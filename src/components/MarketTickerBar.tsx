import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { mockStocks as fallbackStocks } from '../data/financialData';
import { StockData } from '../types';

interface MarketTickerBarProps {
  navigate: (path: string) => void;
}

interface TickerItem {
  id: string;
  label: string;
  price: string;
  changePct?: number;
  path: string;
  highlight?: boolean;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ navigate }) => {
  const [stocks, setStocks] = useState<StockData[]>(fallbackStocks);
  const [benchmarks, setBenchmarks] = useState<{
    nifty50: { price: number; changePercent: number };
    sensex: { price: number; changePercent: number };
    gold24KPerGram: number;
    silverPerKg: number;
    usdInr: number;
  }>({
    nifty50: { price: 24350.25, changePercent: 0.59 },
    sensex: { price: 80210.8, changePercent: 0.61 },
    gold24KPerGram: 14268,
    silverPerKg: 200000,
    usdInr: 93.85,
  });

  useEffect(() => {
    let mounted = true;

    const loadTickerData = async () => {
      try {
        const [bmRes, stRes] = await Promise.allSettled([
          fetch('/api/benchmarks'),
          fetch('/api/stocks'),
        ]);

        if (!mounted) return;

        if (bmRes.status === 'fulfilled' && bmRes.value.ok) {
          const b = await bmRes.value.json();
          setBenchmarks((prev) => ({
            nifty50: b.nifty50 || prev.nifty50,
            sensex: b.sensex || prev.sensex,
            gold24KPerGram: b.gold24KPerGram || prev.gold24KPerGram,
            silverPerKg: b.silverPerKg || prev.silverPerKg,
            usdInr: b.usdInr || prev.usdInr,
          }));
        }

        if (stRes.status === 'fulfilled' && stRes.value.ok) {
          const s = await stRes.value.json();
          if (Array.isArray(s.stocks) && s.stocks.length > 0) {
            setStocks(s.stocks);
          }
        }
      } catch {
        // retain existing state
      }
    };

    loadTickerData();
    const interval = setInterval(loadTickerData, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const tickerItems = useMemo<TickerItem[]>(() => {
    const equityItems = stocks
      .filter((s) => s.symbol !== 'SENSEX' && s.symbol !== 'NIFTY50')
      .map((s) => ({
        id: `stock-${s.symbol}`,
        label: s.symbol,
        price: `${s.currency === 'USD' ? '$' : '₹'}${s.price.toLocaleString('en-IN')}`,
        changePct: s.changePercent,
        path: `/stocks/${s.slug}/`,
      }));

    return [
      {
        id: 'sensex',
        label: 'SENSEX',
        price: benchmarks.sensex.price.toLocaleString('en-IN'),
        changePct: benchmarks.sensex.changePercent,
        path: '/stocks/sensex/',
        highlight: true,
      },
      {
        id: 'nifty50',
        label: 'NIFTY 50',
        price: benchmarks.nifty50.price.toLocaleString('en-IN'),
        changePct: benchmarks.nifty50.changePercent,
        path: '/stocks/nifty50/',
        highlight: true,
      },
      {
        id: 'gold-24k',
        label: 'GOLD 24K /g',
        price: `₹${benchmarks.gold24KPerGram.toLocaleString('en-IN')}`,
        path: '/gold-rate-today/',
      },
      {
        id: 'silver-kg',
        label: 'SILVER /kg',
        price: `₹${benchmarks.silverPerKg.toLocaleString('en-IN')}`,
        path: '/silver-rate-today/',
      },
      {
        id: 'usdinr',
        label: 'USD/INR',
        price: `₹${benchmarks.usdInr.toFixed(2)}`,
        path: '/commodities/',
      },
      ...equityItems,
    ];
  }, [benchmarks, stocks]);

  const renderSegment = (suffix: string) =>
    tickerItems.map((item) => {
      const hasPct = typeof item.changePct === 'number';
      const isUp = (item.changePct ?? 0) >= 0;

      return (
        <button
          key={`${item.id}-${suffix}`}
          type="button"
          onClick={() => navigate(item.path)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 border-r border-white/10 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span
            className={`text-[11px] font-bold tracking-wide ${
              item.highlight ? 'text-emerald-300' : 'text-slate-300'
            }`}
          >
            {item.label}
          </span>
          <span className="text-[11px] font-mono tabular-nums font-bold text-white">
            {item.price}
          </span>
          {hasPct && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums font-semibold ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 shrink-0" />
              )}
              <span>
                {isUp ? '+' : ''}
                {item.changePct!.toFixed(2)}%
              </span>
            </span>
          )}
        </button>
      );
    });

  return (
    <div
      aria-label="Live market ticker tape"
      className="bg-[#0B1714] border-t border-white/10 overflow-hidden select-none"
    >
      <div className="animate-ticker items-center">
        {renderSegment('a')}
        {renderSegment('b')}
      </div>
    </div>
  );
};
