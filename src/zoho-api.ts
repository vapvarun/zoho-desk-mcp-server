/**
 * Zoho Desk API Client for TypeScript
 * Full API coverage for Zoho Desk support ticket management
 *
 * @author Varun Dubey (vapvarun) <varun@wbcomdesigns.com>
 * @company Wbcom Designs
 * @license GPL-2.0-or-later
 * @link https://github.com/vapvarun/zoho-desk-mcp-server
 */

import { writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

interface ZohoResponse<T = any> {
  code: number;
  data: T;
  headers: Record<string, string>;
  error?: boolean;
  message?: string;
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export class ZohoAPI {
  private static readonly API_BASE = 'https://desk.zoho.com/api/v1';
  private static readonly AUTH_BASE = 'https://accounts.zoho.com/oauth/v2';

  private accessToken: string;
  private orgId: string;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;
  private replyFromAddress?: string;
  private onTokenRefresh?: (newToken: string) => void;

  constructor(
    accessToken: string,
    orgId: string,
    options?: {
      refreshToken?: string;
      clientId?: string;
      clientSecret?: string;
      replyFromAddress?: string;
      onTokenRefresh?: (newToken: string) => void;
    }
  ) {
    this.accessToken = accessToken;
    this.orgId = orgId;
    this.refreshToken = options?.refreshToken;
    this.clientId = options?.clientId;
    this.clientSecret = options?.clientSecret;
    this.replyFromAddress = options?.replyFromAddress;
    this.onTokenRefresh = options?.onTokenRefresh;
  }

  /* ===========================
   * OAUTH METHODS
   * =========================== */

  static async refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse | null> {
    const response = await fetch(`${this.AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) return null;
    return await response.json();
  }

  /* ===========================
   * HTTP REQUEST METHODS
   * =========================== */

  private async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    query?: Record<string, string>,
    retryCount = 0
  ): Promise<ZohoResponse<T>> {
    let url = `${ZohoAPI.API_BASE}${endpoint}`;

    if (query) {
      const params = new URLSearchParams(query);
      url += `?${params}`;
    }

    const headers: Record<string, string> = {
      'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
      'orgId': this.orgId
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (data) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json().catch(() => ({}));

      // Check for authentication errors (Zoho returns 200 with errorCode)
      const isAuthError = (response.status === 401 || response.status === 403) ||
                          (responseData.errorCode === 'INVALID_OAUTH');

      if (isAuthError && retryCount === 0) {
        // Try to refresh token automatically
        if (this.refreshToken && this.clientId && this.clientSecret) {
          console.error('🔄 Access token expired, refreshing automatically...');
          const tokenResponse = await ZohoAPI.refreshAccessToken(
            this.clientId,
            this.clientSecret,
            this.refreshToken
          );

          if (tokenResponse?.access_token) {
            this.accessToken = tokenResponse.access_token;
            console.error('✅ Token refreshed successfully, retrying request...');

            // Notify about token refresh
            if (this.onTokenRefresh) {
              this.onTokenRefresh(tokenResponse.access_token);
            }

            // Retry the request with new token
            return this.request<T>(method, endpoint, data, query, retryCount + 1);
          } else {
            console.error('❌ Token refresh failed');
          }
        }
      }

      return {
        code: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        code: 0,
        data: {} as T,
        headers: {},
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async get<T = any>(endpoint: string, query?: Record<string, string>): Promise<ZohoResponse<T>> {
    return this.request<T>('GET', endpoint, null, query);
  }

  private async post<T = any>(endpoint: string, data?: any): Promise<ZohoResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  private async patch<T = any>(endpoint: string, data?: any): Promise<ZohoResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  private async put<T = any>(endpoint: string, data?: any): Promise<ZohoResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  private async delete<T = any>(endpoint: string): Promise<ZohoResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Normalize text content for Zoho's HTML renderer so paragraph and line
   * breaks survive the round-trip. Zoho's email renderer collapses raw \n
   * into a single line — that's the "no formatting, all line together"
   * symptom. If the caller already passed HTML (detected by any tag), we
   * trust them and pass through unchanged. Otherwise we wrap each
   * blank-line-separated block in <p>…</p> and convert intra-paragraph
   * single \n into <br>.
   */
  private formatHtmlContent(content: string): string {
    if (!content) return '';
    // Already HTML? (any tag like <p>, <br>, <div>, <a>, <strong>, etc.)
    if (/<[a-z][\s\S]*?>/i.test(content)) return content;
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const paragraphs = content
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return paragraphs
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }

  /* ===========================
   * TICKETS
   * =========================== */

  async getTickets(params?: {
    status?: string;
    limit?: number;
    sortBy?: string;
    from?: number;
  }) {
    const query: Record<string, string> = {};
    if (params?.status) query.status = params.status;
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.from) query.from = params.from.toString();

    return this.get('/tickets', query);
  }

  async getTicket(ticketId: string) {
    return this.get(`/tickets/${ticketId}`);
  }

  async createTicket(data: {
    subject: string;
    description: string;
    contactId?: string;
    contactEmail?: string;
    contactName?: string;
    departmentId?: string;
    channel?: string;
    priority?: string;
    status?: string;
    assigneeId?: string;
    customFields?: Record<string, any>;
  }) {
    const payload: Record<string, any> = {
      subject: data.subject,
      description: data.description,
    };

    if (data.departmentId) payload.departmentId = data.departmentId;
    if (data.channel) payload.channel = data.channel;
    if (data.priority) payload.priority = data.priority;
    if (data.status) payload.status = data.status;
    if (data.assigneeId) payload.assigneeId = data.assigneeId;
    if (data.customFields) payload.customFields = data.customFields;

    // Contact handling: prefer contactId if provided; otherwise auto-create via email+name
    if (data.contactId) {
      payload.contactId = data.contactId;
    } else if (data.contactEmail || data.contactName) {
      const raw = (data.contactName || '').trim();
      const parts = raw ? raw.split(/\s+/) : [];
      const firstName = parts[0] || (data.contactEmail ? data.contactEmail.split('@')[0] : 'Customer');
      const lastName = parts.slice(1).join(' ') || '-';
      payload.contact = {
        firstName,
        lastName,
        ...(data.contactEmail ? { email: data.contactEmail } : {}),
      };
    }

    return this.post('/tickets', payload);
  }

  // Zoho Desk: POST /api/v1/tickets/{ticketId}/associateTag, body { tags: ["name1", "name2"] }
  // Tag names: 3-100 chars, pattern [a-zA-Z0-9_.\-+%\s] (colon ":" is NOT allowed).
  // Tags must exist in the account allowlist (Setup → Customization → Tags) — otherwise 422 INVALID_DATA.
  async associateTicketTags(ticketId: string, tagNames: string[]) {
    return this.post(`/tickets/${ticketId}/associateTag`, { tags: tagNames });
  }

  async updateTicket(ticketId: string, data: {
    subject?: string;
    description?: string;
    priority?: string;
    status?: string;
    assigneeId?: string;
    departmentId?: string;
  }) {
    return this.patch(`/tickets/${ticketId}`, data);
  }

  async moveTicket(ticketId: string, departmentId: string) {
    return this.post(`/tickets/${ticketId}/move`, { departmentId });
  }

  async deleteTicket(ticketId: string) {
    return this.delete(`/tickets/${ticketId}`);
  }

  /* ===========================
   * TICKET THREADS/CONVERSATIONS
   * =========================== */

  async getTicketThreads(ticketId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get(`/tickets/${ticketId}/threads`, query);
  }

  async getTicketThread(ticketId: string, threadId: string) {
    return this.get(`/tickets/${ticketId}/threads/${threadId}`);
  }

  async getLatestThread(ticketId: string) {
    return this.get(`/tickets/${ticketId}/latestThread`);
  }

  /**
   * Derive channel + from/to for an outbound reply from the ticket's latest inbound
   * thread. Shared by sendReply, draftTicketReply and updateDraftReply so all three
   * route identically. The from-address MUST be a registered Zoho Desk outbound email
   * channel: deriving it from the inbound thread's "to" yields the inbound forwarding
   * address, which Zoho rejects with INVALID_DATA /fromEmailAddress, so the configured
   * replyFromAddress always wins; derivation is only a fallback.
   */
  private async deriveReplyRouting(
    ticketId: string
  ): Promise<{ channel: string; fromAddress: string; toAddress: string }> {
    const threadsRes = await this.get(`/tickets/${ticketId}/threads`, { limit: '50' });
    const threads: any[] = (threadsRes.data && threadsRes.data.data) || [];
    const inbound = threads.find((t) => t.direction === 'in') || threads[0];
    const ticketRes = await this.get(`/tickets/${ticketId}`);
    const ticket: any = ticketRes.data;

    const extractEmail = (s: string | undefined | null): string => {
      if (!s) return '';
      const m = s.match(/<([^>]+)>/);
      return (m ? m[1] : s).trim();
    };

    let toAddress = '';
    let fromAddress = '';
    let channel = 'EMAIL';

    if (inbound) {
      channel = (inbound.channel || 'EMAIL').toUpperCase();
      if (inbound.direction === 'in') {
        toAddress = extractEmail(inbound.fromEmailAddress);
        fromAddress = extractEmail(inbound.to) || ticket.email || '';
      } else {
        toAddress = extractEmail(inbound.to);
        fromAddress = extractEmail(inbound.fromEmailAddress) || ticket.email || '';
      }
    }

    if (!toAddress) toAddress = ticket.email || '';
    if (this.replyFromAddress) fromAddress = this.replyFromAddress;
    if (!fromAddress) fromAddress = ticket.email || '';

    return { channel, fromAddress, toAddress };
  }

  async addTicketReply(ticketId: string, content: string, isPublic = true) {
    // Public replies use Zoho's /sendReply endpoint, which requires channel + from/to.
    // Internal notes (isPublic=false) use the /comments endpoint instead — the public
    // reply path here is the only documented way to email the customer back.
    // Ref: https://desk.zoho.com/DeskAPIDocument#Tickets#Tickets_SendReply
    if (!isPublic) {
      return this.post(`/tickets/${ticketId}/comments`, {
        content,
        contentType: 'html',
        isPublic: false,
      });
    }

    // Auto-derive from/to/channel from the most recent inbound thread so callers
    // don't have to pass them (shared with the draft paths via deriveReplyRouting).
    const { channel, fromAddress, toAddress } = await this.deriveReplyRouting(ticketId);

    if (!toAddress || !fromAddress) {
      throw new Error(
        `Cannot send reply on ticket ${ticketId}: unable to derive from/to email. ` +
        `Use zoho_add_ticket_comment for an internal note instead.`
      );
    }

    return this.post(`/tickets/${ticketId}/sendReply`, {
      channel,
      fromEmailAddress: fromAddress,
      to: toAddress,
      content: this.formatHtmlContent(content),
      contentType: 'html',
      isForward: false,
    });
  }

  /* ===========================
   * TICKET DRAFT REPLY
   * Lets the agent stage a reply without sending it. Same body shape as sendReply.
   * Source: Zoho OAS v1.0 Thread.json (POST /tickets/{id}/draftReply, PATCH /draftReply/{threadId}).
   * =========================== */

  async draftTicketReply(ticketId: string, content: string) {
    const { fromAddress, toAddress } = await this.deriveReplyRouting(ticketId);

    if (!toAddress || !fromAddress) {
      throw new Error(
        `Cannot draft reply on ticket ${ticketId}: unable to derive from/to email.`
      );
    }

    return this.post(`/tickets/${ticketId}/draftReply`, {
      // A reply draft is always an EMAIL reply. deriveReplyRouting returns the INBOUND
      // channel, which for Web/CustomerPortal-originated tickets is WEB/CUSTOMERPORTAL,
      // and Zoho's draftReply rejects those with a 500. Force EMAIL. (Fix: #41767/#41730.)
      channel: 'EMAIL',
      fromEmailAddress: fromAddress,
      to: toAddress,
      content: this.formatHtmlContent(content),
      contentType: 'html',
      isForward: false,
    });
  }

  async updateDraftReply(ticketId: string, threadId: string, content: string) {
    // PATCH still requires channel + fromEmailAddress + to for an Email-channel draft
    // (Zoho rejects a content-only PATCH with INVALID_DATA /fromEmailAddress), so
    // re-derive the same routing the draft was created with.
    const { fromAddress, toAddress } = await this.deriveReplyRouting(ticketId);

    if (!toAddress || !fromAddress) {
      throw new Error(
        `Cannot update draft on ticket ${ticketId}: unable to derive from/to email.`
      );
    }

    return this.patch(`/tickets/${ticketId}/draftReply/${threadId}`, {
      // Force EMAIL: draftReply only supports Email-channel drafts (see draftTicketReply).
      channel: 'EMAIL',
      fromEmailAddress: fromAddress,
      to: toAddress,
      content: this.formatHtmlContent(content),
      contentType: 'html',
      isForward: false,
    });
  }

  /**
   * Delete a draft reply thread (no email sent).
   * Zoho Desk: DELETE /tickets/{id}/draftReply/{threadId} — exposed as rel:"delete" in the
   * draft object's own `actions`. Editing a draft in place is unreliable (PATCH often 404s),
   * so the clean "update" workflow is: delete the stale draft, then create a fresh one. Also
   * use this to keep ONE draft per ticket (delete duplicates before creating a new draft).
   */
  async deleteDraftReply(ticketId: string, threadId: string) {
    return this.delete(`/tickets/${ticketId}/draftReply/${threadId}`);
  }

  /**
   * SEND an existing draft reply to the customer (real outbound email).
   * Zoho Desk: POST /tickets/{id}/sendDraft?draftThreadId={threadId} — exposed as rel:"send"
   * in the draft object's `actions`. This is an OUTWARD-FACING action: keep it human/owner
   * triggered until auto-send is explicitly enabled.
   */
  async sendDraftReply(ticketId: string, threadId: string) {
    return this.request('POST', `/tickets/${ticketId}/sendDraft`, undefined, { draftThreadId: threadId });
  }

  /**
   * Download a thread attachment's binary content to a local file so it can be read/viewed.
   * Zoho Desk: GET /tickets/{id}/threads/{threadId}/attachments/{attachmentId}/content — the
   * URL carried on each attachment's `href`. The shared request() helper always parses JSON,
   * so this does its own authed fetch (+ one token-refresh retry) and writes the bytes to disk.
   * Returns { path, bytes, contentType }.
   */
  async getAttachmentContent(
    ticketId: string,
    threadId: string,
    attachmentId: string,
    fileName?: string,
    outDir?: string
  ): Promise<{ path: string; bytes: number; contentType: string }> {
    const url = `${ZohoAPI.API_BASE}/tickets/${ticketId}/threads/${threadId}/attachments/${attachmentId}/content`;
    const response = await this.binaryFetch(url);
    if (!response.ok) {
      throw new Error(
        `Attachment download failed (HTTP ${response.status}) for attachment ${attachmentId} on ticket ${ticketId}`
      );
    }
    return this.saveBinary(response, ticketId, `${attachmentId}_${fileName || attachmentId}`, outDir);
  }

  /**
   * Download an inline (pasted) screenshot. Customers paste images into the email body, so they
   * are not attachments: the thread HTML carries <img src="/api/v1/threads/{id}/inlineImages/...">.
   * Only that path shape is accepted, so this cannot be turned into a generic authed GET.
   */
  async getInlineImage(
    ticketId: string,
    src: string,
    outDir?: string
  ): Promise<{ path: string; bytes: number; contentType: string }> {
    const path = src.replace(/^https:\/\/desk\.zoho\.com/, '').replace(/&amp;/g, '&');
    if (!/^\/api\/v1\/threads\/\d+\/inlineImages\//.test(path)) {
      throw new Error('Not a Zoho inline-image path: ' + src.slice(0, 80));
    }
    const response = await this.binaryFetch(`${ZohoAPI.API_BASE}${path.slice('/api/v1'.length)}`);
    if (!response.ok) {
      throw new Error(`Inline image download failed (HTTP ${response.status}) on ticket ${ticketId}`);
    }
    const name = new URLSearchParams(path.split('?')[1] ?? '').get('f') || `inline-${Date.now()}.png`;
    return this.saveBinary(response, ticketId, name, outDir);
  }

  /** Authed GET that returns the raw Response (request() always parses JSON), with one token-refresh retry. */
  private async binaryFetch(url: string): Promise<Response> {
    const doFetch = () =>
      fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}`, orgId: this.orgId } });
    let response = await doFetch();
    if (
      (response.status === 401 || response.status === 403) &&
      this.refreshToken && this.clientId && this.clientSecret
    ) {
      const tok = await ZohoAPI.refreshAccessToken(this.clientId, this.clientSecret, this.refreshToken);
      if (tok?.access_token) {
        this.accessToken = tok.access_token;
        if (this.onTokenRefresh) this.onTokenRefresh(tok.access_token);
        response = await doFetch();
      }
    }
    return response;
  }

  private async saveBinary(
    response: Response,
    ticketId: string,
    fileName: string,
    outDir?: string
  ): Promise<{ path: string; bytes: number; contentType: string }> {
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await response.arrayBuffer());

    // Sanitize EVERY path component (ids come from tool args — never trust them for a path):
    // strip anything but word chars / dot / dash, which also kills "/" and ".." traversal.
    const safeTicket = String(ticketId).replace(/[^\w.\-]+/g, '_');
    const safeName = fileName.replace(/[^\w.\-]+/g, '_');
    const base = outDir ? resolve(outDir) : join(tmpdir(), 'zoho-attachments', safeTicket);
    // 0o700: attachment dirs may hold sensitive customer data — not world-readable on shared hosts.
    mkdirSync(base, { recursive: true, mode: 0o700 });
    // Resolve symlinks on the base FIRST (macOS tmpdir /var -> /private/var), then build + check the
    // final path against that real base, so the containment guard doesn't false-positive on a symlink.
    const realBase = realpathSync(base);
    const outPath = resolve(realBase, safeName);
    if (outPath !== realBase && !outPath.startsWith(realBase + sep)) {
      throw new Error('Refusing to write attachment outside its directory');
    }
    writeFileSync(outPath, buf, { mode: 0o600 });
    return { path: outPath, bytes: buf.length, contentType };
  }

  /* ===========================
   * THREAD ORIGINAL CONTENT (full email body)
   * Source: Zoho OAS v1.0 Thread.json.
   * =========================== */

  async getThreadOriginalContent(ticketId: string, threadId: string) {
    return this.get(`/tickets/${ticketId}/threads/${threadId}/originalContent`);
  }

  async deleteThreadAttachment(ticketId: string, threadId: string, attachmentId: string) {
    return this.delete(`/tickets/${ticketId}/threads/${threadId}/attachments/${attachmentId}`);
  }

  /* ===========================
   * TICKET RESOLUTION
   * The "resolution" is the canonical fix-summary stored on a closed ticket.
   * Source: Zoho OAS v1.0 Ticket.json (GET/PATCH/DELETE /tickets/{id}/resolution).
   * =========================== */

  async getTicketResolution(ticketId: string) {
    return this.get(`/tickets/${ticketId}/resolution`);
  }

  async updateTicketResolution(ticketId: string, content: string, isNotifyContact = false) {
    return this.patch(`/tickets/${ticketId}/resolution`, { content, isNotifyContact });
  }

  async deleteTicketResolution(ticketId: string) {
    return this.delete(`/tickets/${ticketId}/resolution`);
  }

  async getTicketResolutionHistory(ticketId: string) {
    return this.get(`/tickets/${ticketId}/resolutionHistory`);
  }

  /* ===========================
   * TICKET MERGE / SPLIT
   * Source: Zoho OAS v1.0 Ticket.json.
   * =========================== */

  async mergeTickets(ticketId: string, mergeIds: string[], source?: {
    contactId?: string; subject?: string; priority?: string; status?: string;
  }) {
    const body: any = { ids: mergeIds };
    if (source) body.source = source;
    return this.post(`/tickets/${ticketId}/merge`, body);
  }

  async splitTicketThread(ticketId: string, threadId: string) {
    return this.post(`/tickets/${ticketId}/threads/${threadId}/split`, {});
  }

  /* ===========================
   * TICKET SPAM HANDLING
   * Source: Zoho OAS v1.0 Ticket.json.
   * =========================== */

  // Mark tickets as spam. Zoho OAS body example:
  // { ids:[...], isSpam:"true", contactSpam:"true", handleExistingTickets:"true" }
  // Note Zoho uses string booleans here (legacy API quirk).
  async markTicketsSpam(ticketIds: string[], options?: {
    contactSpam?: boolean; handleExistingTickets?: boolean;
  }) {
    const body: any = { ids: ticketIds, isSpam: 'true' };
    if (options?.contactSpam !== undefined) body.contactSpam = String(options.contactSpam);
    if (options?.handleExistingTickets !== undefined) body.handleExistingTickets = String(options.handleExistingTickets);
    return this.post('/tickets/markSpam', body);
  }

  // Permanently delete spam tickets. Body: { ticketIds: [...] }.
  async deleteSpamTickets(ticketIds: string[]) {
    return this.post('/tickets/deleteSpam', { ticketIds });
  }

  // Empty all spam in a department. Body: { departmentId }.
  async emptySpam(departmentId: string) {
    return this.post('/tickets/emptySpam', { departmentId });
  }

  /* ===========================
   * TICKET BULK UPDATE
   * Update one field across many tickets. Body:
   * { fieldName, fieldValue, ids:[...], isCustomField? }
   * =========================== */

  async bulkUpdateTickets(
    ticketIds: string[],
    fieldName: string,
    fieldValue: any,
    isCustomField = false
  ) {
    return this.post('/tickets/updateMany', {
      fieldName, fieldValue, ids: ticketIds, isCustomField,
    });
  }

  /* ===========================
   * TICKET LISTS / VIEWS
   * Source: Zoho OAS v1.0 Ticket.json.
   * =========================== */

  async getArchivedTickets(params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    return this.get('/tickets/archivedTickets', query);
  }

  async getAgentsTicketsCount() {
    return this.get('/agentsTicketsCount');
  }

  async getAssociatedTickets(params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    return this.get('/associatedTickets', query);
  }

  async getTicketQueueViewCount() {
    return this.get('/ticketQueueView/count');
  }

  async getTicketsByProduct(productId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    return this.get(`/products/${productId}/tickets`, query);
  }

  /* ===========================
   * TICKET FULL CONTEXT (Combined)
   * =========================== */

  async getTicketFullContext(ticketId: string) {
    // Fetch ticket, threads, and comments in parallel
    const [ticketRes, threadsRes, commentsRes] = await Promise.all([
      this.get(`/tickets/${ticketId}`),
      this.get(`/tickets/${ticketId}/threads`),
      this.get(`/tickets/${ticketId}/comments`)
    ]);

    return {
      code: ticketRes.code,
      data: {
        ...ticketRes.data,
        threads: threadsRes.data?.data || threadsRes.data || [],
        comments: commentsRes.data?.data || commentsRes.data || []
      },
      headers: ticketRes.headers
    };
  }

  /* ===========================
   * TICKET COMMENTS
   * =========================== */

  async getTicketComments(ticketId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get(`/tickets/${ticketId}/comments`, query);
  }

  async addTicketComment(ticketId: string, content: string, isPublic = false, contentType = 'html') {
    // Auto-format plain text into paragraphs for the html renderer; pass HTML through.
    const finalContent = contentType === 'html' ? this.formatHtmlContent(content) : content;
    return this.post(`/tickets/${ticketId}/comments`, {
      content: finalContent,
      isPublic,
      contentType
    });
  }

  // Source: Zoho OAS v1.0 TicketComment.json (per-comment GET/PATCH/DELETE/history).
  async getTicketComment(ticketId: string, commentId: string) {
    return this.get(`/tickets/${ticketId}/comments/${commentId}`);
  }

  async updateTicketComment(ticketId: string, commentId: string, content: string) {
    return this.patch(`/tickets/${ticketId}/comments/${commentId}`, { content });
  }

  async deleteTicketComment(ticketId: string, commentId: string) {
    return this.delete(`/tickets/${ticketId}/comments/${commentId}`);
  }

  async getTicketCommentHistory(ticketId: string, commentId: string) {
    return this.get(`/tickets/${ticketId}/comments/${commentId}/history`);
  }

  /* ===========================
   * TICKET TAGS
   * =========================== */

  async getTicketTags(ticketId: string) {
    return this.get(`/tickets/${ticketId}/tags`);
  }

  // Kept as alias for backward compat — routes through the correct associate endpoint.
  async addTicketTags(ticketId: string, tagNames: string[]) {
    return this.associateTicketTags(ticketId, tagNames);
  }

  // Zoho Desk: POST /api/v1/tickets/{ticketId}/dissociateTag, body { tags: ["name1", ...] }
  // Mirrors associateTag (same body schema). Source: Zoho OAS v1.0 TicketTag.json.
  async dissociateTicketTags(ticketId: string, tagNames: string[]) {
    return this.post(`/tickets/${ticketId}/dissociateTag`, { tags: tagNames });
  }

  // Source: Zoho OAS v1.0 TicketTag.json (recent + global tag operations).
  async listRecentTicketTags() {
    return this.get('/recentTicketTags');
  }

  async updateRecentTicketTag(tagId: string) {
    return this.post(`/recentTicketTags/${tagId}`, {});
  }

  async listAllTicketTags(params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    return this.get('/ticketTags', query);
  }

  async searchTags(query: string, params?: { limit?: number }) {
    const q: Record<string, string> = { searchStr: query };
    if (params?.limit) q.limit = params.limit.toString();
    return this.get('/tags/search', q);
  }

  async listTicketsByTag(tagId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    return this.get(`/tags/${tagId}/tickets`, query);
  }

  // Replace one tag with another across the account. Body: { id: "<replacing tag id>" }.
  async replaceTag(currentTagId: string, replacingTagId: string) {
    return this.patch(`/tags/${currentTagId}/replace`, { id: replacingTagId });
  }

  /* ===========================
   * CONTACTS
   * =========================== */

  async getContacts(params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get('/contacts', query);
  }

  async getContact(contactId: string) {
    return this.get(`/contacts/${contactId}`);
  }

  async getContactTickets(contactId: string) {
    return this.get(`/contacts/${contactId}/tickets`);
  }

  // Find a contact by email. Zoho's contact search uses wildcard matching — bare
  // values won't match unless suffixed with `*` (Pipedream's find-contact pattern).
  // Returns the first match or null. Source: Pipedream zoho_desk find-or-create-contact.
  async findContactByEmail(email: string) {
    const res = await this.get('/contacts/search', {
      email: `${email}*`,
      sortBy: 'relevance',
    });
    const data = (res.data && (res.data.data || res.data)) || [];
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  // Convenience: given a customer email, find the contact and list every ticket
  // they've ever opened. Useful before replying to a returning customer so the
  // agent can see prior interactions. Returns { contact, tickets } or null if
  // no contact found.
  async getCustomerHistoryByEmail(email: string) {
    const contact = await this.findContactByEmail(email);
    if (!contact || !contact.id) return null;
    const ticketsRes = await this.get(`/contacts/${contact.id}/tickets`);
    return {
      contact,
      tickets: (ticketsRes.data && (ticketsRes.data.data || ticketsRes.data)) || [],
    };
  }

  /* ===========================
   * DEPARTMENTS
   * =========================== */

  async getDepartments() {
    return this.get('/departments');
  }

  async getDepartment(departmentId: string) {
    return this.get(`/departments/${departmentId}`);
  }

  /**
   * List the portal's configured From/reply addresses with verified + active flags.
   * Lets us confirm the valid outbound sending address from inside this MCP instead
   * of guessing (the gap that made the reply from-address hard to reason about).
   * departmentId 'allDepartment' returns every department's addresses.
   */
  async listReplyAddresses(departmentId = 'allDepartment', isActive?: boolean) {
    const params: Record<string, string> = { departmentId, limit: '100' };
    if (typeof isActive === 'boolean') params.isActive = String(isActive);
    return this.get('/mailReplyAddress', params);
  }

  /* ===========================
   * AGENTS
   * =========================== */

  async getAgents() {
    return this.get('/agents');
  }

  async getAgent(agentId: string) {
    return this.get(`/agents/${agentId}`);
  }

  /* ===========================
   * SEARCH
   * =========================== */

  // Zoho Desk OAS v1.0 Search.json: GET /tickets/search uses query params (not searchStr).
  // For free-form text search use `_all` with a wildcard suffix (Pipedream pattern).
  // Field-specific filters (subject, status, priority, etc.) are also supported but the
  // free-form path is what `searchStr` was trying to be.
  async searchTickets(query: string, params?: { limit?: number; sortBy?: string }) {
    const searchParams: Record<string, string> = { _all: `${query}*`, sortBy: 'relevance' };
    if (params?.limit) searchParams.limit = params.limit.toString();
    if (params?.sortBy) searchParams.sortBy = params.sortBy;

    return this.get('/tickets/search', searchParams);
  }

  /* ===========================
   * HELPER METHODS
   * =========================== */

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  setOrgId(orgId: string): void {
    this.orgId = orgId;
  }

  /* ===========================
   * TICKET ATTACHMENTS
   * =========================== */

  async getTicketAttachments(ticketId: string) {
    return this.get(`/tickets/${ticketId}/attachments`);
  }

  async deleteTicketAttachment(ticketId: string, attachmentId: string) {
    return this.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
  }

  /* ===========================
   * TICKET HISTORY
   * =========================== */

  async getTicketHistory(ticketId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get(`/tickets/${ticketId}/history`, query);
  }

  /* ===========================
   * TICKET METRICS
   * =========================== */

  async getTicketMetrics(ticketId: string) {
    return this.get(`/tickets/${ticketId}/metrics`);
  }

  /* ===========================
   * BULK TICKET OPERATIONS
   * =========================== */

  // Bulk close tickets. Zoho Desk: POST /api/v1/closeTickets, body { ids: ["..."] }.
  // Note the path is root-level (/closeTickets), NOT /tickets/actions/closemany.
  // Source: Zoho OAS v1.0 Ticket.json (#/components/requestBodies/closeTicketInput).
  async closeTickets(ticketIds: string[]) {
    return this.post('/closeTickets', { ids: ticketIds });
  }

  // Mark a single ticket as read. Zoho Desk: POST /api/v1/tickets/{id}/markAsRead (no body).
  // The API is per-ticket, not bulk — we loop client-side to keep the existing signature.
  // Source: Zoho OAS v1.0 Ticket.json.
  async markTicketsRead(ticketIds: string[]) {
    const results = await Promise.all(
      ticketIds.map((id) => this.post(`/tickets/${id}/markAsRead`, {}))
    );
    return { code: 200, data: results.map((r) => r.data), headers: {} } as ZohoResponse<any>;
  }

  // Mark a single ticket as unread. Zoho Desk: POST /api/v1/tickets/{id}/markAsUnRead (capital R, no body).
  // Per-ticket; loop client-side. Source: Zoho OAS v1.0 Ticket.json.
  async markTicketsUnread(ticketIds: string[]) {
    const results = await Promise.all(
      ticketIds.map((id) => this.post(`/tickets/${id}/markAsUnRead`, {}))
    );
    return { code: 200, data: results.map((r) => r.data), headers: {} } as ZohoResponse<any>;
  }

  // Bulk move tickets to trash. Zoho Desk: POST /api/v1/tickets/moveToTrash, body { ticketIds: ["..."] }.
  // Note the body field is `ticketIds`, not `ids` (different from closeTickets).
  // Source: Zoho OAS v1.0 Ticket.json (#/components/requestBodies/moveRequestsToTrash).
  async trashTickets(ticketIds: string[]) {
    return this.post('/tickets/moveToTrash', { ticketIds });
  }

  /* ===========================
   * ACCOUNTS
   * =========================== */

  async getAccounts(params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get('/accounts', query);
  }

  async getAccount(accountId: string) {
    return this.get(`/accounts/${accountId}`);
  }

  async createAccount(data: {
    accountName: string;
    email?: string;
    phone?: string;
    website?: string;
    description?: string;
  }) {
    return this.post('/accounts', data);
  }

  async updateAccount(accountId: string, data: {
    accountName?: string;
    email?: string;
    phone?: string;
    website?: string;
    description?: string;
  }) {
    return this.patch(`/accounts/${accountId}`, data);
  }

  // Zoho Desk OAS v1.0 Account.json has no DELETE on /accounts/{id} — only POST
  // /accounts/moveToTrash with body { accountIds: [...] }. Earlier code used the
  // (non-existent) DELETE path and would have failed.
  async deleteAccount(accountId: string) {
    return this.post('/accounts/moveToTrash', { accountIds: [accountId] });
  }

  // Bulk version of the above for callers that already have multiple IDs.
  async trashAccounts(accountIds: string[]) {
    return this.post('/accounts/moveToTrash', { accountIds });
  }

  async getAccountTickets(accountId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get(`/accounts/${accountId}/tickets`, query);
  }

  async getAccountContacts(accountId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get(`/accounts/${accountId}/contacts`, query);
  }

  /* ===========================
   * TIME ENTRIES
   * =========================== */

  // Zoho Desk OAS v1.0 TicketTimeEntry.json uses singular `/timeEntry` (not /timeEntries),
  // PUT (not PATCH) for updates, and `/timeEntrySummation` (not /timeEntries/summation).
  // Earlier MCP versions had every one of these wrong — they would 404 or 405 in production.
  async getTicketTimeEntries(ticketId: string, params?: { limit?: number; from?: number; billingType?: string }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    if (params?.billingType) {
      // Zoho exposes "/timeEntryByBillingType" for billing-type filtering.
      query.billingType = params.billingType;
      return this.get(`/tickets/${ticketId}/timeEntryByBillingType`, query);
    }

    return this.get(`/tickets/${ticketId}/timeEntry`, query);
  }

  async addTicketTimeEntry(ticketId: string, data: {
    executedTime: string;  // Format: "HH:MM" or minutes
    ownerId?: string;
    description?: string;
    billingType?: 'Billable' | 'Non Billable';
  }) {
    return this.post(`/tickets/${ticketId}/timeEntry`, data);
  }

  async updateTicketTimeEntry(ticketId: string, timeEntryId: string, data: {
    executedTime?: string;
    description?: string;
    billingType?: 'Billable' | 'Non Billable';
  }) {
    // Zoho uses PUT for time-entry updates (not PATCH like other resources).
    return this.put(`/tickets/${ticketId}/timeEntry/${timeEntryId}`, data);
  }

  async deleteTicketTimeEntry(ticketId: string, timeEntryId: string) {
    return this.delete(`/tickets/${ticketId}/timeEntry/${timeEntryId}`);
  }

  async getTicketTimeEntrySummary(ticketId: string) {
    return this.get(`/tickets/${ticketId}/timeEntrySummation`);
  }

  /* ===========================
   * TASKS
   * =========================== */

  async getTasks(params?: { limit?: number; from?: number; status?: string }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    if (params?.status) query.status = params.status;

    return this.get('/tasks', query);
  }

  async getTask(taskId: string) {
    return this.get(`/tasks/${taskId}`);
  }

  async createTask(data: {
    subject: string;
    departmentId?: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
    ownerId?: string;
    ticketId?: string;
  }) {
    return this.post('/tasks', data);
  }

  async updateTask(taskId: string, data: {
    subject?: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
    ownerId?: string;
  }) {
    return this.patch(`/tasks/${taskId}`, data);
  }

  async deleteTask(taskId: string) {
    return this.delete(`/tasks/${taskId}`);
  }

  async getTicketTasks(ticketId: string, params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get(`/tickets/${ticketId}/tasks`, query);
  }

  /* ===========================
   * PRODUCTS
   * =========================== */

  async getProducts(params?: { limit?: number; from?: number }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();

    return this.get('/products', query);
  }

  async getProduct(productId: string) {
    return this.get(`/products/${productId}`);
  }
}
