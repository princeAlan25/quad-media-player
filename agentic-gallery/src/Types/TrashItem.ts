import type { AudioItem } from '../Interfaces/AudioItem';
import type { VideoItem } from '../Interfaces/VideoItem';
import type { ImageItem } from '../Interfaces/ImageItem';

export type TrashItemType = 'audio' | 'video' | 'image';

export type TrashPayload =
  | { type: 'audio'; item: AudioItem }
  | { type: 'video'; item: VideoItem }
  | { type: 'image'; item: ImageItem };

export type TrashEntry = TrashPayload & {
  trashId: string;
  removedAt: number;
};

