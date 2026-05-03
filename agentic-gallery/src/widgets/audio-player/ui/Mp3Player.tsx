import { useCallback, useEffect, memo } from 'react';
import { useAudioPlayer } from '@/features/audio-player/model/useAudioPlayer';
import type { RepeatMode } from '@/shared/types/RepeatMode';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { Mp3PlayerProps } from '@/shared/types/Mp3PlayerProps';
import { PlaylistPanel } from './PlaylistPanel';
import { NowPlayingInfo } from './NowPlayingInfo';
import { PlaybackSection } from './PlaybackSection';

// Memoized internal player component
interface Mp3PlayerContentProps {
  initialAudios?: AudioItem[];
}

const Mp3PlayerContent = ({ initialAudios }: Mp3PlayerContentProps) => {
  const {
    currentAudio,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffle,
    audioRef,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    setRepeatMode,
    toggleShuffle,
    loadAudios,
    addAudios,
    removeAudio,
    setCurrentIndex,
  } = useAudioPlayer();

  useEffect(() => {
    if (initialAudios && playlist.length === 0 && initialAudios.length > 0) {
      loadAudios(initialAudios);
    }
  }, [initialAudios, loadAudios, playlist.length]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const uploadedAudios: AudioItem[] = files.map((file, index) => ({
      id: `manual-audio-${Date.now()}-${index}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Manual Upload',
      url: URL.createObjectURL(file),
      mimeType: file.type,
      size: file.size,
      modifiedAt: file.lastModified,
      relativePath: file.name,
      sourceLabel: 'Manual Upload',
      origin: 'manual-upload',
      keywords: [file.name.toLowerCase()],
    }));

    addAudios(uploadedAudios, playlist.filter(audio => audio.origin !== 'seed').length === 0);
  }, [addAudios, playlist]);

  const handleSelectAudio = useCallback((audio: AudioItem) => {
    const index = playlist.findIndex(a => a.id === audio.id);
    if (index < 0) return;

    if (currentAudio?.id === audio.id) {
      togglePlay();
      return;
    }

    setCurrentIndex(index, true);
  }, [playlist, currentAudio?.id, setCurrentIndex, togglePlay]);

  const handleRemoveAudio = useCallback((audio: AudioItem) => {
    removeAudio(audio.id);
  }, [removeAudio]);

  const handleRepeatToggle = useCallback(() => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  }, [repeatMode, setRepeatMode]);

  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const handleShuffleToggle = useCallback(() => {
    toggleShuffle();
  }, [toggleShuffle]);

  return (
    <div className="w-full min-w-0 h-full flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Playlist area */}
      <div className="neo-playlist-panel w-full min-w-0 h-[45%] p-2 rounded-4xl mb-4">
        <PlaylistPanel
          audios={playlist}
          currentAudioId={currentAudio?.id}
          isPlaying={isPlaying}
          onSelect={handleSelectAudio}
          onRemove={handleRemoveAudio}
          onUpload={handleFilesSelected}
        />
      </div>

      {/* Now Playing */}
      <NowPlayingInfo audio={currentAudio} />

      {/* Playback UI */}
      <div className="px-4 pb-4">
        <PlaybackSection
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          shuffle={shuffle}
          onSeek={handleSeek}
          onVolumeChange={setVolume}
          onMuteToggle={toggleMute}
          onPlayPause={togglePlay}
          onNext={next}
          onPrevious={previous}
          onRepeatToggle={handleRepeatToggle}
          onShuffleToggle={handleShuffleToggle}
        />
      </div>
    </div>
  );
};

Mp3PlayerContent.displayName = 'Mp3PlayerContent';

export const Mp3Player = memo(function Mp3Player({ initialAudios }: Mp3PlayerProps) {
  return (
    <Mp3PlayerContent initialAudios={initialAudios} />
  );
});
