import { memo } from 'react';
import type { AudioItem } from '../../Interfaces/AudioItem';

interface NowPlayingInfoProps {
  audio?: AudioItem | null;
}

export const NowPlayingInfo: React.FC<NowPlayingInfoProps> = memo(({ audio }) => {
  if (!audio) return null;

  return (
    <div className="text-center px-4 py-2">
      <h3 className="text-white font-bold text-lg truncate">{audio.title}</h3>
      <p className="text-white/60 text-sm">{audio.artist}</p>
    </div>
  );
});

NowPlayingInfo.displayName = 'NowPlayingInfo';
