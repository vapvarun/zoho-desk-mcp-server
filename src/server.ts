/**
 * Zoho Desk MCP Server Implementation
 * Handles all tool executions and MCP protocol communication
 *
 * @author Varun Dubey (vapvarun) <varun@wbcomdesigns.com>
 * @company Wbcom Designs
 * @license GPL-2.0-or-later
 * @link https://github.com/vapvarun/zoho-desk-mcp-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
  TextContent
} from '@modelcontextprotocol/sdk/types.js';
import { ZohoAPI } from './zoho-api.js';
import { tools } from './tools.js';
import { loadConfig } from './config.js';

export class ZohoDeskServer {
  private server: Server;
  private zohoAPI: ZohoAPI;
  private config: any;
  private slackWebhookUrl: string | null;

  constructor() {
    this.server = new Server(
      {
        name: 'zoho-desk-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = loadConfig();
    this.zohoAPI = new ZohoAPI(this.config.accessToken, this.config.orgId, {
      refreshToken: this.config.refreshToken,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      onTokenRefresh: (newToken: string) => {
        console.error('📝 New token available:', newToken.substring(0, 20) + '...');
        console.error('⚠️  Update your config files with the new token');
      }
    });
    this.slackWebhookUrl = this.config.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL || null;

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const toolArgs = (args || {}) as any;

      try {
        switch (name) {
          /* ===========================
           * TICKET MANAGEMENT
           * =========================== */
          case 'zoho_list_tickets':
            return await this.handleListTickets(toolArgs);
          case 'zoho_get_ticket':
            return await this.handleGetTicket(toolArgs);
          case 'zoho_create_ticket':
            return await this.handleCreateTicket(toolArgs);
          case 'zoho_update_ticket':
            return await this.handleUpdateTicket(toolArgs);
          case 'zoho_move_ticket':
            return await this.handleMoveTicket(toolArgs);
          case 'zoho_reply_ticket':
            return await this.handleReplyTicket(toolArgs);
          case 'zoho_delete_ticket':
            return await this.handleDeleteTicket(toolArgs);

          /* ===========================
           * TICKET COMMENTS
           * =========================== */
          case 'zoho_list_ticket_comments':
            return await this.handleListTicketComments(toolArgs);
          case 'zoho_add_ticket_comment':
            return await this.handleAddTicketComment(toolArgs);

          /* ===========================
           * TICKET TAGS
           * =========================== */
          case 'zoho_get_ticket_tags':
            return await this.handleGetTicketTags(toolArgs);
          case 'zoho_add_ticket_tags':
            return await this.handleAddTicketTags(toolArgs);

          /* ===========================
           * CONTACTS
           * =========================== */
          case 'zoho_list_contacts':
            return await this.handleListContacts(toolArgs);
          case 'zoho_get_contact':
            return await this.handleGetContact(toolArgs);
          case 'zoho_get_contact_tickets':
            return await this.handleGetContactTickets(toolArgs);

          /* ===========================
           * DEPARTMENTS & AGENTS
           * =========================== */
          case 'zoho_list_departments':
            return await this.handleListDepartments(toolArgs);
          case 'zoho_list_agents':
            return await this.handleListAgents(toolArgs);
          case 'zoho_get_agent':
            return await this.handleGetAgent(toolArgs);

          /* ===========================
           * SEARCH
           * =========================== */
          case 'zoho_search_tickets':
            return await this.handleSearchTickets(toolArgs);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            } as TextContent,
          ],
        };
      }
    });
  }

  /* ===========================
   * TICKET HANDLERS
   * =========================== */

  private async handleListTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTickets({
      status: args.status,
      limit: args.limit,
      sortBy: args.sort_by,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetTicket(args: any): Promise<CallToolResult> {
    const ticketResponse = await this.zohoAPI.getTicket(args.ticket_id);
    let result = ticketResponse.data;

    if (args.include_threads !== false) {
      const threadsResponse = await this.zohoAPI.getTicketThreads(args.ticket_id);
      result = {
        ...result,
        threads: threadsResponse.data,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleCreateTicket(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.createTicket({
      subject: args.subject,
      description: args.description,
      contactId: args.contact_id,
      priority: args.priority,
      status: args.status,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleUpdateTicket(args: any): Promise<CallToolResult> {
    const updateData: any = {};
    if (args.status) updateData.status = args.status;
    if (args.priority) updateData.priority = args.priority;
    if (args.assignee_id) updateData.assigneeId = args.assignee_id;
    if (args.department_id) updateData.departmentId = args.department_id;

    const response = await this.zohoAPI.updateTicket(args.ticket_id, updateData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleMoveTicket(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.moveTicket(args.ticket_id, args.department_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleReplyTicket(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.addTicketReply(
      args.ticket_id,
      args.content,
      args.is_public !== false
    );

    // Send Slack notification
    if (this.slackWebhookUrl) {
      try {
        const ticket = await this.zohoAPI.getTicket(args.ticket_id);
        await this.sendSlackNotification({
          type: 'reply',
          ticket: ticket.data,
          content: args.content,
          isPublic: args.is_public !== false
        });
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleDeleteTicket(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.deleteTicket(args.ticket_id);

    return {
      content: [
        {
          type: 'text',
          text: `Ticket ${args.ticket_id} deleted successfully`,
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * TICKET COMMENT HANDLERS
   * =========================== */

  private async handleListTicketComments(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketComments(args.ticket_id, {
      limit: args.limit,
      from: args.from,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleAddTicketComment(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.addTicketComment(
      args.ticket_id,
      args.content,
      args.is_public !== undefined ? args.is_public : false,
      args.content_type || 'html'
    );

    // Send Slack notification
    if (this.slackWebhookUrl) {
      try {
        const ticket = await this.zohoAPI.getTicket(args.ticket_id);
        await this.sendSlackNotification({
          type: 'comment',
          ticket: ticket.data,
          content: args.content,
          isPublic: args.is_public !== undefined ? args.is_public : false
        });
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * TICKET TAG HANDLERS
   * =========================== */

  private async handleGetTicketTags(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketTags(args.ticket_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleAddTicketTags(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.addTicketTags(args.ticket_id, args.tags);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * CONTACT HANDLERS
   * =========================== */

  private async handleListContacts(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getContacts({
      limit: args.limit,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetContact(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getContact(args.contact_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetContactTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getContactTickets(args.contact_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * DEPARTMENT & AGENT HANDLERS
   * =========================== */

  private async handleListDepartments(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getDepartments();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleListAgents(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getAgents();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetAgent(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getAgent(args.agent_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * SEARCH HANDLER
   * =========================== */

  private async handleSearchTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.searchTickets(args.query, {
      limit: args.limit,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * SLACK NOTIFICATION
   * =========================== */

  private async sendSlackNotification(data: {
    type: 'reply' | 'comment';
    ticket: any;
    content: string;
    isPublic: boolean;
  }): Promise<void> {
    if (!this.slackWebhookUrl) {
      return;
    }

    const { type, ticket, content, isPublic } = data;

    // Clean HTML from content for Slack
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .substring(0, 500);

    let emoji = '';
    let title = '';
    if (type === 'reply') {
      emoji = isPublic ? '💬' : '🔒';
      title = isPublic ? 'New Ticket Reply (via Claude)' : 'Private Reply (via Claude)';
    } else {
      emoji = isPublic ? '💭' : '🔒';
      title = isPublic ? 'Public Comment Added (via Claude)' : 'Private Note Added (via Claude)';
    }

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Ticket:*\n#${ticket.ticketNumber} - ${ticket.subject}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${ticket.status}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${type === 'reply' ? 'Reply' : 'Comment'}:*\n${cleanContent}${content.length > 500 ? '...' : ''}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Priority: ${ticket.priority || 'None'} | ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error('Slack notification failed:', response.status);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /* ===========================
   * SERVER LIFECYCLE
   * =========================== */

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Zoho Desk MCP server running on stdio');
  }
}
