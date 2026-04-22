import { promises as fs } from 'node:fs';
import type { MediaIndexRepository } from '../../application/media/contracts';
import { createEmptyIndexState } from '../../domain/media/catalog';
import type { MediaIndexState } from '../../domain/media/types';
import { DATA_DIRECTORY, MEDIA_INDEX_FILE } from '../config/paths';

export class FileMediaIndexRepository implements MediaIndexRepository {
  private async ensureStore(): Promise<void> {
    await fs.mkdir(DATA_DIRECTORY, { recursive: true });

    try {
      await fs.access(MEDIA_INDEX_FILE);
    } catch {
      await fs.writeFile(MEDIA_INDEX_FILE, JSON.stringify(createEmptyIndexState(), null, 2), 'utf8');
    }
  }

  async readIndex(): Promise<MediaIndexState> {
    await this.ensureStore();
    const raw = await fs.readFile(MEDIA_INDEX_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MediaIndexState>;
    const emptyIndex = createEmptyIndexState();

    return {
      version: 1,
      updatedAt: parsed.updatedAt ?? emptyIndex.updatedAt,
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    };
  }

  async saveIndex(index: MediaIndexState): Promise<void> {
    await this.ensureStore();
    await fs.writeFile(MEDIA_INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
  }
}
