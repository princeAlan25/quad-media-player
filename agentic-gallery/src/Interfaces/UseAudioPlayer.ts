import type { AudioItem } from './AudioItem';
import type { RepeatMode } from '../Types/RepeatMode';

export interface UseAudioPlayerReturn {
  // State
  currentAudio: AudioItem | null;
  playlist: AudioItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  next: () => void;
  previous: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  loadAudio: (audio: AudioItem) => void;
  loadAudios: (audios: AudioItem[], startIndex?: number, autoPlay?: boolean) => void;
  addAudios: (audios: AudioItem[], autoPlay?: boolean) => void;
  removeAudio: (id: number) => void;
  setCurrentIndex: (index: number, autoPlay?: boolean) => void;
}

