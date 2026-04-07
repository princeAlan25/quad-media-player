import type { MediaOrigin } from './LibraryMedia';

export interface AudioItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  isPlaying?: boolean;
  sourceId?: string;
  sourceLabel?: string;
  relativePath?: string;
  mimeType?: string;
  size?: number;
  modifiedAt?: number;
  durationSeconds?: number;
  summary?: string;
  transcript?: string;
  ocrText?: string;
  keywords?: string[];
  origin?: MediaOrigin;
}
