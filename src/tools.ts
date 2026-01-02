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
    description: 'Create a new support ticket',
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Ticket subject/title'
        },
        description: {
          type: 'string',
          description: 'Ticket description/content'
        },
        contact_id: {
          type: 'string',
          description: 'Contact ID (customer)'
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High'],
          description: 'Ticket priority'
        },
        status: {
          type: 'string',
          description: 'Initial ticket status'
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
  }
];
