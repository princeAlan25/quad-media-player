import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100;

/**
 * Simple rate limiter middleware using in-memory store.
 * For production, consider using Redis-based solutions.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (!store[key]) {
    store[key] = { count: 0, resetTime: now + WINDOW_MS };
  }

  const record = store[key];

  // Reset if window has passed
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + WINDOW_MS;
  }

  record.count++;

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return;
  }

  next();
};
