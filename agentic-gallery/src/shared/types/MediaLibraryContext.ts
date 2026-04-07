import type { AudioItem } from './AudioItem';

export interface MediaLibraryContextValue {
  audios: AudioItem[];
  replaceAudios: (items: AudioItem[]) => void;
  addAudios: (items: AudioItem[]) => void;
  removeAudio: (id: string) => void;
}
