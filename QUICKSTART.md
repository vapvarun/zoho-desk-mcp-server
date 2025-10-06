# 🚀 Zoho Desk MCP Server - Quick Start

## ✅ Setup Complete!

Your Zoho Desk MCP Server is now installed and configured with your Zoho credentials.

### What's Been Done:

1. ✅ **Credentials Configured** - Access tokens and org ID set up
2. ✅ **Server Built** - TypeScript compiled to JavaScript
3. ✅ **Claude Desktop Configured** - MCP server added to Claude Desktop
4. ✅ **Ready to Use** - All 20 Zoho Desk tools are now available

## 🔄 Next Steps

### 1. Restart Claude Desktop

**Important:** You must restart Claude Desktop for the changes to take effect.

```bash
# Quit Claude Desktop completely, then restart it
```

### 2. Verify Installation

Open Claude Desktop and check if the Zoho Desk tools are available. You should see the hammer/wrench icon in the bottom right showing MCP tools are loaded.

### 3. Test It Out

Try these commands in Claude Desktop:

```
"List all open support tickets"

"Create a new ticket with subject 'Login issue' and description 'User cannot access account'"

"Show me ticket #12345 with all conversation threads"

"Reply to ticket #12345 saying 'We're investigating this issue'"

"Search for tickets about 'password reset'"

"Add tags 'urgent' and 'security' to ticket #12345"
```

## 📍 Installation Paths

- **MCP Server:** `/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server`
- **Built Files:** `/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/build`
- **Config File:** `/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/config.json`
- **Claude Config:** `~/Library/Application Support/Claude/claude_desktop_config.json`

## 🔧 Your Credentials

Your configuration is loaded from:

**Access Token:** Loaded from environment variable in Claude config
**Organization ID:** `657932157`

## 🛠 Available Tools (20)

### Ticket Management (7 tools)
- `zoho_list_tickets` - List tickets with filters
- `zoho_get_ticket` - Get ticket with ALL threaded replies (automatic)
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

## 📝 Usage Examples

### Example 1: Create and Manage a Ticket
```
User: "Create a ticket for customer login issue with high priority"

Claude: [Uses zoho_create_ticket tool]
        Ticket created successfully! ID: #12345

User: "Reply to that ticket saying we're working on it"

Claude: [Uses zoho_reply_ticket tool]
        Reply posted to ticket #12345
```

### Example 2: Search and Filter
```
User: "Find all tickets about password reset that are still open"

Claude: [Uses zoho_search_tickets tool]
        Found 5 open tickets about password reset...
```

### Example 3: Customer Support History
```
User: "Show me all tickets from contact ID 98765"

Claude: [Uses zoho_get_contact_tickets tool]
        Customer has 12 tickets total:
        - 8 closed
        - 3 open
        - 1 on hold
```

## 🔄 Updating

If you make changes to the source code:

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server"
npm run build
# Then restart Claude Desktop
```

## 🌍 Using from Terminal/CLI

You can also run the MCP server directly from any terminal:

```bash
# Set environment variables
export ZOHO_ACCESS_TOKEN="your_token"
export ZOHO_ORG_ID="657932157"

# Run the server
node "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/build/index.js"
```

Or use the config file:

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server"
node build/index.js
```

## 🐛 Troubleshooting

### Tools not showing in Claude
1. Make sure you **completely quit and restart Claude Desktop** (Cmd+Q, then reopen)
2. Check Claude Desktop logs for errors
3. Verify config file path is correct

### "Zoho credentials not found"
- Check that config.json exists and contains the access token
- Or verify environment variables are set in Claude config

### API Errors / "Token Invalid or Expired"

**Zoho access tokens expire after 1 hour!**

To refresh your token:

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server"
./refresh-token.sh
```

Then **restart Claude Desktop** (Cmd+Q, then reopen).

Other API error causes:
- Verify you have proper permissions in Zoho Desk
- Ensure organization ID is correct

### Server Crashes
Check Claude Desktop logs:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

## 🤖 Bonus: Automated Slack Summaries

Send daily ticket summaries to Slack automatically!

```bash
# Setup (one time)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test
cd automation
node combined-summary-slack.js

# Schedule (daily at 9 AM)
crontab -e
# Add: 0 9 * * * cd /path/to/automation && node combined-summary-slack.js
```

See `automation/README.md` for complete guide.

---

## 📚 Documentation

- **README:** Full documentation in `README.md`
- **Automation:** Setup guide in `automation/README.md`
- **Zoho Desk API:** https://desk.zoho.com/support/APIDocument.do

## 🎉 You're All Set!

Your Zoho Desk MCP server is ready to use. Just restart Claude Desktop and start managing your support tickets with natural language!

---

**Need help?** Check the README.md for detailed information.
