import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AudioItem } from '../Interfaces/AudioItem';
import type { VideoItem } from '../Interfaces/VideoItem';
import type { ImageItem } from '../Interfaces/ImageItem';
import type { TrashEntry, TrashItemType, TrashPayload } from '../Types/TrashItem';
import type { MediaLibraryContextValue } from '../Interfaces/MediaLibraryContext';
import AudiosMocks from '../DataSource/AudioStorage.json';

const MediaLibraryContext = createContext<MediaLibraryContextValue | undefined>(undefined);

const generateTrashId = (type: TrashItemType) => `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isBlobUrl = (url: string) => url.startsWith('blob:');

const itemKey = (payload: TrashPayload) => `${payload.type}-${(payload.item as AudioItem | VideoItem | ImageItem).id}`;

export const MediaLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audios, setAudios] = useState<AudioItem[]>(() => AudiosMocks as AudioItem[]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [trash, setTrash] = useState<TrashEntry[]>([]);

  const pushToTrash = useCallback((payload: TrashPayload) => {
    const key = itemKey(payload);
    const trashEntry: TrashEntry = {
      ...payload,
      trashId: generateTrashId(payload.type),
      removedAt: Date.now(),
    };
    setTrash(prev => {
      const exists = prev.some(entry => `${entry.type}-${(entry.item as AudioItem | VideoItem | ImageItem).id}` === key);
      if (exists) return prev;
      return [trashEntry, ...prev];
    });
  }, []);

  const replaceAudios = useCallback((items: AudioItem[]) => {
    setAudios(items);
  }, []);

  const addAudios = useCallback((items: AudioItem[]) => {
    setAudios(prev => [...prev, ...items]);
  }, []);

  const removeAudio = useCallback((id: number) => {
    setAudios(prev => {
      const audio = prev.find(a => a.id === id);
      if (!audio) return prev;
      pushToTrash({ type: 'audio', item: audio });
      return prev.filter(a => a.id !== id);
    });
  }, [pushToTrash]);

  const addVideos = useCallback((items: VideoItem[]) => {
    setVideos(prev => [...prev, ...items]);
  }, []);

  const removeVideo = useCallback((id: string) => {
    setVideos(prev => {
      const video = prev.find(v => v.id === id);
      if (!video) return prev;
      pushToTrash({ type: 'video', item: video });
      return prev.filter(v => v.id !== id);
    });
  }, [pushToTrash]);

  const addImages = useCallback((items: ImageItem[]) => {
    setImages(prev => [...prev, ...items]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (!image) return prev;
      pushToTrash({ type: 'image', item: image });
      return prev.filter(img => img.id !== id);
    });
  }, [pushToTrash]);

  const restoreItem = useCallback((trashId: string) => {
    setTrash(prev => {
      const entryIndex = prev.findIndex(t => t.trashId === trashId);
      if (entryIndex === -1) return prev;

      const entry = prev[entryIndex];

      if (entry.type === 'audio') {
        const restored = entry.item as AudioItem;
        setAudios(current => {
          const withoutDuplicate = current.filter(a => a.id !== restored.id);
          return [...withoutDuplicate, restored];
        });
      } else if (entry.type === 'video') {
        const restored = entry.item as VideoItem;
        setVideos(current => {
          const withoutDuplicate = current.filter(v => v.id !== restored.id);
          return [...withoutDuplicate, restored];
        });
      } else if (entry.type === 'image') {
        const restored = entry.item as ImageItem;
        setImages(current => {
          const withoutDuplicate = current.filter(img => img.id !== restored.id);
          return [...withoutDuplicate, restored];
        });
      }

      const next = [...prev];
      next.splice(entryIndex, 1);
      return next;
    });
  }, []);

  const deleteFromTrash = useCallback((trashId: string) => {
    setTrash(prev => {
      const entry = prev.find(t => t.trashId === trashId);
      if (entry && 'url' in entry.item && typeof entry.item.url === 'string' && isBlobUrl(entry.item.url)) {
        URL.revokeObjectURL(entry.item.url);
      }
      return prev.filter(t => t.trashId !== trashId);
    });
  }, []);

  const clearTrash = useCallback((type?: TrashItemType) => {
    setTrash(prev => {
      const toDelete = type ? prev.filter(t => t.type === type) : prev;
      toDelete.forEach(entry => {
        if ('url' in entry.item && typeof entry.item.url === 'string' && isBlobUrl(entry.item.url)) {
          URL.revokeObjectURL(entry.item.url);
        }
      });
      return type ? prev.filter(t => t.type !== type) : [];
    });
  }, []);

  const value = useMemo<MediaLibraryContextValue>(() => ({
    audios,
    videos,
    images,
    trash,
    replaceAudios,
    addAudios,
    removeAudio,
    addVideos,
    removeVideo,
    addImages,
    removeImage,
    restoreItem,
    deleteFromTrash,
    clearTrash,
  }), [
    audios,
    videos,
    images,
    trash,
    replaceAudios,
    addAudios,
    removeAudio,
    addVideos,
    removeVideo,
    addImages,
    removeImage,
    restoreItem,
    deleteFromTrash,
    clearTrash,
  ]);

  return (
    <MediaLibraryContext.Provider value={value}>
      {children}
    </MediaLibraryContext.Provider>
  );
};

export const useMediaLibrary = (): MediaLibraryContextValue => {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
  }
  return context;
};
