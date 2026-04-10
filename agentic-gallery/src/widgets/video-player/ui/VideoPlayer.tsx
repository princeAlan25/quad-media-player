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
  }, []);

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
  }, [duration]);

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
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setIsPlaying(true);
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
  }, [currentVideo, isPlaying]);

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
      <div className="w-full h-full max-w-full max-h-full overflow-scroll flex flex-col items-center justify-center bg-black/40 rounded-4xl max-sm:rounded-md max-sm:*:scale-90">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-xl font-semibold tracking-wide text-white">Upload Videos</span>
          </div>
          <h3 className="text-white text-xl font-semibold">No Video Selected</h3>
          <p className="text-white/60">Upload one or more videos to get started</p>
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
      className="relative w-full h-full bg-black rounded-4xl overflow-hidden group max-sm:overflow-y-scroll max-sm:rounded-md max-sm:p-0 max-sm:max-h-[96vh] max-sm:overflow-hidden max-lg:flex max-lg:flex-col max-lg:overflow-y-auto max-lg:rounded-xl max-lg:p-0 max-lg:h-auto max-lg:min-h-full"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div
        key={currentVideo?.id || 'empty'}
        className="h-full w-full transition-opacity duration-300 max-sm:sticky max-sm:top-0 max-sm:z-1 max-sm:mb-2 max-lg:sticky max-lg:top-0 max-lg:h-auto max-lg:aspect-video max-lg:shrink-0 max-lg:z-20 max-lg:bg-black max-lg:mb-2"
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
            controls
            src={currentVideo?.url}
            className="w-full h-full object-contain"
            onClick={handlePlayPause}
            playsInline
          />
        )}
      </div>

      {/* Now-playing title — iPad only */}
      <div className="hidden max-lg:flex max-sm:hidden items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-sm shrink-0">
        <span className="text-white/50 text-xs font-medium uppercase tracking-wider shrink-0">Now Playing</span>
        <span className="text-white text-sm font-semibold truncate">{currentVideo?.name ?? ''}</span>
      </div>

      {currentVideo?.sourceId !== 'youtube' && (
        <div 
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 max-sm:w-full max-sm:h-30 max-sm:hidden max-lg:hidden ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
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

      <div className={`absolute top-4 right-4 transition-opacity duration-300 max-sm:sticky max-sm:top-2 max-sm:float-right max-sm:z-2 max-lg:absolute max-lg:top-2 max-lg:right-2 max-lg:z-20 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-2 max-sm:rounded-md max-lg:rounded-md">
          {currentVideo && (
            <button
              onClick={handleRemoveCurrentVideo}
              className="p-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all active:scale-95"
              title="Move current video to trash"
            >
              <FaTrash />
            </button>
          )}
          <VideoFileUpload onFilesSelected={handleFilesSelected} />
        </div>
      </div>

      {/* Thumbnail rail on the right */}
      {videos.length > 0 && (
        <div className="absolute top-4 bottom-4 right-2 w-28 overflow-y-auto space-y-2 pr-1 max-sm:relative max-sm:shadow-2xl max-sm:w-full max-sm:right-0 max-sm:p-2 max-sm:overflow-y-scroll max-lg:relative max-lg:w-full max-lg:h-auto max-lg:right-auto max-lg:top-auto max-lg:bottom-auto max-lg:grid max-lg:grid-cols-2 max-sm:grid-cols-1 max-lg:gap-3 max-lg:space-y-0 max-lg:p-3 max-lg:overflow-y-auto max-lg:max-h-[calc(100vh-56vw-2rem)]">
          {videos.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => handleSelectVideo(idx)}
              className={`relative w-full flex flex-col items-center gap-1 rounded-xl overflow-hidden border transition-all max-sm:opacity-60 max-lg:opacity-85 ${
                idx === currentIndex
                  ? 'border-emerald-400 bg-white/10 max-sm:opacity-80 max-sm:shadow-md max-sm:shadow-green-100 max-lg:shadow-[0_0_15px_rgba(52,211,153,0.15)] max-lg:opacity-100'
                  : 'border-white/15 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveVideo(v.id);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:bg-red-600 hover:text-white transition-colors max-lg:p-1.5 max-lg:z-10"
                title="Move to trash"
              >
                <FaTrash className="text-[10px]" />
              </span>
              <video
                src={v.url}
                className="w-full h-20 object-cover pointer-events-none max-lg:h-auto max-lg:aspect-video"
                muted
              />
              <span className={`px-2 pb-2 text-[11px] text-white/80 truncate w-full max-sm:text-left max-lg:text-sm max-lg:text-left max-lg:px-3 max-lg:pt-1 max-lg:text-white/90 ${idx === currentIndex ? 'max-sm:bg-emerald-500/80 max-lg:bg-emerald-500/20' : ''}`}>{v.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mini playlist chips */}
      {videos.length > 1 && (
        <div className="absolute bottom-24 left-0 right-0 flex flex-wrap justify-center gap-2 px-4 max-sm:hidden max-lg:hidden">
          {videos.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => handleSelectVideo(idx)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                idx === currentIndex
                  ? 'bg-emerald-500/80 text-white'
                  : 'bg-white/15 text-white/70 hover:bg-white/25'
              }`}
            >
              {v.name}
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
