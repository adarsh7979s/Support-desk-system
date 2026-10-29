import type {
  TicketListResponse,
  TicketDetail,
  Ticket,
  Agent,
  DashboardStats,
  TicketFilters,
  CreateTicketData,
  UpdateTicketData,
  CreateCommentData,
  Comment,
  ApiError,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiError;
      const message = body.error || `Request failed with status ${res.status}`;
      const err = new Error(message) as Error & { status: number; details?: Record<string, string> };
      err.status = res.status;
      err.details = body.details;
      throw err;
    }

    return res.json() as Promise<T>;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard');
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  // Tickets
  async getTickets(filters?: TicketFilters): Promise<TicketListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.request<TicketListResponse>(`/tickets${query ? `?${query}` : ''}`);
  }

  async getTicket(id: string): Promise<TicketDetail> {
    return this.request<TicketDetail>(`/tickets/${id}`);
  }

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    return this.request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    return this.request<Ticket>(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addComment(ticketId: string, data: CreateCommentData): Promise<Comment> {
    return this.request<Comment>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
