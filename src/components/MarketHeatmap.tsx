import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Layers, Info } from 'lucide-react';
import { mockStocks } from '../data/financialData';

import { StockData } from '../types';

interface MarketHeatmapProps {
  navigate: (path: string) => void;
  stocks?: StockData[];
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({ navigate, stocks }) => {
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const stockList = stocks && stocks.length > 0 ? stocks : mockStocks;

  // Group stocks by broad sector
  const sectors = [
    {
      name: 'Information Technology',
      stocks: stockList.filter((s) => s.sector.includes('Information Technology') || s.sector.includes('Software')),
      weight: '30%',
    },
    {
      name: 'Oil, Gas & Energy',
      stocks: stockList.filter((s) => s.sector.includes('Oil, Gas') || s.sector.includes('Conglomerate')),
      weight: '25%',
    },
    {
      name: 'Banking & Financials',
      stocks: stockList.filter((s) => s.sector.includes('Banking')),
      weight: '25%',
    },
    {
      name: 'Automobiles & Industry',
      stocks: stockList.filter((s) => s.sector.includes('Automobile')),
      weight: '20%',
    },
  ];

  const getColorClass = (changePercent: number) => {
    if (changePercent >= 2.5) return 'bg-emerald-700 text-white border-emerald-800';
    if (changePercent >= 1.0) return 'bg-emerald-600 text-white border-emerald-700';
    if (changePercent > 0) return 'bg-emerald-500/80 text-white border-emerald-600';
    if (changePercent <= -2.0) return 'bg-rose-700 text-white border-rose-800';
    if (changePercent <= -1.0) return 'bg-rose-600 text-white border-rose-700';
    return 'bg-rose-500/80 text-white border-rose-600';
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 mb-4 gap-2">
        <div>
          <h3 className="font-bold text-stone-900 text-base flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Indian Market Sectoral Heatmap</span>
          </h3>
          <p className="text-xs text-stone-500">
            Tile visualizer weighted by market capitalisation and today’s price momentum
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-1 text-[10px] font-mono-num">
          <span className="text-stone-400 mr-1">Momentum:</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white font-bold">-2%</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold">-1%</span>
          <span className="px-1.5 py-0.5 rounded bg-stone-300 text-stone-800 font-bold">0%</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">+1%</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-bold">+2%+</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {sectors.map((sector) => (
          <div key={sector.name} className="bg-stone-50 rounded-lg p-3 border border-stone-200/70 flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-2 flex items-center justify-between">
              <span className="truncate">{sector.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1">
              {sector.stocks.map((stock) => {
                const color = getColorClass(stock.changePercent);
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stocks/${stock.slug}/`)}
                    onMouseEnter={() => setHoveredStock(stock.symbol)}
                    onMouseLeave={() => setHoveredStock(null)}
                    className={`${color} p-3 rounded-lg border cursor-pointer hover:scale-[1.03] transition-all flex flex-col justify-between shadow-2xs group min-w-0`}
                  >
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm font-mono-num tracking-tight block break-words">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] text-white/80 line-clamp-1">
                        {stock.name}
                      </span>
                    </div>

                    <div className="mt-2 pt-1 border-t border-white/20 flex flex-wrap items-center justify-between gap-1 text-xs font-mono-num font-bold">
                      <span className="break-words">₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      <span>
                        {stock.changePercent >= 0 ? '+' : ''}
                        {stock.changePercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
