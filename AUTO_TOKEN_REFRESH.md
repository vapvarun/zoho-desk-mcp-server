# Automatic Token Refresh for Zoho Desk MCP Server

## Overview
The Zoho Desk MCP server includes fully automated OAuth token refresh functionality. This ensures continuous operation across Claude Desktop and Claude Code without any manual intervention.

## 🎯 Automated Token Refresh Features

### 1. Real-time Auto-Refresh (Built-in)
- Automatically detects when token expires during API calls
- Refreshes token instantly and retries the request
- Updates all config files automatically (local, Claude Desktop, Claude Code)
- Zero downtime, no manual intervention needed

### 2. Scheduled Auto-Refresh (Optional)
- Runs every 50 minutes via macOS launchd daemon
- Proactively refreshes before the 1-hour expiry
- Keeps all systems in sync even when idle
- Logs all refresh operations for monitoring

## How It Works

### 1. Automatic Token Refresh
When a Zoho API request fails due to an expired access token:
- The server automatically uses your refresh token to obtain a new access token
- The new token is immediately used to retry the failed request
- Your operation continues without interruption

### 2. Configuration Updates
When a token is refreshed, the server automatically updates:
- Local `config.json` file (if not using environment variables)
- Claude Code's `config.json` file (if it exists)
- The server's in-memory configuration

### 3. No Restart Required
- The MCP server continues working with the new token immediately
- No manual restart is needed for the current session
- Other systems will get the new token from the updated config files

## Configuration for Multiple Systems

### Option 1: Environment Variables (Recommended)
Set these environment variables on each system:
```bash
export ZOHO_ACCESS_TOKEN="your_access_token"
export ZOHO_ORG_ID="your_org_id"
export ZOHO_CLIENT_ID="your_client_id"
export ZOHO_CLIENT_SECRET="your_client_secret"
export ZOHO_REFRESH_TOKEN="your_refresh_token"
```

**Benefits:**
- Credentials are loaded from environment, not files
- Easy to manage across multiple systems
- Secure credential storage

### Option 2: Shared Configuration
1. Use the same `config.json` on all systems
2. The server will auto-update the token in the file
3. Sync the config file across systems (e.g., using Git, cloud storage)

## Required Configuration
For automatic token refresh to work, you MUST provide:
1. `refreshToken` - Long-lived token for obtaining new access tokens
2. `clientId` - Your Zoho OAuth client ID
3. `clientSecret` - Your Zoho OAuth client secret

## Token Lifespan
- **Access Token**: Expires every 1 hour
- **Refresh Token**: Long-lived (typically doesn't expire if used regularly)
- **Auto-refresh**: Happens transparently when needed

## 🚀 Setup Scheduled Auto-Refresh (Recommended)

For the best experience, install the scheduled auto-refresh service:

```bash
cd ~/.mcp-servers/zoho-desk-mcp-server/automation
./setup-auto-refresh.sh install
```

This will:
- Install a launchd daemon that runs every 50 minutes
- Refresh token proactively before expiry
- Update all config files (local, Claude Desktop, Claude Code)
- Log all operations for monitoring

### Management Commands

```bash
# Check status
./setup-auto-refresh.sh status

# View logs
./setup-auto-refresh.sh logs

# Restart service
./setup-auto-refresh.sh restart

# Uninstall
./setup-auto-refresh.sh uninstall
```

## Manual Token Refresh
If you need to manually refresh the token:
```bash
./refresh-token.sh
```

This script will:
1. Get a new access token from Zoho
2. Update local config.json
3. Update Claude Desktop config
4. Update Claude Code config

## Troubleshooting

### Token Refresh Fails
If automatic refresh fails, check:
1. Refresh token is valid and not expired
2. Client ID and Client Secret are correct
3. Internet connection is available

### Multiple Systems Out of Sync
If tokens get out of sync across systems:
1. Run `./refresh-token.sh` on one system
2. Copy the new `accessToken` to other systems
3. Or use environment variables for consistency

## Security Notes
- Never commit tokens to version control
- Use `.gitignore` to exclude `config.json`
- Consider using secret management tools for production
- Refresh tokens should be kept secure

## Support
For issues or questions:
- GitHub: https://github.com/vapvarun/zoho-desk-mcp-server
- Author: Varun Dubey (vapvarun) <varun@wbcomdesigns.com>