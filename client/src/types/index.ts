// Shared types matching the backend schema

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type CommentType = 'REPLY' | 'NOTE';

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Ticket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  assignee: Agent | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  type: CommentType;
  authorName: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  ticketId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  comments: Comment[];
  activities: ActivityLog[];
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  waitingOnCustomer: number;
  resolved: number;
  urgent: number;
  overdue: number;
}

export interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  sortBy?: 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateTicketData {
  subject: string;
  customerName: string;
  customerEmail: string;
  description: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigneeId?: string | null;
}

export interface UpdateTicketData {
  subject?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  performedBy?: string;
}

export interface CreateCommentData {
  content: string;
  type: CommentType;
  authorName: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
