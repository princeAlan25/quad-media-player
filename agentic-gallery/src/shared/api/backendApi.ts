import type { BackendMediaDocument, BackendMediaMatch, BackendMediaStats, MediaKind } from '@/shared/types/LibraryMedia';

const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function syncMediaSource(source: { id: string; label: string; mode: 'directory' | 'session' }, documents: BackendMediaDocument[]) {
  return requestJson<{ sourceId: string; synced: number; stats: BackendMediaStats }>('/api/media/sync', {
    method: 'POST',
    body: JSON.stringify({ source, documents }),
  });
}

export function getBackendMediaUrl(mediaId: string): string {
  return `${backendBaseUrl}/api/media/file/${encodeURIComponent(mediaId)}`;
}

export async function deleteMediaSource(sourceId: string) {
  return requestJson<{ sourceId: string; stats: BackendMediaStats }>(`/api/media/source/${encodeURIComponent(sourceId)}`, {
    method: 'DELETE',
  });
}

export async function fetchMediaDocument(mediaId: string) {
  return requestJson<{ document: BackendMediaDocument }>(`/api/media/item/${encodeURIComponent(mediaId)}`);
}

export async function fetchMediaDocuments(ids: string[]) {
  if (ids.length === 0) {
    return { documents: [] as BackendMediaDocument[] };
  }

  return requestJson<{ documents: BackendMediaDocument[] }>('/api/media/items', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function fetchMediaLibrary(types?: MediaKind[]) {
  const query = types?.length ? `?types=${encodeURIComponent(types.join(','))}` : '';
  return requestJson<{ documents: BackendMediaDocument[]; stats: BackendMediaStats }>(`/api/media${query}`);
}

export async function searchMediaLibrary(query: string, types?: MediaKind[], limit = 8) {
  return requestJson<{ query: string; matches: BackendMediaMatch[]; stats: BackendMediaStats }>('/api/media/search', {
    method: 'POST',
    body: JSON.stringify({ query, types, limit }),
  });
}

export async function scanSystemMediaLibrary() {
  return requestJson<{
    scannedSources: number;
    scannedItems: number;
    skippedEntries: number;
    sources: Array<{ id: string; label: string; rootPath: string; itemCount: number }>;
    analysis?: {
      enabled: boolean;
      model?: string;
      analyzed: number;
      cached: number;
      skipped: number;
      failed: number;
    };
    stats: BackendMediaStats;
  }>('/api/media/system-scan', {
    method: 'POST',
  });
}

export async function fetchRagContext(query: string, types?: MediaKind[], limit = 8) {
  return requestJson<{ query: string; matches: BackendMediaMatch[]; context: string; stats: BackendMediaStats }>('/api/media/rag', {
    method: 'POST',
    body: JSON.stringify({ query, types, limit }),
  });
}

export async function fetchBackendHealth() {
  return requestJson<{ ok: boolean; stats: BackendMediaStats }>('/api/health');
}

export async function searchJamendoMusic(query: string, limit = 10) {
  return requestJson<{ query: string; documents: BackendMediaDocument[] }>('/api/media/jamendo/search', {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  });
}
