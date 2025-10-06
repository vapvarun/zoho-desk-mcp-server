#!/bin/bash

##
# Zoho Desk Token Refresh Script
# Automatically refreshes your Zoho Desk access token
#
# Author: Varun Dubey (vapvarun)
# Company: Wbcom Designs
##

set -e

echo "🔄 Refreshing Zoho Desk Access Token..."

# Read config
CONFIG_FILE="$(dirname "$0")/config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: config.json not found!"
    exit 1
fi

# Extract credentials
CLIENT_ID=$(grep '"clientId"' "$CONFIG_FILE" | sed 's/.*: "\(.*\)".*/\1/')
CLIENT_SECRET=$(grep '"clientSecret"' "$CONFIG_FILE" | sed 's/.*: "\(.*\)".*/\1/')
REFRESH_TOKEN=$(grep '"refreshToken"' "$CONFIG_FILE" | sed 's/.*: "\(.*\)".*/\1/')

# Request new token
echo "📡 Requesting new access token from Zoho..."
RESPONSE=$(curl -s -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=refresh_token")

# Extract new access token
NEW_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\(.*\)"/\1/')

if [ -z "$NEW_TOKEN" ]; then
    echo "❌ Error: Failed to get new token"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ New token received: ${NEW_TOKEN:0:20}..."

# Update config.json
echo "📝 Updating config.json..."
OLD_TOKEN=$(grep '"accessToken"' "$CONFIG_FILE" | sed 's/.*: "\(.*\)".*/\1/')
sed -i '' "s|$OLD_TOKEN|$NEW_TOKEN|g" "$CONFIG_FILE"

# Update Claude Desktop config
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "📝 Updating Claude Desktop config..."
    sed -i '' "s|$OLD_TOKEN|$NEW_TOKEN|g" "$CLAUDE_CONFIG"
    echo "✅ Claude Desktop config updated"
else
    echo "⚠️  Claude Desktop config not found at: $CLAUDE_CONFIG"
fi

# Update WordPress if wp-cli is available
if command -v wp &> /dev/null; then
    WP_PATH="/Users/varundubey/Local Sites/reign-learndash/app/public"
    if [ -d "$WP_PATH" ]; then
        echo "📝 Updating WordPress..."
        cd "$WP_PATH"
        wp option update zdm_access_token "$NEW_TOKEN" --quiet 2>/dev/null || true
        echo "✅ WordPress updated"
    fi
fi

echo ""
echo "🎉 Token refresh complete!"
echo ""
echo "⚠️  IMPORTANT: Restart Claude Desktop for changes to take effect!"
echo ""
echo "New token expires in: 1 hour (3600 seconds)"
echo "Run this script again when the token expires."
