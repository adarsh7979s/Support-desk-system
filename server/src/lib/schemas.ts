import { z } from 'zod';

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED'] as const;
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const COMMENT_TYPES = ['REPLY', 'NOTE'] as const;
export const AGENT_ROLES = ['ADMIN', 'AGENT'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type CommentType = (typeof COMMENT_TYPES)[number];

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject must be 255 characters or fewer'),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name must be 100 characters or fewer'),
  customerEmail: z.string().min(1, 'Customer email is required').email('Invalid email address'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be 5000 characters or fewer'),
  priority: z.enum(TICKET_PRIORITIES).optional().default('MEDIUM'),
  status: z.enum(TICKET_STATUSES).optional().default('OPEN'),
  assigneeId: z.string().nullable().optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255).optional(),
  customerName: z.string().min(1).max(100).optional(),
  customerEmail: z.string().email('Invalid email address').optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z.string().nullable().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment must be 5000 characters or fewer'),
  type: z.enum(COMMENT_TYPES, { errorMap: () => ({ message: 'Type must be REPLY or NOTE' }) }),
  authorName: z.string().min(1, 'Author name is required').max(100),
});

export const ticketQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(), // comma-separated statuses
  priority: z.string().optional(), // comma-separated priorities
  assigneeId: z.string().optional(),
  sortBy: z.enum(['updatedAt', 'priority']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
