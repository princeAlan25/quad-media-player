import dotenv from 'dotenv';
dotenv.config();

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { MediaLibraryService } from './application/media/MediaLibraryService';
import { OpenRouterMediaAnalyzer } from './infrastructure/analysis/OpenRouterMediaAnalyzer';
import { FileMediaIndexRepository } from './infrastructure/persistence/FileMediaIndexRepository';
import { FileSystemMediaScanner } from './infrastructure/scan/FileSystemMediaScanner';
import { createMediaRouter } from './presentation/http/createMediaRouter';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
const indexRepository = new FileMediaIndexRepository();
const mediaAnalyzer = new OpenRouterMediaAnalyzer();
const systemScanner = new FileSystemMediaScanner(mediaAnalyzer);
const mediaLibraryService = new MediaLibraryService({
  indexRepository,
  systemScanner,
});

app.use(express.json({ limit: '20mb' }));
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range'],
    exposedHeaders: ['Accept-Ranges', 'Content-Length', 'Content-Range', 'Content-Type'],
  }),
);
app.use(createMediaRouter({ mediaLibraryService }));

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: error.message || 'Unexpected server error.',
  });
});

app.listen(port, () => {
  console.log(`Media RAG backend running on port:${port} now`);
});
