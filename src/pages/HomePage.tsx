import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Coins,
  BarChart3,
  Globe2,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  History,
} from 'lucide-react';
import {
  goldCityRates as fallbackGoldCityRates,
  mockStocks as fallbackMockStocks,
  mockNewsArticles as fallbackMockNewsArticles,
  mockCrypto as fallbackMockCrypto,
  mockCommodities as fallbackMockCommodities,
} from '../data/financialData';
import { GoldCityRate, StockData, NewsArticle, CryptoData, CommodityData } from '../types';
import { updatePageSeo } from '../utils/seo';
import { GoldHistoryPanel } from '../components/GoldHistoryPanel';
import { buildGoldHistory, GoldPurity } from '../utils/goldHistory';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'gold' | 'silver' | 'stocks' | 'crypto'>('news');
  const [newsCategory, setNewsCategory] = useState<'all' | 'stocks' | 'banking' | 'economy' | 'global'>('all');

  // Live state with resilient fallback defaults
  const [benchmarks, setBenchmarks] = useState<{
    nifty50: { price: number; changePercent: number; change: number };
    sensex: { price: number; changePercent: number; change: number };
    gold24KPerGram: number;
    silverPerKg: number;
    isLive: boolean;
  }>({
    nifty50: { price: 24350.25, changePercent: 0.59, change: 142.8 },
    sensex: { price: 80210.80, changePercent: 0.61, change: 485.2 },
    gold24KPerGram: 14268,
    silverPerKg: 200000,
    isLive: false,
  });

  const [cityRates, setCityRates] = useState<GoldCityRate[]>(fallbackGoldCityRates);
  const [selectedGoldCity, setSelectedGoldCity] = useState<GoldCityRate>(fallbackGoldCityRates[0]);
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver' | 'platinum' | 'diamond'>('gold');
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showGoldHistory, setShowGoldHistory] = useState<boolean>(false);
  const [selectedGoldPurity, setSelectedGoldPurity] = useState<GoldPurity>('24K');

  const [newsList, setNewsList] = useState<NewsArticle[]>(fallbackMockNewsArticles);
  const [stocksList, setStocksList] = useState<StockData[]>(fallbackMockStocks);
  const [cryptoList, setCryptoList] = useState<CryptoData[]>(fallbackMockCrypto);
  const [commoditiesList, setCommoditiesList] = useState<CommodityData[]>(fallbackMockCommodities);
  const [loading, setLoading] = useState(false);

  const [stockTab, setStockTab] = useState<'gainers' | 'losers' | 'most-active'>('gainers');

  // Fetch real data from server live endpoints
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const [bmRes, gsRes, newsRes, stocksRes, cryptoRes, commRes] = await Promise.allSettled([
        fetch('/api/benchmarks'),
        fetch('/api/gold-silver'),
        fetch('/api/news'),
        fetch('/api/stocks'),
        fetch('/api/crypto'),
        fetch('/api/commodities'),
      ]);

      if (bmRes.status === 'fulfilled' && bmRes.value.ok) {
        const bmData = await bmRes.value.json();
        setBenchmarks({
          nifty50: bmData.nifty50 || benchmarks.nifty50,
          sensex: bmData.sensex || benchmarks.sensex,
          gold24KPerGram: bmData.gold24KPerGram || benchmarks.gold24KPerGram,
          silverPerKg: bmData.silverPerKg || benchmarks.silverPerKg,
          isLive: Boolean(bmData.isLive),
        });
      }

      if (gsRes.status === 'fulfilled' && gsRes.value.ok) {
        const gsData = await gsRes.value.json();
        if (Array.isArray(gsData.cities) && gsData.cities.length > 0) {
          setCityRates(gsData.cities);
          setSelectedGoldCity((prev) => {
            const found = gsData.cities.find((c: GoldCityRate) => c.slug === prev.slug);
            return found || gsData.cities[0];
          });
        }
      }

      if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
        const nData = await newsRes.value.json();
        if (Array.isArray(nData.articles) && nData.articles.length > 0) {
          setNewsList(nData.articles);
        }
      }

      if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
        const sData = await stocksRes.value.json();
        if (Array.isArray(sData.stocks) && sData.stocks.length > 0) {
          setStocksList(sData.stocks);
        }
      }

      if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
        const cData = await cryptoRes.value.json();
        if (Array.isArray(cData.crypto) && cData.crypto.length > 0) {
          setCryptoList(cData.crypto);
        }
      }

      if (commRes.status === 'fulfilled' && commRes.value.ok) {
        const cmData = await commRes.value.json();
        if (Array.isArray(cmData.commodities) && cmData.commodities.length > 0) {
          setCommoditiesList(cmData.commodities);
        }
      }
    } catch (err) {
      console.warn('Real data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updatePageSeo({
      title: 'MarketMind – Live Bullion Rates, Financial News & Stock Quotes',
      description: 'Real-time financial news, live Gold & Silver spot rates by city, stock quotes, and metal calculators.',
      canonicalPath: '/',
    });
    fetchLiveData();

    // Auto poll every 60 seconds
    const interval = setInterval(fetchLiveData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = newsCategory === 'all'
    ? newsList
    : newsList.filter((n) => n.category === newsCategory);

  const displayedStocks = (() => {
    switch (stockTab) {
      case 'gainers':
        return stocksList.filter((s) => s.changePercent > 0);
      case 'losers':
        return stocksList.filter((s) => s.changePercent < 0);
      case 'most-active':
      default:
        return stocksList.filter((s) => s.isMostActive);
    }
  })();



  const goldHistory = useMemo(
    () => buildGoldHistory(selectedGoldCity, 30),
    [selectedGoldCity]
  );

  const activeGoldDay = useMemo(
    () => goldHistory.find((d) => d.isoDate === selectedDateIso) || goldHistory[0],
    [goldHistory, selectedDateIso]
  );

  const availableDates = useMemo(() => goldHistory.slice(0, 7), [goldHistory]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* 1. Sleek Terminal Benchmark Tickers */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div
          onClick={() => setActiveTab('stocks')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-colors group min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">NIFTY 50</span>
            <span className={`text-xs font-semibold font-mono tabular-nums ${benchmarks.nifty50.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {benchmarks.nifty50.changePercent >= 0 ? '+' : ''}{benchmarks.nifty50.changePercent}%
            </span>
          </div>
          <div className="text-[15px] sm:text-xl font-bold text-slate-900 font-mono tabular-nums mt-1.5 tracking-tight break-words">
            {benchmarks.nifty50.price.toLocaleString('en-IN')}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('stocks')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-colors group min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SENSEX</span>
            <span className={`text-xs font-semibold font-mono tabular-nums ${benchmarks.sensex.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {benchmarks.sensex.changePercent >= 0 ? '+' : ''}{benchmarks.sensex.changePercent}%
            </span>
          </div>
          <div className="text-[15px] sm:text-xl font-bold text-slate-900 font-mono tabular-nums mt-1.5 tracking-tight break-words">
            {benchmarks.sensex.price.toLocaleString('en-IN')}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('gold');
            setSelectedMetal('gold');
            setSelectedGoldPurity('24K');
            setShowGoldHistory(true);
          }}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-colors group min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">24K GOLD /g</span>
            <span className={`text-xs font-semibold font-mono tabular-nums ${(selectedGoldCity.change24K ?? -185.2) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(selectedGoldCity.change24K ?? -185.2) >= 0 ? '+' : '-'}₹{Math.abs(selectedGoldCity.change24K ?? -185.2)}
            </span>
          </div>
          <div className="text-[15px] sm:text-xl font-bold text-slate-900 font-mono tabular-nums mt-1.5 tracking-tight break-words">
            ₹{selectedGoldCity.rate24KPerGram ? selectedGoldCity.rate24KPerGram.toLocaleString('en-IN') : benchmarks.gold24KPerGram.toLocaleString('en-IN')}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('silver');
            setSelectedMetal('silver');
          }}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-colors group min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SILVER /kg</span>
            <span className={`text-xs font-semibold font-mono tabular-nums ${(selectedGoldCity.silverChange ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(selectedGoldCity.silverChange ?? 0) >= 0 ? '+' : '-'}₹{Math.abs(selectedGoldCity.silverChange ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[15px] sm:text-xl font-bold text-slate-900 font-mono tabular-nums mt-1.5 tracking-tight break-words">
            ₹{selectedGoldCity.silverPerKg ? selectedGoldCity.silverPerKg.toLocaleString('en-IN') : benchmarks.silverPerKg.toLocaleString('en-IN')}
          </div>
        </div>
      </section>

      {/* 2. Horizontal Navigation Options Bar */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center overflow-x-auto text-xs font-medium scrollbar-none shadow-xs">
        <div className="flex items-center space-x-1 shrink-0 min-w-full sm:min-w-0">
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors shrink-0 ${
              activeTab === 'news'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Market News</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gold');
              setSelectedMetal('gold');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors shrink-0 ${
              activeTab === 'gold'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Gold Rate</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('silver');
              setSelectedMetal('silver');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors shrink-0 ${
              activeTab === 'silver'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Silver Rate</span>
          </button>

          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors shrink-0 ${
              activeTab === 'stocks'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stock Prices</span>
          </button>

          <button
            onClick={() => setActiveTab('crypto')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors shrink-0 ${
              activeTab === 'crypto'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Crypto & Commodities</span>
          </button>
        </div>
      </div>
      {/* 3. TAB 1: MARKET NEWS FEED */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Newspaper className="w-4 h-4 text-slate-700" />
                <span>Financial News</span>
              </h2>
            </div>

            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto scrollbar-none max-w-full shadow-xs">
              {(['all', 'stocks', 'banking', 'economy', 'global'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewsCategory(cat)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 ${
                    newsCategory === cat
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredNews.map((article, idx) => (
              <div
                key={`${article.id || article.slug}-${idx}`}
                onClick={() => navigate(`/news/${article.slug}/`)}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group space-y-2.5"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                    {article.category}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {article.source || article.author || 'Market News'}
                  </span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                  <span>·</span>
                  <span>{article.publishedAt}</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {article.summary}
                </p>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-900 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Key Takeaways</span>
                  </div>
                  {article.aiBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start text-xs text-slate-600">
                      <span className="text-slate-400 font-bold mr-1.5">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 2 & 3: BULLION RATES & INVOICE CALCULATOR */}
      {(activeTab === 'gold' || activeTab === 'silver') && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs space-y-4">
          {/* Controls Bar: Date + City */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 tracking-tight">Market Benchmarks:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{activeGoldDay.label}{activeGoldDay.isToday ? ' (Today)' : ''}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30">
                    {availableDates.map((d) => {
                      const isCurrent = d.isoDate === activeGoldDay.isoDate;
                      return (
                        <button
                          key={d.isoDate}
                          type="button"
                          onClick={() => {
                            setSelectedDateIso(d.isToday ? null : d.isoDate);
                            setShowDatePicker(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer ${
                            isCurrent ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                          }`}
                        >
                          <span>{d.label}{d.isToday ? ' (Today)' : ''}</span>
                          {isCurrent && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!activeGoldDay.isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDateIso(null)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Delivery Center:</span>
              <select
                aria-label="Select City"
                value={selectedGoldCity.slug}
                onChange={(e) => {
                  const city = cityRates.find((c) => c.slug === e.target.value);
                  if (city) setSelectedGoldCity(city);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer focus:border-slate-400 transition-colors"
              >
                {cityRates.map((c) => (
                  <option key={c.slug} value={c.slug} className="text-slate-900">
                    {c.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metal Segmented Control */}
          <div className="flex items-center justify-between">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex items-center space-x-1">
              {(['gold', 'silver', 'platinum', 'diamond'] as const).map((metal) => {
                const isActive = selectedMetal === metal;
                return (
                  <button
                    key={metal}
                    type="button"
                    onClick={() => {
                      if (metal === 'gold' || metal === 'silver') setActiveTab(metal);
                      setSelectedMetal(metal);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {metal}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Source: IBJA & MCX Spot (Landed)
            </span>
          </div>

          {/* 3 RATE CARDS */}
          {selectedMetal === 'gold' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  {
                    purityKey: '24K' as GoldPurity,
                    label: '24K Gold /g',
                    purity: '99.9% Fine',
                    price: activeGoldDay.rate24KPerGram,
                    change: activeGoldDay.change24KPerGram,
                  },
                  {
                    purityKey: '22K' as GoldPurity,
                    label: '22K Gold /g',
                    purity: '91.6% Hallmark',
                    price: activeGoldDay.rate22KPerGram,
                    change: activeGoldDay.change22KPerGram,
                  },
                  {
                    purityKey: '18K' as GoldPurity,
                    label: '18K Gold /g',
                    purity: '75.0% Jewelry',
                    price: activeGoldDay.rate18KPerGram,
                    change: activeGoldDay.change18KPerGram,
                  },
                ].map((item) => {
                  const isUp = item.change >= 0;
                  const isSelectedCard = showGoldHistory && selectedGoldPurity === item.purityKey;
                  return (
                    <button
                      key={item.purityKey}
                      type="button"
                      onClick={() => {
                        if (showGoldHistory && selectedGoldPurity === item.purityKey) {
                          setShowGoldHistory(false);
                        } else {
                          setSelectedGoldPurity(item.purityKey);
                          setShowGoldHistory(true);
                        }
                      }}
                      className={`text-left rounded-xl p-3.5 sm:p-4 transition-all min-w-0 flex sm:block items-center justify-between gap-3 cursor-pointer group ${
                        isSelectedCard
                          ? 'bg-white border-2 border-slate-900 shadow-xs'
                          : 'bg-slate-50/70 border border-slate-200 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                            {item.purity}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">
                          {item.purity}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 mt-1 sm:hidden">
                          <History className="w-3 h-3" />
                          <span>{isSelectedCard ? 'Hide history' : 'View history'}</span>
                        </span>
                      </div>

                      <div className="text-right sm:text-left min-w-0">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>

                        <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono mt-0.5 gap-2">
                          <span className={`font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isUp ? '+' : '-'}₹{Math.abs(item.change)}
                          </span>
                          <span className="text-slate-500 hidden sm:inline">
                            10g: ₹{(item.price * 10).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="hidden sm:flex items-center justify-between mt-2 text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">
                          <span className="inline-flex items-center gap-1">
                            <History className="w-3 h-3" />
                            <span>{isSelectedCard ? 'Showing date history' : 'Click for date history'}</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {showGoldHistory && (
                <GoldHistoryPanel
                  city={selectedGoldCity}
                  selectedPurity={selectedGoldPurity}
                  onSelectPurity={setSelectedGoldPurity}
                  selectedDateIso={activeGoldDay.isoDate}
                  onSelectDate={(day) =>
                    setSelectedDateIso(day.isToday ? null : day.isoDate)
                  }
                  onClose={() => setShowGoldHistory(false)}
                  onOpenFullPage={() =>
                    navigate(
                      selectedGoldCity.slug === 'national'
                        ? '/gold-rate-today/'
                        : `/gold-rate-today/${selectedGoldCity.slug}/`
                    )
                  }
                />
              )}
            </div>
          )}

          {selectedMetal === 'silver' && (() => {
            const silverKgChange = selectedGoldCity.silverChange ?? 0;
            const silverItems = [
              {
                label: 'Fine Silver /g',
                price: selectedGoldCity.silverPerGram,
                change: Number((silverKgChange / 1000).toFixed(2)),
              },
              {
                label: 'Silver Bar /10g',
                price: Math.round(selectedGoldCity.silverPerGram * 10),
                change: Math.round((silverKgChange / 100) * 10) / 10,
              },
              {
                label: 'Silver Kilobar /1kg',
                price: selectedGoldCity.silverPerKg,
                change: silverKgChange,
              },
            ];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {silverItems.map((item, idx) => {
                  const isUp = item.change >= 0;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 transition-colors min-w-0 flex sm:block items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">{item.label}</span>
                        <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">999 Refined</span>
                      </div>
                      <div className="text-right sm:text-left min-w-0">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono font-semibold mt-0.5">
                          <span className={isUp ? 'text-emerald-600' : 'text-rose-600'}>
                            {isUp ? '+' : '-'}₹{Math.abs(item.change).toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-500 hidden sm:inline font-normal">999 Refined</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {selectedMetal === 'platinum' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: 'Platinum /g', price: 3850, change: 15 },
                { label: 'Platinum /10g', price: 38500, change: 150 },
                { label: 'Platinum /100g', price: 385000, change: 1500 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 transition-colors min-w-0 flex sm:block items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">{item.label}</span>
                    <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">950 Pt Hallmark</span>
                  </div>
                  <div className="text-right sm:text-left min-w-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono text-emerald-600 font-semibold mt-0.5">
                      <span>+₹{item.change.toLocaleString('en-IN')}</span>
                      <span className="text-slate-500 hidden sm:inline font-normal">950 Pt Hallmark</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedMetal === 'diamond' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: '0.50 Carat (VS1 / G)', price: 42500, change: 250 },
                { label: '1.00 Carat (VVS1 / F)', price: 165000, change: 800 },
                { label: '2.00 Carat (Solitaire / D)', price: 480000, change: 2400 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 transition-colors min-w-0 flex sm:block items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">{item.label}</span>
                    <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">IGI / GIA Certified</span>
                  </div>
                  <div className="text-right sm:text-left min-w-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono text-emerald-600 font-semibold mt-0.5">
                      <span>+₹{item.change.toLocaleString('en-IN')}</span>
                      <span className="text-slate-500 hidden sm:inline font-normal">IGI / GIA Certified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* 5. TAB 4: STOCKS TABLE */}
      {activeTab === 'stocks' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              <span>Equity Market Quotes</span>
            </h3>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setStockTab('gainers')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  stockTab === 'gainers' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gainers
              </button>
              <button
                onClick={() => setStockTab('losers')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  stockTab === 'losers' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Losers
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Company Symbol</th>
                  <th className="py-2.5 px-3 text-right">LTP (₹)</th>
                  <th className="py-2.5 px-3 text-right">Change (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-num">
                {displayedStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => navigate(`/stocks/${stock.slug}/`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">{stock.symbol}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {stock.currency === 'USD' ? '$' : '₹'}{stock.price.toLocaleString('en-IN')}
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
      )}

      {/* 6. TAB 5: CRYPTO & COMMODITIES */}
      {activeTab === 'crypto' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center justify-between">
              <span>Cryptocurrency Feed</span>
              <span className="text-[10px] text-slate-500 font-normal">CoinGecko Benchmark</span>
            </h3>
            <div className="space-y-2 font-mono-num text-xs">
              {cryptoList.map((coin) => (
                <div
                  key={coin.symbol}
                  onClick={() => navigate(`/crypto/${coin.slug}/`)}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition-all"
                >
                  <span className="font-sans font-semibold text-slate-900 min-w-0 break-words">{coin.name}</span>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">${coin.priceUSD.toLocaleString('en-US')}</span>
                    <span className={`block text-[10px] ${coin.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-xs mb-3">Commodities Spot & Futures</h3>
            <div className="space-y-2 font-mono-num text-xs">
              {commoditiesList.map((c) => (
                <div
                  key={c.slug}
                  onClick={() => navigate(`/commodities/${c.slug}/`)}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition-all"
                >
                  <span className="font-sans font-semibold text-slate-900 min-w-0 break-words">{c.name}</span>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">${c.price}</span>
                    <span className={`block text-[10px] ${c.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {c.changePercent >= 0 ? '+' : ''}{c.changePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
