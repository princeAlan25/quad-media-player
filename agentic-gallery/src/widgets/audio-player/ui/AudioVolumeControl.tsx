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
        className="text-white/80 hover:text-white transition-colors p-1"
      >
        <VolumeIcon />
      </button>
      <div 
        className="w-20 h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
        onClick={handleClick}
      >
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-100"
          style={{ width: isMuted ? '0%' : `${volume * 100}%` }}
        />
      </div>
    </div>
  );
});

