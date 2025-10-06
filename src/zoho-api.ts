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

  constructor(accessToken: string, orgId: string) {
    this.accessToken = accessToken;
    this.orgId = orgId;
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
    query?: Record<string, string>
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
  }) {
    return this.patch(`/tickets/${ticketId}`, data);
  }

  async deleteTicket(ticketId: string) {
    return this.delete(`/tickets/${ticketId}`);
  }

  /* ===========================
   * TICKET THREADS/CONVERSATIONS
   * =========================== */

  async getTicketThreads(ticketId: string) {
    return this.get(`/tickets/${ticketId}/threads`);
  }

  async addTicketReply(ticketId: string, content: string, isPublic = true) {
    return this.post(`/tickets/${ticketId}/threads`, {
      content,
      isPublicReply: isPublic
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
}
