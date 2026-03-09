import { memo } from 'react';
import type { RepeatMode } from '../../Hooks/useAudioPlayer';
import { AudioProgressBar } from './AudioProgressBar';
import { AudioVolumeControl } from './AudioVolumeControl';
import { AudioControlButtons } from './AudioControlButtons';

interface PlaybackSectionProps {
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRepeatToggle: () => void;
  onShuffleToggle: () => void;
}

export const PlaybackSection: React.FC<PlaybackSectionProps> = memo(({
  currentTime,
  duration,
  volume,
  isMuted,
  isPlaying,
  repeatMode,
  shuffle,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlayPause,
  onNext,
  onPrevious,
  onRepeatToggle,
  onShuffleToggle,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      <AudioProgressBar currentTime={currentTime} duration={duration} onSeek={onSeek} />

      <div className="flex justify-center">
        <AudioVolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={onVolumeChange}
          onMuteToggle={onMuteToggle}
        />
      </div>

      <div className="flex items-start justify-center">
        <AudioControlButtons
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          shuffle={shuffle}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrevious={onPrevious}
          onRepeatToggle={onRepeatToggle}
          onShuffleToggle={onShuffleToggle}
        />
      </div>
    </div>
  );
});

PlaybackSection.displayName = 'PlaybackSection';
