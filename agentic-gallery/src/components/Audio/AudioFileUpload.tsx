import { useCallback, useRef, memo } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import type { AudioItem } from '../../Interfaces/AudioItem';

interface AudioFileUploadProps {
  onFilesSelected: (files: AudioItem[]) => void;
}

export const AudioFileUpload: React.FC<AudioFileUploadProps> = memo(({ onFilesSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const audioItems: AudioItem[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local File',
      url: URL.createObjectURL(file),
      isPlaying: false,
    }));

    onFilesSelected(audioItems);
    
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
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/30 active:scale-95"
      >
        <FaCloudUploadAlt className="text-lg" />
        <span className="text-sm font-medium">Upload Music</span>
      </button>
    </div>
  );
});

AudioFileUpload.displayName = 'AudioFileUpload';

