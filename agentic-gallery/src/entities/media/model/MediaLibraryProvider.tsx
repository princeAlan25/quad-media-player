import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { ImageItem } from '@/shared/types/ImageItem';
import type { MediaLibraryContextValue } from '@/shared/types/MediaLibraryContext';
import AudiosMocks from '@/shared/assets/AudioStorage.json';
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

interface MediaLibraryProviderProps {
  children: ReactNode;
}

export function MediaLibraryProvider({ children }: MediaLibraryProviderProps) {
  const [audios, setAudios] = useState<AudioItem[]>(() => seededAudios);
  const [images, setImages] = useState<ImageItem[]>([]);

  const replaceAudios = useCallback((items: AudioItem[]) => {
    setAudios(normalizeAudioLibrary(items));
  }, []);

  const addAudios = useCallback((items: AudioItem[]) => {
    setAudios(prev => normalizeAudioLibrary(mergeUniqueItems(prev.filter(item => item.origin !== 'seed'), items)));
  }, []);

  const removeAudio = useCallback((id: string) => {
    setAudios(prev => normalizeAudioLibrary(prev.filter(audio => audio.id !== id)));
  }, []);

  const addImages = useCallback((items: ImageItem[]) => {
    setImages(prev => mergeUniqueItems(prev, items));
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  }, []);

  const value = useMemo<MediaLibraryContextValue>(() => ({
    audios,
    images,
    replaceAudios,
    addAudios,
    removeAudio,
    addImages,
    removeImage,
  }), [
    audios,
    images,
    replaceAudios,
    addAudios,
    removeAudio,
    addImages,
    removeImage,
  ]);

  return (
    <MediaLibraryContext.Provider value={value}>
      {children}
    </MediaLibraryContext.Provider>
  );
}
