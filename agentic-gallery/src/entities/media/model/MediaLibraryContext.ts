import { createContext } from 'react';
import type { MediaLibraryContextValue } from '@/shared/types/MediaLibraryContext';

export const MediaLibraryContext = createContext<MediaLibraryContextValue | undefined>(undefined);
