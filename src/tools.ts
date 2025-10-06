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
  }
];
