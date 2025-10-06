# 🎫 Zoho Desk MCP Server

[![License](https://img.shields.io/badge/license-GPL--2.0--or--later-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-0.5.0-purple.svg)](https://modelcontextprotocol.io/)

**AI-Powered Support Ticket Management for Claude AI**

A Model Context Protocol (MCP) server that provides comprehensive Zoho Desk integration, enabling Claude AI to manage support tickets, customers, agents, and more through natural language.

**Author:** [Varun Dubey (vapvarun)](https://github.com/vapvarun) | **Company:** [Wbcom Designs](https://wbcomdesigns.com)

---

## ✨ Features

### 🎯 Complete Ticket Management
- **List & Filter**: View tickets by status, priority, date with advanced filtering
- **CRUD Operations**: Create, read, update, and delete support tickets
- **Threaded Conversations**: Automatically includes all replies when reading tickets
- **Comments & Notes**: Add internal comments and public updates to tickets
- **Tag Management**: Organize tickets with tags and categories

### 👥 Customer & Contact Management
- **Customer Profiles**: Access complete contact information and history
- **Ticket History**: View all tickets for specific customers
- **Multi-Contact Support**: Manage multiple contacts per organization

### 🤝 Team & Department Management
- **Agent Directory**: List all support agents and their details
- **Department Organization**: View and manage support departments
- **Assignment Control**: Assign tickets to specific agents

### 🔍 Advanced Search
- **Full-Text Search**: Find tickets by keywords across all fields
- **Smart Filtering**: Combine multiple search criteria
- **Quick Lookup**: Fast access to specific tickets and contacts

### 🤖 AI Integration
- **Natural Language**: Manage tickets using conversational AI
- **Context Awareness**: Claude understands ticket context and relationships
- **Automated Workflows**: Let AI suggest and execute support workflows

---

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- Zoho Desk account with API access
- Claude Desktop or MCP-compatible client

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/vapvarun/zoho-desk-mcp-server.git
cd zoho-desk-mcp-server

# Install dependencies
npm install

# Configure credentials (see Configuration section)
cp config.example.json config.json
# Edit config.json with your Zoho credentials

# Build the server
npm run build

# Test the server
npm start
```

---

## ⚙️ Configuration

### Getting Zoho Desk Credentials

1. **Create Zoho API Client**:
   - Go to [Zoho API Console](https://api-console.zoho.com/)
   - Create a new "Self Client" application
   - Note your Client ID and Client Secret

2. **Generate Tokens**:
   - Use OAuth 2.0 flow to get access token and refresh token
   - Required scopes: `Desk.tickets.ALL`, `Desk.contacts.READ`, `Desk.settings.READ`

3. **Get Organization ID**:
   - Found in Zoho Desk Settings → Developer Space → API
   - Or in your Zoho Desk URL: `https://desk.zoho.com/support/YourOrgID`

### Configuration Methods

#### Option 1: Config File (Recommended for Development)

Create `config.json` in the project root:

```json
{
  "accessToken": "1000.xxxxx...",
  "orgId": "657932157",
  "clientId": "1000.XXXXX...",
  "clientSecret": "xxxxx...",
  "refreshToken": "1000.xxxxx..."
}
```

**⚠️ IMPORTANT**: Never commit `config.json` to git! It's already in `.gitignore`.

#### Option 2: Environment Variables (Recommended for Production)

```bash
export ZOHO_ACCESS_TOKEN="1000.xxxxx..."
export ZOHO_ORG_ID="657932157"
export ZOHO_CLIENT_ID="1000.XXXXX..."
export ZOHO_CLIENT_SECRET="xxxxx..."
export ZOHO_REFRESH_TOKEN="1000.xxxxx..."
```

---

## 🚀 Usage

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "zoho-desk": {
      "command": "node",
      "args": [
        "/absolute/path/to/zoho-desk-mcp-server/build/index.js"
      ],
      "env": {
        "ZOHO_ACCESS_TOKEN": "your_access_token",
        "ZOHO_ORG_ID": "your_org_id"
      }
    }
  }
}
```

**Restart Claude Desktop** for changes to take effect.

### From Command Line

```bash
# Using environment variables
ZOHO_ACCESS_TOKEN="..." ZOHO_ORG_ID="..." node build/index.js

# Using config.json
node build/index.js
```

### Example Conversations with Claude

```
"List all open support tickets"

"Create a new ticket for customer issue with login"

"Show me ticket #12345 with all conversation threads"

"Reply to ticket #12345 saying 'We're working on this issue'"

"Search for all tickets about 'password reset'"

"Add tags 'urgent' and 'security' to ticket #12345"

"Move ticket #12345 to the Technical Support department"

"Show me all tickets for contact ID 98765"

"List all support agents in the Sales department"

"List all departments and move ticket #98765 to department ID 123456"
```

---

## 🤖 Automation & Slack Integration

### Automated Daily Summaries

Send ticket summaries to Slack automatically with included automation scripts.

**Features:**
- 📊 Daily/weekly ticket summaries
- 🔔 Slack notifications
- 📈 Status and priority breakdowns
- 🔄 Combined Zoho + Basecamp reports

**Quick Setup:**

```bash
# Configure Slack webhook
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test manually
cd automation
node combined-summary-slack.js

# Schedule with cron (daily at 9 AM)
crontab -e
# Add: 0 9 * * * cd /path/to/automation && node combined-summary-slack.js
```

**See:** [`automation/README.md`](automation/README.md) for complete setup guide.

---

## 🛠️ Available Tools

### Ticket Management (7 tools)
- `zoho_list_tickets` - List tickets with filters
- `zoho_get_ticket` - Get ticket details with all threaded replies (automatic)
- `zoho_create_ticket` - Create new support ticket
- `zoho_update_ticket` - Update ticket status/priority/assignee/department
- `zoho_move_ticket` - Move/transfer ticket to different department
- `zoho_reply_ticket` - Add reply or private note
- `zoho_delete_ticket` - Delete/trash a ticket

### Ticket Comments (2 tools)
- `zoho_list_ticket_comments` - List all comments on a ticket
- `zoho_add_ticket_comment` - Add internal or public comment to ticket

### Ticket Tags (2 tools)
- `zoho_get_ticket_tags` - Get all tags for a ticket
- `zoho_add_ticket_tags` - Add categorization tags

### Contacts (3 tools)
- `zoho_list_contacts` - List all customers
- `zoho_get_contact` - Get contact details
- `zoho_get_contact_tickets` - Get customer's ticket history

### Departments & Agents (3 tools)
- `zoho_list_departments` - List all departments
- `zoho_list_agents` - List all support agents
- `zoho_get_agent` - Get agent profile

### Search (1 tool)
- `zoho_search_tickets` - Full-text ticket search

**Total: 20 powerful AI tools**

---

## 📚 API Coverage

This MCP server implements the complete Zoho Desk API v1:

- ✅ Tickets API - Full CRUD operations
- ✅ Ticket Threads API - Conversations and replies
- ✅ Ticket Tags API - Tag management
- ✅ Contacts API - Customer management
- ✅ Departments API - Organization structure
- ✅ Agents API - Team member access
- ✅ Search API - Advanced ticket search
- ✅ OAuth 2.0 - Token refresh support

**API Documentation**: [Zoho Desk API Reference](https://desk.zoho.com/support/APIDocument.do)

---

## 🔧 Development

### Project Structure

```
zoho-desk-mcp-server/
├── src/
│   ├── index.ts         # Entry point
│   ├── server.ts        # MCP server implementation
│   ├── zoho-api.ts      # Zoho Desk API client
│   ├── tools.ts         # MCP tool definitions
│   └── config.ts        # Configuration loader
├── build/               # Compiled JavaScript (git-ignored)
├── config.json          # Your credentials (git-ignored)
├── config.example.json  # Template for configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Build & Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode (auto-rebuild on changes)
npm run dev

# Start the server
npm start
```

### TypeScript Configuration

Uses strict TypeScript 5.3+ with:
- ES2022 target
- Node16 module resolution
- Full type checking enabled
- Source maps for debugging

---

## 🔐 Security

### Important Security Notes

1. **Never Commit Credentials**: `config.json` is git-ignored by default
2. **Token Expiration**: Access tokens expire - implement refresh logic
3. **OAuth Scopes**: Request only necessary API scopes
4. **Environment Variables**: Preferred for production deployments
5. **HTTPS Only**: All API requests use secure connections

### Token Refresh

**Zoho access tokens expire after 1 hour.** When your token expires, you'll see authentication errors.

#### Quick Token Refresh (Recommended)

Use the included refresh script:

```bash
cd /path/to/zoho-desk-mcp-server
./refresh-token.sh
```

This script automatically:
- ✅ Requests a new access token from Zoho
- ✅ Updates `config.json`
- ✅ Updates Claude Desktop config
- ✅ Updates WordPress (if available)

**After refreshing, restart Claude Desktop!**

#### Manual Token Refresh

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

Then update the `accessToken` in:
1. `config.json`
2. Claude Desktop config
3. Restart Claude Desktop

#### Programmatic Token Refresh

The Zoho API client includes token refresh support:

```typescript
import { ZohoAPI } from './zoho-api.js';

await ZohoAPI.refreshAccessToken(
  clientId,
  clientSecret,
  refreshToken
);
```

### Reporting Security Issues

Please report security vulnerabilities to: **varun@wbcomdesigns.com**

Do not create public GitHub issues for security problems.

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with clear commit messages
4. Add tests if applicable
5. Run `npm run build` to ensure it compiles
6. Submit a pull request

---

## 📄 License

**GPL-2.0-or-later** - See [LICENSE](LICENSE) file for details.

This is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later version.

---

## 👨‍💻 Author & Support

**Varun Dubey (vapvarun)**
- GitHub: [@vapvarun](https://github.com/vapvarun)
- Email: varun@wbcomdesigns.com
- Company: [Wbcom Designs](https://wbcomdesigns.com)

**Company:** Wbcom Designs
- Website: https://wbcomdesigns.com
- Premium WordPress Plugins & Themes
- Custom Development Services

---

## 🙏 Acknowledgments

- **Anthropic** - For Claude AI and the Model Context Protocol
- **Zoho** - For the comprehensive Desk API
- **MCP Community** - For protocol standards and best practices

---

## 📊 Related Projects

- [Basecamp MCP Server](https://github.com/vapvarun/basecamp-mcp-server) - Basecamp project management for Claude AI
- [Wbcom Designs](https://wbcomdesigns.com) - Premium WordPress solutions

---

## 🌟 Show Your Support

If this project helps you, please ⭐️ star it on GitHub!

---

**Made with ❤️ by [Varun Dubey](https://github.com/vapvarun) at [Wbcom Designs](https://wbcomdesigns.com)**
