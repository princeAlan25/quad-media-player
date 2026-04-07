import type { AudioItem } from './AudioItem';
import type { ImageItem } from './ImageItem';

export interface MediaLibraryContextValue {
  audios: AudioItem[];
  images: ImageItem[];
  replaceAudios: (items: AudioItem[]) => void;
  addAudios: (items: AudioItem[]) => void;
  removeAudio: (id: string) => void;
  addImages: (items: ImageItem[]) => void;
  removeImage: (id: string) => void;
}
