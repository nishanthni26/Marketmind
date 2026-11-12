import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Coins,
  BarChart3,
  Calculator,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { mockStocks, goldCityRates } from '../data/financialData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (path: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  navigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const quickActions = [
    {
      title: 'Open Gold & Jewelry Invoice Calculator',
      category: 'Tools',
      icon: <Calculator className="w-4 h-4 text-slate-700" />,
      action: () => {
        onClose();
        navigate('/calculator/');
      },
    },
    {
      title: 'Gold Rate Today (All India Benchmark)',
      category: 'Gold',
      icon: <Coins className="w-4 h-4 text-amber-600" />,
      action: () => {
        onClose();
        navigate('/gold-rate-today/');
      },
    },
    {
      title: 'Top Market Gainers (NSE/BSE)',
      category: 'Stocks',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onClose();
        navigate('/stocks/top-gainers/');
      },
    },
  ];

  const matchingStocks = mockStocks
    .filter((s) => s.name.toLowerCase().includes(cleanQuery) || s.symbol.toLowerCase().includes(cleanQuery))
    .slice(0, 4);

  const matchingGold = goldCityRates
    .filter((c) => c.city.toLowerCase().includes(cleanQuery) || c.state.toLowerCase().includes(cleanQuery))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a stock symbol, gold city rate, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded-md font-mono font-semibold">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 max-h-96 overflow-y-auto space-y-3 text-xs divide-y divide-slate-100">
          {!cleanQuery ? (
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 px-3 block mb-1">
                Quick Actions
              </span>
              <div className="space-y-1">
                {quickActions.map((act, idx) => (
                  <div
                    key={idx}
                    onClick={act.action}
                    className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5">
                      {act.icon}
                      <span className="font-semibold text-slate-800 group-hover:text-slate-950">
                        {act.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {matchingStocks.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 px-3 block mb-1">
                    Stocks ({matchingStocks.length})
                  </span>
                  {matchingStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => {
                        onClose();
                        navigate(`/stocks/${stock.slug}/`);
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-semibold text-slate-900">{stock.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({stock.symbol})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{stock.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {matchingGold.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-amber-700 px-3 block mb-1">
                    Gold Rates by City
                  </span>
                  {matchingGold.map((city) => (
                    <div
                      key={city.slug}
                      onClick={() => {
                        onClose();
                        navigate(city.slug === 'national' ? '/gold-rate-today/' : `/gold-rate-today/${city.slug}/`);
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-slate-900">{city.city}</span>
                        <span className="text-[10px] text-slate-500">{city.state}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{city.rate24KPer10g.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
