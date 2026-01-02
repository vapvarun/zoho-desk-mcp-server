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
          case 'zoho_get_ticket_full':
            return await this.handleGetTicketFull(toolArgs);
          case 'zoho_list_open_tickets':
            return await this.handleListOpenTickets(toolArgs);
          case 'zoho_get_thread':
            return await this.handleGetThread(toolArgs);
          case 'zoho_get_latest_thread':
            return await this.handleGetLatestThread(toolArgs);
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

          /* ===========================
           * TICKET ATTACHMENTS
           * =========================== */
          case 'zoho_list_ticket_attachments':
            return await this.handleListTicketAttachments(toolArgs);
          case 'zoho_delete_ticket_attachment':
            return await this.handleDeleteTicketAttachment(toolArgs);

          /* ===========================
           * TICKET HISTORY & METRICS
           * =========================== */
          case 'zoho_get_ticket_history':
            return await this.handleGetTicketHistory(toolArgs);
          case 'zoho_get_ticket_metrics':
            return await this.handleGetTicketMetrics(toolArgs);

          /* ===========================
           * BULK TICKET OPERATIONS
           * =========================== */
          case 'zoho_bulk_close_tickets':
            return await this.handleBulkCloseTickets(toolArgs);
          case 'zoho_mark_tickets_read':
            return await this.handleMarkTicketsRead(toolArgs);
          case 'zoho_mark_tickets_unread':
            return await this.handleMarkTicketsUnread(toolArgs);
          case 'zoho_trash_tickets':
            return await this.handleTrashTickets(toolArgs);

          /* ===========================
           * ACCOUNTS
           * =========================== */
          case 'zoho_list_accounts':
            return await this.handleListAccounts(toolArgs);
          case 'zoho_get_account':
            return await this.handleGetAccount(toolArgs);
          case 'zoho_create_account':
            return await this.handleCreateAccount(toolArgs);
          case 'zoho_update_account':
            return await this.handleUpdateAccount(toolArgs);
          case 'zoho_delete_account':
            return await this.handleDeleteAccount(toolArgs);
          case 'zoho_get_account_tickets':
            return await this.handleGetAccountTickets(toolArgs);
          case 'zoho_get_account_contacts':
            return await this.handleGetAccountContacts(toolArgs);

          /* ===========================
           * TIME ENTRIES
           * =========================== */
          case 'zoho_list_ticket_time_entries':
            return await this.handleListTicketTimeEntries(toolArgs);
          case 'zoho_add_ticket_time_entry':
            return await this.handleAddTicketTimeEntry(toolArgs);
          case 'zoho_update_ticket_time_entry':
            return await this.handleUpdateTicketTimeEntry(toolArgs);
          case 'zoho_delete_ticket_time_entry':
            return await this.handleDeleteTicketTimeEntry(toolArgs);
          case 'zoho_get_ticket_time_summary':
            return await this.handleGetTicketTimeSummary(toolArgs);

          /* ===========================
           * TASKS
           * =========================== */
          case 'zoho_list_tasks':
            return await this.handleListTasks(toolArgs);
          case 'zoho_get_task':
            return await this.handleGetTask(toolArgs);
          case 'zoho_create_task':
            return await this.handleCreateTask(toolArgs);
          case 'zoho_update_task':
            return await this.handleUpdateTask(toolArgs);
          case 'zoho_delete_task':
            return await this.handleDeleteTask(toolArgs);
          case 'zoho_list_ticket_tasks':
            return await this.handleListTicketTasks(toolArgs);

          /* ===========================
           * PRODUCTS
           * =========================== */
          case 'zoho_list_products':
            return await this.handleListProducts(toolArgs);
          case 'zoho_get_product':
            return await this.handleGetProduct(toolArgs);

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

  private async handleGetTicketFull(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketFullContext(args.ticket_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleListOpenTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTickets({
      status: 'Open',
      limit: args.limit,
      sortBy: args.sort_by || 'modifiedTime',
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

  private async handleGetThread(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketThread(args.ticket_id, args.thread_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetLatestThread(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getLatestThread(args.ticket_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
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
   * TICKET ATTACHMENT HANDLERS
   * =========================== */

  private async handleListTicketAttachments(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketAttachments(args.ticket_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleDeleteTicketAttachment(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.deleteTicketAttachment(args.ticket_id, args.attachment_id);

    return {
      content: [
        {
          type: 'text',
          text: `Attachment ${args.attachment_id} deleted successfully`,
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * TICKET HISTORY & METRICS HANDLERS
   * =========================== */

  private async handleGetTicketHistory(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketHistory(args.ticket_id, {
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

  private async handleGetTicketMetrics(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketMetrics(args.ticket_id);

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
   * BULK TICKET OPERATION HANDLERS
   * =========================== */

  private async handleBulkCloseTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.closeTickets(args.ticket_ids);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleMarkTicketsRead(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.markTicketsRead(args.ticket_ids);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleMarkTicketsUnread(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.markTicketsUnread(args.ticket_ids);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleTrashTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.trashTickets(args.ticket_ids);

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
   * ACCOUNT HANDLERS
   * =========================== */

  private async handleListAccounts(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getAccounts({
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

  private async handleGetAccount(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getAccount(args.account_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleCreateAccount(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.createAccount({
      accountName: args.account_name,
      email: args.email,
      phone: args.phone,
      website: args.website,
      description: args.description,
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

  private async handleUpdateAccount(args: any): Promise<CallToolResult> {
    const updateData: any = {};
    if (args.account_name) updateData.accountName = args.account_name;
    if (args.email) updateData.email = args.email;
    if (args.phone) updateData.phone = args.phone;
    if (args.website) updateData.website = args.website;
    if (args.description) updateData.description = args.description;

    const response = await this.zohoAPI.updateAccount(args.account_id, updateData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleDeleteAccount(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.deleteAccount(args.account_id);

    return {
      content: [
        {
          type: 'text',
          text: `Account ${args.account_id} deleted successfully`,
        } as TextContent,
      ],
    };
  }

  private async handleGetAccountTickets(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getAccountTickets(args.account_id, {
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

  private async handleGetAccountContacts(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getAccountContacts(args.account_id, {
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
   * TIME ENTRY HANDLERS
   * =========================== */

  private async handleListTicketTimeEntries(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketTimeEntries(args.ticket_id, {
      limit: args.limit,
      billingType: args.billing_type,
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

  private async handleAddTicketTimeEntry(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.addTicketTimeEntry(args.ticket_id, {
      executedTime: args.executed_time,
      description: args.description,
      billingType: args.billing_type,
      ownerId: args.owner_id,
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

  private async handleUpdateTicketTimeEntry(args: any): Promise<CallToolResult> {
    const updateData: any = {};
    if (args.executed_time) updateData.executedTime = args.executed_time;
    if (args.description) updateData.description = args.description;
    if (args.billing_type) updateData.billingType = args.billing_type;

    const response = await this.zohoAPI.updateTicketTimeEntry(
      args.ticket_id,
      args.time_entry_id,
      updateData
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleDeleteTicketTimeEntry(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.deleteTicketTimeEntry(args.ticket_id, args.time_entry_id);

    return {
      content: [
        {
          type: 'text',
          text: `Time entry ${args.time_entry_id} deleted successfully`,
        } as TextContent,
      ],
    };
  }

  private async handleGetTicketTimeSummary(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketTimeEntrySummary(args.ticket_id);

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
   * TASK HANDLERS
   * =========================== */

  private async handleListTasks(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTasks({
      limit: args.limit,
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

  private async handleGetTask(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTask(args.task_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleCreateTask(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.createTask({
      subject: args.subject,
      description: args.description,
      dueDate: args.due_date,
      priority: args.priority,
      status: args.status,
      ownerId: args.owner_id,
      ticketId: args.ticket_id,
      departmentId: args.department_id,
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

  private async handleUpdateTask(args: any): Promise<CallToolResult> {
    const updateData: any = {};
    if (args.subject) updateData.subject = args.subject;
    if (args.description) updateData.description = args.description;
    if (args.due_date) updateData.dueDate = args.due_date;
    if (args.priority) updateData.priority = args.priority;
    if (args.status) updateData.status = args.status;
    if (args.owner_id) updateData.ownerId = args.owner_id;

    const response = await this.zohoAPI.updateTask(args.task_id, updateData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleDeleteTask(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.deleteTask(args.task_id);

    return {
      content: [
        {
          type: 'text',
          text: `Task ${args.task_id} deleted successfully`,
        } as TextContent,
      ],
    };
  }

  private async handleListTicketTasks(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getTicketTasks(args.ticket_id, {
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
   * PRODUCT HANDLERS
   * =========================== */

  private async handleListProducts(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getProducts({
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

  private async handleGetProduct(args: any): Promise<CallToolResult> {
    const response = await this.zohoAPI.getProduct(args.product_id);

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
