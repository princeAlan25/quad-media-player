import { useCallback, useEffect, memo } from 'react';
import { useAudioPlayer } from '../../Hooks/useAudioPlayer';
import type { RepeatMode } from '../../Hooks/useAudioPlayer';
import type { AudioItem } from '../../Interfaces/AudioItem';
import AudiosMocks from '../../DataSource/AudioStorage.json';
import { PlaylistPanel } from './PlaylistPanel';
import { NowPlayingInfo } from './NowPlayingInfo';
import { PlaybackSection } from './PlaybackSection';

interface Mp3PlayerProps {
  initialAudios?: AudioItem[];
}

// Memoized internal player component
const Mp3PlayerContent: React.FC<{ initialAudios?: AudioItem[] }> = ({ initialAudios }) => {
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

  // Load initial audios
  useEffect(() => {
    const seedAudios = initialAudios || (AudiosMocks as AudioItem[]);
    if (playlist.length === 0 && seedAudios.length > 0) {
      loadAudios(seedAudios);
    }
  }, [initialAudios, loadAudios, playlist.length]);

  const handleFilesSelected = useCallback((newAudios: AudioItem[]) => {
    addAudios(newAudios, playlist.length === 0);
  }, [addAudios, playlist.length]);

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
    <div className="w-full h-full flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Playlist area */}
      <div className="w-full h-[45%] p-2 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-4xl shadow mb-4">
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

export const Mp3Player: React.FC<Mp3PlayerProps> = memo(({ initialAudios }) => {
  return (
    <Mp3PlayerContent initialAudios={initialAudios} />
  );
});

Mp3Player.displayName = 'Mp3Player';
