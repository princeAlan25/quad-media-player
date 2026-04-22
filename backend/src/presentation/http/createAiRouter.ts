import { Router, type Request, type Response, type NextFunction } from 'express';
import { AiService } from '../../application/ai/AiService';

export function createAiRouter() {
  const router = Router();
  const aiService = new AiService();

  router.post('/api/ai/chat', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, options } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const result = await aiService.chatCompletion(messages, options);
      res.json(result);
    } catch (error) {
      console.error('[AI Router] Error:', error);
      next(error);
    }
  });

  return router;
}
