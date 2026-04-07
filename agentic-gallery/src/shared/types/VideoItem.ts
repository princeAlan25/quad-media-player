import type { MediaOrigin } from './LibraryMedia';

export interface VideoItem {
  id: string;
  url: string;
  name: string;
  sourceId?: string;
  sourceLabel?: string;
  relativePath?: string;
  mimeType?: string;
  size?: number;
  modifiedAt?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  summary?: string;
  transcript?: string;
  keywords?: string[];
  origin?: MediaOrigin;
}
