import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { RepeatMode } from '@/shared/types/RepeatMode';
import type { UseAudioPlayerReturn } from '@/shared/types/UseAudioPlayer';
import { useMediaLibrary } from '@/entities/media';

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    audios,
    replaceAudios,
    addAudios: addAudiosToLibrary,
    removeAudio: removeAudioFromLibrary,
    focusRequest,
  } = useMediaLibrary();
  
  const [currentIndex, setCurrentIndexState] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>('none');
  const [shuffle, setShuffle] = useState<boolean>(false);

  // Computed values
  const currentAudio = useMemo(() => 
    audios[currentIndex] || null, 
    [audios, currentIndex]
  );

  // Sync volume with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Actions
  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (!audios.length) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause, audios.length]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  }, [duration]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    setIsMuted(clampedVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const next = useCallback(() => {
    if (!audios.length) return;
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * audios.length);
    } else if (currentIndex < audios.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (repeatMode === 'all') {
      nextIndex = 0;
    } else {
      return;
    }
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [currentIndex, shuffle, repeatMode, audios.length]);

  const previous = useCallback(() => {
    if (!audios.length) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    let prevIndex: number;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * audios.length);
    } else if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else if (repeatMode === 'all') {
      prevIndex = audios.length - 1;
    } else {
      seek(0);
      return;
    }
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
  }, [currentIndex, currentTime, shuffle, repeatMode, audios.length, seek]);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  const setCurrentIndex = useCallback((index: number, autoPlay = true) => {
    if (!audios.length) return;
    const safeIndex = Math.max(0, Math.min(index, audios.length - 1));
    setCurrentIndexState(safeIndex);
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [audios.length]);

  const loadAudio = useCallback((audio: AudioItem) => {
    replaceAudios([audio]);
    setCurrentIndexState(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [replaceAudios]);

  const loadAudios = useCallback((newAudios: AudioItem[], startIndex = 0, autoPlay = false) => {
    replaceAudios(newAudios);
    const safeIndex = Math.max(0, Math.min(startIndex, Math.max(newAudios.length - 1, 0)));
    setCurrentIndexState(safeIndex);
    setCurrentTime(0);
    setIsPlaying(autoPlay && newAudios.length > 0);
  }, [replaceAudios]);

  const addAudios = useCallback((newAudios: AudioItem[], autoPlay = false) => {
    if (newAudios.length === 0) return;
    const previousLength = audios.length;
    addAudiosToLibrary(newAudios);
    if (autoPlay) {
      setCurrentIndexState(previousLength);
      setIsPlaying(true);
    }
  }, [addAudiosToLibrary, audios.length]);

  const removeAudio = useCallback((id: string) => {
    const indexToRemove = audios.findIndex(audio => audio.id === id);
    if (indexToRemove === -1) return;
    removeAudioFromLibrary(id);
    setCurrentIndexState(current => {
      if (audios.length <= 1) return 0;
      if (current > indexToRemove) return Math.max(0, current - 1);
      if (current === indexToRemove) return Math.min(indexToRemove, audios.length - 2);
      return current;
    });
  }, [audios, removeAudioFromLibrary]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all' || currentIndex < audios.length - 1) {
        next();
      } else {
        setIsPlaying(false);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [repeatMode, currentIndex, audios.length, next]);

  // Keep index within bounds when playlist changes
  useEffect(() => {
    if (audios.length === 0) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    setCurrentIndexState(prev => Math.max(0, Math.min(prev, audios.length - 1)));
  }, [audios.length]);

  // Load audio when currentIndex changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentAudio) {
      audio.src = currentAudio.url;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentIndex, currentAudio, isPlaying]);

  // Auto-play when new audio loads
  useEffect(() => {
    if (currentAudio && isPlaying) {
      audioRef.current?.play().catch(console.error);
    }
  }, [currentAudio, isPlaying]);

  useEffect(() => {
    if (focusRequest?.type !== 'audio') {
      return;
    }

    const requestedIndex = audios.findIndex(audio => audio.id === focusRequest.id);
    if (requestedIndex >= 0) {
      setCurrentIndex(requestedIndex, focusRequest.autoplay);
    }
  }, [audios, focusRequest, setCurrentIndex]);

  return {
    currentAudio,
    playlist: audios,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffle,
    audioRef,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    setRepeatMode,
    toggleShuffle,
    loadAudio,
    loadAudios,
    addAudios,
    removeAudio,
    setCurrentIndex,
  };
};
