import type { AudioItem } from './AudioItem';

export interface PlaylistPanelProps {
  audios: AudioItem[];
  currentAudioId?: number;
  isPlaying: boolean;
  onSelect: (audio: AudioItem) => void;
  onRemove: (audio: AudioItem) => void;
  onUpload: (audioItems: AudioItem[]) => void;
}

