import { createReadStream, promises as fs } from 'node:fs';
import type { Request, Response } from 'express';
import type { MediaDocument } from '../../domain/media/types';
import { mapHostPathToContainer } from '../../infrastructure/config/pathMapping';

export async function streamMediaFile(req: Request, res: Response, document: MediaDocument): Promise<void> {
  if (!document.filePath) {
    res.status(404).json({ error: 'This media item is not directly accessible from the backend.' });
    return;
  }

  const resolvedPath = mapHostPathToContainer(document.filePath);
  const stats = await fs.stat(resolvedPath);
  const rangeHeader = req.headers.range;
  const baseHeaders = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'Content-Disposition': `inline; filename="${encodeURIComponent(document.fileName)}"`,
    'Content-Type': document.mimeType || 'application/octet-stream',
  };

  if (!rangeHeader) {
    res.writeHead(200, {
      ...baseHeaders,
      'Content-Length': stats.size,
    });
    createReadStream(resolvedPath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    res.status(416).json({ error: 'Invalid range request.' });
    return;
  }

  const parsedStart = match[1] ? Number.parseInt(match[1], 10) : 0;
  const parsedEnd = match[2] ? Number.parseInt(match[2], 10) : stats.size - 1;
  const start = Number.isFinite(parsedStart) ? parsedStart : 0;
  const end = Number.isFinite(parsedEnd) ? parsedEnd : stats.size - 1;

  if (start < 0 || end < start || end >= stats.size) {
    res.status(416).json({ error: 'Requested range is not satisfiable.' });
    return;
  }

  res.writeHead(206, {
    ...baseHeaders,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
  });
  createReadStream(resolvedPath, { start, end }).pipe(res);
}
