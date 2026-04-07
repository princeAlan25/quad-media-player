export type MediaType = 'audio' | 'video' | 'image';

export interface MediaDocument {
  id: string;
  type: MediaType;
  sourceId: string;
  sourceLabel: string;
  sourceMode?: 'directory' | 'session' | 'system';
  fileName: string;
  title: string;
  artist?: string;
  mimeType: string;
  relativePath: string;
  size: number;
  modifiedAt: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  summary?: string;
  transcript?: string;
  ocrText?: string;
  keywords: string[];
  tags: string[];
  filePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PublicMediaDocument = Omit<MediaDocument, 'filePath'>;

export interface MediaSyncSource {
  id: string;
  label: string;
  mode: 'directory' | 'session' | 'system';
}

export interface MediaSourceDocuments {
  source: MediaSyncSource;
  documents: MediaDocument[];
}

export interface MediaSyncRequest {
  source: MediaSyncSource;
  documents: MediaDocument[];
}

export interface MediaSearchRequest {
  query?: string;
  limit?: number;
  types?: MediaType[];
}

export interface MediaSearchMatch {
  id: string;
  type: MediaType;
  sourceId: string;
  sourceLabel: string;
  title: string;
  fileName: string;
  relativePath: string;
  artist?: string;
  score: number;
  snippet: string;
  keywords: string[];
  modifiedAt: number;
}

export interface MediaIndexState {
  version: 1;
  updatedAt: string;
  documents: MediaDocument[];
}

export interface MediaIndexStats {
  total: number;
  audio: number;
  video: number;
  image: number;
  sources: number;
  updatedAt: string | null;
}

export interface MediaAnalysisStats {
  enabled: boolean;
  model?: string;
  analyzed: number;
  cached: number;
  skipped: number;
  failed: number;
}
