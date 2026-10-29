import prisma from '../lib/db';
import { Prisma } from '@prisma/client';
import type { TicketStatus, TicketPriority } from '../lib/schemas';

// Priority ordering for sorting
const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  sortBy: 'updatedAt' | 'priority';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface TicketUpdateData {
  subject?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

export async function listTickets(filters: TicketFilters) {
  const where: Prisma.TicketWhereInput = {};

  // Search across subject, customer name, customer email
  if (filters.search) {
    where.OR = [
      { subject: { contains: filters.search } },
      { customerName: { contains: filters.search } },
      { customerEmail: { contains: filters.search } },
    ];
  }

  // Filter by statuses (comma-separated)
  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim());
    where.status = { in: statuses };
  }

  // Filter by priorities (comma-separated)
  if (filters.priority) {
    const priorities = filters.priority.split(',').map((p) => p.trim());
    where.priority = { in: priorities };
  }

  // Filter by assignee
  if (filters.assigneeId) {
    if (filters.assigneeId === 'unassigned') {
      where.assigneeId = null;
    } else {
      where.assigneeId = filters.assigneeId;
    }
  }

  const skip = (filters.page - 1) * filters.limit;

  // Determine ordering
  let orderBy: Prisma.TicketOrderByWithRelationInput;
  if (filters.sortBy === 'priority') {
    // SQLite doesn't support custom ordering in Prisma, so we sort in-memory for priority
    orderBy = { updatedAt: 'desc' };
  } else {
    orderBy = { updatedAt: filters.sortOrder };
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy,
      skip: filters.sortBy === 'priority' ? undefined : skip,
      take: filters.sortBy === 'priority' ? undefined : filters.limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  // If sorting by priority, sort in-memory and paginate
  if (filters.sortBy === 'priority') {
    tickets.sort((a, b) => {
      const orderA = PRIORITY_ORDER[a.priority] ?? 99;
      const orderB = PRIORITY_ORDER[b.priority] ?? 99;
      const diff = orderA - orderB;
      if (diff !== 0) return filters.sortOrder === 'asc' ? -diff : diff;
      // Secondary sort by updatedAt desc
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    const paginated = tickets.slice(skip, skip + filters.limit);
    return { tickets: paginated, total, page: filters.page, limit: filters.limit };
  }

  return { tickets, total, page: filters.page, limit: filters.limit };
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      comments: { orderBy: { createdAt: 'asc' } },
      activities: { orderBy: { createdAt: 'asc' } },
    },
  });
  return ticket;
}

export async function createTicket(data: {
  subject: string;
  customerName: string;
  customerEmail: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string | null;
}) {
  // Use transaction to create ticket + activity log atomically
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        subject: data.subject,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        description: data.description,
        priority: data.priority,
        status: data.status,
        assigneeId: data.assigneeId ?? null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Log creation
    await tx.activityLog.create({
      data: {
        ticketId: ticket.id,
        action: 'CREATED',
        performedBy: 'System',
      },
    });

    // Log initial assignment if assigned
    if (ticket.assigneeId && ticket.assignee) {
      await tx.activityLog.create({
        data: {
          ticketId: ticket.id,
          action: 'ASSIGNED',
          field: 'assignee',
          oldValue: null,
          newValue: ticket.assignee.name,
          performedBy: 'System',
        },
      });
    }

    return ticket;
  });

  return result;
}

export async function updateTicket(id: string, data: TicketUpdateData, performedBy: string) {
  // Fetch existing ticket to detect changes
  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true } } },
  });

  if (!existing) return null;

  // Build activity log entries for tracked field changes
  const activityEntries: Array<{
    action: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }> = [];

  if (data.status !== undefined && data.status !== existing.status) {
    activityEntries.push({
      action: 'STATUS_CHANGED',
      field: 'status',
      oldValue: existing.status,
      newValue: data.status,
    });
  }

  if (data.priority !== undefined && data.priority !== existing.priority) {
    activityEntries.push({
      action: 'PRIORITY_CHANGED',
      field: 'priority',
      oldValue: existing.priority,
      newValue: data.priority,
    });
  }

  if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
    // Look up new assignee name
    let newAssigneeName: string | null = null;
    if (data.assigneeId) {
      const newAgent = await prisma.agent.findUnique({
        where: { id: data.assigneeId },
        select: { name: true },
      });
      newAssigneeName = newAgent?.name ?? null;
    }

    activityEntries.push({
      action: 'ASSIGNED',
      field: 'assignee',
      oldValue: existing.assignee?.name ?? null,
      newValue: newAssigneeName,
    });
  }

  // Use transaction for update + activity logs
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Create activity log entries
    for (const entry of activityEntries) {
      await tx.activityLog.create({
        data: {
          ticketId: id,
          action: entry.action,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          performedBy,
        },
      });
    }

    return updated;
  });

  return result;
}

export async function addComment(
  ticketId: string,
  data: { content: string; type: string; authorName: string }
) {
  // Verify ticket exists
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;

  const result = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        ticketId,
        content: data.content,
        type: data.type,
        authorName: data.authorName,
      },
    });

    // Update ticket's updatedAt
    await tx.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        ticketId,
        action: data.type === 'NOTE' ? 'NOTE_ADDED' : 'COMMENT_ADDED',
        performedBy: data.authorName,
      },
    });

    return comment;
  });

  return result;
}

export async function getDashboardStats() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [total, open, inProgress, waitingOnCustomer, resolved, urgent, overdue] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { status: 'WAITING_ON_CUSTOMER' } }),
    prisma.ticket.count({ where: { status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { priority: 'URGENT', status: { not: 'RESOLVED' } } }),
    prisma.ticket.count({
      where: {
        status: { not: 'RESOLVED' },
        createdAt: { lt: twentyFourHoursAgo },
      },
    }),
  ]);

  return { total, open, inProgress, waitingOnCustomer, resolved, urgent, overdue };
}

export async function listAgents() {
  return prisma.agent.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}
