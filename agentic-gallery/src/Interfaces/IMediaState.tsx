// Media item interface for video and image
export interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'image';
  thumbnail?: string;
}

export interface IMediaState {
  items: MediaItem[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
}

export interface IMediaContextValue {
  mediaState: IMediaState;
  setMediaState: React.Dispatch<React.SetStateAction<IMediaState>>;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  addItems: (items: MediaItem[]) => void;
  removeItem: (id: string) => void;
  setCurrentIndex: (index: number) => void;
}

