# 🤖 Automated Ticket & Project Summaries to Slack

Send automated daily/weekly summaries of Zoho Desk tickets and Basecamp projects to Slack.

## 📋 Available Scripts

### 1. Zoho Desk Summary
**File:** `ticket-summary-slack.js`

Sends summary of Zoho Desk tickets with:
- Total ticket count
- Breakdown by status (Open, Closed, etc.)
- Breakdown by priority (High, Medium, Low)
- Recent tickets (top 5)

### 2. Basecamp Summary
**File:** `card-summary-slack.js`

Sends summary of Basecamp projects with:
- Total project count
- Active vs archived
- Recent active projects

### 3. Combined Summary (Recommended)
**File:** `combined-summary-slack.js`

Sends comprehensive summary of both:
- Zoho Desk tickets
- Basecamp projects
- All in one message

---

## 🚀 Setup

### Step 1: Get Slack Webhook URL

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to "Incoming Webhooks"
4. Activate Incoming Webhooks
5. Click "Add New Webhook to Workspace"
6. Select the channel (e.g., #support-summary)
7. Copy the Webhook URL

**Example webhook URL:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### Step 2: Configure Webhook

**Option 1: Environment Variable (Recommended)**
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Option 2: Add to config.json**
```json
{
  "accessToken": "...",
  "orgId": "...",
  "slackWebhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
}
```

### Step 3: Make Scripts Executable

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation"
chmod +x ticket-summary-slack.js
chmod +x combined-summary-slack.js
```

---

## 🧪 Testing

### Test Zoho Desk Summary

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation"

# Set webhook URL
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run script
node ticket-summary-slack.js
```

### Test Combined Summary

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation"

# Set webhook URL
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run script
node combined-summary-slack.js
```

**Expected Output:**
```
🔄 Fetching data from Zoho Desk and Basecamp...

✅ Zoho Desk: 47 tickets
✅ Basecamp: 12 projects

📤 Sending summary to Slack...
✅ Summary sent successfully!
```

---

## ⏰ Scheduling with Cron

### Daily Summary at 9 AM

Edit crontab:
```bash
crontab -e
```

Add this line:
```cron
0 9 * * * export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node combined-summary-slack.js >> /tmp/slack-summary.log 2>&1
```

### Weekly Summary (Monday at 9 AM)

```cron
0 9 * * 1 export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node combined-summary-slack.js >> /tmp/slack-summary.log 2>&1
```

### Multiple Reports

```cron
# Daily combined summary at 9 AM
0 9 * * * export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node combined-summary-slack.js >> /tmp/slack-summary.log 2>&1

# Zoho Desk summary at 5 PM
0 17 * * * export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node ticket-summary-slack.js >> /tmp/slack-summary.log 2>&1
```

### Cron Schedule Examples

| Schedule | Cron | Description |
|----------|------|-------------|
| Every day 9 AM | `0 9 * * *` | Daily summary |
| Every Monday 9 AM | `0 9 * * 1` | Weekly summary |
| Every hour | `0 * * * *` | Hourly updates |
| Every 30 minutes | `*/30 * * * *` | Half-hourly |
| Mon-Fri 9 AM | `0 9 * * 1-5` | Weekdays only |

---

## 📊 Sample Slack Message

The combined summary message looks like this:

```
📊 Daily Workflow Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎫 Zoho Desk Tickets

Total Tickets: 47
By Status:
• Open: 23
• Closed: 18
• On Hold: 6

Recent Tickets:
• #12345 - Login issue for customer
• #12346 - Feature request: Dark mode
• #12347 - Bug in payment gateway

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Basecamp Projects

Total Projects: 12
Active Projects: 8

Active Projects:
• Website Redesign
• Mobile App v2.0
• API Integration

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: 2025-10-06 09:00 AM | Zoho Desk + Basecamp MCP Servers
```

---

## 🔧 Customization

### Change Report Frequency

Edit the script to filter by date range:

```javascript
// In ticket-summary-slack.js

// Last 24 hours
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// Add date filter to API call
const params = new URLSearchParams();
params.append('modifiedTimeRange', yesterday.toISOString());
```

### Filter by Status

```javascript
// Only open tickets
const tickets = await fetchTickets('Open', 100);
```

### Custom Slack Channels

Use different webhooks for different channels:

```bash
# Support team channel
export SLACK_WEBHOOK_SUPPORT="https://hooks.slack.com/services/XXX/YYY/ZZZ"

# Management channel
export SLACK_WEBHOOK_MGMT="https://hooks.slack.com/services/AAA/BBB/CCC"
```

---

## 🐛 Troubleshooting

### "Slack webhook URL not configured"
- Make sure `SLACK_WEBHOOK_URL` environment variable is set
- Or add `slackWebhookUrl` to config.json

### "Zoho API error: 401"
- Access token expired (refresh using `../refresh-token.sh`)
- Run: `cd .. && ./refresh-token.sh`

### "Basecamp API error: 401"
- Basecamp token expired
- Check Basecamp token expiration

### Cron job not running
- Check cron logs: `grep CRON /var/log/syslog`
- Check script logs: `cat /tmp/slack-summary.log`
- Verify node path: `which node`
- Use full paths in cron

### Message not appearing in Slack
- Verify webhook URL is correct
- Check channel permissions
- Test webhook with curl:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_WEBHOOK_URL
```

---

## 📚 Advanced Usage

### Run on Specific Conditions

```bash
#!/bin/bash
# Only send if there are open tickets

OPEN_COUNT=$(node -e "
  import('./ticket-summary-slack.js').then(m =>
    m.fetchTickets('Open').then(t => console.log(t.data.length))
  )
")

if [ "$OPEN_COUNT" -gt 0 ]; then
  node combined-summary-slack.js
fi
```

### Send to Multiple Channels

```javascript
// Modify combined-summary-slack.js

const WEBHOOKS = [
  process.env.SLACK_WEBHOOK_SUPPORT,
  process.env.SLACK_WEBHOOK_MGMT
];

for (const webhook of WEBHOOKS) {
  await sendToSlack(message, webhook);
}
```

---

## 🔐 Security Notes

1. **Never commit webhook URLs to git**
2. **Use environment variables for sensitive data**
3. **Restrict webhook to specific channels**
4. **Monitor webhook usage in Slack admin**

---

## 📞 Support

**Questions?**
- Email: varun@wbcomdesigns.com
- GitHub: https://github.com/vapvarun/zoho-desk-mcp-server

---

**Author:** Varun Dubey (vapvarun)
**Company:** Wbcom Designs
**License:** GPL-2.0-or-later
