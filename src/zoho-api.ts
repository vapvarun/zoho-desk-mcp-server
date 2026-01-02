/**
 * Zoho Desk API Client for TypeScript
 * Full API coverage for Zoho Desk support ticket management
 *
 * @author Varun Dubey (vapvarun) <varun@wbcomdesigns.com>
 * @company Wbcom Designs
 * @license GPL-2.0-or-later
 * @link https://github.com/vapvarun/zoho-desk-mcp-server
 */

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
  private onTokenRefresh?: (newToken: string) => void;

  constructor(
    accessToken: string,
    orgId: string,
    options?: {
      refreshToken?: string;
      clientId?: string;
      clientSecret?: string;
      onTokenRefresh?: (newToken: string) => void;
    }
  ) {
    this.accessToken = accessToken;
    this.orgId = orgId;
    this.refreshToken = options?.refreshToken;
    this.clientId = options?.clientId;
    this.clientSecret = options?.clientSecret;
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

      // Check for authentication errors
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
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

  private async delete<T = any>(endpoint: string): Promise<ZohoResponse<T>> {
    return this.request<T>('DELETE', endpoint);
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
    departmentId?: string;
    priority?: string;
    status?: string;
    assigneeId?: string;
  }) {
    return this.post('/tickets', data);
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

  async addTicketReply(ticketId: string, content: string, isPublic = true) {
    return this.post(`/tickets/${ticketId}/threads`, {
      content,
      isPublicReply: isPublic
    });
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
    return this.post(`/tickets/${ticketId}/comments`, {
      content,
      isPublic,
      contentType
    });
  }

  /* ===========================
   * TICKET TAGS
   * =========================== */

  async getTicketTags(ticketId: string) {
    return this.get(`/tickets/${ticketId}/tags`);
  }

  async addTicketTags(ticketId: string, tags: string[]) {
    return this.post(`/tickets/${ticketId}/tags`, { tags });
  }

  async removeTicketTag(ticketId: string, tagId: string) {
    return this.delete(`/tickets/${ticketId}/tags/${tagId}`);
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

  /* ===========================
   * DEPARTMENTS
   * =========================== */

  async getDepartments() {
    return this.get('/departments');
  }

  async getDepartment(departmentId: string) {
    return this.get(`/departments/${departmentId}`);
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

  async searchTickets(query: string, params?: { limit?: number }) {
    const searchParams: Record<string, string> = { searchStr: query };
    if (params?.limit) searchParams.limit = params.limit.toString();

    return this.get('/search', searchParams);
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

  async closeTickets(ticketIds: string[]) {
    return this.post('/tickets/close', { ids: ticketIds });
  }

  async markTicketsRead(ticketIds: string[]) {
    return this.post('/tickets/read', { ids: ticketIds });
  }

  async markTicketsUnread(ticketIds: string[]) {
    return this.post('/tickets/unread', { ids: ticketIds });
  }

  async trashTickets(ticketIds: string[]) {
    return this.post('/tickets/trash', { ids: ticketIds });
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

  async deleteAccount(accountId: string) {
    return this.delete(`/accounts/${accountId}`);
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

  async getTicketTimeEntries(ticketId: string, params?: { limit?: number; from?: number; billingType?: string }) {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = params.limit.toString();
    if (params?.from) query.from = params.from.toString();
    if (params?.billingType) query.billingType = params.billingType;

    return this.get(`/tickets/${ticketId}/timeEntries`, query);
  }

  async addTicketTimeEntry(ticketId: string, data: {
    executedTime: string;  // Format: "HH:MM" or minutes
    ownerId?: string;
    description?: string;
    billingType?: 'Billable' | 'Non Billable';
  }) {
    return this.post(`/tickets/${ticketId}/timeEntries`, data);
  }

  async updateTicketTimeEntry(ticketId: string, timeEntryId: string, data: {
    executedTime?: string;
    description?: string;
    billingType?: 'Billable' | 'Non Billable';
  }) {
    return this.patch(`/tickets/${ticketId}/timeEntries/${timeEntryId}`, data);
  }

  async deleteTicketTimeEntry(ticketId: string, timeEntryId: string) {
    return this.delete(`/tickets/${ticketId}/timeEntries/${timeEntryId}`);
  }

  async getTicketTimeEntrySummary(ticketId: string) {
    return this.get(`/tickets/${ticketId}/timeEntries/summation`);
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
