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
  // Priority 1: Environment variables
  if (process.env.ZOHO_ACCESS_TOKEN && process.env.ZOHO_ORG_ID) {
    return {
      accessToken: process.env.ZOHO_ACCESS_TOKEN,
      orgId: process.env.ZOHO_ORG_ID,
      clientId: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    };
  }

  // Priority 2: config.json file
  try {
    const configPath = join(__dirname, '..', 'config.json');
    const configFile = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configFile);

    if (!config.accessToken || !config.orgId) {
      throw new Error('config.json must contain accessToken and orgId');
    }

    return config;
  } catch (error) {
    throw new Error(
      'Zoho Desk credentials not found. Please set ZOHO_ACCESS_TOKEN and ZOHO_ORG_ID environment variables, or create a config.json file.'
    );
  }
}
