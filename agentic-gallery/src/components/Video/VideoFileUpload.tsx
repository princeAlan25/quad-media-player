import { useCallback, useRef, memo } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';

interface VideoFileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const VideoFileUpload: React.FC<VideoFileUploadProps> = memo(({ onFilesSelected }) => {
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
    <div className="relative">
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
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/30 active:scale-95"
      >
        <FaCloudUploadAlt className="text-lg" />
        <span className="text-sm font-medium">Upload Videos</span>
      </button>
    </div>
  );
});

VideoFileUpload.displayName = 'VideoFileUpload';

