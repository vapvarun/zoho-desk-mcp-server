#!/bin/bash

##
# Zoho Desk Token Auto-Refresh Setup Script
# Manages launchd daemon for automatic token refresh
#
# Author: Varun Dubey (vapvarun)
# Company: Wbcom Designs
##

set -e

PLIST_FILE="com.wbcom.zoho-desk-token-refresh.plist"
PLIST_SOURCE="$(dirname "$0")/$PLIST_FILE"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_FILE"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_status() {
    echo ""
    echo -e "${BLUE}=== Zoho Desk Token Auto-Refresh Status ===${NC}"
    echo ""

    if [ -f "$PLIST_DEST" ]; then
        echo -e "${GREEN}✅ Installed:${NC} Yes"
        echo -e "${GREEN}📁 Location:${NC} $PLIST_DEST"

        if launchctl list | grep -q "com.wbcom.zoho-desk-token-refresh"; then
            echo -e "${GREEN}🟢 Status:${NC} Running"

            # Show last run time from log
            if [ -f "$(dirname "$0")/token-refresh.log" ]; then
                echo -e "${GREEN}📝 Last run:${NC}"
                tail -n 3 "$(dirname "$0")/token-refresh.log" | head -n 1
            fi
        else
            echo -e "${YELLOW}🟡 Status:${NC} Not running"
        fi

        echo -e "${GREEN}⏱️  Interval:${NC} Every 50 minutes (3000 seconds)"
        echo -e "${GREEN}📊 Logs:${NC} $(dirname "$0")/token-refresh.log"
    else
        echo -e "${RED}❌ Installed:${NC} No"
    fi
    echo ""
}

install_service() {
    echo ""
    echo -e "${BLUE}🚀 Installing Zoho Desk Token Auto-Refresh...${NC}"
    echo ""

    # Create LaunchAgents directory if it doesn't exist
    mkdir -p "$HOME/Library/LaunchAgents"

    # Copy plist file
    cp "$PLIST_SOURCE" "$PLIST_DEST"
    echo -e "${GREEN}✅ Copied plist to LaunchAgents${NC}"

    # Load the service
    launchctl load "$PLIST_DEST"
    echo -e "${GREEN}✅ Service loaded${NC}"

    # Run it immediately for testing
    launchctl start com.wbcom.zoho-desk-token-refresh
    echo -e "${GREEN}✅ Initial refresh triggered${NC}"

    echo ""
    echo -e "${GREEN}🎉 Auto-refresh installed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}ℹ️  The token will now refresh automatically every 50 minutes${NC}"
    echo -e "${YELLOW}ℹ️  Check logs at: $(dirname "$0")/token-refresh.log${NC}"
    echo ""
}

uninstall_service() {
    echo ""
    echo -e "${BLUE}🗑️  Uninstalling Zoho Desk Token Auto-Refresh...${NC}"
    echo ""

    if [ -f "$PLIST_DEST" ]; then
        # Unload the service
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
        echo -e "${GREEN}✅ Service unloaded${NC}"

        # Remove plist file
        rm "$PLIST_DEST"
        echo -e "${GREEN}✅ Removed plist file${NC}"

        echo ""
        echo -e "${GREEN}🎉 Auto-refresh uninstalled successfully!${NC}"
        echo ""
    else
        echo -e "${RED}❌ Service is not installed${NC}"
        echo ""
    fi
}

restart_service() {
    echo ""
    echo -e "${BLUE}🔄 Restarting Zoho Desk Token Auto-Refresh...${NC}"
    echo ""

    if [ -f "$PLIST_DEST" ]; then
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
        launchctl load "$PLIST_DEST"
        launchctl start com.wbcom.zoho-desk-token-refresh

        echo -e "${GREEN}✅ Service restarted${NC}"
        echo ""
    else
        echo -e "${RED}❌ Service is not installed. Run './setup-auto-refresh.sh install' first${NC}"
        echo ""
    fi
}

show_logs() {
    echo ""
    echo -e "${BLUE}📋 Recent Token Refresh Logs:${NC}"
    echo ""

    LOG_FILE="$(dirname "$0")/token-refresh.log"
    if [ -f "$LOG_FILE" ]; then
        tail -n 50 "$LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  No logs found yet${NC}"
    fi
    echo ""
}

show_help() {
    echo ""
    echo -e "${BLUE}Zoho Desk Token Auto-Refresh Management${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install   - Install and start auto-refresh service"
    echo "  uninstall - Stop and remove auto-refresh service"
    echo "  restart   - Restart the service"
    echo "  status    - Show service status"
    echo "  logs      - Show recent logs"
    echo "  help      - Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 install"
    echo "  $0 status"
    echo ""
}

# Main script
case "${1:-status}" in
    install)
        install_service
        ;;
    uninstall)
        uninstall_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
