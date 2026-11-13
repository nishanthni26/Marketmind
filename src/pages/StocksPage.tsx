import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { mockStocks } from '../data/financialData';
import { StockData } from '../types';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { RechartsTrendChart } from '../components/RechartsTrendChart';
import { WatchlistButton } from '../utils/watchlist';

interface StocksPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const StocksPage: React.FC<StocksPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const subPath = pathParts[1] || '';

  const [liveStocks, setLiveStocks] = useState<StockData[]>(mockStocks);
  const [benchmarks, setBenchmarks] = useState<{
    nifty50?: { price: number; changePercent: number; change: number };
    sensex?: { price: number; changePercent: number; change: number };
    lastFetched?: string;
    isLive?: boolean;
  }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveStockData = async () => {
    setIsRefreshing(true);
    try {
      const [stocksRes, benchRes] = await Promise.all([
        fetch('/api/stocks'),
        fetch('/api/benchmarks'),
      ]);

      if (stocksRes.ok) {
        const data = await stocksRes.json();
        if (Array.isArray(data.stocks) && data.stocks.length > 0) {
          setLiveStocks(data.stocks);
        }
      }

      if (benchRes.ok) {
        const bData = await benchRes.json();
        setBenchmarks(bData);
      }
    } catch (e) {
      console.warn('Error fetching live stock data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStockData();
    const interval = setInterval(fetchLiveStockData, 10000);
    return () => clearInterval(interval);
  }, []);

  const normalizedSubPath = subPath.toLowerCase();
  const matchedStock = liveStocks.find(
    (s) =>
      s.slug === normalizedSubPath ||
      s.symbol.toLowerCase() === normalizedSubPath ||
      (normalizedSubPath === 'sensex' && s.symbol === 'SENSEX') ||
      (normalizedSubPath === 'nifty' && s.symbol === 'NIFTY50') ||
      (normalizedSubPath === 'nifty50' && s.symbol === 'NIFTY50') ||
      (normalizedSubPath === 'bsesn' && s.symbol === 'SENSEX') ||
      (normalizedSubPath === 'nsei' && s.symbol === 'NIFTY50')
  );

  const isIndexPage =
    matchedStock && (matchedStock.symbol === 'SENSEX' || matchedStock.symbol === 'NIFTY50');

  const [timeframe, setTimeframe] = useState<'1D' | '1M' | '1Y' | '5Y'>('1M');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredStocks = (() => {
    switch (categoryFilter) {
      case 'nse':
        return liveStocks.filter((s) => s.exchange === 'NSE');
      case 'bse':
        return liveStocks.filter((s) => s.exchange === 'BSE');
      case 'international':
        return liveStocks.filter((s) => s.category === 'international');
      case 'top-gainers':
        return [...liveStocks].filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
      case 'top-losers':
        return [...liveStocks].filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
      case 'most-active':
        return [...liveStocks].filter((s) => s.isMostActive).sort((a, b) => b.volume - a.volume);
      default:
        return liveStocks;
    }
  })();

  useEffect(() => {
    if (matchedStock) {
      const pageTitle = isIndexPage
        ? `Live ${matchedStock.name} Today - Indian Market Benchmark`
        : `${matchedStock.name} (${matchedStock.symbol}) Share Price Today`;
      const metaDescription = `Live real-time updates for ${matchedStock.name}. Interactive price charts, day range, AI market insights, and constituent stocks.`;

      updatePageSeo({
        title: pageTitle,
        description: metaDescription,
        canonicalPath: currentPath,
      });

      fetchAiAnalysis(matchedStock);
    } else {
      updatePageSeo({
        title: 'Live Sensex, Nifty 50 & Indian Stock Quotes',
        description: 'Track live BSE Sensex, NSE Nifty 50, top gainers, losers, and stock quotes in real-time on MarketMind.',
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedStock?.symbol]);

  const fetchAiAnalysis = async (stock: StockData) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${stock.name} (${stock.symbol})`,
          contextType: isIndexPage ? 'Market Benchmark Index' : 'Equities',
          currentPrice: `${stock.currency === 'INR' ? '₹' : '$'}${stock.price}`,
          changePercent: stock.changePercent,
        }),
      });
      const data = await res.json();
      setAiExplanation(data.text);
    } catch (e) {
      console.error(e);
      setAiExplanation(
        stock.aiExplanation ||
          `${stock.name} is responding to prevailing institutional liquidity, global equity signals, and macroeconomic indicators.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const sensexStock = liveStocks.find((s) => s.symbol === 'SENSEX');
  const niftyStock = liveStocks.find((s) => s.symbol === 'NIFTY50');

  // Single Stock or Index Detail Page
  if (matchedStock) {
    const isUp = matchedStock.changePercent >= 0;
    const chartData =
      timeframe === '1D'
        ? matchedStock.historical1D
        : timeframe === '1M'
        ? matchedStock.historical1M
        : timeframe === '1Y'
        ? matchedStock.historical1Y
        : matchedStock.historical5Y;

    // Filter bluechip constituents for Index views
    const constituents = liveStocks.filter(
      (s) => s.symbol !== 'SENSEX' && s.symbol !== 'NIFTY50'
    );

    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'Stocks & Indices', path: '/stocks/' },
            {
              label: matchedStock.exchange === 'NSE' ? 'NSE' : 'BSE',
              path: matchedStock.exchange === 'NSE' ? '/stocks/nse/' : '/stocks/bse/',
            },
            { label: `${matchedStock.name}` },
          ]}
        />

        {/* Index Quick Switcher Bar (If viewing Sensex or Nifty) */}
        {isIndexPage && (
          <div className="bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-between gap-2 overflow-x-auto shadow-xs">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center space-x-1 shrink-0">
              <button
                onClick={() => navigate('/stocks/sensex/')}
                className={`px-3.5 py-1.5 rounded-md font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer ${
                  matchedStock.symbol === 'SENSEX'
                    ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>BSE SENSEX</span>
                {benchmarks.sensex && (
                  <span className="font-mono text-[11px] opacity-90">
                    ₹{benchmarks.sensex.price.toLocaleString('en-IN')}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/stocks/nifty50/')}
                className={`px-3.5 py-1.5 rounded-md font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer ${
                  matchedStock.symbol === 'NIFTY50'
                    ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>NSE NIFTY 50</span>
                {benchmarks.nifty50 && (
                  <span className="font-mono text-[11px] opacity-90">
                    ₹{benchmarks.nifty50.price.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs text-slate-900 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase tracking-wider border border-slate-200">
                  {matchedStock.exchange}: {matchedStock.symbol}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {matchedStock.sector}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                {matchedStock.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl line-clamp-2">
                {matchedStock.description}
              </p>
              {!isIndexPage && (
                <div className="mt-3">
                  <WatchlistButton
                    item={{
                      id: `stock:${matchedStock.symbol}`,
                      type: 'stock',
                      label: matchedStock.symbol,
                      sublabel: matchedStock.name,
                      path: `/stocks/${matchedStock.slug}/`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 font-mono-num tracking-tight break-words">
                {matchedStock.currency === 'INR' ? '₹' : '$'}
                {matchedStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                className={`flex items-center sm:justify-end text-sm font-bold font-mono-num mt-1 ${
                  isUp ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isUp ? <TrendingUp className="w-4 h-4 mr-1 shrink-0" /> : <TrendingDown className="w-4 h-4 mr-1 shrink-0" />}
                <span className="break-words">
                  {isUp ? '+' : ''}
                  {matchedStock.change.toFixed(2)} ({isUp ? '+' : ''}
                  {matchedStock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 font-mono-num break-words">
                Previous Close: ₹{matchedStock.previousClose.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Day Range Bar */}
          <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-num">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Day Open</span>
              <span className="font-bold text-slate-900 break-words block">₹{matchedStock.open.toLocaleString('en-IN')}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Day High</span>
              <span className="font-bold text-emerald-600 break-words block">₹{matchedStock.high.toLocaleString('en-IN')}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Day Low</span>
              <span className="font-bold text-rose-600 break-words block">₹{matchedStock.low.toLocaleString('en-IN')}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">52W High / Low</span>
              <span className="font-bold text-slate-900 break-words block">₹{matchedStock.high52W} / ₹{matchedStock.low52W}</span>
            </div>
          </div>
        </div>

        {/* Chart & AI Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Chart Card */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isIndexPage ? 'Index Trajectory' : 'Price Trend'}
                </h3>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                {(['1D', '1M', '1Y', '5Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      timeframe === tf
                        ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <RechartsTrendChart
              data={chartData}
              height={240}
              currency={matchedStock.currency === 'INR' ? '₹' : '$'}
              isPositive={isUp}
              chartTheme={isIndexPage ? 'emerald' : 'auto'}
            />
          </div>

          {/* AI Intelligence Card */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isIndexPage ? 'Index Intelligence' : 'Stock Analysis'}
                  </h3>
                </div>
                <button
                  onClick={() => fetchAiAnalysis(matchedStock)}
                  disabled={aiLoading}
                  className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Analyze</span>
                </button>
              </div>

              {aiLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                  <span>Evaluating institutional volume & order flow...</span>
                </div>
              ) : (
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {aiExplanation}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono-num">
              <span>Source: MarketMind Research Engine</span>
              <span>Updated: {matchedStock.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics / Fundamentals */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>{isIndexPage ? 'Benchmark Index Metrics' : 'Key Fundamentals'}</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-num text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0">
              <span className="text-slate-500 text-[10px] font-sans font-semibold block">Market Valuation</span>
              <span className="font-bold text-slate-900 mt-0.5 block break-words">{matchedStock.marketCap}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0">
              <span className="text-slate-500 text-[10px] font-sans font-semibold block">P/E Valuation Ratio</span>
              <span className="font-bold text-slate-900 mt-0.5 block break-words">{matchedStock.peRatio}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0">
              <span className="text-slate-500 text-[10px] font-sans font-semibold block">52-Week Range</span>
              <span className="font-bold text-slate-900 mt-0.5 block break-words">₹{matchedStock.low52W} - ₹{matchedStock.high52W}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0">
              <span className="text-slate-500 text-[10px] font-sans font-semibold block">Trading Volume</span>
              <span className="font-bold text-slate-900 mt-0.5 block break-words">{matchedStock.volumeDisplay}</span>
            </div>
          </div>
        </div>

        {/* Index Constituent Equities Table (If on Sensex or Nifty page) */}
        {isIndexPage && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Top Constituent Heavyweight Stocks
                </h3>
                <p className="text-xs text-slate-500">
                  Key blue-chip companies driving {matchedStock.name} price movements today.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg font-mono-num">
                {constituents.length} Listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Day Change</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-num">
                  {constituents.map((c) => {
                    const cIsUp = c.changePercent >= 0;
                    return (
                      <tr
                        key={c.symbol}
                        onClick={() => navigate(`/stocks/${c.slug}/`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-sans font-semibold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{c.exchange}: {c.symbol}</div>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-500 text-[11px]">
                          {c.sector.split('/')[0]}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          ₹{c.price.toLocaleString('en-IN')}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold ${
                            cIsUp ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {cIsUp ? '+' : ''}
                          {c.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center text-[10px] font-semibold text-blue-600 hover:underline">
                            Details <ExternalLink className="w-3 h-3 ml-1" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stock Market Overview Hub Page (All Equities + Sensex & Nifty Featured Cards)
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <Breadcrumbs
        navigate={navigate}
        items={[
          { label: 'Stocks & Indices', path: '/stocks/' },
          { label: 'All Equities' },
        ]}
      />

      {/* Hero Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase tracking-wider border border-slate-200">
              EQUITIES
            </span>
            <span className="text-xs font-semibold text-slate-500">NSE & BSE Benchmark Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Indian Stock Market & Indices
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Live quotes for BSE Sensex, NSE Nifty 50, top gainers, losers, and institutional sector trends.
          </p>
        </div>
      </div>

      {/* Featured Live Benchmark Cards: SENSEX & NIFTY 50 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIFTY 50 Card */}
        <div
          onClick={() => navigate('/stocks/nifty50/')}
          className="bg-white hover:border-slate-300 rounded-xl border border-slate-200 p-5 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                NSE
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  NSE NIFTY 50
                </h3>
                <span className="text-[10px] text-slate-500 font-medium block">50 Flagship Bluechips</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 mt-3 font-mono-num">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
              {(niftyStock?.price ?? benchmarks.nifty50?.price ?? 24350.25).toLocaleString('en-IN')}
            </div>
            <div
              className={`text-sm font-bold flex items-center ${
                (niftyStock?.changePercent ?? benchmarks.nifty50?.changePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(niftyStock?.changePercent ?? benchmarks.nifty50?.changePercent ?? 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 shrink-0" />
              )}
              <span>
                {(niftyStock?.change ?? benchmarks.nifty50?.change ?? 0) >= 0 ? '+' : ''}
                {(niftyStock?.change ?? benchmarks.nifty50?.change ?? 0).toFixed(2)} (
                {(niftyStock?.changePercent ?? benchmarks.nifty50?.changePercent ?? 0) >= 0 ? '+' : ''}
                {(niftyStock?.changePercent ?? benchmarks.nifty50?.changePercent ?? 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>View Nifty 50 Dashboard</span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* SENSEX Card */}
        <div
          onClick={() => navigate('/stocks/sensex/')}
          className="bg-white hover:border-slate-300 rounded-xl border border-slate-200 p-5 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                BSE
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  BSE SENSEX
                </h3>
                <span className="text-[10px] text-slate-500 font-medium block">30 Heavyweight Equities</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 mt-3 font-mono-num">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
              {(sensexStock?.price ?? benchmarks.sensex?.price ?? 80210.80).toLocaleString('en-IN')}
            </div>
            <div
              className={`text-sm font-bold flex items-center ${
                (sensexStock?.changePercent ?? benchmarks.sensex?.changePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(sensexStock?.changePercent ?? benchmarks.sensex?.changePercent ?? 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 shrink-0" />
              )}
              <span>
                {(sensexStock?.change ?? benchmarks.sensex?.change ?? 0) >= 0 ? '+' : ''}
                {(sensexStock?.change ?? benchmarks.sensex?.change ?? 0).toFixed(2)} (
                {(sensexStock?.changePercent ?? benchmarks.sensex?.changePercent ?? 0) >= 0 ? '+' : ''}
                {(sensexStock?.changePercent ?? benchmarks.sensex?.changePercent ?? 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>View Sensex Dashboard</span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 border-b border-slate-200">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center space-x-1 text-xs font-semibold shrink-0">
            {[
              { id: 'all', label: 'All Equities' },
              { id: 'top-gainers', label: 'Top Gainers' },
              { id: 'top-losers', label: 'Top Losers' },
              { id: 'most-active', label: 'Most Active' },
              { id: 'nse', label: 'NSE Listed' },
              { id: 'bse', label: 'BSE Listed' },
              { id: 'international', label: 'Global US' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Company / Asset</th>
                <th className="py-2.5 px-3">Exchange</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-num">
              {filteredStocks.map((stock) => {
                const isPositive = stock.changePercent >= 0;
                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => navigate(`/stocks/${stock.slug}/`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {stock.symbol !== 'SENSEX' && stock.symbol !== 'NIFTY50' && (
                          <WatchlistButton
                            compact
                            item={{
                              id: `stock:${stock.symbol}`,
                              type: 'stock',
                              label: stock.symbol,
                              sublabel: stock.name,
                              path: `/stocks/${stock.slug}/`,
                            }}
                          />
                        )}
                        <div>
                          <div className="font-sans font-semibold text-slate-900">{stock.name}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{stock.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">{stock.exchange}</td>
                    <td className="py-3 px-3 font-sans text-slate-500 text-[11px]">
                      {stock.sector.split('/')[0]}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {stock.currency === 'INR' ? '₹' : '$'}
                      {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
