# 🔔 Real-Time Slack Notifications (MCP)

Get instant Slack notifications when you reply or comment on Zoho Desk tickets through Claude AI!

## ✨ Features

**Automatic notifications when you use Claude to:**
- 💬 Reply to tickets (public or private)
- 💭 Add comments to tickets (public or private)

**Each notification includes:**
- 🎫 Ticket number and subject
- 📊 Ticket status and priority
- 📝 Your reply/comment content (first 500 chars)
- 🔒 Privacy indicator (public/private)
- ⏰ Timestamp

**Key Benefit:** Only actions done **through Claude MCP** trigger notifications. Manual actions in Zoho Desk won't spam your Slack!

---

## 🚀 Setup

### Step 1: Configure Slack Webhook

Add your Slack webhook URL to `config.json`:
```json
{
  "slackWebhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
}
```

### Step 2: Restart Claude Desktop

For the new functionality to take effect:

1. **Quit Claude Desktop completely**
2. **Restart Claude Desktop**
3. **That's it!** Notifications are now enabled

---

## 💬 How It Works

### When You Reply via Claude

**You say:** "Reply to ticket #36145 saying 'I'll look into this issue and get back to you shortly.'"

**Claude:**
1. Adds the reply to Zoho Desk ✅
2. Sends Slack notification ✅

**Slack receives:**
```
💬 New Ticket Reply (via Claude)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ticket: #36145 - Plugin compatibility issue
Status: Open

Reply:
I'll look into this issue and get back to you shortly.

Priority: High | 2025-10-06 06:30 PM
```

### When You Add Comment via Claude

**You say:** "Add private note to ticket #36145: Customer reported this on forum too. High priority for next release."

**Claude:**
1. Adds private comment to Zoho Desk ✅
2. Sends Slack notification ✅

**Slack receives:**
```
🔒 Private Note Added (via Claude)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ticket: #36145 - Plugin compatibility issue
Status: Open

Comment:
Customer reported this on forum too. High priority for next release.

Priority: High | 2025-10-06 06:32 PM
```

---

## 🎯 Example Workflows

### Customer Support Flow

1. **Check open tickets:**
   ```
   You: "Show me open high priority tickets"
   Claude: [Lists tickets]
   ```

2. **Reply to urgent ticket:**
   ```
   You: "Reply to ticket #36145 saying 'Our development team is investigating this issue. We'll have an update for you within 24 hours.'"
   Claude: [Adds reply]
   ```

3. **Slack notification sent immediately** ✅
   - Your team sees you've responded
   - No need to check Zoho Desk constantly

4. **Add internal note:**
   ```
   You: "Add private note to #36145: Assigned to senior dev team. Related to WordPress 6.4 update."
   Claude: [Adds note]
   ```

5. **Slack notification sent for note** ✅
   - Team aware of internal action
   - Better coordination

---

## 🔧 Customization

### Disable Notifications Temporarily

Remove or comment out `slackWebhookUrl` in `config.json`:

```json
{
  "accessToken": "...",
  "orgId": "...",
  // "slackWebhookUrl": "https://hooks.slack.com/..."
}
```

Restart Claude Desktop.

### Use Different Slack Channel

Update `slackWebhookUrl` in `config.json` with a new webhook URL for a different channel:

```json
{
  "slackWebhookUrl": "https://hooks.slack.com/services/YOUR/NEW/WEBHOOK"
}
```

Restart Claude Desktop.

### Environment Variable Override

You can also set via environment variable in Claude Desktop config:

```json
{
  "mcpServers": {
    "zoho-desk": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/..."
      }
    }
  }
}
```

---

## 📋 Notification Types

### Public Reply
- **Icon:** 💬
- **Title:** "New Ticket Reply (via Claude)"
- **Visible to:** Everyone in Slack channel

### Private Reply
- **Icon:** 🔒
- **Title:** "Private Reply (via Claude)"
- **Visible to:** Everyone in Slack channel (but reply is private in Zoho)

### Public Comment
- **Icon:** 💭
- **Title:** "Public Comment Added (via Claude)"
- **Visible to:** Everyone in Slack channel

### Private Note
- **Icon:** 🔒
- **Title:** "Private Note Added (via Claude)"
- **Visible to:** Everyone in Slack channel (but note is private in Zoho)

---

## ❓ FAQ

### Why only MCP actions?
This prevents notification spam. You might make dozens of manual changes in Zoho Desk throughout the day, but Claude actions are typically more significant and worth notifying the team about.

### Can I get notifications for ALL Zoho actions?
Not through MCP. If you need all Zoho actions, you'll need to set up Zoho Desk webhooks separately (see Zoho's documentation).

### What if Slack notification fails?
The MCP action still completes successfully. Slack notification failures are logged to console but don't block ticket operations.

### Can I customize the notification format?
Yes! Edit the `sendSlackNotification` method in `src/server.ts` and rebuild with `npm run build`.

### Does this work with other chat platforms?
Currently only Slack is supported. You can adapt the `sendSlackNotification` method for other platforms that support webhooks (Discord, Microsoft Teams, etc.).

---

## 🐛 Troubleshooting

### Not receiving notifications?

**Check 1: Webhook URL is configured**
```bash
cat config.json | grep slackWebhookUrl
```

Should show your webhook URL.

**Check 2: Webhook URL is valid**
```bash
curl -X POST -H 'Content-Type: application/json' \
  --data '{"text":"Test from Zoho MCP"}' \
  "YOUR_WEBHOOK_URL"
```

Should return `ok`.

**Check 3: Claude Desktop restarted**
- Completely quit Claude Desktop
- Restart it
- Try the action again

**Check 4: Check Claude Desktop logs**
- Look for any error messages
- Failed Slack notifications are logged but don't stop execution

### Notifications going to wrong channel?

Update the webhook URL in `config.json` to point to the correct Slack channel.

---

## 📞 Support

**Questions or issues?**
- Email: varun@wbcomdesigns.com
- GitHub: https://github.com/vapvarun/zoho-desk-mcp-server

---

**Author:** Varun Dubey (vapvarun)
**Company:** Wbcom Designs
**License:** GPL-2.0-or-later
