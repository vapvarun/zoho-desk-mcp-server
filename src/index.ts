#!/usr/bin/env node

/**
 * Zoho Desk MCP Server Entry Point
 * AI-powered support ticket management for Claude AI
 *
 * @author Varun Dubey (vapvarun) <varun@wbcomdesigns.com>
 * @company Wbcom Designs
 * @license GPL-2.0-or-later
 * @link https://github.com/vapvarun/zoho-desk-mcp-server
 */

import { ZohoDeskServer } from './server.js';

const server = new ZohoDeskServer();
server.run().catch(console.error);
