import type { AudioItem } from '@/shared/types/AudioItem';
import type { ImageItem } from '@/shared/types/ImageItem';
import type { VideoItem } from '@/shared/types/VideoItem';
import type { BackendMediaDocument, MediaKind, MediaOrigin } from '@/shared/types/LibraryMedia';

const DIRECTORY_DB_NAME = 'quad-media-player';
const DIRECTORY_STORE_NAME = 'directory-handles';

const EXTENSION_FALLBACKS: Record<MediaKind, string[]> = {
  audio: ['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav', '.wma'],
  video: ['.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.webm'],
  image: ['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'],
};

type MediaItem = AudioItem | VideoItem | ImageItem;

interface SavedDirectorySource {
  id: string;
  label: string;
  handle: FileSystemDirectoryHandle;
}

export type KnownDirectoryStart = 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';

export const COMMON_DIRECTORY_SOURCES = [
  { id: 'known-desktop', label: 'Desktop', startIn: 'desktop' },
  { id: 'known-documents', label: 'Documents', startIn: 'documents' },
  { id: 'known-downloads', label: 'Downloads', startIn: 'downloads' },
  { id: 'known-music', label: 'Music', startIn: 'music' },
  { id: 'known-pictures', label: 'Pictures', startIn: 'pictures' },
  { id: 'known-videos', label: 'Videos', startIn: 'videos' },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  startIn: KnownDirectoryStart;
}>;

interface LocalFileRecord {
  file: File;
  type: MediaKind;
  relativePath: string;
}

interface DirectoryHandleWithValues extends FileSystemDirectoryHandle {
  values: () => AsyncIterable<FileSystemHandle>;
  queryPermission?: (descriptor: { mode: 'read' }) => Promise<PermissionState>;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: KnownDirectoryStart;
}

interface WindowWithDirectoryPicker extends Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}

export interface DirectoryMediaSnapshot {
  audios: AudioItem[];
  videos: VideoItem[];
  images: ImageItem[];
  documents: BackendMediaDocument[];
  itemCount: number;
}

function openDirectoryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DIRECTORY_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DIRECTORY_STORE_NAME)) {
        database.createObjectStore(DIRECTORY_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open the directory database.'));
  });
}

async function withObjectStore<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDirectoryDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DIRECTORY_STORE_NAME, mode);
    const store = transaction.objectStore(DIRECTORY_STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

function getExtension(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  const index = lowerName.lastIndexOf('.');
  return index >= 0 ? lowerName.slice(index) : '';
}

function inferMediaType(file: File): MediaKind | null {
  if (file.type.startsWith('audio/')) {
    return 'audio';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }
  if (file.type.startsWith('image/')) {
    return 'image';
  }

  const extension = getExtension(file.name);
  for (const [type, extensions] of Object.entries(EXTENSION_FALLBACKS) as Array<[MediaKind, string[]]>) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return null;
}

function toKeywords(...values: Array<string | undefined>): string[] {
  const tokens = new Set<string>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    for (const token of value.toLowerCase().split(/[^a-z0-9]+/g)) {
      if (token.length >= 2) {
        tokens.add(token);
      }
    }
  }
  return Array.from(tokens).slice(0, 24);
}

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return Math.abs(hash >>> 0).toString(16);
}

function createMediaId(sourceId: string, relativePath: string, file: File): string {
  return `${sourceId}-${hashString(`${relativePath}|${file.size}|${file.lastModified}`)}`;
}

function getFileTitle(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

function getRelativeArtist(relativePath: string): string {
  const segments = relativePath.split('/');
  return segments.length > 1 ? segments[segments.length - 2] : 'Local Library';
}

function loadMediaMetadata(url: string, kind: 'audio' | 'video'): Promise<{ durationSeconds?: number; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (kind === 'video') {
      const element = document.createElement('video');
      element.preload = 'metadata';
      element.src = url;
      element.onloadedmetadata = () => {
        resolve({
          durationSeconds: Number.isFinite(element.duration) ? Math.round(element.duration * 100) / 100 : undefined,
          width: element.videoWidth,
          height: element.videoHeight,
        });
      };
      element.onerror = () => resolve({});
      return;
    }

    const element = document.createElement('audio');
    element.preload = 'metadata';
    element.src = url;
    element.onloadedmetadata = () => {
      const result = {
        durationSeconds: Number.isFinite(element.duration) ? Math.round(element.duration * 100) / 100 : undefined,
      };
      resolve(result);
    };
    element.onerror = () => resolve({});
  });
}

function loadImageMetadata(url: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({});
    image.src = url;
  });
}

function createIndexedMediaDocument(
  sourceId: string,
  sourceLabel: string,
  relativePath: string,
  file: File,
  type: MediaKind,
  mediaId: string,
  metadata: { durationSeconds?: number; width?: number; height?: number },
  tags: string[],
): BackendMediaDocument {
  const title = getFileTitle(file.name);
  return {
    id: mediaId,
    type,
    sourceId,
    sourceLabel,
    fileName: file.name,
    title,
    artist: type === 'audio' ? getRelativeArtist(relativePath) : undefined,
    mimeType: file.type || 'application/octet-stream',
    relativePath,
    size: file.size,
    modifiedAt: file.lastModified,
    durationSeconds: metadata.durationSeconds,
    width: metadata.width,
    height: metadata.height,
    keywords: toKeywords(file.name, relativePath, sourceLabel, title),
    tags,
  };
}

async function createMediaItemAndDocument(sourceId: string, sourceLabel: string, record: LocalFileRecord, origin: MediaOrigin): Promise<{ item: MediaItem; document: BackendMediaDocument }> {
  const mediaId = createMediaId(sourceId, record.relativePath, record.file);
  const objectUrl = URL.createObjectURL(record.file);

  try {
    if (record.type === 'audio') {
      const metadata = await loadMediaMetadata(objectUrl, 'audio');
      const item: AudioItem = {
        id: mediaId,
        title: getFileTitle(record.file.name),
        artist: getRelativeArtist(record.relativePath),
        url: objectUrl,
        mimeType: record.file.type,
        size: record.file.size,
        modifiedAt: record.file.lastModified,
        durationSeconds: metadata.durationSeconds,
        relativePath: record.relativePath,
        sourceId,
        sourceLabel,
        origin,
        keywords: toKeywords(record.file.name, record.relativePath, sourceLabel),
      };

      return {
        item,
        document: createIndexedMediaDocument(sourceId, sourceLabel, record.relativePath, record.file, record.type, mediaId, metadata, [origin, 'audio']),
      };
    }

    if (record.type === 'video') {
      const metadata = await loadMediaMetadata(objectUrl, 'video');
      const item: VideoItem = {
        id: mediaId,
        name: record.file.name,
        url: objectUrl,
        mimeType: record.file.type,
        size: record.file.size,
        modifiedAt: record.file.lastModified,
        durationSeconds: metadata.durationSeconds,
        width: metadata.width,
        height: metadata.height,
        relativePath: record.relativePath,
        sourceId,
        sourceLabel,
        origin,
        keywords: toKeywords(record.file.name, record.relativePath, sourceLabel),
      };

      return {
        item,
        document: createIndexedMediaDocument(sourceId, sourceLabel, record.relativePath, record.file, record.type, mediaId, metadata, [origin, 'video']),
      };
    }

    const metadata = await loadImageMetadata(objectUrl);
    const item: ImageItem = {
      id: mediaId,
      name: record.file.name,
      url: objectUrl,
      mimeType: record.file.type,
      size: record.file.size,
      modifiedAt: record.file.lastModified,
      width: metadata.width,
      height: metadata.height,
      relativePath: record.relativePath,
      sourceId,
      sourceLabel,
      origin,
      keywords: toKeywords(record.file.name, record.relativePath, sourceLabel),
    };

    return {
      item,
      document: createIndexedMediaDocument(sourceId, sourceLabel, record.relativePath, record.file, record.type, mediaId, metadata, [origin, 'image']),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function collectMediaFilesFromDirectory(handle: FileSystemDirectoryHandle, parentPath = ''): Promise<LocalFileRecord[]> {
  const collected: LocalFileRecord[] = [];
  const iterableHandle = handle as DirectoryHandleWithValues;

  for await (const entry of iterableHandle.values()) {
    const nextPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      collected.push(...await collectMediaFilesFromDirectory(entry as FileSystemDirectoryHandle, nextPath));
      continue;
    }

    const file = await (entry as FileSystemFileHandle).getFile();
    const type = inferMediaType(file);
    if (!type) {
      continue;
    }

    collected.push({
      file,
      type,
      relativePath: nextPath,
    });
  }

  return collected;
}

async function buildDirectorySnapshot(sourceId: string, sourceLabel: string, files: LocalFileRecord[], origin: MediaOrigin): Promise<DirectoryMediaSnapshot> {
  const artifacts = await Promise.all(files.map(record => createMediaItemAndDocument(sourceId, sourceLabel, record, origin)));

  const audios = artifacts
    .map(artifact => artifact.item)
    .filter((item): item is AudioItem => 'title' in item);
  const videos = artifacts
    .map(artifact => artifact.item)
    .filter((item): item is VideoItem => 'name' in item && !('title' in item) && item.mimeType?.startsWith('video/') === true);
  const images = artifacts
    .map(artifact => artifact.item)
    .filter((item): item is ImageItem => 'name' in item && item.mimeType?.startsWith('image/') === true);

  return {
    audios,
    videos,
    images,
    documents: artifacts.map(artifact => artifact.document),
    itemCount: artifacts.length,
  };
}

export function supportsDirectorySelection(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function promptForDirectorySource(options?: { sourceId?: string; startIn?: KnownDirectoryStart }): Promise<SavedDirectorySource> {
  if (!supportsDirectorySelection()) {
    throw new Error('This browser does not support directory sync.');
  }

  const handle = await (window as WindowWithDirectoryPicker).showDirectoryPicker?.({
    id: options?.sourceId,
    mode: 'read',
    startIn: options?.startIn,
  });
  if (!handle) {
    throw new Error('Directory picker is unavailable.');
  }
  return {
    id: options?.sourceId ?? `directory-${hashString(`${handle.name}-${Date.now()}`)}`,
    label: handle.name,
    handle,
  };
}

export async function saveDirectorySourceHandle(source: SavedDirectorySource): Promise<void> {
  await withObjectStore('readwrite', store => store.put(source));
}

export async function listSavedDirectorySources(): Promise<SavedDirectorySource[]> {
  const results = await withObjectStore('readonly', store => store.getAll());
  return Array.isArray(results) ? results as SavedDirectorySource[] : [];
}

export async function removeStoredDirectorySource(sourceId: string): Promise<void> {
  await withObjectStore('readwrite', store => store.delete(sourceId));
}

export async function hasDirectoryReadPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const permissionHandle = handle as DirectoryHandleWithValues;
  if (!permissionHandle.queryPermission) {
    return true;
  }

  const permission = await permissionHandle.queryPermission({ mode: 'read' });
  return permission === 'granted';
}

export async function scanDirectorySourceFiles(sourceId: string, sourceLabel: string, handle: FileSystemDirectoryHandle): Promise<DirectoryMediaSnapshot> {
  const files = await collectMediaFilesFromDirectory(handle);
  return buildDirectorySnapshot(sourceId, sourceLabel, files, 'local-sync');
}

export async function buildSelectedFilesSnapshot(sourceId: string, sourceLabel: string, files: File[]): Promise<DirectoryMediaSnapshot> {
  const records = files
    .map(file => {
      const type = inferMediaType(file);
      if (!type) {
        return null;
      }
      return {
        file,
        type,
        relativePath: file.webkitRelativePath || file.name,
      };
    })
    .filter((record): record is LocalFileRecord => Boolean(record));

  return buildDirectorySnapshot(sourceId, sourceLabel, records, 'manual-upload');
}

export function revokeObjectUrlsForMediaItems(items: Array<{ url: string }>): void {
  items.forEach(item => {
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }
  });
}
