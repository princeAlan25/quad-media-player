import type { MediaOrigin } from './LibraryMedia';

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  sourceId?: string;
  sourceLabel?: string;
  relativePath?: string;
  mimeType?: string;
  size?: number;
  modifiedAt?: number;
  width?: number;
  height?: number;
  summary?: string;
  ocrText?: string;
  keywords?: string[];
  origin?: MediaOrigin;
}
