import type { AudioItem } from './AudioItem';
import type { VideoItem } from './VideoItem';
import type { ImageItem } from './ImageItem';

export type TrashItemType = 'audio' | 'video' | 'image';

export type TrashPayload =
  | { type: 'audio'; item: AudioItem }
  | { type: 'video'; item: VideoItem }
  | { type: 'image'; item: ImageItem };

export type TrashEntry = TrashPayload & {
  trashId: string;
  removedAt: number;
};
