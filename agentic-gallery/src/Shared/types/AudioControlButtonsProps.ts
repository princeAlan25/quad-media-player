import type { RepeatMode } from './RepeatMode';

export interface AudioControlButtonsProps {
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRepeatToggle: () => void;
  onShuffleToggle: () => void;
}

