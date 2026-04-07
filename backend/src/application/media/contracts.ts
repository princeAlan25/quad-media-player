import type { MediaIndexState } from '../../domain/media/types';

export interface MediaIndexRepository {
  readIndex(): Promise<MediaIndexState>;
  saveIndex(index: MediaIndexState): Promise<void>;
}
