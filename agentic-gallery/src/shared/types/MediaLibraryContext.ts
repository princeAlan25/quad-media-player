import type { AudioItem } from './AudioItem';
import type { ImageItem } from './ImageItem';
import type { VideoItem } from './VideoItem';

export interface MediaLibraryContextValue {
  audios: AudioItem[];
  videos: VideoItem[];
  images: ImageItem[];
  replaceAudios: (items: AudioItem[]) => void;
  addAudios: (items: AudioItem[]) => void;
  removeAudio: (id: string) => void;
  addVideos: (items: VideoItem[]) => void;
  removeVideo: (id: string) => void;
  addImages: (items: ImageItem[]) => void;
  removeImage: (id: string) => void;
}
