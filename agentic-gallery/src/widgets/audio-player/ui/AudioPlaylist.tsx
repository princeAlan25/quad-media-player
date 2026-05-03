import { memo, useCallback } from 'react';
import { FaPause, FaTrash, FaMusic } from 'react-icons/fa';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { AudioPlaylistProps } from '@/shared/types/AudioPlaylistProps';

export const AudioPlaylist = memo(function AudioPlaylist({
  audios,
  currentAudioId,
  isPlaying,
  onSelect,
  onRemove,
}: AudioPlaylistProps) {
  const handleSelect = useCallback((audio: AudioItem) => {
    onSelect(audio);
  }, [onSelect]);

  const handleRemove = useCallback((e: React.MouseEvent, audio: AudioItem) => {
    e.stopPropagation();
    onRemove(audio);
  },[onRemove]);

  if (audios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#6f7b90]">
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
              neo-track-row max-sm:scale-90 max-sm:h-10 max-sm:*:scale-90 group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
              active:scale-[0.98]
              ${isCurrent ? 'is-active' : ''}
            `}
          >
            {/* Play/Pause indicator or index */}
            <div className="neo-track-index w-8 h-8 flex items-center justify-center rounded-full text-sm">
              {isCurrent && isPlaying ? (
                <FaPause className="neo-active-icon text-xs animate-pulse" />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="neo-track-title text-sm font-medium truncate">
                {audio.title}
              </p>
              <p className="neo-track-artist text-xs truncate">{audio.artist}</p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => handleRemove(e, audio)}
              className="neo-icon-danger p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
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

