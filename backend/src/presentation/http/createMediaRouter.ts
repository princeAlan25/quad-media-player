import { Router, type Request } from 'express';
import { MediaLibraryService } from '../../application/media/MediaLibraryService';
import type { MediaSearchRequest, MediaSyncRequest, MediaType } from '../../domain/media/types';
import { streamMediaFile } from './streamMediaFile';

const VALID_MEDIA_TYPES = new Set<MediaType>(['audio', 'video', 'image']);

function parseMediaTypes(value: unknown): MediaType[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map(type => type.trim())
    .filter((type): type is MediaType => VALID_MEDIA_TYPES.has(type as MediaType));
}

interface CreateMediaRouterDependencies {
  mediaLibraryService: MediaLibraryService;
}

export function createMediaRouter({ mediaLibraryService }: CreateMediaRouterDependencies): Router {
  const router = Router();

  router.get('/api/health', async (_req, res, next) => {
    try {
      res.json(await mediaLibraryService.getHealth());
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/media', async (req, res, next) => {
    try {
      res.json(await mediaLibraryService.listMedia(parseMediaTypes(req.query.types)));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/system-scan', async (_req, res, next) => {
    try {
      res.status(201).json(await mediaLibraryService.scanSystemSources());
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/media/item/:mediaId', async (req, res, next) => {
    try {
      const response = await mediaLibraryService.getMediaItem(req.params.mediaId);
      if (!response) {
        res.status(404).json({ error: 'Media item not found.' });
        return;
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/items', async (req: Request<unknown, unknown, { ids?: string[] }>, res, next) => {
    try {
      const ids = Array.isArray(req.body?.ids)
        ? req.body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : [];

      if (ids.length === 0) {
        res.status(400).json({ error: 'ids must be a non-empty array of media ids.' });
        return;
      }

      res.json(await mediaLibraryService.getMediaItems(ids));
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/media/file/:mediaId', async (req, res, next) => {
    try {
      const document = await mediaLibraryService.getMediaFile(req.params.mediaId);
      if (!document) {
        res.status(404).json({ error: 'Media item not found.' });
        return;
      }

      await streamMediaFile(req, res, document);
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/sync', async (req: Request<unknown, unknown, MediaSyncRequest>, res, next) => {
    try {
      const payload = req.body;
      if (!payload?.source?.id || !payload?.source?.label || !Array.isArray(payload.documents)) {
        res.status(400).json({ error: 'source.id, source.label, and documents are required.' });
        return;
      }

      res.status(201).json(await mediaLibraryService.syncMediaSource(payload.source, payload.documents));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/api/media/source/:sourceId', async (req, res, next) => {
    try {
      const { sourceId } = req.params;
      if (!sourceId) {
        res.status(400).json({ error: 'sourceId is required.' });
        return;
      }

      res.json(await mediaLibraryService.removeMediaSource(sourceId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/search', async (req: Request<unknown, unknown, MediaSearchRequest>, res, next) => {
    try {
      res.json(await mediaLibraryService.searchMedia(req.body ?? {}));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/rag', async (req: Request<unknown, unknown, MediaSearchRequest>, res, next) => {
    try {
      res.json(await mediaLibraryService.buildRagMedia(req.body ?? {}));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/jamendo/search', async (req: Request<unknown, unknown, MediaSearchRequest>, res, next) => {
    try {
      const query = req.body?.query || '';
      const limit = req.body?.limit || 10;
      res.json(await mediaLibraryService.searchJamendo(query, limit));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/media/youtube/search', async (req: Request<unknown, unknown, MediaSearchRequest>, res, next) => {
    try {
      const query = req.body?.query || '';
      const limit = req.body?.limit || 10;
      res.json(await mediaLibraryService.searchYouTube(query, limit));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
