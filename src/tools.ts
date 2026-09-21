/**
 * MCP Tools Definitions for Zoho Desk Manager
 * Maps all WP-CLI commands to MCP tools for AI-powered support
 *
 * @author Varun Dubey (vapvarun) <varun@wbcomdesigns.com>
 * @company Wbcom Designs
 * @license GPL-2.0-or-later
 * @link https://github.com/vapvarun/zoho-desk-mcp-server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  /* ===========================
   * TICKET MANAGEMENT
   * =========================== */
  {
    name: 'zoho_list_tickets',
    description: 'List Zoho Desk support tickets with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (Open, On Hold, Escalated, Closed)'
        },
        limit: {
          type: 'number',
          description: 'Number of tickets to retrieve (default: 50)'
        },
        sort_by: {
          type: 'string',
          description: 'Sort field (createdTime, modifiedTime, customerResponseTime)'
        }
      }
    }
  },
  {
    name: 'zoho_get_ticket',
    description: 'Get detailed information about a specific ticket including conversation threads',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        include_threads: {
          type: 'boolean',
          description: 'Include conversation history',
          default: true
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_get_ticket_full',
    description: 'Get complete ticket context with ALL threads AND comments in one call. Use this when you need the full picture of a ticket conversation.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_list_open_tickets',
    description: 'List all open tickets (convenience method). Returns tickets with status Open, sorted by latest activity.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of tickets to retrieve (default: 50)'
        },
        sort_by: {
          type: 'string',
          enum: ['createdTime', 'modifiedTime', 'customerResponseTime'],
          description: 'Sort field (default: modifiedTime)'
        }
      }
    }
  },
  {
    name: 'zoho_get_thread',
    description: 'Get a specific thread/conversation from a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        thread_id: {
          type: 'string',
          description: 'Thread ID'
        }
      },
      required: ['ticket_id', 'thread_id']
    }
  },
  {
    name: 'zoho_get_latest_thread',
    description: 'Get the most recent thread/message from a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_create_ticket',
    description: 'Create a new support ticket. Department defaults to Themes & Plugins if not specified. Pass contact_email + contact_name to auto-create a contact when contact_id is unknown (useful for Crisp chat → Zoho sync).',
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Ticket subject/title'
        },
        description: {
          type: 'string',
          description: 'Ticket description/content (HTML supported)'
        },
        department_id: {
          type: 'string',
          description: 'Department ID. Defaults to Themes & Plugins (233992000000006907) if omitted.'
        },
        contact_id: {
          type: 'string',
          description: 'Existing Zoho contact ID (if known)'
        },
        contact_email: {
          type: 'string',
          description: 'Customer email — used to auto-create contact when contact_id is missing'
        },
        contact_name: {
          type: 'string',
          description: 'Customer full name — used to auto-create contact when contact_id is missing'
        },
        channel: {
          type: 'string',
          description: 'Ticket channel (e.g. Email, Web, Phone, Chat, Forums, Twitter, Facebook)'
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High'],
          description: 'Ticket priority'
        },
        status: {
          type: 'string',
          description: 'Initial ticket status'
        },
        assignee_id: {
          type: 'string',
          description: 'Agent ID to assign the ticket to'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tag names to attach on creation (e.g. ["source:crisp", "chat"])'
        },
        custom_fields: {
          type: 'object',
          description: 'Custom field values keyed by API field name (e.g. {"cf_crisp_session_id":"s_abc123"})',
          additionalProperties: true
        }
      },
      required: ['subject', 'description']
    }
  },
  {
    name: 'zoho_update_ticket',
    description: 'Update ticket details (status, priority, assignee, department, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        status: {
          type: 'string',
          description: 'New status'
        },
        priority: {
          type: 'string',
          description: 'New priority'
        },
        assignee_id: {
          type: 'string',
          description: 'Assign to agent ID'
        },
        department_id: {
          type: 'string',
          description: 'Move ticket to department ID'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_move_ticket',
    description: 'Move/transfer a ticket to a different department',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        department_id: {
          type: 'string',
          description: 'Target department ID to move ticket to'
        }
      },
      required: ['ticket_id', 'department_id']
    }
  },
  {
    name: 'zoho_reply_ticket',
    description: 'Add a reply/comment to a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        content: {
          type: 'string',
          description: 'Reply content (supports HTML)'
        },
        is_public: {
          type: 'boolean',
          description: 'Public reply visible to customer (true) or private note (false)',
          default: true
        }
      },
      required: ['ticket_id', 'content']
    }
  },
  {
    name: 'zoho_delete_ticket',
    description: 'Delete a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID to delete'
        }
      },
      required: ['ticket_id']
    }
  },

  /* ===========================
   * TICKET COMMENTS
   * =========================== */
  {
    name: 'zoho_list_ticket_comments',
    description: 'List all comments on a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        limit: {
          type: 'number',
          description: 'Number of comments to retrieve (1-100, default 50)'
        },
        from: {
          type: 'number',
          description: 'Starting index for pagination'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_add_ticket_comment',
    description: 'Add a comment to a ticket (internal note or public comment)',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        content: {
          type: 'string',
          description: 'Comment content (supports HTML)'
        },
        is_public: {
          type: 'boolean',
          description: 'Public comment visible to customer (true) or private note (false)',
          default: false
        },
        content_type: {
          type: 'string',
          enum: ['html', 'plainText'],
          description: 'Content format type',
          default: 'html'
        }
      },
      required: ['ticket_id', 'content']
    }
  },

  /* ===========================
   * TICKET TAGS
   * =========================== */
  {
    name: 'zoho_get_ticket_tags',
    description: 'Get all tags applied to a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_add_ticket_tags',
    description: 'Add tags to a ticket for categorization',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names to add'
        }
      },
      required: ['ticket_id', 'tags']
    }
  },

  /* ===========================
   * CUSTOMER/CONTACT MANAGEMENT
   * =========================== */
  {
    name: 'zoho_list_contacts',
    description: 'List all contacts (customers)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of contacts to retrieve'
        }
      }
    }
  },
  {
    name: 'zoho_get_contact',
    description: 'Get contact details',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: {
          type: 'string',
          description: 'Contact ID'
        }
      },
      required: ['contact_id']
    }
  },
  {
    name: 'zoho_get_contact_tickets',
    description: 'Get all tickets for a specific contact (customer history)',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: {
          type: 'string',
          description: 'Contact ID'
        }
      },
      required: ['contact_id']
    }
  },

  /* ===========================
   * DEPARTMENTS & AGENTS
   * =========================== */
  {
    name: 'zoho_list_departments',
    description: 'List all departments',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'zoho_list_reply_addresses',
    description: 'List the From/reply email addresses configured in the portal, each with isVerified and isActive flags. Use to confirm which address outbound replies actually send from (only an active + verified address can be a From address).',
    inputSchema: {
      type: 'object',
      properties: {
        department_id: {
          type: 'string',
          description: "Department ID to scope to, or 'allDepartment' for every department (default)."
        },
        active_only: {
          type: 'boolean',
          description: 'If true, only return active addresses.'
        }
      }
    }
  },
  {
    name: 'zoho_list_agents',
    description: 'List all support agents',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'zoho_get_agent',
    description: 'Get agent details',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Agent ID'
        }
      },
      required: ['agent_id']
    }
  },

  /* ===========================
   * SEARCH
   * =========================== */
  {
    name: 'zoho_search_tickets',
    description: 'Search tickets by keywords',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        limit: {
          type: 'number',
          description: 'Max results to return'
        }
      },
      required: ['query']
    }
  },

  /* ===========================
   * TICKET ATTACHMENTS
   * =========================== */
  {
    name: 'zoho_list_ticket_attachments',
    description: 'List all attachments on a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_delete_ticket_attachment',
    description: 'Delete an attachment from a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        attachment_id: {
          type: 'string',
          description: 'Attachment ID to delete'
        }
      },
      required: ['ticket_id', 'attachment_id']
    }
  },

  /* ===========================
   * TICKET HISTORY & METRICS
   * =========================== */
  {
    name: 'zoho_get_ticket_history',
    description: 'Get the activity history/audit trail of a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        limit: {
          type: 'number',
          description: 'Number of history entries to retrieve'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_get_ticket_metrics',
    description: 'Get metrics/statistics for a ticket (response times, resolution time, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        }
      },
      required: ['ticket_id']
    }
  },

  /* ===========================
   * BULK TICKET OPERATIONS
   * =========================== */
  {
    name: 'zoho_bulk_close_tickets',
    description: 'Close multiple tickets at once',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ticket IDs to close'
        }
      },
      required: ['ticket_ids']
    }
  },
  {
    name: 'zoho_mark_tickets_read',
    description: 'Mark multiple tickets as read',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ticket IDs to mark as read'
        }
      },
      required: ['ticket_ids']
    }
  },
  {
    name: 'zoho_mark_tickets_unread',
    description: 'Mark multiple tickets as unread',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ticket IDs to mark as unread'
        }
      },
      required: ['ticket_ids']
    }
  },
  {
    name: 'zoho_trash_tickets',
    description: 'Move multiple tickets to trash',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ticket IDs to trash'
        }
      },
      required: ['ticket_ids']
    }
  },

  /* ===========================
   * ACCOUNTS (Companies/Organizations)
   * =========================== */
  {
    name: 'zoho_list_accounts',
    description: 'List all accounts (companies/organizations)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of accounts to retrieve'
        }
      }
    }
  },
  {
    name: 'zoho_get_account',
    description: 'Get details of a specific account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'Account ID'
        }
      },
      required: ['account_id']
    }
  },
  {
    name: 'zoho_create_account',
    description: 'Create a new account (company/organization)',
    inputSchema: {
      type: 'object',
      properties: {
        account_name: {
          type: 'string',
          description: 'Account/company name'
        },
        email: {
          type: 'string',
          description: 'Account email'
        },
        phone: {
          type: 'string',
          description: 'Account phone number'
        },
        website: {
          type: 'string',
          description: 'Account website URL'
        },
        description: {
          type: 'string',
          description: 'Account description'
        }
      },
      required: ['account_name']
    }
  },
  {
    name: 'zoho_update_account',
    description: 'Update an existing account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'Account ID'
        },
        account_name: {
          type: 'string',
          description: 'New account name'
        },
        email: {
          type: 'string',
          description: 'New email'
        },
        phone: {
          type: 'string',
          description: 'New phone'
        },
        website: {
          type: 'string',
          description: 'New website'
        },
        description: {
          type: 'string',
          description: 'New description'
        }
      },
      required: ['account_id']
    }
  },
  {
    name: 'zoho_delete_account',
    description: 'Delete an account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'Account ID to delete'
        }
      },
      required: ['account_id']
    }
  },
  {
    name: 'zoho_get_account_tickets',
    description: 'Get all tickets for a specific account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'Account ID'
        },
        limit: {
          type: 'number',
          description: 'Number of tickets to retrieve'
        }
      },
      required: ['account_id']
    }
  },
  {
    name: 'zoho_get_account_contacts',
    description: 'Get all contacts associated with an account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'Account ID'
        },
        limit: {
          type: 'number',
          description: 'Number of contacts to retrieve'
        }
      },
      required: ['account_id']
    }
  },

  /* ===========================
   * TIME ENTRIES
   * =========================== */
  {
    name: 'zoho_list_ticket_time_entries',
    description: 'List all time entries for a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        limit: {
          type: 'number',
          description: 'Number of entries to retrieve'
        },
        billing_type: {
          type: 'string',
          enum: ['Billable', 'Non Billable'],
          description: 'Filter by billing type'
        }
      },
      required: ['ticket_id']
    }
  },
  {
    name: 'zoho_add_ticket_time_entry',
    description: 'Add a time entry to a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        executed_time: {
          type: 'string',
          description: 'Time spent (format: "HH:MM" or minutes as string)'
        },
        description: {
          type: 'string',
          description: 'Description of work done'
        },
        billing_type: {
          type: 'string',
          enum: ['Billable', 'Non Billable'],
          description: 'Billing type (default: Billable)'
        },
        owner_id: {
          type: 'string',
          description: 'Agent ID who performed the work'
        }
      },
      required: ['ticket_id', 'executed_time']
    }
  },
  {
    name: 'zoho_update_ticket_time_entry',
    description: 'Update a time entry on a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        time_entry_id: {
          type: 'string',
          description: 'Time entry ID'
        },
        executed_time: {
          type: 'string',
          description: 'New time spent'
        },
        description: {
          type: 'string',
          description: 'New description'
        },
        billing_type: {
          type: 'string',
          enum: ['Billable', 'Non Billable'],
          description: 'New billing type'
        }
      },
      required: ['ticket_id', 'time_entry_id']
    }
  },
  {
    name: 'zoho_delete_ticket_time_entry',
    description: 'Delete a time entry from a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        time_entry_id: {
          type: 'string',
          description: 'Time entry ID to delete'
        }
      },
      required: ['ticket_id', 'time_entry_id']
    }
  },
  {
    name: 'zoho_get_ticket_time_summary',
    description: 'Get total time summary for a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        }
      },
      required: ['ticket_id']
    }
  },

  /* ===========================
   * TASKS
   * =========================== */
  {
    name: 'zoho_list_tasks',
    description: 'List all tasks',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of tasks to retrieve'
        },
        status: {
          type: 'string',
          description: 'Filter by status'
        }
      }
    }
  },
  {
    name: 'zoho_get_task',
    description: 'Get details of a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'zoho_create_task',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Task subject/title'
        },
        description: {
          type: 'string',
          description: 'Task description'
        },
        due_date: {
          type: 'string',
          description: 'Due date (ISO format)'
        },
        priority: {
          type: 'string',
          description: 'Task priority'
        },
        status: {
          type: 'string',
          description: 'Task status'
        },
        owner_id: {
          type: 'string',
          description: 'Agent ID to assign task to'
        },
        ticket_id: {
          type: 'string',
          description: 'Associated ticket ID'
        },
        department_id: {
          type: 'string',
          description: 'Department ID'
        }
      },
      required: ['subject']
    }
  },
  {
    name: 'zoho_update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID'
        },
        subject: {
          type: 'string',
          description: 'New subject'
        },
        description: {
          type: 'string',
          description: 'New description'
        },
        due_date: {
          type: 'string',
          description: 'New due date'
        },
        priority: {
          type: 'string',
          description: 'New priority'
        },
        status: {
          type: 'string',
          description: 'New status'
        },
        owner_id: {
          type: 'string',
          description: 'New owner agent ID'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'zoho_delete_task',
    description: 'Delete a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID to delete'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'zoho_list_ticket_tasks',
    description: 'List all tasks associated with a ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'Ticket ID'
        },
        limit: {
          type: 'number',
          description: 'Number of tasks to retrieve'
        }
      },
      required: ['ticket_id']
    }
  },

  /* ===========================
   * PRODUCTS
   * =========================== */
  {
    name: 'zoho_list_products',
    description: 'List all products',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of products to retrieve'
        }
      }
    }
  },
  {
    name: 'zoho_get_product',
    description: 'Get details of a specific product',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'Product ID'
        }
      },
      required: ['product_id']
    }
  },

  /* ===========================
   * TICKET DRAFT REPLIES (stage outbound emails without sending)
   * =========================== */
  {
    name: 'zoho_draft_ticket_reply',
    description: 'Stage an email reply on a ticket as a draft (no email sent). From/To/channel auto-derived from the latest inbound thread. Plain-text content is auto-formatted as HTML paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Ticket ID' },
        content: { type: 'string', description: 'Reply body. HTML or plain text — plain text is auto-wrapped in <p> tags so paragraphs render correctly.' }
      },
      required: ['ticket_id', 'content']
    }
  },
  {
    name: 'zoho_update_draft_reply',
    description: 'Update the content of an existing draft reply thread. NOTE: Zoho often rejects an in-place draft edit (PATCH 404) — if this fails, delete the draft with zoho_delete_draft_reply and create a fresh one with zoho_draft_ticket_reply (that delete+recreate is the reliable "update").',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Ticket ID' },
        thread_id: { type: 'string', description: 'Draft thread ID returned from zoho_draft_ticket_reply' },
        content: { type: 'string', description: 'New reply body' }
      },
      required: ['ticket_id', 'thread_id', 'content']
    }
  },
  {
    name: 'zoho_delete_draft_reply',
    description: 'Delete a stale/duplicate draft reply thread (no email sent). Keep ONE draft per ticket: before creating a new draft, delete any older ones. Also the reliable way to "update" a draft (delete + recreate). thread_id comes from a draft creation result or a ticket read (threads with status DRAFT).',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Ticket ID' },
        thread_id: { type: 'string', description: 'Draft thread ID to delete' }
      },
      required: ['ticket_id', 'thread_id']
    }
  },
  {
    name: 'zoho_send_draft_reply',
    description: 'SEND an existing draft reply to the customer (real outbound email). Outward-facing action — only call when a human/owner has approved the send or auto-send is explicitly enabled. Default posture is to LEAVE replies as drafts for review.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Ticket ID' },
        thread_id: { type: 'string', description: 'Draft thread ID to send' }
      },
      required: ['ticket_id', 'thread_id']
    }
  },
  {
    name: 'zoho_get_attachment',
    description: 'Download a ticket thread attachment (screenshot, log, image) to a local file and return its path, so you can actually LOOK at what the customer sent before diagnosing. Get thread_id + attachment_id + name from zoho_get_thread (attachments[].id / .name / .href).',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Ticket ID' },
        thread_id: { type: 'string', description: 'Thread ID that carries the attachment' },
        attachment_id: { type: 'string', description: 'Attachment ID from the thread attachments list' },
        file_name: { type: 'string', description: 'Optional original file name (preserves the extension so images open correctly)' },
        out_dir: { type: 'string', description: 'Optional output directory; defaults to a temp folder under the ticket ID' }
      },
      required: ['ticket_id', 'thread_id', 'attachment_id']
    }
  },

  /* ===========================
   * THREAD UTILITIES
   * =========================== */
  {
    name: 'zoho_get_thread_original_content',
    description: 'Fetch the original (full) email body for a thread, including any inline images and full quoted history.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string' },
        thread_id: { type: 'string' }
      },
      required: ['ticket_id', 'thread_id']
    }
  },
  {
    name: 'zoho_delete_thread_attachment',
    description: 'Delete an attachment from a specific thread on a ticket.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string' },
        thread_id: { type: 'string' },
        attachment_id: { type: 'string' }
      },
      required: ['ticket_id', 'thread_id', 'attachment_id']
    }
  },

  /* ===========================
   * TICKET RESOLUTION
   * =========================== */
  {
    name: 'zoho_get_ticket_resolution',
    description: 'Get the resolution summary for a ticket (the canonical fix description set when closing).',
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] }
  },
  {
    name: 'zoho_update_ticket_resolution',
    description: 'Set or update the resolution summary on a ticket. Optionally email the contact when set.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string' },
        content: { type: 'string', description: 'Resolution body (auto-formatted as HTML if plain text)' },
        is_notify_contact: { type: 'boolean', description: 'Email the contact when resolution is set (default false)' }
      },
      required: ['ticket_id', 'content']
    }
  },
  {
    name: 'zoho_delete_ticket_resolution',
    description: 'Clear the resolution summary on a ticket.',
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] }
  },
  {
    name: 'zoho_get_ticket_resolution_history',
    description: 'Get the edit history of a ticket resolution.',
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] }
  },

  /* ===========================
   * TICKET MERGE / SPLIT
   * =========================== */
  {
    name: 'zoho_merge_tickets',
    description: 'Merge other tickets into a primary ticket. Useful for collapsing duplicate auto-replies into one record.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Primary ticket ID (target)' },
        merge_ids: { type: 'array', items: { type: 'string' }, description: 'IDs of tickets to merge into the primary' },
        source: {
          type: 'object',
          description: 'Optional: which ticket to inherit fields from (contactId/subject/priority/status)',
          properties: {
            contact_id: { type: 'string' },
            subject: { type: 'string' },
            priority: { type: 'string' },
            status: { type: 'string' }
          }
        }
      },
      required: ['ticket_id', 'merge_ids']
    }
  },
  {
    name: 'zoho_split_ticket_thread',
    description: 'Split a thread off a ticket into a new ticket. Useful when one customer email mixes two unrelated issues.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string' },
        thread_id: { type: 'string' }
      },
      required: ['ticket_id', 'thread_id']
    }
  },

  /* ===========================
   * SPAM HANDLING
   * =========================== */
  {
    name: 'zoho_mark_tickets_spam',
    description: 'Mark one or more tickets as spam. Optionally also mark the contact as spam and apply to their existing tickets.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: { type: 'array', items: { type: 'string' } },
        contact_spam: { type: 'boolean', description: 'Also mark the originating contact as spam' },
        handle_existing_tickets: { type: 'boolean', description: 'Apply spam classification to the contact\'s prior tickets' }
      },
      required: ['ticket_ids']
    }
  },
  {
    name: 'zoho_delete_spam_tickets',
    description: 'Permanently delete spam tickets by ID.',
    inputSchema: {
      type: 'object',
      properties: { ticket_ids: { type: 'array', items: { type: 'string' } } },
      required: ['ticket_ids']
    }
  },
  {
    name: 'zoho_empty_spam',
    description: 'Empty the entire spam folder for a department.',
    inputSchema: {
      type: 'object',
      properties: { department_id: { type: 'string' } },
      required: ['department_id']
    }
  },

  /* ===========================
   * BULK UPDATE
   * =========================== */
  {
    name: 'zoho_bulk_update_tickets',
    description: 'Update one field across many tickets at once (e.g. reassign 50 tickets to one agent).',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: { type: 'array', items: { type: 'string' } },
        field_name: { type: 'string', description: 'Field to update (e.g. status, priority, assigneeId, subject)' },
        field_value: { description: 'New value for that field (string usually)' },
        is_custom_field: { type: 'boolean', description: 'True if updating a custom field (default false)' }
      },
      required: ['ticket_ids', 'field_name', 'field_value']
    }
  },

  /* ===========================
   * TICKET LISTS / VIEWS
   * =========================== */
  {
    name: 'zoho_get_archived_tickets',
    description: 'List archived tickets.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' }, from: { type: 'number' } }
    }
  },
  {
    name: 'zoho_get_agents_tickets_count',
    description: 'Get ticket-count-per-agent across the organization (for workload visibility).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'zoho_get_associated_tickets',
    description: 'List tickets that are associated with another via merge/parent/child relationship.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' }, from: { type: 'number' } }
    }
  },
  {
    name: 'zoho_get_ticket_queue_view_count',
    description: 'Get queue-view counts (tickets per saved view).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'zoho_get_tickets_by_product',
    description: 'List tickets filed against a specific product.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        limit: { type: 'number' },
        from: { type: 'number' }
      },
      required: ['product_id']
    }
  },

  /* ===========================
   * COMMENT GET / EDIT / DELETE
   * =========================== */
  {
    name: 'zoho_get_ticket_comment',
    description: 'Get a single ticket comment by ID.',
    inputSchema: {
      type: 'object',
      properties: { ticket_id: { type: 'string' }, comment_id: { type: 'string' } },
      required: ['ticket_id', 'comment_id']
    }
  },
  {
    name: 'zoho_update_ticket_comment',
    description: 'Edit an existing ticket comment\'s content. Plain text is auto-formatted as HTML.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string' },
        comment_id: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['ticket_id', 'comment_id', 'content']
    }
  },
  {
    name: 'zoho_delete_ticket_comment',
    description: 'Delete a ticket comment by ID.',
    inputSchema: {
      type: 'object',
      properties: { ticket_id: { type: 'string' }, comment_id: { type: 'string' } },
      required: ['ticket_id', 'comment_id']
    }
  },
  {
    name: 'zoho_get_ticket_comment_history',
    description: 'Get the edit history of a ticket comment.',
    inputSchema: {
      type: 'object',
      properties: { ticket_id: { type: 'string' }, comment_id: { type: 'string' } },
      required: ['ticket_id', 'comment_id']
    }
  },

  /* ===========================
   * TAG OPERATIONS (account-level)
   * =========================== */
  {
    name: 'zoho_list_recent_tags',
    description: 'List recently-used ticket tags across the org.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'zoho_update_recent_tag',
    description: 'Mark a tag as recently used (bumps it in the recent-tags list).',
    inputSchema: {
      type: 'object',
      properties: { tag_id: { type: 'string' } },
      required: ['tag_id']
    }
  },
  {
    name: 'zoho_list_all_tags',
    description: 'List all ticket tags in the account (full catalog).',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' }, from: { type: 'number' } }
    }
  },
  {
    name: 'zoho_search_tags',
    description: 'Search ticket tags by name.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, limit: { type: 'number' } },
      required: ['query']
    }
  },
  {
    name: 'zoho_list_tickets_by_tag',
    description: 'List tickets that have a given tag attached.',
    inputSchema: {
      type: 'object',
      properties: {
        tag_id: { type: 'string' },
        limit: { type: 'number' },
        from: { type: 'number' }
      },
      required: ['tag_id']
    }
  },
  {
    name: 'zoho_replace_tag',
    description: 'Replace one tag with another across every ticket that uses it (bulk rename/merge).',
    inputSchema: {
      type: 'object',
      properties: {
        current_tag_id: { type: 'string', description: 'Tag to be replaced' },
        replacing_tag_id: { type: 'string', description: 'Tag that takes its place' }
      },
      required: ['current_tag_id', 'replacing_tag_id']
    }
  },

  /* ===========================
   * CONTACT LOOKUP / CUSTOMER HISTORY
   * =========================== */
  {
    name: 'zoho_find_contact_by_email',
    description: 'Find a Zoho contact by their email address. Returns the first match or null.',
    inputSchema: {
      type: 'object',
      properties: { email: { type: 'string' } },
      required: ['email']
    }
  },
  {
    name: 'zoho_get_customer_history_by_email',
    description: 'Given a customer email, returns their contact record AND every ticket they have ever opened. Use this before replying to a returning customer so you have prior interaction context. Returns null if no contact found.',
    inputSchema: {
      type: 'object',
      properties: { email: { type: 'string' } },
      required: ['email']
    }
  }
];
