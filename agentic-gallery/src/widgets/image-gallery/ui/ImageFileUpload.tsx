import { useCallback, useRef, memo } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import type { ImageFileUploadProps } from '@/shared/types/ImageFileUploadProps';

export const ImageFileUpload = memo(function ImageFileUpload({ onFilesSelected }: ImageFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    onFilesSelected(fileArray);
    
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
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="image-file-upload"
      />
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-pink-500/30 active:scale-95"
      >
        <FaCloudUploadAlt className="text-lg" />
        <span className="text-sm font-medium">Upload Images</span>
      </button>
    </div>
  );
});

