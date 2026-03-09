import type { AudioItem } from './AudioItem';
import type { VideoItem } from './VideoItem';
import type { ImageItem } from './ImageItem';
import type { TrashEntry, TrashItemType, TrashPayload } from '../Types/TrashItem';

export interface MediaLibraryContextValue {
  audios: AudioItem[];
  videos: VideoItem[];
  images: ImageItem[];
  trash: TrashEntry[];
  replaceAudios: (items: AudioItem[]) => void;
  addAudios: (items: AudioItem[]) => void;
  removeAudio: (id: number) => void;
  addVideos: (items: VideoItem[]) => void;
  removeVideo: (id: string) => void;
  addImages: (items: ImageItem[]) => void;
  removeImage: (id: string) => void;
  restoreItem: (trashId: string) => void;
  deleteFromTrash: (trashId: string) => void;
  clearTrash: (type?: TrashItemType) => void;
}

export type { TrashPayload };

