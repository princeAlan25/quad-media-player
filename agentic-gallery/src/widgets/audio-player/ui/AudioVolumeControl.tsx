import { useCallback, memo } from 'react';
import { FaVolumeUp, FaVolumeMute, FaVolumeDown } from 'react-icons/fa';
import type { AudioVolumeControlProps } from '@/shared/types/AudioVolumeControlProps';

export const AudioVolumeControl = memo(function AudioVolumeControl({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  onMuteToggle 
}: AudioVolumeControlProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onVolumeChange(percentage);
  }, [onVolumeChange]);

  const VolumeIcon = useCallback(() => {
    if (isMuted || volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  }, [isMuted, volume]);

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onMuteToggle}
        className="neo-volume-button transition-all duration-200 p-2 rounded-full"
      >
        <VolumeIcon />
      </button>
      <div 
        className="neo-progress-track neo-volume-track w-20 h-2 rounded-full cursor-pointer relative overflow-hidden"
        onClick={handleClick}
      >
        <div 
          className="neo-progress-fill h-full rounded-full transition-all duration-100"
          style={{ width: isMuted ? '0%' : `${volume * 100}%` }}
        />
      </div>
    </div>
  );
});

