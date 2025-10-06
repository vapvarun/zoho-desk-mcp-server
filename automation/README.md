# 🤖 Automated Zoho Desk Ticket Summaries to Slack

Send automated daily/weekly summaries of Zoho Desk support tickets to Slack.

## 📋 What It Does

**File:** `ticket-summary-slack.js`

Sends summary of **OPEN** Zoho Desk tickets with smart filtering:
- ✅ Shows only OPEN tickets (skips closed/resolved)
- 🗑️ Automatically filters out spam/marketing tickets:
  - Guest post requests
  - Backlink/link exchange requests
  - Collaboration/partnership spam
  - Link building outreach
- 📊 Total open ticket count
- 📈 Breakdown by priority (High, Medium, Low, None)
- 📋 Recent tickets (top 5)
- ⏰ Customizable report frequency (daily, weekly, custom)

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

### Step 3: Make Script Executable

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation"
chmod +x ticket-summary-slack.js
```

---

## 🧪 Testing

```bash
cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation"

# Set webhook URL
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run script
node ticket-summary-slack.js
```

**Expected Output:**
```
🔄 Fetching open tickets from Zoho Desk...
✅ Fetched 20 open tickets
📋 Processing 20 genuine tickets
📊 Summary generated
   Total: 20
   By Priority: { None: 9, High: 11 }
📤 Sending to Slack...
✅ Message sent to Slack successfully!
```

**With spam filtering:**
```
🔄 Fetching open tickets from Zoho Desk...
✅ Fetched 25 open tickets
🗑️  Filtered out 5 spam/marketing tickets
📋 Processing 20 genuine tickets
📊 Summary generated
   Total: 20
   By Priority: { None: 9, High: 11 }
📤 Sending to Slack...
✅ Message sent to Slack successfully!
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
0 9 * * * export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node ticket-summary-slack.js >> /tmp/zoho-summary.log 2>&1
```

### Weekly Summary (Monday at 9 AM)

```cron
0 9 * * 1 export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node ticket-summary-slack.js >> /tmp/zoho-summary.log 2>&1
```

### Multiple Daily Reports

```cron
# Morning summary at 9 AM
0 9 * * * export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node ticket-summary-slack.js >> /tmp/zoho-summary.log 2>&1

# Afternoon summary at 5 PM
0 17 * * * export SLACK_WEBHOOK_URL="YOUR_WEBHOOK_URL" && cd "/Users/varundubey/Local Sites/reign-learndash/app/public/zoho-desk-mcp-server/automation" && /usr/local/bin/node ticket-summary-slack.js >> /tmp/zoho-summary.log 2>&1
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

```
📊 Open Support Tickets
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Tickets: 20

By Status:
• Open: 20

By Priority:
• High: 11
• None: 9

Recent Tickets:
• #36145 - Plugin compatibility issue with WordPress 6.4
• #36142 - BuddyPress notification not working
• #36138 - WooCommerce integration request
• #36135 - Reign theme customization help needed
• #36130 - LearnDash course progress not saving

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: 2025-10-06 09:00 AM | Zoho Desk MCP Server
```

**Note:** Only genuine support tickets are shown. Spam tickets (guest posts, backlinks, etc.) are automatically filtered out.

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

### Customize Spam Filter

Edit the spam keywords in the script:

```javascript
// In ticket-summary-slack.js
const spamKeywords = [
  'guest post',
  'guest blog',
  'collaboration',
  'backlink',
  'link exchange',
  'link building',
  'guest article',
  'sponsored post',
  'link swap',
  'outreach',
  'partnership',
  // Add your own keywords here
];
```

### Show All Tickets (Including Closed)

To include closed tickets, modify the main function:

```javascript
// Change from:
const response = await fetchTickets('Open', 100);

// To:
const response = await fetchTickets(null, 100);
```

### Disable Spam Filtering

To disable spam filtering:

```javascript
// Comment out the filter line in main()
// tickets = filterSpamTickets(tickets);
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

### Cron job not running
- Check cron logs: `grep CRON /var/log/syslog`
- Check script logs: `cat /tmp/zoho-summary.log`
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
  node ticket-summary-slack.js
fi
```

### Send to Multiple Channels

```javascript
// Modify ticket-summary-slack.js

const WEBHOOKS = [
  process.env.SLACK_WEBHOOK_SUPPORT,
  process.env.SLACK_WEBHOOK_MGMT
];

for (const webhook of WEBHOOKS) {
  await sendToSlack(message, webhook);
}
```

### Custom Filters

```javascript
// High priority open tickets only
async function fetchHighPriorityOpenTickets() {
  const params = new URLSearchParams();
  params.append('status', 'Open');
  params.append('priority', 'High');
  params.append('limit', '50');

  const url = `${ZOHO_API_BASE}/tickets?${params}`;
  // ... fetch logic
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
