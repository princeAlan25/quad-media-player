import type { AudioItem } from './AudioItem';
import type { VideoItem } from './VideoItem';
import type { ImageItem } from './ImageItem';
import type { MediaFocusRequest, MediaKind, MediaSource, MediaSyncState } from './LibraryMedia';

export interface MediaLibraryContextValue {
  audios: AudioItem[];
  videos: VideoItem[];
  images: ImageItem[];
  syncedSources: MediaSource[];
  syncState: MediaSyncState;
  focusRequest: MediaFocusRequest | null;
  supportsDirectorySync: boolean;
  replaceAudios: (items: AudioItem[]) => void;
  addAudios: (items: AudioItem[]) => void;
  removeAudio: (id: string) => void;
  addVideos: (items: VideoItem[]) => void;
  removeVideo: (id: string) => void;
  addImages: (items: ImageItem[]) => void;
  removeImage: (id: string) => void;
  connectCustomDirectorySource: () => Promise<void>;
  connectSuggestedDirectorySources: () => Promise<void>;
  rescanDirectorySources: () => Promise<void>;
  removeMediaSource: (sourceId: string) => Promise<void>;
  requestMediaFocus: (type: MediaKind, id: string, autoplay?: boolean) => void;
}
