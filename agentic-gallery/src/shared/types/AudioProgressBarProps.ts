export interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

