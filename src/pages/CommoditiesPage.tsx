import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { mockCommodities as fallbackMockCommodities } from '../data/financialData';
import { CommodityData } from '../types';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SvgChart } from '../components/SvgChart';

interface CommoditiesPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const CommoditiesPage: React.FC<CommoditiesPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const commoditySlug = pathParts[1] || '';

  const [liveCommodities, setLiveCommodities] = useState<CommodityData[]>(fallbackMockCommodities);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const res = await fetch('/api/commodities');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.commodities) && data.commodities.length > 0) {
            setLiveCommodities(data.commodities);
          }
        }
      } catch (e) {
        console.warn('Error fetching live commodities:', e);
      }
    };
    fetchCommodities();
    const interval = setInterval(fetchCommodities, 60000);
    return () => clearInterval(interval);
  }, []);

  const matchedCommodity = liveCommodities.find((c) => c.slug === commoditySlug);

  useEffect(() => {
    if (matchedCommodity) {
      const title = `${matchedCommodity.name} Price Today, Live Futures & Chart | MarketMind`;
      const desc = `Live ${matchedCommodity.name} benchmark price. Real-time global spot and futures quotes ($${matchedCommodity.price} ${matchedCommodity.unit}), 30-day historical chart, and supply-demand factors.`;
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    } else {
      const title = 'Commodities Market Today – Crude Oil, Natural Gas, Copper, Metals | MarketMind';
      const desc = 'Check real-time international and MCX commodity prices for Brent Crude, WTI, Natural Gas, Copper, Aluminium, and Industrial Metals with supply and demand analysis.';
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedCommodity?.slug]);

  if (matchedCommodity) {
    const isUp = matchedCommodity.changePercent >= 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'Commodities', path: '/commodities/' },
            { label: matchedCommodity.name },
          ]}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                {matchedCommodity.category} Benchmark
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {matchedCommodity.name} Price Today
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {matchedCommodity.description}
              </p>
            </div>

            <div className="lg:text-right font-mono min-w-0">
              <span className="text-[11px] text-slate-500 block">Spot / Front-Month Contract</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                ${matchedCommodity.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-slate-500 font-sans">{matchedCommodity.unit}</span>
              <div
                className={`flex items-center lg:justify-end text-xs font-bold mt-1 ${
                  isUp ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                <span>
                  {isUp ? '+' : ''}
                  {matchedCommodity.change.toFixed(2)} ({isUp ? '+' : ''}
                  {matchedCommodity.changePercent.toFixed(2)}%) Today
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-0.5">30-Day Price Trend</h3>
          <p className="text-xs text-slate-500 mb-3">Daily closing contract prices in USD</p>
          <SvgChart
            data={matchedCommodity.historical30D}
            height={220}
            currency="$"
            isPositive={isUp}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-3">
            Core Drivers Affecting {matchedCommodity.name} Prices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            {matchedCommodity.factors.map((factor, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2">
                <span className="text-slate-900 font-bold">•</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs navigate={navigate} items={[{ label: 'Commodities' }]} />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
          Raw Materials & Energy
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Global Commodity Benchmarks
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track crude oil, natural gas, copper, and industrial metals driving global macroeconomic cycles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveCommodities.map((c) => {
          const isUp = c.changePercent >= 0;
          return (
            <div
              key={c.slug}
              onClick={() => navigate(`/commodities/${c.slug}/`)}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {c.category}
                  </span>
                  <span className="text-slate-500 text-[11px]">{c.unit}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-slate-700 transition-colors mb-2">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 font-mono text-xs mt-4">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block">Spot Price</span>
                  <span className="font-bold text-slate-900 text-base break-words">
                    ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold block ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {isUp ? '+' : ''}
                    {c.changePercent}%
                  </span>
                  <span className="text-slate-900 font-sans font-semibold group-hover:underline text-[11px]">
                    Analysis →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
