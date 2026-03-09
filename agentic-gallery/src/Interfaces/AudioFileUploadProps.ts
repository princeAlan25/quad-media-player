import type { AudioItem } from './AudioItem';

export interface AudioFileUploadProps {
  onFilesSelected: (files: AudioItem[]) => void;
}

