import { memo, useCallback } from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaForwardStep, 
  FaBackwardStep, 
  FaRepeat
} from 'react-icons/fa6';
import { MdRepeatOne, MdShuffle } from 'react-icons/md';
import type { RepeatMode } from '../../Hooks/useAudioPlayer';

interface AudioControlButtonsProps {
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRepeatToggle: () => void;
  onShuffleToggle: () => void;
}

export const AudioControlButtons: React.FC<AudioControlButtonsProps> = memo(({
  isPlaying,
  repeatMode,
  shuffle,
  onPlayPause,
  onNext,
  onPrevious,
  onRepeatToggle,
  onShuffleToggle,
}) => {
  const getRepeatIcon = useCallback(() => {
    if (repeatMode === 'one') {
      return <MdRepeatOne className="text-green-400" />;
    }
    return <FaRepeat className={repeatMode !== 'none' ? "text-green-400" : "text-white"} />;
  }, [repeatMode]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Repeat & Shuffle Row */}
      <div className="flex justify-center gap-8 w-full">
        <button
          onClick={onRepeatToggle}
          className="p-3 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-90"
          title={`Repeat: ${repeatMode}`}
        >
          {getRepeatIcon()}
        </button>
        <button
          onClick={onShuffleToggle}
          className={`p-3 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-90 ${shuffle ? 'text-green-400' : 'text-white'}`}
          title={shuffle ? 'Shuffle On' : 'Shuffle Off'}
        >
          <MdShuffle />
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex justify-center items-center gap-6">
        <button
          onClick={onPrevious}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-90 text-white shadow-lg"
          title="Previous"
        >
          <FaBackwardStep className="text-xl" />
        </button>
        
        <button
          onClick={onPlayPause}
          className="p-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 transition-all duration-200 active:scale-95 text-white shadow-lg shadow-green-500/30"
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
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-90 text-white shadow-lg"
          title="Next"
        >
          <FaForwardStep className="text-xl" />
        </button>
      </div>
    </div>
  );
});

AudioControlButtons.displayName = 'AudioControlButtons';

