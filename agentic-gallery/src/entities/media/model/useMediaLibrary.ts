import { useContext } from 'react';
import type { MediaLibraryContextValue } from '@/shared/types/MediaLibraryContext';
import { MediaLibraryContext } from './MediaLibraryContext';

export const useMediaLibrary = (): MediaLibraryContextValue => {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
  }
  return context;
};
