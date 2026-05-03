import { memo, useCallback } from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaForwardStep, 
  FaBackwardStep, 
  FaRepeat
} from 'react-icons/fa6';
import { MdRepeatOne, MdShuffle } from 'react-icons/md';
import type { AudioControlButtonsProps } from '@/shared/types/AudioControlButtonsProps';

export const AudioControlButtons = memo(function AudioControlButtons({
  isPlaying,
  repeatMode,
  shuffle,
  onPlayPause,
  onNext,
  onPrevious,
  onRepeatToggle,
  onShuffleToggle,
}: AudioControlButtonsProps) {
  const getRepeatIcon = useCallback(() => {
    if (repeatMode === 'one') {
      return <MdRepeatOne />;
    }
    return <FaRepeat />;
  }, [repeatMode]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-sm:gap-0">
      {/* Repeat & Shuffle Row */}
      <div className="flex justify-center gap-8 w-full">
        <button
          onClick={onRepeatToggle}
          className={`neo-mode-button p-3 rounded-full transition-all duration-200 active:scale-90 ${repeatMode !== 'none' ? 'is-active' : ''}`}
          title={`Repeat: ${repeatMode}`}
        >
          {getRepeatIcon()}
        </button>
        <button
          onClick={onShuffleToggle}
          className={`neo-mode-button p-3 rounded-full transition-all duration-200 active:scale-90 ${shuffle ? 'is-active' : ''}`}
          title={shuffle ? 'Shuffle On' : 'Shuffle Off'}
        >
          <MdShuffle />
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex justify-center items-center gap-6 max-sm:*:scale-80">
        <button
          onClick={onPrevious}
          className="neo-round-control p-4 rounded-full transition-all duration-200 active:scale-90"
          title="Previous"
        >
          <FaBackwardStep className="text-xl" />
        </button>
        
        <button
          onClick={onPlayPause}
          className="neo-main-control p-5 rounded-full transition-all duration-200 active:scale-95"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <FaPause className="text-2xl" />
          ) : (
            <FaPlay className="text-2xl ml-1" />
          )}
        </button>
        
        <button
          onClick={onNext}
          className="neo-round-control p-4 rounded-full transition-all duration-200 active:scale-90"
          title="Next"
        >
          <FaForwardStep className="text-xl" />
        </button>
      </div>
    </div>
  );
});

