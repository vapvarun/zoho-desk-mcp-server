/**
 * Configuration Management for Zoho Desk MCP Server
 * Loads credentials from environment variables or config file
 *
 * @author Varun Dubey (vapvarun) <varun@wbcomdesigns.com>
 * @company Wbcom Designs
 * @license GPL-2.0-or-later
 * @link https://github.com/vapvarun/zoho-desk-mcp-server
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ZohoConfig {
  accessToken: string;
  orgId: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export function loadConfig(): ZohoConfig {
  // Priority 1: Environment variables (with OAuth refresh support)
  if (process.env.ZOHO_ORG_ID) {
    // If we have refresh token and OAuth credentials, we can generate access token
    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN) {
      return {
        accessToken: process.env.ZOHO_ACCESS_TOKEN || '',  // Empty token will be refreshed on first use
        orgId: process.env.ZOHO_ORG_ID,
        clientId: process.env.ZOHO_CLIENT_ID,
        clientSecret: process.env.ZOHO_CLIENT_SECRET,
        refreshToken: process.env.ZOHO_REFRESH_TOKEN,
      };
    }
    // If we only have access token (legacy mode)
    if (process.env.ZOHO_ACCESS_TOKEN) {
      return {
        accessToken: process.env.ZOHO_ACCESS_TOKEN,
        orgId: process.env.ZOHO_ORG_ID,
        clientId: process.env.ZOHO_CLIENT_ID,
        clientSecret: process.env.ZOHO_CLIENT_SECRET,
        refreshToken: process.env.ZOHO_REFRESH_TOKEN,
      };
    }
  }

  // Priority 2: config.json file
  try {
    const configPath = join(__dirname, '..', 'config.json');
    const configFile = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configFile);

    if (!config.orgId) {
      throw new Error('config.json must contain orgId');
    }

    // Allow config without access token if we have OAuth credentials
    if (!config.accessToken && (!config.clientId || !config.clientSecret || !config.refreshToken)) {
      throw new Error('config.json must contain either accessToken or OAuth credentials (clientId, clientSecret, refreshToken)');
    }

    return {
      ...config,
      accessToken: config.accessToken || ''  // Empty token will be refreshed on first use
    };
  } catch (error) {
    throw new Error(
      'Zoho Desk credentials not found. Please set environment variables or create a config.json file with OAuth credentials.'
    );
  }
}
