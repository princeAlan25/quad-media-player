import { memo, useCallback } from 'react';
import { FaPause, FaTrash, FaMusic } from 'react-icons/fa';
import type { AudioItem } from '../../Interfaces/AudioItem';

interface AudioPlaylistProps {
  audios: AudioItem[];
  currentAudioId?: number;
  isPlaying: boolean;
  onSelect: (audio: AudioItem) => void;
  onRemove: (audio: AudioItem) => void;
}

export const AudioPlaylist: React.FC<AudioPlaylistProps> = memo(({
  audios,
  currentAudioId,
  isPlaying,
  onSelect,
  onRemove,
}) => {
  const handleSelect = useCallback((audio: AudioItem) => {
    onSelect(audio);
  }, [onSelect]);

  const handleRemove = useCallback((e: React.MouseEvent, audio: AudioItem) => {
    e.stopPropagation();
    onRemove(audio);
  },[onRemove]);

  if (audios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/50">
        <FaMusic className="text-4xl mb-2" />
        <p className="text-sm">No songs added yet</p>
        <p className="text-xs mt-1">Upload some music to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full space-y-1 px-2 scrollbar-hide">
      {audios.map((audio, index) => {
        const isCurrent = audio.id === currentAudioId;
        return (
          <div
            key={audio.id}
            onClick={() => handleSelect(audio)}
            className={`
              group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
              hover:bg-white/10 active:scale-[0.98]
              ${isCurrent ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-l-4 border-green-400' : ''}
            `}
          >
            {/* Play/Pause indicator or index */}
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 text-sm">
              {isCurrent && isPlaying ? (
                <FaPause className="text-green-400 text-xs animate-pulse" />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                {audio.title}
              </p>
              <p className="text-xs text-white/50 truncate">{audio.artist}</p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => handleRemove(e, audio)}
              className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
              title="Remove"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        );
      })}
    </div>
  );
});

AudioPlaylist.displayName = 'AudioPlaylist';

