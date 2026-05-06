import { Request, Response, NextFunction } from 'express';

/**
 * Validates API key from request headers or environment variable.
 * Required for sensitive endpoints like AI operations.
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  // Skip validation in development if no API key is set
  if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;

  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }

  next();
};
