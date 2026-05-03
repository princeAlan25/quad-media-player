import { useCallback, memo, useMemo } from 'react';
import type { AudioProgressBarProps } from '@/shared/types/AudioProgressBarProps';

const formatTime = (time: number): string => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioProgressBar = memo(function AudioProgressBar({ currentTime, duration, onSeek }: AudioProgressBarProps) {
  const progress = useMemo(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  }, [duration, onSeek]);

  return (
    <div className="w-full flex flex-col gap-1">
      <div 
        className="neo-progress-track w-full h-2 rounded-full cursor-pointer relative overflow-visible group"
        onClick={handleClick}
      >
        <div 
          className="neo-progress-fill h-full rounded-full transition-all duration-100 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="neo-progress-knob absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-opacity" />
        </div>
      </div>
      <div className="neo-time-row flex justify-between text-xs font-medium">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
});

