import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';

export type WatchlistItemType = 'stock' | 'mutual-fund' | 'crypto' | 'city';

export interface WatchlistItem {
  id: string;
  type: WatchlistItemType;
  label: string;
  sublabel: string;
  path: string;
  addedAt: string;
}

const STORAGE_KEY = 'marketmind_watchlist_v1';

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  {
    id: 'stock:RELIANCE',
    type: 'stock',
    label: 'RELIANCE',
    sublabel: 'Reliance Industries',
    path: '/stocks/reliance-industries/',
    addedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'stock:TCS',
    type: 'stock',
    label: 'TCS',
    sublabel: 'Tata Consultancy Services',
    path: '/stocks/tcs/',
    addedAt: '2026-11-12T00:00:00.000Z',
  },
  {
    id: 'mf:parag-parikh-flexi-cap',
    type: 'mutual-fund',
    label: 'Parag Parikh Flexi Cap',
    sublabel: 'Flexi Cap · Direct Growth',
    path: '/mutual-funds/parag-parikh-flexi-cap/',
    addedAt: '2026-11-12T00:00:00.000Z',
  },
];

interface WatchlistContextValue {
  items: WatchlistItem[];
  isWatched: (id: string) => boolean;
  toggleWatch: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeWatch: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WatchlistItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_WATCHLIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  const isWatched = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const toggleWatch = useCallback((item: Omit<WatchlistItem, 'addedAt'>) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [{ ...item, addedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeWatch = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <WatchlistContext.Provider value={{ items, isWatched, toggleWatch, removeWatch }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist must be used inside WatchlistProvider');
  }
  return ctx;
}

interface WatchlistButtonProps {
  item: Omit<WatchlistItem, 'addedAt'>;
  compact?: boolean;
  className?: string;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  item,
  compact = false,
  className = '',
}) => {
  const { isWatched, toggleWatch } = useWatchlist();
  const watched = isWatched(item.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleWatch(item);
      }}
      title={watched ? 'Remove from Watchlist' : 'Add to Watchlist'}
      aria-label={watched ? `Remove ${item.label} from Watchlist` : `Add ${item.label} to Watchlist`}
      className={`inline-flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
        compact ? 'p-1.5' : 'px-2.5 py-1.5 text-xs font-semibold'
      } ${
        watched
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
      } ${className}`}
    >
      <Star className={`w-3.5 h-3.5 ${watched ? 'fill-emerald-600 text-emerald-600' : ''}`} />
      {!compact && <span>{watched ? 'Watchlisted' : 'Watchlist'}</span>}
    </button>
  );
};
