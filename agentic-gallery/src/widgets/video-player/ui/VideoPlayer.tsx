import { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { VideoPlayerControls } from './VideoPlayerControls';
import { VideoFileUpload } from './VideoFileUpload';
import { useMediaLibrary } from '@/entities/media';
import type { VideoItem } from '@/shared/types/VideoItem';
import type { VideoPlayerProps } from '@/shared/types/VideoPlayerProps';
import { FaTrash } from 'react-icons/fa6';

const VideoPlayerContent = ({ initialVideoUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSeededRef = useRef(false);

  const { videos, addVideos: addVideosToLibrary, removeVideo: removeVideoFromLibrary, focusRequest } = useMediaLibrary();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentVideo = useMemo(() => videos[currentIndex] ?? null, [videos, currentIndex]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialVideoUrl && !initialSeededRef.current) {
      initialSeededRef.current = true;
      addVideosToLibrary([{ id: 'initial', url: initialVideoUrl, name: 'Initial Video' }]);
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [initialVideoUrl, addVideosToLibrary]);

  useEffect(() => {
    if (videos.length === 0) {
      setIsPlaying(false);
      setCurrentIndex(0);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    setCurrentIndex(prev => Math.max(0, Math.min(prev, videos.length - 1)));
  }, [videos.length]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  }, []);

  // Wire basic video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, currentTime, duration]);


  // Keep element volume in sync
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Auto-hide controls when playing
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, duration));
  }, [currentTime]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  }, [duration]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newItems: VideoItem[] = files.map((file, index) => ({
      id: `manual-video-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      modifiedAt: file.lastModified,
      relativePath: file.name,
      sourceLabel: 'Manual Upload',
      origin: 'manual-upload',
      keywords: [file.name.toLowerCase()],
    }));

    const hadVideos = videos.length > 0;
    addVideosToLibrary(newItems);
    if (!hadVideos && newItems.length > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
    setShowControls(true);
  }, [addVideosToLibrary, videos.length]);

  const handleRemoveVideo = useCallback((id: string) => {
    const indexToRemove = videos.findIndex(v => v.id === id);
    if (indexToRemove === -1) return;
    removeVideoFromLibrary(id);
    setCurrentIndex(prev => {
      if (videos.length <= 1) return 0;
      if (prev > indexToRemove) return Math.max(0, prev - 1);
      if (prev === indexToRemove) return Math.min(indexToRemove, videos.length - 2);
      return prev;
    });
    if (videos.length <= 1) {
      setIsPlaying(false);
    }
  }, [removeVideoFromLibrary, videos]);

  const handleRemoveCurrentVideo = useCallback(() => {
    if (currentVideo) {
      handleRemoveVideo(currentVideo.id);
    }
  }, [currentVideo, handleRemoveVideo]);

  const handleSelectVideo = useCallback((index: number) => {
    if (index === currentIndex) {
      handlePlayPause();
      return;
    };
    setCurrentIndex(index);
    setIsPlaying(true);
    handlePlayPause();
    return;
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Load new video source and auto-play when appropriate
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !currentVideo) return;
    el.src = currentVideo.url;
    if (isPlaying) {
      el.play().catch(() => undefined);
    }
  }, [currentVideo]);

  useEffect(() => {
    if (focusRequest?.type !== 'video') {
      return;
    }

    const requestedIndex = videos.findIndex(video => video.id === focusRequest.id);
    if (requestedIndex >= 0) {
      setCurrentIndex(requestedIndex);
      setIsPlaying(focusRequest.autoplay);
      setShowControls(true);
    }
  }, [focusRequest, videos]);

  if (!currentVideo) {
    return (
      <div className="neo-playlist-panel w-full h-full max-w-full max-h-full overflow-scroll flex flex-col items-center justify-center rounded-4xl max-sm:rounded-md">
        <div className="text-center space-y-4">
          <div className="neo-main-control w-24 h-24 mx-auto rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold tracking-wide text-[#7d126f]">Upload Videos</span>
          </div>
          <h3 className="text-[#3f4b5f] text-xl font-semibold">No Video Selected</h3>
          <p className="text-[#6f7b90]">Upload one or more videos to get started</p>
          <div className="pt-4">
            <VideoFileUpload onFilesSelected={handleFilesSelected} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col lg:flex-row w-full h-full bg-black rounded-md overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* ── Left column: scrollable, video sticky at top ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:overflow-y-scroll">

        {/* Video — sticky at top on all screens */}
        <div
          key={currentVideo?.id || 'empty'}
          className="sticky top-0 z-10 shrink-0 aspect-video bg-black rounded-none lg:rounded-md transition-opacity duration-300"
        >
          {currentVideo?.sourceId === 'youtube' ? (
            <iframe
              className="w-full h-full border-0"
              src={`https://www.youtube-nocookie.com/embed/${currentVideo.relativePath}?autoplay=1&controls=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={currentVideo?.url}
              className="w-full h-full object-contain"
              onClick={handlePlayPause}
              playsInline
            />
          )}

          {/* Trash + Upload — top-right on mobile/tablet; top-left on desktop */}
          <div className="absolute top-2 right-2 lg:left-2 lg:right-auto z-20 flex items-center gap-2 transition-opacity duration-300">
            {currentVideo && (
              <button
                onClick={handleRemoveCurrentVideo}
                className="p-2 rounded-md bg-red-500/80 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all active:scale-95"
                title="Move current video to trash"
              >
                <FaTrash />
              </button>
            )}
            <VideoFileUpload onFilesSelected={handleFilesSelected} />
          </div>
        </div>

        {/* Now-playing title — Desktop (lg and above) */}
        {!isFullscreen && (
          <div className="hidden lg:block shrink-0 px-4 py-3 border-b border-white/10">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Now Playing</p>
            <p className="text-white text-base font-semibold line-clamp-2 break-words">
              {currentVideo?.name ?? 'Unknown'}
            </p>
          </div>
        )}

        {/* Now-playing title — Tablet (md to lg) */}
        <div className="hidden md:flex lg:hidden shrink-0 px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10 items-center gap-3">
          <span className="text-white/50 text-xs font-medium uppercase tracking-wider shrink-0">Now Playing:</span>
          <span className="text-white text-sm font-semibold truncate flex-1">
            {currentVideo?.name ?? 'Unknown'}
          </span>
        </div>

        {/* Now-playing title — Mobile (below md) */}
        <div className="md:hidden flex shrink-0 px-3 py-2 bg-gradient-to-b from-black/70 to-black/50 backdrop-blur-sm border-b border-white/5 items-center gap-2 min-w-0">
          <span className="text-white/50 text-xs font-medium uppercase tracking-wider shrink-0">Now:</span>
          <span className="text-white text-xs font-semibold truncate flex-1">
            {currentVideo?.name ?? 'Unknown'}
          </span>
        </div>

        {/* VideoPlayerControls — visible on lg and above */}
        {currentVideo?.sourceId !== 'youtube' && (
          <div className="mt-auto shrink-0 transition-opacity duration-300 hidden lg:block">
            <VideoPlayerControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              isFullscreen={isFullscreen}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onPlayPause={handlePlayPause}
              onMuteToggle={handleMuteToggle}
              onFullscreenToggle={toggleFullscreen}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onSkip={handleSkip}
            />
          </div>
        )}
      </div>{/* end left column */}

      {/* ── Right column: scrollable thumbnail rail — visible only on lg and above ── */}
      {videos.length > 0 && (
        <div className="hidden lg:flex w-44 flex-col shrink-0 overflow-y-auto border-l border-white/10 gap-2 p-2">
          {videos.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => handleSelectVideo(idx)}
              className={`relative w-full flex flex-col items-center gap-1 rounded-md overflow-hidden border transition-all min-h-30 ${
                idx === currentIndex
                  ? 'border-emerald-400 bg-white/10 shadow-lg shadow-green-500/20'
                  : 'border-white/15 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveVideo(v.id);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:bg-red-600 hover:text-white transition-colors z-10"
                title="Move to trash"
              >
                <FaTrash className="text-[10px]" />
              </span>
              {v.sourceId === 'youtube' ? (
                <img
                  src={`https://i.ytimg.com/vi/${v.relativePath}/hqdefault.jpg`}
                  alt={v.name}
                  className="w-full h-20 object-cover pointer-events-none"
                  loading="lazy"
                />
              ) : (
                <video
                  src={v.url}
                  className="w-full h-20 object-cover pointer-events-none"
                  muted
                />
              )}
              <span className="px-2 pb-2 text-[11px] text-white/80 truncate w-full text-left">
                {v.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

VideoPlayerContent.displayName = 'VideoPlayerContent';

export const VideoPlayer = memo(function VideoPlayer(props: VideoPlayerProps) {
  return <VideoPlayerContent {...props} />;
});
