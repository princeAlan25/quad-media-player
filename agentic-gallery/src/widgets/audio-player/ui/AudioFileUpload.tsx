import { useCallback, useRef, memo } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import type { AudioFileUploadProps } from '@/shared/types/AudioFileUploadProps';

export const AudioFileUpload = memo(function AudioFileUpload({ onFilesSelected }: AudioFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    onFilesSelected(Array.from(files));
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
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
        accept="audio/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="audio-file-upload"
      />
      <button
        onClick={handleClick}
        className="neo-upload-button flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 active:scale-95 max-sm:px-3"
      >
        <FaCloudUploadAlt className="text-lg" />
        <span className="text-sm font-medium max-sm:hidden">Upload Music</span>
      </button>
    </div>
  );
});
