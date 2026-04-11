import { memo, useCallback, useEffect } from 'react';
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaCompress,
  FaBackward,
  FaForward
} from 'react-icons/fa6';
import { IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';
import type { VideoPlayerControlsProps } from '@/shared/types/VideoPlayerControlsProps';

export const VideoPlayerControls = memo(function VideoPlayerControls({
  isPlaying,
  isMuted,
  isFullscreen,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onSeek,
  onVolumeChange,
  onSkip,
}: VideoPlayerControlsProps) {
  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  }, [duration, onSeek]);

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onVolumeChange(Math.max(0, Math.min(1, percentage)));
  }, [onVolumeChange]);

  return (
    <div className="w-full bg-black/60 backdrop-blur-sm px-4 pb-3 pt-2 flex flex-col gap-2">
      {/* Progress Bar — sits right above the buttons */}
      <div
        className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSkip(-10)}
            className="text-white/80 hover:text-white transition-colors p-2"
            title="Rewind 10s"
          >
            <FaBackward />
          </button>

          <button
            onClick={onPlayPause}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
          </button>

          <button
            onClick={() => onSkip(10)}
            className="text-white/80 hover:text-white transition-colors p-2"
            title="Forward 10s"
          >
            <FaForward />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={onMuteToggle}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <IoVolumeMute /> : <IoVolumeHigh />}
            </button>
            <div
              className="w-20 h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
              onClick={handleVolumeClick}
            >
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
          </div>

          {/* Time */}
          <span className="text-white/80 text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right Controls */}
        <button
          onClick={onFullscreenToggle}
          className="text-white/80 hover:text-white transition-colors p-2"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
  );
});

