import { memo } from 'react';
import type { PlaybackSectionProps } from '@/shared/types/PlaybackSectionProps';
import { AudioProgressBar } from './AudioProgressBar';
import { AudioVolumeControl } from './AudioVolumeControl';
import { AudioControlButtons } from './AudioControlButtons';

export const PlaybackSection = memo(function PlaybackSection({
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
}: PlaybackSectionProps) {
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
