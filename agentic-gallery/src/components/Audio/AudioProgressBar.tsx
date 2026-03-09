import { useCallback, memo, useMemo } from 'react';
import type { AudioProgressBarProps } from '../../Interfaces/AudioProgressBarProps';

const formatTime = (time: number): string => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioProgressBar: React.FC<AudioProgressBarProps> = memo(({ currentTime, duration, onSeek }) => {
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
        className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden group"
        onClick={handleClick}
      >
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-100 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-white/70 font-medium">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
});

AudioProgressBar.displayName = 'AudioProgressBar';

