import type {
  MediaDocument,
  MediaIndexState,
  MediaIndexStats,
  MediaSourceDocuments,
  MediaSyncSource,
  PublicMediaDocument,
} from './types';

const EMPTY_UPDATED_AT = new Date(0).toISOString();

export function createEmptyIndexState(): MediaIndexState {
  return {
    version: 1,
    updatedAt: EMPTY_UPDATED_AT,
    documents: [],
  };
}

export function createMediaIndexState(documents: MediaDocument[]): MediaIndexState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    documents,
  };
}

export function normalizeMediaDocument(document: MediaDocument, source: MediaSyncSource): MediaDocument {
  const now = new Date().toISOString();
  return {
    ...document,
    sourceId: source.id,
    sourceLabel: source.label,
    sourceMode: source.mode,
    fileName: document.fileName.trim(),
    title: document.title.trim() || document.fileName.trim(),
    relativePath: document.relativePath.trim(),
    mimeType: document.mimeType.trim(),
    ...(document.filePath?.trim() ? { filePath: document.filePath.trim() } : {}),
    keywords: Array.from(new Set((document.keywords ?? []).map(keyword => keyword.trim()).filter(Boolean))),
    tags: Array.from(new Set((document.tags ?? []).map(tag => tag.trim()).filter(Boolean))),
    createdAt: document.createdAt ?? now,
    updatedAt: now,
  };
}

export function replaceDocumentsForSources(
  current: MediaIndexState,
  sourceEntries: MediaSourceDocuments[],
): MediaIndexState {
  const replacedSourceIds = new Set(sourceEntries.map(entry => entry.source.id));
  const nextDocuments = current.documents
    .filter(document => !replacedSourceIds.has(document.sourceId))
    .concat(sourceEntries.flatMap(entry => entry.documents.map(document => normalizeMediaDocument(document, entry.source))));

  return createMediaIndexState(nextDocuments);
}

export function removeDocumentsForSource(current: MediaIndexState, sourceId: string): MediaIndexState {
  return createMediaIndexState(current.documents.filter(document => document.sourceId !== sourceId));
}

export function findMediaDocumentById(documents: MediaDocument[], documentId: string): MediaDocument | null {
  return documents.find(document => document.id === documentId) ?? null;
}

export function toPublicDocument(document: MediaDocument): PublicMediaDocument {
  const { filePath: _filePath, ...publicDocument } = document;
  return publicDocument;
}

export function validateDocuments(documents: MediaDocument[]): void {
  for (const document of documents) {
    if (!document.id || !document.fileName || !document.title || !document.type || !document.relativePath) {
      throw new Error('Each media document must include id, type, fileName, title, and relativePath.');
    }
  }
}

export function buildStats(documents: MediaDocument[], updatedAt: string | null): MediaIndexStats {
  const sourceIds = new Set(documents.map(document => document.sourceId));
  return {
    total: documents.length,
    audio: documents.filter(document => document.type === 'audio').length,
    video: documents.filter(document => document.type === 'video').length,
    image: documents.filter(document => document.type === 'image').length,
    sources: sourceIds.size,
    updatedAt,
  };
}
