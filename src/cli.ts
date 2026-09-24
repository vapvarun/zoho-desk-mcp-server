#!/usr/bin/env node
/**
 * Zoho Desk CLI - read-only commands for scripts and other MCP servers.
 *
 * Reuses the server's own config + ZohoAPI client, so credentials and token refresh live in
 * one place. A token refreshed here is written back to the local config.json, exactly like the
 * server does, so the next call (from here or from the MCP server) reuses it.
 *
 *   node build/cli.js ticket-full <ticketId>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { ZohoAPI } from './zoho-api.js';

const PAGE = 100;

function client(): ZohoAPI {
  const config = loadConfig();
  const configPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json');
  return new ZohoAPI(config.accessToken, config.orgId, {
    refreshToken: config.refreshToken,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    onTokenRefresh: (token: string) => {
      if (!existsSync(configPath)) return;
      const onDisk = JSON.parse(readFileSync(configPath, 'utf-8'));
      onDisk.accessToken = token;
      writeFileSync(configPath, JSON.stringify(onDisk, null, 2));
    },
  });
}

function unwrap(res: any, what: string): any {
  if (!res || res.error || (res.code && res.code >= 400)) {
    throw new Error(`${what} failed: ${res?.message || JSON.stringify(res?.data ?? res).slice(0, 300)}`);
  }
  return res.data;
}

// Zoho list endpoints cap page size and use a 1-based `from`. Dedupe by id so an off-by-one on
// `from` can never double-count, and stop on a short or repeat-only page.
async function listAll(fetchPage: (from?: number) => Promise<any>, what: string): Promise<any[]> {
  const seen = new Map<string, any>();
  let from: number | undefined;
  for (;;) {
    const data = unwrap(await fetchPage(from), what);
    const rows: any[] = data?.data ?? (Array.isArray(data) ? data : []);
    let added = 0;
    for (const row of rows) {
      if (!seen.has(row.id)) { seen.set(row.id, row); added++; }
    }
    if (rows.length < PAGE || added === 0) break;
    from = seen.size + 1;
  }
  return [...seen.values()];
}

async function ticketFull(ticketId: string) {
  const api = client();
  const ticket = unwrap(await api.getTicket(ticketId), 'ticket');

  const threadRows = await listAll((from) => api.getTicketThreads(ticketId, { limit: PAGE, from }), 'threads');
  const threads = [];
  for (const row of threadRows) {
    // The list endpoint only carries a `summary`; the body needs the per-thread fetch.
    const full = unwrap(await api.getTicketThread(ticketId, row.id), `thread ${row.id}`);
    let content: string = full.content ?? '';
    let contentSource = 'thread';
    if (full.isContentTruncated) {
      const original = await api.getThreadOriginalContent(ticketId, row.id);
      if (!original.error && original.data?.content) {
        content = original.data.content;
        contentSource = 'originalContent';
      } else {
        contentSource = 'thread (truncated, original unavailable)';
      }
    }
    threads.push({
      id: full.id,
      createdTime: full.createdTime,
      direction: full.direction,
      status: full.status,
      visibility: full.visibility,
      channel: full.channel,
      author: full.author ? { name: full.author.name, email: full.author.email, type: full.author.type } : null,
      from: full.fromEmailAddress ?? null,
      contentType: full.contentType,
      contentSource,
      content,
      attachments: (full.attachments ?? []).map((a: any) => ({ id: a.id, name: a.name, size: a.size, href: a.href })),
    });
  }
  threads.sort((a, b) => String(a.createdTime).localeCompare(String(b.createdTime)));

  const commentRows = await listAll((from) => api.getTicketComments(ticketId, { limit: PAGE, from }), 'comments');
  const comments = commentRows
    .map((c: any) => ({
      id: c.id,
      commentedTime: c.commentedTime,
      isPublic: c.isPublic,
      commenter: c.commenter ? { name: c.commenter.name, email: c.commenter.email, type: c.commenter.type ?? null } : null,
      content: c.content ?? '',
    }))
    .sort((a, b) => String(a.commentedTime).localeCompare(String(b.commentedTime)));

  return {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      email: ticket.email,
      contactId: ticket.contactId,
      assigneeId: ticket.assigneeId,
      createdTime: ticket.createdTime,
      customerResponseTime: ticket.customerResponseTime,
      isOverDue: ticket.isOverDue,
      isEscalated: ticket.isEscalated,
      webUrl: ticket.webUrl,
    },
    threads,
    comments,
    fetchedAt: new Date().toISOString(),
  };
}

const USAGE = 'Usage: node build/cli.js ticket-full <ticketId>';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'ticket-full' && args[0]) {
    process.stdout.write(JSON.stringify(await ticketFull(args[0]), null, 2) + '\n');
    return;
  }
  process.stderr.write(USAGE + '\n');
  process.exit(2);
}

main().catch((err) => {
  process.stderr.write(JSON.stringify({ error: String(err?.message ?? err) }) + '\n');
  process.exit(1);
});
