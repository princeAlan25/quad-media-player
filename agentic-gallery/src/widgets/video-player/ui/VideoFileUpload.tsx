import { useCallback, useRef, memo } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import type { VideoFileUploadProps } from '@/shared/types/VideoFileUploadProps';

export const VideoFileUpload = memo(function VideoFileUpload({ onFilesSelected }: VideoFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [onFilesSelected]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex max-sm:w-full justify-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
        id="video-file-upload"
      />
      <button
        onClick={handleClick}
        className="neo-upload-button flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 active:scale-95 max-sm:px-3"
      >
        <FaCloudUploadAlt className="text-lg" />
        <span className="text-sm font-medium max-sm:hidden">Upload Videos</span>
      </button>
    </div>
  );
});

