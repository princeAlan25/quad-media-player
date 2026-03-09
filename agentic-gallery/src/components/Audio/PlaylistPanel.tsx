import { memo, useCallback } from 'react';
import { AudioFileUpload } from './AudioFileUpload';
import { AudioPlaylist } from './AudioPlaylist';
import type { AudioItem } from '../../Interfaces/AudioItem';

interface PlaylistPanelProps {
  audios: AudioItem[];
  currentAudioId?: number;
  isPlaying: boolean;
  onSelect: (audio: AudioItem) => void;
  onRemove: (audio: AudioItem) => void;
  onUpload: (audioItems: AudioItem[]) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = memo(({
  audios,
  currentAudioId,
  isPlaying,
  onSelect,
  onRemove,
  onUpload,
}) => {
  const handleUpload = useCallback((items: AudioItem[]) => {
    onUpload(items);
  }, [onUpload]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2">
        <h3 className="text-white font-semibold">Playlist</h3>
        <AudioFileUpload onFilesSelected={handleUpload} />
      </div>
      <div className="flex-1 overflow-hidden">
        <AudioPlaylist
          audios={audios}
          currentAudioId={currentAudioId}
          isPlaying={isPlaying}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
});

PlaylistPanel.displayName = 'PlaylistPanel';
