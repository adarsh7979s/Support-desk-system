import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import ticketRoutes from './routes/tickets';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigin = process.env.CLIENT_URL;
app.use(
  cors({
    origin: allowedOrigin ? [allowedOrigin, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', ticketRoutes);

// Static frontend serving in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const clientDistAlt = path.resolve(process.cwd(), 'client/dist');
const staticPath = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(clientDistAlt)
  ? clientDistAlt
  : null;

if (staticPath) {
  app.use(express.static(staticPath));
  // SPA Fallback for client-side routing in Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(staticPath, 'index.html'));
    }
    next();
  });
}

// 404 handler for API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Fallback 404 for when static assets or routes are not found
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — never expose internal stack traces
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
