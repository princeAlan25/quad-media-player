import { memo, useCallback } from 'react';
import { AudioFileUpload } from './AudioFileUpload';
import { AudioPlaylist } from './AudioPlaylist';
import type { PlaylistPanelProps } from '@/shared/types/PlaylistPanelProps';

export const PlaylistPanel = memo(function PlaylistPanel({
  audios,
  currentAudioId,
  isPlaying,
  onSelect,
  onRemove,
  onUpload,
}: PlaylistPanelProps) {
  const handleUpload = useCallback((files: File[]) => {
    onUpload(files);
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
