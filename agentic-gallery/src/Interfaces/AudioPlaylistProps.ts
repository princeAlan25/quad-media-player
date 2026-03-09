import type { AudioItem } from './AudioItem';

export interface AudioPlaylistProps {
  audios: AudioItem[];
  currentAudioId?: number;
  isPlaying: boolean;
  onSelect: (audio: AudioItem) => void;
  onRemove: (audio: AudioItem) => void;
}

