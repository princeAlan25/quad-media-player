export type MediaKind = 'audio' | 'video' | 'image';
export type MediaOrigin = 'seed' | 'manual-upload' | 'local-sync' | 'backend-scan';

export interface MediaSource {
  id: string;
  label: string;
  mode: 'directory' | 'session';
  status: 'ready' | 'syncing' | 'permission-needed' | 'error';
  itemCount: number;
  lastSyncedAt?: number;
  error?: string;
}

export interface MediaSyncState {
  phase: 'idle' | 'syncing' | 'ready' | 'error';
  message: string;
  syncedItems: number;
  syncedSources: number;
  lastSyncedAt?: number;
}

export interface MediaFocusRequest {
  type: MediaKind;
  id: string;
  autoplay: boolean;
  nonce: number;
}

export interface BackendMediaDocument {
  id: string;
  type: MediaKind;
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
}

export interface BackendMediaMatch {
  id: string;
  type: MediaKind;
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

export interface BackendMediaStats {
  total: number;
  audio: number;
  video: number;
  image: number;
  sources: number;
  updatedAt: string | null;
}
