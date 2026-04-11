import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaCompress, FaTrash, FaPlay, FaPause } from 'react-icons/fa6';
import { ImageFileUpload } from './ImageFileUpload';
import { useMediaLibrary } from '@/entities/media';
import type { ImageItem } from '@/shared/types/ImageItem';

const ImageGalleryContent = () => {
  const { images, addImages: addImagesToLibrary, removeImage: removeImageFromLibrary, focusRequest } = useMediaLibrary();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (images.length === 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex(prev => Math.max(0, Math.min(prev, images.length - 1)));
  }, [images.length]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    const target = images[index];
    if (!target) return;

    removeImageFromLibrary(target.id);
    setCurrentIndex(prev => {
      if (images.length <= 1) return 0;
      if (prev > index) return Math.max(0, prev - 1);
      if (prev === index) return Math.min(index, images.length - 2);
      return prev;
    });
  }, [images, removeImageFromLibrary]);

  const goToNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const toggleSlideshow = useCallback(() => {
    setIsPlaying(prev => !prev);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newImages: ImageItem[] = files.map((file, index) => ({
      id: `manual-image-${Date.now()}-${index}`,
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

    const hadImages = images.length > 0;
    addImagesToLibrary(newImages);
    if (!hadImages && newImages.length > 0) {
      setCurrentIndex(0);
    }
  }, [addImagesToLibrary, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, isFullscreen, toggleFullscreen]);

  useEffect(() => {
    if (images.length <= 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [images.length, isPlaying]);

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    const id = setInterval(goToNext, 3500);
    return () => clearInterval(id);
  }, [isPlaying, images.length, goToNext]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (focusRequest?.type !== 'image') {
      return;
    }

    const requestedIndex = images.findIndex(image => image.id === focusRequest.id);
    if (requestedIndex >= 0) {
      setCurrentIndex(requestedIndex);
      setShowControls(true);
    }
  }, [focusRequest, images]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-4xl max-sm:rounded-md max-sm:*:scale-90">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <span className="text-xl font-semibold text-white">Gallery Ready</span>
          </div>
          <h3 className="text-white text-xl font-semibold">No Images Selected</h3>
          <p className="text-white/60">Upload images to create your gallery</p>
          <div className="pt-4">
            <ImageFileUpload onFilesSelected={handleFilesSelected} />
          </div>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-4xl overflow-hidden max-sm:p-2 max-sm:rounded-md max-sm:min-h-[96vh]"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="w-full h-full flex items-center justify-center p-8 max-sm:w-full max-sm:rounded-md max-sm:p-0">
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl max-sm:rounded-md"
        />
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className={`absolute invert-25 left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Previous image"
      >
        <FaChevronLeft />
      </button>

      <button
        onClick={goToNext}
        className={`absolute invert-25 right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Next image"
      >
        <FaChevronRight />
      </button>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/50 to-transparent p-4 pt-12 max-sm:pt-0 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="text-center mb-4 max-sm:p-2 max-sm:mb-0">
          <span className="text-white/80 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <p className="text-white text-sm truncate max-w-md mx-auto max-sm:mb-20">{currentImage.name}</p>
        </div>

        <div className="flex justify-center gap-4 max-sm:mb-6 max-sm:*:scale-80 max-sm:[&>button]:h-10 max-sm:items-center max-sm:gap-2 max-sm:rounded-md">
          <button
            onClick={toggleSlideshow}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button
            onClick={() => handleRemoveImage(currentIndex)}
            className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
            title="Delete Image"
          >
            <FaTrash />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors max-sm:hidden"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          <ImageFileUpload onFilesSelected={handleFilesSelected} />
        </div>
      </div>

      <div className={`absolute bottom-24 max-sm:bottom-24 left-0 right-0 flex justify-center gap-2 px-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {images.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((img, idx) => {
          const actualIndex = Math.max(0, currentIndex - 2) + idx;
          return (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(actualIndex)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                actualIndex === currentIndex
                  ? 'border-green-400 scale-110'
                  : 'border-white/30 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

ImageGalleryContent.displayName = 'ImageGalleryContent';

export const ImageGallery = memo(function ImageGallery() {
  return <ImageGalleryContent />;
});
