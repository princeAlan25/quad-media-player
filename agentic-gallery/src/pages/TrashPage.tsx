import type React from 'react';
import { useMemo } from 'react';
import { FaMusic, FaVideo, FaImage, FaArrowRotateLeft, FaTrash, FaBroom } from 'react-icons/fa6';
import { useMediaLibrary } from '../Shared/MediaContextProvider';
import type { TrashEntry, TrashItemType } from '../Interfaces/TrashItem';

const typeMeta: Record<TrashItemType, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string; bg: string }> = {
  audio: { label: 'Audio', icon: FaMusic, accent: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  video: { label: 'Video', icon: FaVideo, accent: 'text-indigo-300', bg: 'bg-indigo-500/15' },
  image: { label: 'Image', icon: FaImage, accent: 'text-pink-300', bg: 'bg-pink-500/15' },
};

const formatRemovedAt = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TrashCard: React.FC<{
  entry: TrashEntry;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ entry, onRestore, onDelete }) => {
  const meta = typeMeta[entry.type];
  const Icon = meta.icon;
  const title = entry.type === 'audio' ? entry.item.title : entry.item.name;
  const subtitle = entry.type === 'audio' && 'artist' in entry.item ? entry.item.artist : entry.type.toUpperCase();

  const preview =
    entry.type === 'image' ? (
      <img
        src={entry.item.url}
        alt={entry.item.name}
        className="w-full h-36 object-cover rounded-lg border border-white/10"
      />
    ) : entry.type === 'video' ? (
      <video
        src={entry.item.url}
        className="w-full h-36 object-cover rounded-lg border border-white/10"
        muted
      />
    ) : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm space-y-3 shadow-lg shadow-black/20">
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-xl ${meta.bg}`}>
          <Icon className={`text-lg ${meta.accent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{title}</p>
          <p className="text-white/60 text-sm truncate">{subtitle}</p>
          <p className="text-white/40 text-xs mt-1">Removed {formatRemovedAt(entry.removedAt)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onRestore(entry.trashId)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm transition-colors"
          >
            <FaArrowRotateLeft />
            <span>Restore</span>
          </button>
          <button
            onClick={() => onDelete(entry.trashId)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white text-sm transition-colors"
          >
            <FaTrash />
            <span>Delete</span>
          </button>
        </div>
      </div>
      {preview}
    </div>
  );
};

export const TrashPage: React.FC = () => {
  const { trash, restoreItem, deleteFromTrash, clearTrash } = useMediaLibrary();

  const sortedTrash = useMemo(
    () => [...trash].sort((a, b) => b.removedAt - a.removedAt),
    [trash]
  );

  const grouped = useMemo(
    () => ({
      audio: sortedTrash.filter(t => t.type === 'audio'),
      video: sortedTrash.filter(t => t.type === 'video'),
      image: sortedTrash.filter(t => t.type === 'image'),
    }),
    [sortedTrash]
  );

  const hasItems = sortedTrash.length > 0;

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-semibold">Trash</h2>
          <p className="text-white/60 text-sm">Restore or permanently delete removed media.</p>
        </div>
        {hasItems && (
          <div className="flex gap-2">
            <button
              onClick={() => clearTrash()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <FaBroom />
              <span>Empty All</span>
            </button>
          </div>
        )}
      </div>

      {!hasItems && (
        <div className="flex-1 flex flex-col items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/70">
          <FaTrash className="text-4xl mb-3" />
          <p className="text-lg font-semibold">Trash is empty</p>
          <p className="text-sm text-white/50">Deleted audio, video, and images will appear here.</p>
        </div>
      )}

      {hasItems && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(['audio', 'video', 'image'] as const).map(type => {
            const Icon = typeMeta[type].icon;
            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2 text-white/80">
                  <span className={`p-2 rounded-lg ${typeMeta[type].bg}`}>
                    <Icon className={`${typeMeta[type].accent} text-base`} />
                  </span>
                  <span className="font-semibold">{typeMeta[type].label}</span>
                  <span className="text-white/40 text-sm">({grouped[type].length})</span>
                  {grouped[type].length > 0 && (
                    <button
                      onClick={() => clearTrash(type)}
                      className="ml-auto text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      Empty
                    </button>
                  )}
                </div>
                {grouped[type].length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-white/15 flex items-center justify-center text-white/40 text-sm">
                    No {typeMeta[type].label.toLowerCase()} items
                  </div>
                ) : (
                  grouped[type].map(entry => (
                    <TrashCard
                      key={entry.trashId}
                      entry={entry}
                      onRestore={restoreItem}
                      onDelete={deleteFromTrash}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

TrashPage.displayName = 'TrashPage';
