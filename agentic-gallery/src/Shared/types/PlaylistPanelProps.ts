import type { AudioItem } from './AudioItem';

export interface PlaylistPanelProps {
  audios: AudioItem[];
  currentAudioId?: string;
  isPlaying: boolean;
  onSelect: (audio: AudioItem) => void;
  onRemove: (audio: AudioItem) => void;
  onUpload: (files: File[]) => void;
}

