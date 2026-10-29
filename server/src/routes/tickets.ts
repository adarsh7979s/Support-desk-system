import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  createTicketSchema,
  updateTicketSchema,
  createCommentSchema,
  ticketQuerySchema,
} from '../lib/schemas';
import * as ticketService from '../services/ticket.service';

const router = Router();

/** Format Zod errors into a user-friendly object */
function formatZodError(error: ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'general';
    errors[path] = issue.message;
  }
  return errors;
}

/** GET /api/dashboard — Dashboard statistics */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const stats = await ticketService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/** GET /api/agents — List all agents */
router.get('/agents', async (_req: Request, res: Response) => {
  try {
    const agents = await ticketService.listAgents();
    res.json(agents);
  } catch (err) {
    console.error('List agents error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/** GET /api/tickets — List tickets with search, filter, sort, pagination */
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const parsed = ticketQuerySchema.parse(req.query);
    const result = await ticketService.listTickets(parsed);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: formatZodError(err) });
      return;
    }
    console.error('List tickets error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/** POST /api/tickets — Create a new ticket */
router.post('/tickets', async (req: Request, res: Response) => {
  try {
    const data = createTicketSchema.parse(req.body);
    const ticket = await ticketService.createTicket(data);
    res.status(201).json(ticket);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) });
      return;
    }
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/** GET /api/tickets/:id — Get ticket details with comments and activity */
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ticket = await ticketService.getTicketById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (err) {
    console.error('Get ticket error:', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

/** PATCH /api/tickets/:id — Update ticket fields */
router.patch('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = updateTicketSchema.parse(req.body);
    // Use performedBy from request body or default
    const performedBy = (req.body.performedBy as string) || 'System';
    const ticket = await ticketService.updateTicket(id, data, performedBy);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) });
      return;
    }
    console.error('Update ticket error:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/** POST /api/tickets/:id/comments — Add a reply or internal note */
router.post('/tickets/:id/comments', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = createCommentSchema.parse(req.body);
    const comment = await ticketService.addComment(id, data);
    if (!comment) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) });
      return;
    }
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
