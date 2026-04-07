import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { VideoItem } from '@/shared/types/VideoItem';
import type { ImageItem } from '@/shared/types/ImageItem';
import type { MediaLibraryContextValue } from '@/shared/types/MediaLibraryContext';
import type { MediaFocusRequest, MediaKind, MediaSource, MediaSyncState } from '@/shared/types/LibraryMedia';
import AudiosMocks from '@/shared/assets/AudioStorage.json';
import { deleteMediaSource, syncMediaSource } from '@/shared/api/backendApi';
import {
  COMMON_DIRECTORY_SOURCES,
  hasDirectoryReadPermission,
  listSavedDirectorySources,
  promptForDirectorySource,
  removeStoredDirectorySource,
  revokeObjectUrlsForMediaItems,
  saveDirectorySourceHandle,
  scanDirectorySourceFiles,
  supportsDirectorySelection,
} from '@/shared/lib/mediaSync';
import { MediaLibraryContext } from './MediaLibraryContext';

const createSeedAudios = (): AudioItem[] =>
  (AudiosMocks as Array<{ id: number; title: string; artist: string; url: string }>).map((audio) => ({
    ...audio,
    id: `seed-${audio.id}`,
    sourceId: 'seed-library',
    sourceLabel: 'Starter Library',
    relativePath: audio.title,
    mimeType: 'audio/mpeg',
    keywords: [audio.title.toLowerCase(), audio.artist.toLowerCase()],
    origin: 'seed',
  }));

const seededAudios = createSeedAudios();

const baseSyncState: MediaSyncState = {
  phase: 'idle',
  message: 'Choose folders to build your local index.',
  syncedItems: 0,
  syncedSources: 0,
};

function normalizeAudioLibrary(items: AudioItem[]): AudioItem[] {
  const uploadedAudios = items.filter(item => item.origin !== 'seed');
  return uploadedAudios.length > 0 ? uploadedAudios : seededAudios;
}

function mergeUniqueItems<T extends { id: string }>(existingItems: T[], incomingItems: T[]): T[] {
  const mergedItems = [...existingItems];
  const itemIndexes = new Map(existingItems.map((item, index) => [item.id, index]));

  for (const item of incomingItems) {
    const existingIndex = itemIndexes.get(item.id);
    if (existingIndex === undefined) {
      itemIndexes.set(item.id, mergedItems.length);
      mergedItems.push(item);
      continue;
    }

    mergedItems[existingIndex] = item;
  }

  return mergedItems;
}

function upsertSource(sources: MediaSource[], nextSource: MediaSource): MediaSource[] {
  const filtered = sources.filter(source => source.id !== nextSource.id);
  return [...filtered, nextSource].sort((left, right) => left.label.localeCompare(right.label));
}

function isPickerAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError')
  );
}

interface MediaLibraryProviderProps {
  children: ReactNode;
}

export function MediaLibraryProvider({ children }: MediaLibraryProviderProps) {
  const [audios, setAudios] = useState<AudioItem[]>(() => seededAudios);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [syncedSources, setSyncedSources] = useState<MediaSource[]>([]);
  const [syncState, setSyncState] = useState<MediaSyncState>(baseSyncState);
  const [focusRequest, setFocusRequest] = useState<MediaFocusRequest | null>(null);

  const audioRef = useRef(audios);
  const videoRef = useRef(videos);
  const imageRef = useRef(images);
  const sourcesRef = useRef(syncedSources);

  useEffect(() => {
    audioRef.current = audios;
  }, [audios]);

  useEffect(() => {
    videoRef.current = videos;
  }, [videos]);

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    sourcesRef.current = syncedSources;
  }, [syncedSources]);

  const canSelectDirectories = supportsDirectorySelection();

  const replaceAudios = useCallback((items: AudioItem[]) => {
    setAudios(normalizeAudioLibrary(items));
  }, []);

  const addAudios = useCallback((items: AudioItem[]) => {
    setAudios(prev => normalizeAudioLibrary(mergeUniqueItems(prev.filter(item => item.origin !== 'seed'), items)));
  }, []);

  const removeAudio = useCallback((id: string) => {
    setAudios(prev => normalizeAudioLibrary(prev.filter(audio => audio.id !== id)));
  }, []);

  const addVideos = useCallback((items: VideoItem[]) => {
    setVideos(prev => mergeUniqueItems(prev, items));
  }, []);

  const removeVideo = useCallback((id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
  }, []);

  const addImages = useCallback((items: ImageItem[]) => {
    setImages(prev => mergeUniqueItems(prev, items));
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  }, []);

  const requestMediaFocus = useCallback((type: MediaKind, id: string, autoplay = true) => {
    setFocusRequest({
      type,
      id,
      autoplay,
      nonce: Date.now(),
    });
  }, []);

  const replaceSourceItemsWithSnapshot = useCallback((sourceId: string, snapshot: Awaited<ReturnType<typeof scanDirectorySourceFiles>>) => {
    const removedAudios = audioRef.current.filter(item => item.sourceId === sourceId && item.origin === 'local-sync');
    const removedVideos = videoRef.current.filter(item => item.sourceId === sourceId && item.origin === 'local-sync');
    const removedImages = imageRef.current.filter(item => item.sourceId === sourceId && item.origin === 'local-sync');

    revokeObjectUrlsForMediaItems(removedAudios);
    revokeObjectUrlsForMediaItems(removedVideos);
    revokeObjectUrlsForMediaItems(removedImages);

    setAudios(prev => normalizeAudioLibrary([
      ...prev.filter(item => item.sourceId !== sourceId && item.origin !== 'seed'),
      ...snapshot.audios,
    ]));
    setVideos(prev => [
      ...prev.filter(item => item.sourceId !== sourceId),
      ...snapshot.videos,
    ]);
    setImages(prev => [
      ...prev.filter(item => item.sourceId !== sourceId),
      ...snapshot.images,
    ]);
  }, []);

  const scanAndSyncDirectorySource = useCallback(async (
    source: { id: string; label: string; handle: FileSystemDirectoryHandle },
    options?: { background?: boolean },
  ) => {
    setSyncedSources(prev => upsertSource(prev, {
      id: source.id,
      label: source.label,
      mode: 'directory',
      status: 'syncing',
      itemCount: prev.find(item => item.id === source.id)?.itemCount ?? 0,
      error: undefined,
      lastSyncedAt: prev.find(item => item.id === source.id)?.lastSyncedAt,
    }));

    if (!options?.background) {
      setSyncState(prev => ({
        ...prev,
        phase: 'syncing',
        message: `Scanning ${source.label}...`,
      }));
    }

    const snapshot = await scanDirectorySourceFiles(source.id, source.label, source.handle);
    replaceSourceItemsWithSnapshot(source.id, snapshot);

    try {
      await syncMediaSource({ id: source.id, label: source.label, mode: 'directory' }, snapshot.documents);
      const timestamp = Date.now();

      setSyncedSources(prev => upsertSource(prev, {
        id: source.id,
        label: source.label,
        mode: 'directory',
        status: 'ready',
        itemCount: snapshot.itemCount,
        lastSyncedAt: timestamp,
      }));

      const sourceCount = sourcesRef.current.some(item => item.id === source.id)
        ? sourcesRef.current.filter(item => item.mode === 'directory').length
        : sourcesRef.current.filter(item => item.mode === 'directory').length + 1;

      setSyncState({
        phase: 'ready',
        message: `Indexed ${snapshot.itemCount} media files from ${source.label}.`,
        syncedItems: snapshot.itemCount,
        syncedSources: sourceCount,
        lastSyncedAt: timestamp,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend indexing failed.';
      setSyncedSources(prev => upsertSource(prev, {
        id: source.id,
        label: source.label,
        mode: 'directory',
        status: 'error',
        itemCount: snapshot.itemCount,
        error: message,
      }));

      setSyncState({
        phase: 'error',
        message: `${source.label} was scanned locally, but the backend index update failed.`,
        syncedItems: snapshot.itemCount,
        syncedSources: sourcesRef.current.filter(item => item.mode === 'directory').length,
        lastSyncedAt: Date.now(),
      });
    }

    return snapshot;
  }, [replaceSourceItemsWithSnapshot]);

  const connectCustomDirectorySource = useCallback(async () => {
    try {
      const source = await promptForDirectorySource();
      await saveDirectorySourceHandle(source);
      await scanAndSyncDirectorySource(source);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect the selected directory.';
      setSyncState({
        phase: 'error',
        message,
        syncedItems: 0,
        syncedSources: sourcesRef.current.filter(source => source.mode === 'directory').length,
        lastSyncedAt: Date.now(),
      });
      throw error;
    }
  }, [scanAndSyncDirectorySource]);

  const connectSuggestedDirectorySources = useCallback(async () => {
    try {
      if (!canSelectDirectories) {
        setSyncState({
          phase: 'error',
          message: 'Directory sync requires a Chromium browser with File System Access support.',
          syncedItems: 0,
          syncedSources: 0,
          lastSyncedAt: Date.now(),
        });
        return;
      }

      const storedSources = await listSavedDirectorySources();
      const knownSources = [...storedSources];
      const connectedSourceIds = new Set(storedSources.map(source => source.id));
      let connectedFolders = 0;
      let skippedFolders = 0;
      let indexedItems = 0;

      setSyncState({
        phase: 'syncing',
        message: 'Grant access to Desktop, Documents, Downloads, Music, Pictures, and Videos.',
        syncedItems: 0,
        syncedSources: connectedSourceIds.size,
        lastSyncedAt: Date.now(),
      });

      for (const target of COMMON_DIRECTORY_SOURCES) {
        try {
          const matchingSource = knownSources.find(source =>
            source.id === target.id || source.label.toLowerCase() === target.label.toLowerCase(),
          );
          const source = await promptForDirectorySource({
            sourceId: matchingSource?.id ?? target.id,
            startIn: target.startIn,
          });
          await saveDirectorySourceHandle(source);
          const snapshot = await scanAndSyncDirectorySource(source, { background: true });
          const existingSourceIndex = knownSources.findIndex(entry => entry.id === source.id);
          if (existingSourceIndex >= 0) {
            knownSources[existingSourceIndex] = source;
          } else {
            knownSources.push(source);
          }
          connectedSourceIds.add(source.id);
          connectedFolders += 1;
          indexedItems += snapshot.itemCount;
        } catch (error) {
          if (isPickerAbortError(error)) {
            skippedFolders += 1;
            continue;
          }
          throw error;
        }
      }

      if (connectedFolders === 0) {
        setSyncState({
          phase: 'idle',
          message: skippedFolders > 0
            ? 'No common folders were added. You can still add any folder manually.'
            : 'No folders were added.',
          syncedItems: 0,
          syncedSources: connectedSourceIds.size,
          lastSyncedAt: Date.now(),
        });
        return;
      }

      const skippedMessage = skippedFolders > 0
        ? ` Skipped ${skippedFolders} cancelled prompt${skippedFolders === 1 ? '' : 's'}.`
        : '';

      setSyncState({
        phase: 'ready',
        message: `Connected ${connectedFolders} common folder${connectedFolders === 1 ? '' : 's'} and indexed ${indexedItems} item${indexedItems === 1 ? '' : 's'}.${skippedMessage}`,
        syncedItems: indexedItems,
        syncedSources: connectedSourceIds.size,
        lastSyncedAt: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect the common folders.';
      setSyncState({
        phase: 'error',
        message,
        syncedItems: 0,
        syncedSources: sourcesRef.current.filter(source => source.mode === 'directory').length,
        lastSyncedAt: Date.now(),
      });
      throw error;
    }
  }, [canSelectDirectories, scanAndSyncDirectorySource]);

  const rescanDirectorySources = useCallback(async () => {
    try {
      if (!canSelectDirectories) {
        setSyncState({
          phase: 'error',
          message: 'Directory sync requires a Chromium browser with File System Access support.',
          syncedItems: 0,
          syncedSources: 0,
        });
        return;
      }

      const storedSources = await listSavedDirectorySources();
      if (storedSources.length === 0) {
        setSyncState({
          phase: 'idle',
          message: 'No saved folders yet. Connect one or more folders first.',
          syncedItems: 0,
          syncedSources: 0,
        });
        return;
      }

      setSyncState({
        phase: 'syncing',
        message: 'Refreshing saved media folders...',
        syncedItems: 0,
        syncedSources: storedSources.length,
      });

      for (const source of storedSources) {
        const hasPermission = await hasDirectoryReadPermission(source.handle);

        if (!hasPermission) {
          setSyncedSources(prev => upsertSource(prev, {
            id: source.id,
            label: source.label,
            mode: 'directory',
            status: 'permission-needed',
            itemCount: prev.find(item => item.id === source.id)?.itemCount ?? 0,
            error: 'Grant folder access again to rescan this directory.',
            lastSyncedAt: prev.find(item => item.id === source.id)?.lastSyncedAt,
          }));
          continue;
        }

        await scanAndSyncDirectorySource(source, { background: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh saved media folders.';
      setSyncState({
        phase: 'error',
        message,
        syncedItems: 0,
        syncedSources: sourcesRef.current.filter(source => source.mode === 'directory').length,
        lastSyncedAt: Date.now(),
      });
      throw error;
    }
  }, [canSelectDirectories, scanAndSyncDirectorySource]);

  const removeMediaSource = useCallback(async (sourceId: string) => {
    const removedAudios = audioRef.current.filter(item => item.sourceId === sourceId);
    const removedVideos = videoRef.current.filter(item => item.sourceId === sourceId);
    const removedImages = imageRef.current.filter(item => item.sourceId === sourceId);

    revokeObjectUrlsForMediaItems(removedAudios);
    revokeObjectUrlsForMediaItems(removedVideos);
    revokeObjectUrlsForMediaItems(removedImages);

    setAudios(prev => normalizeAudioLibrary(prev.filter(item => item.sourceId !== sourceId)));
    setVideos(prev => prev.filter(item => item.sourceId !== sourceId));
    setImages(prev => prev.filter(item => item.sourceId !== sourceId));
    setSyncedSources(prev => prev.filter(source => source.id !== sourceId));
    setSyncState({
      phase: 'ready',
      message: 'Removed the selected source from the local library.',
      syncedItems: 0,
      syncedSources: Math.max(0, sourcesRef.current.filter(source => source.mode === 'directory').length - 1),
      lastSyncedAt: Date.now(),
    });

    try {
      await removeStoredDirectorySource(sourceId);
    } catch {
      // Local source may already be gone.
    }

    try {
      await deleteMediaSource(sourceId);
    } catch {
      // Local removal already succeeded; leave backend cleanup as best effort.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!canSelectDirectories) {
        setSyncState({
          phase: 'idle',
          message: 'Directory sync is available in Chromium browsers. Local upload still works.',
          syncedItems: 0,
          syncedSources: 0,
        });
        return;
      }

      const storedSources = await listSavedDirectorySources();
      if (cancelled || storedSources.length === 0) {
        return;
      }

      setSyncedSources(storedSources.map(source => ({
        id: source.id,
        label: source.label,
        mode: 'directory',
        status: 'permission-needed',
        itemCount: 0,
      })));

      for (const source of storedSources) {
        if (cancelled) {
          return;
        }

        const granted = await hasDirectoryReadPermission(source.handle);
        if (!granted) {
          continue;
        }

        await scanAndSyncDirectorySource(source, { background: true });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [canSelectDirectories, scanAndSyncDirectorySource]);

  const value = useMemo<MediaLibraryContextValue>(() => ({
    audios,
    videos,
    images,
    syncedSources,
    syncState,
    focusRequest,
    supportsDirectorySync: canSelectDirectories,
    replaceAudios,
    addAudios,
    removeAudio,
    addVideos,
    removeVideo,
    addImages,
    removeImage,
    connectCustomDirectorySource,
    connectSuggestedDirectorySources,
    rescanDirectorySources,
    removeMediaSource,
    requestMediaFocus,
  }), [
    audios,
    videos,
    images,
    syncedSources,
    syncState,
    focusRequest,
    canSelectDirectories,
    replaceAudios,
    addAudios,
    removeAudio,
    addVideos,
    removeVideo,
    addImages,
    removeImage,
    connectCustomDirectorySource,
    connectSuggestedDirectorySources,
    rescanDirectorySources,
    removeMediaSource,
    requestMediaFocus,
  ]);

  return (
    <MediaLibraryContext.Provider value={value}>
      {children}
    </MediaLibraryContext.Provider>
  );
}
