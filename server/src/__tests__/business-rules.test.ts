import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/db';
import * as ticketService from '../services/ticket.service';
import {
  createTicketSchema,
  updateTicketSchema,
  createCommentSchema,
  ticketQuerySchema,
} from '../lib/schemas';

describe('Support Desk System — Automated Test Suite', () => {
  let testAgentId: string;
  let testTicketId: string;

  beforeAll(async () => {
    // Find or create a test agent
    let agent = await prisma.agent.findFirst();
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          name: 'Test Agent',
          email: 'test.agent@example.com',
          role: 'AGENT',
        },
      });
    }
    testAgentId = agent.id;
  });

  describe('1. Schema Validation Rules', () => {
    it('should reject ticket creation without subject', () => {
      const result = createTicketSchema.safeParse({
        subject: '',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        description: 'Need help with account',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Subject is required');
      }
    });

    it('should reject ticket creation with invalid email', () => {
      const result = createTicketSchema.safeParse({
        subject: 'Login error',
        customerName: 'Jane Doe',
        customerEmail: 'not-an-email',
        description: 'Need help with account',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject ticket creation without description', () => {
      const result = createTicketSchema.safeParse({
        subject: 'Login error',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        description: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Description is required');
      }
    });

    it('should validate allowed status and priority enums', () => {
      const valid = createTicketSchema.safeParse({
        subject: 'Valid Ticket',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        description: 'Valid description',
        status: 'OPEN',
        priority: 'URGENT',
      });
      expect(valid.success).toBe(true);

      const invalid = createTicketSchema.safeParse({
        subject: 'Invalid Ticket',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        description: 'Valid description',
        status: 'CLOSED_INVALID' as any,
      });
      expect(invalid.success).toBe(false);
    });

    it('should require valid comment type (REPLY or NOTE)', () => {
      const validReply = createCommentSchema.safeParse({
        content: 'This is a public reply',
        type: 'REPLY',
        authorName: 'Sarah Chen',
      });
      expect(validReply.success).toBe(true);

      const validNote = createCommentSchema.safeParse({
        content: 'This is an internal note',
        type: 'NOTE',
        authorName: 'Sarah Chen',
      });
      expect(validNote.success).toBe(true);

      const invalidType = createCommentSchema.safeParse({
        content: 'Test content',
        type: 'UNKNOWN' as any,
        authorName: 'Sarah Chen',
      });
      expect(invalidType.success).toBe(false);
    });
  });

  describe('2. Core Ticket Lifecycle & History Logging', () => {
    it('should create a ticket and record CREATED activity log atomically', async () => {
      const ticket = await ticketService.createTicket({
        subject: 'Integration Test Ticket',
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        description: 'This is an automated test ticket.',
        priority: 'HIGH',
        status: 'OPEN',
        assigneeId: testAgentId,
      });

      expect(ticket).toBeDefined();
      expect(ticket.id).toBeDefined();
      expect(ticket.subject).toBe('Integration Test Ticket');
      expect(ticket.status).toBe('OPEN');
      expect(ticket.priority).toBe('HIGH');
      testTicketId = ticket.id;

      // Verify activity logs
      const fetched = await ticketService.getTicketById(ticket.id);
      expect(fetched).not.toBeNull();
      const createAction = fetched?.activities.find((a) => a.action === 'CREATED');
      expect(createAction).toBeDefined();
      expect(createAction?.performedBy).toBe('System');

      const assignAction = fetched?.activities.find((a) => a.action === 'ASSIGNED');
      expect(assignAction).toBeDefined();
    });

    it('should update ticket status and create STATUS_CHANGED activity log', async () => {
      const updated = await ticketService.updateTicket(
        testTicketId,
        { status: 'IN_PROGRESS' },
        'Test Agent'
      );

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('IN_PROGRESS');

      const fetched = await ticketService.getTicketById(testTicketId);
      const statusLog = fetched?.activities.find(
        (a) => a.action === 'STATUS_CHANGED' && a.newValue === 'IN_PROGRESS'
      );
      expect(statusLog).toBeDefined();
      expect(statusLog?.oldValue).toBe('OPEN');
      expect(statusLog?.performedBy).toBe('Test Agent');
    });

    it('should update ticket priority and create PRIORITY_CHANGED activity log', async () => {
      const updated = await ticketService.updateTicket(
        testTicketId,
        { priority: 'URGENT' },
        'Test Agent'
      );

      expect(updated?.priority).toBe('URGENT');

      const fetched = await ticketService.getTicketById(testTicketId);
      const priorityLog = fetched?.activities.find(
        (a) => a.action === 'PRIORITY_CHANGED' && a.newValue === 'URGENT'
      );
      expect(priorityLog).toBeDefined();
      expect(priorityLog?.oldValue).toBe('HIGH');
    });

    it('should add public replies and internal notes with activity tracking', async () => {
      // Add public reply
      const reply = await ticketService.addComment(testTicketId, {
        content: 'Hello customer, we are investigating.',
        type: 'REPLY',
        authorName: 'Test Agent',
      });
      expect(reply).not.toBeNull();
      expect(reply?.type).toBe('REPLY');

      // Add internal note
      const note = await ticketService.addComment(testTicketId, {
        content: 'Internal note: checked logs, database latency observed.',
        type: 'NOTE',
        authorName: 'Test Agent',
      });
      expect(note).not.toBeNull();
      expect(note?.type).toBe('NOTE');

      // Verify comments and activity entries
      const fetched = await ticketService.getTicketById(testTicketId);
      expect(fetched?.comments.length).toBe(2);
      expect(fetched?.comments[0].type).toBe('REPLY');
      expect(fetched?.comments[1].type).toBe('NOTE');

      const replyLog = fetched?.activities.find((a) => a.action === 'COMMENT_ADDED');
      const noteLog = fetched?.activities.find((a) => a.action === 'NOTE_ADDED');
      expect(replyLog).toBeDefined();
      expect(noteLog).toBeDefined();
    });
  });

  describe('3. Overdue and Dashboard Business Rules', () => {
    it('should compute overdue accurately based on 24-hour rule', async () => {
      // Create an overdue ticket (created 30 hours ago, status OPEN)
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
      const overdueTicket = await prisma.ticket.create({
        data: {
          subject: 'Old Unresolved Ticket',
          customerName: 'Late Customer',
          customerEmail: 'late@customer.com',
          description: 'Needs urgent answer',
          status: 'OPEN',
          priority: 'URGENT',
          createdAt: thirtyHoursAgo,
          updatedAt: thirtyHoursAgo,
        },
      });

      const statsBeforeResolution = await ticketService.getDashboardStats();
      expect(statsBeforeResolution.overdue).toBeGreaterThan(0);

      // When resolved, ticket must NOT count as overdue or open
      await ticketService.updateTicket(overdueTicket.id, { status: 'RESOLVED' }, 'System');

      const statsAfterResolution = await ticketService.getDashboardStats();
      expect(statsAfterResolution.overdue).toBe(statsBeforeResolution.overdue - 1);
      expect(statsAfterResolution.resolved).toBe(statsBeforeResolution.resolved + 1);

      // Clean up test ticket
      await prisma.ticket.delete({ where: { id: overdueTicket.id } });
    });

    it('should exclude RESOLVED tickets from active and urgent counts', async () => {
      const stats = await ticketService.getDashboardStats();
      const resolvedCount = await prisma.ticket.count({ where: { status: 'RESOLVED' } });
      expect(stats.resolved).toBe(resolvedCount);

      // Urgent count in dashboard must only count unresolved urgent tickets
      const unresolvedUrgentInDb = await prisma.ticket.count({
        where: { priority: 'URGENT', status: { not: 'RESOLVED' } },
      });
      expect(stats.urgent).toBe(unresolvedUrgentInDb);
    });
  });

  describe('4. Search, Filter, and Sorting', () => {
    it('should search tickets by subject, customer name, or customer email', async () => {
      const bySubject = await ticketService.listTickets({
        search: 'Integration Test',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
      });
      expect(bySubject.tickets.length).toBeGreaterThan(0);

      const byEmail = await ticketService.listTickets({
        search: 'customer@test.com',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
      });
      expect(byEmail.tickets.length).toBeGreaterThan(0);
    });

    it('should filter by combined criteria (status + priority)', async () => {
      const filtered = await ticketService.listTickets({
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
      });
      for (const t of filtered.tickets) {
        expect(t.status).toBe('IN_PROGRESS');
        expect(t.priority).toBe('URGENT');
      }
    });

    it('should sort correctly by priority (URGENT > HIGH > MEDIUM > LOW)', async () => {
      const result = await ticketService.listTickets({
        sortBy: 'priority',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });

      const priorityOrderMap: Record<string, number> = {
        URGENT: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      };

      for (let i = 1; i < result.tickets.length; i++) {
        const prevRank = priorityOrderMap[result.tickets[i - 1].priority];
        const currRank = priorityOrderMap[result.tickets[i].priority];
        expect(currRank).toBeGreaterThanOrEqual(prevRank);
      }
    });
  });

  afterAll(async () => {
    // Clean up test ticket and its cascading relations
    if (testTicketId) {
      await prisma.ticket.delete({ where: { id: testTicketId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });
});
