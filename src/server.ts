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
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class ZohoDeskServer {
  private server: Server;
  private zohoAPI!: ZohoAPI;  // Using definite assignment assertion
  private config: any;
  private slackWebhookUrl: string | null;
  private tokenInitialized = false;

  constructor() {
    this.server = new Server(
      {
        name: 'zoho-desk-mcp-server',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = loadConfig();
    this.slackWebhookUrl = this.config.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL || null;

    // Don't initialize zohoAPI yet - wait for fresh token

    this.setupHandlers();
  }

  private async ensureTokenInitialized(): Promise<void> {
    if (this.tokenInitialized) {
      return;
    }

    console.error('🔄 Initializing Zoho API with fresh token...');

    try {
      // Try to refresh token first if we have credentials
      if (this.config.clientId && this.config.clientSecret && this.config.refreshToken) {
        console.error('🔄 Refreshing access token...');
        const tokenResponse = await ZohoAPI.refreshAccessToken(
          this.config.clientId,
          this.config.clientSecret,
          this.config.refreshToken
        );

        if (tokenResponse?.access_token) {
          this.config.accessToken = tokenResponse.access_token;
          console.error(`✅ Fresh token obtained: ${tokenResponse.access_token.substring(0, 20)}...`);
        } else {
          console.error('⚠️  Token refresh failed, using existing token');
        }
      }

      // Create zohoAPI instance with either fresh or existing token
      this.zohoAPI = new ZohoAPI(this.config.accessToken, this.config.orgId, {
        refreshToken: this.config.refreshToken,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        replyFromAddress: this.config.replyFromAddress,
        onTokenRefresh: (newToken: string) => {
          this.config.accessToken = newToken;
          console.error('✅ Token auto-refreshed during API call');
          this.updateTokenInConfigs(newToken);
        }
      });

      this.tokenInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing token:', error);
      // Create zohoAPI with existing token as fallback
      this.zohoAPI = new ZohoAPI(this.config.accessToken || '', this.config.orgId, {
        refreshToken: this.config.refreshToken,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        replyFromAddress: this.config.replyFromAddress,
        onTokenRefresh: (newToken: string) => {
          this.config.accessToken = newToken;
          console.error('✅ Token auto-refreshed during API call');
          this.updateTokenInConfigs(newToken);
        }
      });
      this.tokenInitialized = true;
    }
  }

  /**
   * Update token in all config files (local, Claude Desktop, Claude Code)
   */
  private updateTokenInConfigs(newToken: string): void {
    try {
      // Update local config.json
      const configPath = join(__dirname, '..', 'config.json');
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        config.accessToken = newToken;
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.error('✅ Updated local config.json');
      }

      // Update Claude Desktop config
      const desktopConfigPath = join(homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
      if (existsSync(desktopConfigPath)) {
        const desktopConfig = JSON.parse(readFileSync(desktopConfigPath, 'utf-8'));
        if (desktopConfig.mcpServers?.['zoho-desk']?.env?.ZOHO_ACCESS_TOKEN) {
          desktopConfig.mcpServers['zoho-desk'].env.ZOHO_ACCESS_TOKEN = newToken;
          writeFileSync(desktopConfigPath, JSON.stringify(desktopConfig, null, 2));
          console.error('✅ Updated Claude Desktop config');
        }
      }

      // Update Claude Code config
      const codeConfigPath = join(homedir(), '.config/claude-code/config.json');
      if (existsSync(codeConfigPath)) {
        const codeConfig = JSON.parse(readFileSync(codeConfigPath, 'utf-8'));
        if (codeConfig.mcpServers?.['zoho-desk']?.env?.ZOHO_ACCESS_TOKEN) {
          codeConfig.mcpServers['zoho-desk'].env.ZOHO_ACCESS_TOKEN = newToken;
          writeFileSync(codeConfigPath, JSON.stringify(codeConfig, null, 2));
          console.error('✅ Updated Claude Code config');
        }
      }
    } catch (error) {
      console.error('⚠️  Failed to update config files:', error);
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const toolArgs = (args || {}) as any;

      try {
        // Guarantee this.zohoAPI exists before ANY handler runs. It is created
        // lazily inside ensureTokenInitialized (idempotent), and individual
        // handlers used to each call it — but ~27 handlers omitted the call, so
        // whichever of those was the first tool used in a session crashed with
        // "Cannot read properties of undefined". Initializing once here at the
        // single dispatch choke point covers every current and future handler.
        await this.ensureTokenInitialized();

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
          case 'zoho_list_reply_addresses':
            return await this.handleListReplyAddresses(toolArgs);
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

          /* ===========================
           * DRAFT REPLIES + THREAD UTILITIES
           * =========================== */
          case 'zoho_draft_ticket_reply':
            return await this.handleDraftTicketReply(toolArgs);
          case 'zoho_update_draft_reply':
            return await this.handleUpdateDraftReply(toolArgs);
          case 'zoho_delete_draft_reply':
            return await this.handleDeleteDraftReply(toolArgs);
          case 'zoho_send_draft_reply':
            return await this.handleSendDraftReply(toolArgs);
          case 'zoho_get_attachment':
            return await this.handleGetAttachment(toolArgs);
          case 'zoho_get_thread_original_content':
            return await this.handleGetThreadOriginalContent(toolArgs);
          case 'zoho_delete_thread_attachment':
            return await this.handleDeleteThreadAttachment(toolArgs);

          /* ===========================
           * RESOLUTION
           * =========================== */
          case 'zoho_get_ticket_resolution':
            return await this.handleGetTicketResolution(toolArgs);
          case 'zoho_update_ticket_resolution':
            return await this.handleUpdateTicketResolution(toolArgs);
          case 'zoho_delete_ticket_resolution':
            return await this.handleDeleteTicketResolution(toolArgs);
          case 'zoho_get_ticket_resolution_history':
            return await this.handleGetTicketResolutionHistory(toolArgs);

          /* ===========================
           * MERGE / SPLIT
           * =========================== */
          case 'zoho_merge_tickets':
            return await this.handleMergeTickets(toolArgs);
          case 'zoho_split_ticket_thread':
            return await this.handleSplitTicketThread(toolArgs);

          /* ===========================
           * SPAM
           * =========================== */
          case 'zoho_mark_tickets_spam':
            return await this.handleMarkTicketsSpam(toolArgs);
          case 'zoho_delete_spam_tickets':
            return await this.handleDeleteSpamTickets(toolArgs);
          case 'zoho_empty_spam':
            return await this.handleEmptySpam(toolArgs);

          /* ===========================
           * BULK UPDATE
           * =========================== */
          case 'zoho_bulk_update_tickets':
            return await this.handleBulkUpdateTickets(toolArgs);

          /* ===========================
           * TICKET LISTS / VIEWS
           * =========================== */
          case 'zoho_get_archived_tickets':
            return await this.handleGetArchivedTickets(toolArgs);
          case 'zoho_get_agents_tickets_count':
            return await this.handleGetAgentsTicketsCount(toolArgs);
          case 'zoho_get_associated_tickets':
            return await this.handleGetAssociatedTickets(toolArgs);
          case 'zoho_get_ticket_queue_view_count':
            return await this.handleGetTicketQueueViewCount(toolArgs);
          case 'zoho_get_tickets_by_product':
            return await this.handleGetTicketsByProduct(toolArgs);

          /* ===========================
           * COMMENT GET/EDIT/DELETE
           * =========================== */
          case 'zoho_get_ticket_comment':
            return await this.handleGetTicketComment(toolArgs);
          case 'zoho_update_ticket_comment':
            return await this.handleUpdateTicketComment(toolArgs);
          case 'zoho_delete_ticket_comment':
            return await this.handleDeleteTicketComment(toolArgs);
          case 'zoho_get_ticket_comment_history':
            return await this.handleGetTicketCommentHistory(toolArgs);

          /* ===========================
           * TAG OPERATIONS (account-level)
           * =========================== */
          case 'zoho_list_recent_tags':
            return await this.handleListRecentTags(toolArgs);
          case 'zoho_update_recent_tag':
            return await this.handleUpdateRecentTag(toolArgs);
          case 'zoho_list_all_tags':
            return await this.handleListAllTags(toolArgs);
          case 'zoho_search_tags':
            return await this.handleSearchTags(toolArgs);
          case 'zoho_list_tickets_by_tag':
            return await this.handleListTicketsByTag(toolArgs);
          case 'zoho_replace_tag':
            return await this.handleReplaceTag(toolArgs);

          /* ===========================
           * CONTACT LOOKUP / CUSTOMER HISTORY
           * =========================== */
          case 'zoho_find_contact_by_email':
            return await this.handleFindContactByEmail(toolArgs);
          case 'zoho_get_customer_history_by_email':
            return await this.handleGetCustomerHistoryByEmail(toolArgs);

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
    await this.ensureTokenInitialized();

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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();

    // Default to Themes & Plugins if caller didn't specify — Zoho API requires departmentId.
    const DEFAULT_DEPARTMENT_ID = '233992000000006907';

    const response = await this.zohoAPI.createTicket({
      subject: args.subject,
      description: args.description,
      departmentId: args.department_id || DEFAULT_DEPARTMENT_ID,
      contactId: args.contact_id,
      contactEmail: args.contact_email,
      contactName: args.contact_name,
      channel: args.channel,
      priority: args.priority,
      status: args.status,
      assigneeId: args.assignee_id,
      customFields: args.custom_fields,
    });

    const ticketData: any = response.data || {};
    const ticketId: string | undefined = ticketData.id;

    // Attach tags after creation — Zoho uses a separate endpoint.
    // Tag names: 3-100 chars, allowed chars: [a-zA-Z0-9_.+\-%\s] (colon NOT allowed).
    if (ticketId && Array.isArray(args.tags) && args.tags.length > 0) {
      // Sanitize: Zoho forbids ":" in tag names. Replace with "-" so "source:crisp" → "source-crisp".
      const sanitized: string[] = [];
      const renamed: Array<{ from: string; to: string }> = [];
      for (const raw of args.tags) {
        const clean = String(raw).replace(/[:]/g, '-').trim();
        if (clean !== String(raw)) renamed.push({ from: raw, to: clean });
        if (clean.length >= 3) sanitized.push(clean);
      }
      if (renamed.length > 0) ticketData._tag_renamed = renamed;

      try {
        const tagRes = await this.zohoAPI.associateTicketTags(ticketId, sanitized);
        const tagErrorCode = (tagRes.data as any)?.errorCode;
        if (tagRes.code >= 400 || tagErrorCode) {
          ticketData._tag_warning = `Tag association failed (${tagRes.code}): ${tagErrorCode || 'unknown'} - ${(tagRes.data as any)?.message || JSON.stringify(tagRes.data)}`;
        } else {
          ticketData._tags_attached = sanitized;
        }
      } catch (tagErr: any) {
        ticketData._tag_warning = `Tag association threw: ${tagErr?.message || String(tagErr)}`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(ticketData, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleUpdateTicket(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const updateData: any = {};
    if (args.status) updateData.status = args.status;
    if (args.priority) updateData.priority = args.priority;
    if (args.assignee_id) updateData.assigneeId = args.assignee_id;
    if (args.department_id) updateData.departmentId = args.department_id;

    const response = await this.zohoAPI.updateTicket(args.ticket_id, updateData);
    const body: any = response.data || {};
    if (response.code >= 400 || body.errorCode) {
      body._http_status = response.code;
      body._zoho_error = body.errorCode;
      if (body.errorCode === 'URL_NOT_FOUND') {
        body._hint = 'Likely OAuth scope issue: refresh token may lack Desk.tickets.UPDATE. Regenerate token with Desk.tickets.ALL scope.';
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(body, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleMoveTicket(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
    // Sanitize: Zoho forbids ":" in tag names. Replace with "-".
    const renamed: Array<{ from: string; to: string }> = [];
    const sanitized: string[] = [];
    for (const raw of (args.tags || [])) {
      const clean = String(raw).replace(/[:]/g, '-').trim();
      if (clean !== String(raw)) renamed.push({ from: raw, to: clean });
      if (clean.length >= 3) sanitized.push(clean);
    }

    const response = await this.zohoAPI.addTicketTags(args.ticket_id, sanitized);
    const body: any = response.data || {};
    const out: any = Array.isArray(body) || typeof body === 'object' ? { ...body } : { data: body };
    if (renamed.length > 0) out._tag_renamed = renamed;
    if (response.code >= 400 || body.errorCode) {
      out._http_status = response.code;
      out._zoho_error = body.errorCode;
    } else {
      out._tags_attached = sanitized;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(out, null, 2),
        } as TextContent,
      ],
    };
  }

  /* ===========================
   * CONTACT HANDLERS
   * =========================== */

  private async handleListContacts(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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

  private async handleListReplyAddresses(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const response = await this.zohoAPI.listReplyAddresses(
      args?.department_id || 'allDepartment',
      typeof args?.active_only === 'boolean' ? args.active_only : undefined
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

  private async handleListAgents(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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
    await this.ensureTokenInitialized();
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

  private wrapBulkResponse(response: any, ticketIds: string[]): any {
    const body: any = response.data || {};
    const out: any = Array.isArray(body) ? { data: body } : { ...body };
    if (response.code >= 400 || body.errorCode) {
      out._http_status = response.code;
      out._zoho_error = body.errorCode;
    } else {
      out._affected_ids = ticketIds;
    }
    return out;
  }

  private async handleBulkCloseTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const response = await this.zohoAPI.closeTickets(args.ticket_ids);
    return {
      content: [{ type: 'text', text: JSON.stringify(this.wrapBulkResponse(response, args.ticket_ids), null, 2) } as TextContent],
    };
  }

  private async handleMarkTicketsRead(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const response = await this.zohoAPI.markTicketsRead(args.ticket_ids);
    return {
      content: [{ type: 'text', text: JSON.stringify(this.wrapBulkResponse(response, args.ticket_ids), null, 2) } as TextContent],
    };
  }

  private async handleMarkTicketsUnread(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const response = await this.zohoAPI.markTicketsUnread(args.ticket_ids);
    return {
      content: [{ type: 'text', text: JSON.stringify(this.wrapBulkResponse(response, args.ticket_ids), null, 2) } as TextContent],
    };
  }

  private async handleTrashTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const response = await this.zohoAPI.trashTickets(args.ticket_ids);
    return {
      content: [{ type: 'text', text: JSON.stringify(this.wrapBulkResponse(response, args.ticket_ids), null, 2) } as TextContent],
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
   * NEW HANDLERS (audit batch — Zoho OAS coverage gaps)
   * Each delegates to the matching ZohoAPI method; ensureTokenInitialized()
   * is called before any zohoAPI access (the helper is idempotent).
   * =========================== */

  private toResult(data: any): CallToolResult {
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) } as TextContent],
    };
  }

  private async handleDraftTicketReply(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.draftTicketReply(args.ticket_id, args.content);
    return this.toResult(res.data);
  }

  private async handleUpdateDraftReply(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.updateDraftReply(args.ticket_id, args.thread_id, args.content);
    return this.toResult(res.data);
  }

  private async handleDeleteDraftReply(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.deleteDraftReply(args.ticket_id, args.thread_id);
    return this.toResult(res.data || { deleted: true, thread_id: args.thread_id });
  }

  private async handleSendDraftReply(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.sendDraftReply(args.ticket_id, args.thread_id);
    return this.toResult(res.data);
  }

  private async handleGetAttachment(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getAttachmentContent(
      args.ticket_id, args.thread_id, args.attachment_id, args.file_name, args.out_dir
    );
    return this.toResult(res);
  }

  private async handleGetThreadOriginalContent(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getThreadOriginalContent(args.ticket_id, args.thread_id);
    return this.toResult(res.data);
  }

  private async handleDeleteThreadAttachment(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.deleteThreadAttachment(args.ticket_id, args.thread_id, args.attachment_id);
    return this.toResult(res.data || { deleted: true });
  }

  private async handleGetTicketResolution(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getTicketResolution(args.ticket_id);
    return this.toResult(res.data);
  }

  private async handleUpdateTicketResolution(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.updateTicketResolution(
      args.ticket_id,
      args.content,
      args.is_notify_contact === true
    );
    return this.toResult(res.data);
  }

  private async handleDeleteTicketResolution(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.deleteTicketResolution(args.ticket_id);
    return this.toResult(res.data || { deleted: true });
  }

  private async handleGetTicketResolutionHistory(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getTicketResolutionHistory(args.ticket_id);
    return this.toResult(res.data);
  }

  private async handleMergeTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    // Map snake_case args to the camelCase the API expects.
    const source = args.source ? {
      contactId: args.source.contact_id,
      subject: args.source.subject,
      priority: args.source.priority,
      status: args.source.status,
    } : undefined;
    const res = await this.zohoAPI.mergeTickets(args.ticket_id, args.merge_ids, source);
    return this.toResult(res.data);
  }

  private async handleSplitTicketThread(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.splitTicketThread(args.ticket_id, args.thread_id);
    return this.toResult(res.data);
  }

  private async handleMarkTicketsSpam(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.markTicketsSpam(args.ticket_ids, {
      contactSpam: args.contact_spam,
      handleExistingTickets: args.handle_existing_tickets,
    });
    return this.toResult(res.data);
  }

  private async handleDeleteSpamTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.deleteSpamTickets(args.ticket_ids);
    return this.toResult(res.data);
  }

  private async handleEmptySpam(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.emptySpam(args.department_id);
    return this.toResult(res.data);
  }

  private async handleBulkUpdateTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.bulkUpdateTickets(
      args.ticket_ids,
      args.field_name,
      args.field_value,
      args.is_custom_field === true
    );
    return this.toResult(res.data);
  }

  private async handleGetArchivedTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getArchivedTickets({ limit: args.limit, from: args.from });
    return this.toResult(res.data);
  }

  private async handleGetAgentsTicketsCount(_args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getAgentsTicketsCount();
    return this.toResult(res.data);
  }

  private async handleGetAssociatedTickets(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getAssociatedTickets({ limit: args.limit, from: args.from });
    return this.toResult(res.data);
  }

  private async handleGetTicketQueueViewCount(_args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getTicketQueueViewCount();
    return this.toResult(res.data);
  }

  private async handleGetTicketsByProduct(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getTicketsByProduct(args.product_id, { limit: args.limit, from: args.from });
    return this.toResult(res.data);
  }

  private async handleGetTicketComment(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getTicketComment(args.ticket_id, args.comment_id);
    return this.toResult(res.data);
  }

  private async handleUpdateTicketComment(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.updateTicketComment(args.ticket_id, args.comment_id, args.content);
    return this.toResult(res.data);
  }

  private async handleDeleteTicketComment(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.deleteTicketComment(args.ticket_id, args.comment_id);
    return this.toResult(res.data || { deleted: true });
  }

  private async handleGetTicketCommentHistory(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.getTicketCommentHistory(args.ticket_id, args.comment_id);
    return this.toResult(res.data);
  }

  private async handleListRecentTags(_args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.listRecentTicketTags();
    return this.toResult(res.data);
  }

  private async handleUpdateRecentTag(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.updateRecentTicketTag(args.tag_id);
    return this.toResult(res.data);
  }

  private async handleListAllTags(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.listAllTicketTags({ limit: args.limit, from: args.from });
    return this.toResult(res.data);
  }

  private async handleSearchTags(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.searchTags(args.query, { limit: args.limit });
    return this.toResult(res.data);
  }

  private async handleListTicketsByTag(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.listTicketsByTag(args.tag_id, { limit: args.limit, from: args.from });
    return this.toResult(res.data);
  }

  private async handleReplaceTag(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const res = await this.zohoAPI.replaceTag(args.current_tag_id, args.replacing_tag_id);
    return this.toResult(res.data);
  }

  private async handleFindContactByEmail(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const contact = await this.zohoAPI.findContactByEmail(args.email);
    return this.toResult(contact);
  }

  private async handleGetCustomerHistoryByEmail(args: any): Promise<CallToolResult> {
    await this.ensureTokenInitialized();
    const history = await this.zohoAPI.getCustomerHistoryByEmail(args.email);
    return this.toResult(history);
  }

  /* ===========================
   * SERVER LIFECYCLE
   * =========================== */

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Zoho Desk MCP server v1.2.1 running on stdio');
  }
}
