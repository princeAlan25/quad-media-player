import dotenv from 'dotenv';
dotenv.config();

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { MediaLibraryService } from './application/media/MediaLibraryService';
import { FileMediaIndexRepository } from './infrastructure/persistence/FileMediaIndexRepository';
import { createMediaRouter } from './presentation/http/createMediaRouter';
import { createAiRouter } from './presentation/http/createAiRouter';
import { validateApiKey } from './middleware/apiKeyAuth';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');

const indexRepository = new FileMediaIndexRepository();
const mediaLibraryService = new MediaLibraryService({
  indexRepository,
});

// Body size limit
app.use(express.json({ limit: '20mb' }));

// CORS configuration - restricted to allowed origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range', 'Authorization'],
    exposedHeaders: ['Accept-Ranges', 'Content-Length', 'Content-Range', 'Content-Type'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// Rate limiting middleware
app.use(rateLimiter);

// API Key validation for sensitive endpoints
app.use('/api/ai', validateApiKey);

// Register AI Router
app.use(createAiRouter());

app.use(createMediaRouter({ mediaLibraryService }));

// Health check endpoint (public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message || 'Unexpected server error.';
  
  res.status(500).json({ error: message });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Media RAG backend running on port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
