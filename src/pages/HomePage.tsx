import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Coins,
  BarChart3,
  Globe2,
  Calendar,
  ChevronDown,
  CheckCircle2,
  History,
  Star,
  Briefcase,
  Calculator,
  Scale,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  goldCityRates as fallbackGoldCityRates,
  mockStocks as fallbackMockStocks,
  mockNewsArticles as fallbackMockNewsArticles,
  mockCrypto as fallbackMockCrypto,
  mockCommodities as fallbackMockCommodities,
  mockMutualFunds,
} from '../data/financialData';
import { GoldCityRate, StockData, NewsArticle, CryptoData, CommodityData } from '../types';
import { updatePageSeo } from '../utils/seo';
import { GoldHistoryPanel } from '../components/GoldHistoryPanel';
import { SilverHistoryPanel } from '../components/SilverHistoryPanel';
import {
  buildGoldHistory,
  buildSilverHistory,
  GoldPurity,
  SilverUnit,
} from '../utils/goldHistory';
import { useWatchlist, WatchlistButton } from '../utils/watchlist';

interface HomePageProps {
  navigate: (path: string) => void;
}

type HeroBenchmarkKey = 'nifty50' | 'sensex' | 'gold' | 'silver';

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'gold' | 'silver' | 'stocks' | 'crypto'>('news');
  const [newsCategory, setNewsCategory] = useState<'all' | 'stocks' | 'banking' | 'economy' | 'global'>('all');

  const [heroAsset, setHeroAsset] = useState<HeroBenchmarkKey>('nifty50');
  const [heroRange, setHeroRange] = useState<'short' | 'long'>('short');
  const [pulseTab, setPulseTab] = useState<'gainers' | 'losers'>('gainers');
  const [stockSearch, setStockSearch] = useState('');

  // Live state with resilient fallback defaults
  const [benchmarks, setBenchmarks] = useState<{
    nifty50: { price: number; changePercent: number; change: number };
    sensex: { price: number; changePercent: number; change: number };
    gold24KPerGram: number;
    silverPerKg: number;
    usdInr: number;
    isLive: boolean;
  }>({
    nifty50: { price: 24350.25, changePercent: 0.59, change: 142.8 },
    sensex: { price: 80210.80, changePercent: 0.61, change: 485.2 },
    gold24KPerGram: 14268,
    silverPerKg: 200000,
    usdInr: 93.85,
    isLive: false,
  });

  const [cityRates, setCityRates] = useState<GoldCityRate[]>(fallbackGoldCityRates);
  const [selectedGoldCity, setSelectedGoldCity] = useState<GoldCityRate>(fallbackGoldCityRates[0]);
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver' | 'platinum' | 'diamond'>('gold');
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showGoldHistory, setShowGoldHistory] = useState<boolean>(false);
  const [selectedGoldPurity, setSelectedGoldPurity] = useState<GoldPurity>('24K');
  const [showSilverHistory, setShowSilverHistory] = useState<boolean>(false);
  const [selectedSilverUnit, setSelectedSilverUnit] = useState<SilverUnit>('1kg');

  const { items: watchlistItems } = useWatchlist();

  const [newsList, setNewsList] = useState<NewsArticle[]>(fallbackMockNewsArticles);
  const [stocksList, setStocksList] = useState<StockData[]>(fallbackMockStocks);
  const [cryptoList, setCryptoList] = useState<CryptoData[]>(fallbackMockCrypto);
  const [commoditiesList, setCommoditiesList] = useState<CommodityData[]>(fallbackMockCommodities);
  const [stockTab, setStockTab] = useState<'all' | 'gainers' | 'losers'>('all');

  const fetchLiveData = async () => {
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
        setBenchmarks((prev) => ({
          nifty50: bmData.nifty50 || prev.nifty50,
          sensex: bmData.sensex || prev.sensex,
          gold24KPerGram: bmData.gold24KPerGram || prev.gold24KPerGram,
          silverPerKg: bmData.silverPerKg || prev.silverPerKg,
          usdInr: bmData.usdInr || prev.usdInr,
          isLive: Boolean(bmData.isLive),
        }));
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
    }
  };

  useEffect(() => {
    updatePageSeo({
      title: 'MarketMind – Live Bullion Rates, Financial News & Stock Quotes',
      description: 'Real-time financial news, live Gold & Silver spot rates by city, stock quotes, and metal calculators.',
      canonicalPath: '/',
    });
    fetchLiveData();

    const interval = setInterval(fetchLiveData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = useMemo(
    () =>
      newsCategory === 'all'
        ? newsList
        : newsList.filter((n) => n.category === newsCategory),
    [newsList, newsCategory]
  );

  const equities = useMemo(
    () => stocksList.filter((s) => s.symbol !== 'SENSEX' && s.symbol !== 'NIFTY50'),
    [stocksList]
  );

  const marketBreadth = useMemo(() => {
    const advances = equities.filter((s) => s.changePercent >= 0).length;
    const declines = equities.length - advances;
    const advPct = equities.length > 0 ? Math.round((advances / equities.length) * 100) : 50;
    return { advances, declines, advPct };
  }, [equities]);

  const displayedStocks = useMemo(() => {
    const query = stockSearch.trim().toLowerCase();
    let list = equities;
    if (stockTab === 'gainers') {
      list = list.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    } else if (stockTab === 'losers') {
      list = list.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    }
    if (query) {
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.sector.toLowerCase().includes(query)
      );
    }
    return list;
  }, [equities, stockTab, stockSearch]);

  const pulseMovers = useMemo(() => {
    if (pulseTab === 'gainers') {
      return [...equities]
        .filter((s) => s.changePercent >= 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);
    }
    const losers = [...equities]
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent);
    return (losers.length > 0 ? losers : [...equities].sort((a, b) => a.changePercent - b.changePercent)).slice(0, 5);
  }, [equities, pulseTab]);

  const goldHistory = useMemo(
    () => buildGoldHistory(selectedGoldCity, 30),
    [selectedGoldCity]
  );

  const activeGoldDay = useMemo(
    () => goldHistory.find((d) => d.isoDate === selectedDateIso) || goldHistory[0],
    [goldHistory, selectedDateIso]
  );

  const silverHistory = useMemo(
    () => buildSilverHistory(selectedGoldCity, 30),
    [selectedGoldCity]
  );

  const activeSilverDay = useMemo(
    () => silverHistory.find((d) => d.isoDate === selectedDateIso) || silverHistory[0],
    [silverHistory, selectedDateIso]
  );

  const availableDates = useMemo(() => goldHistory.slice(0, 7), [goldHistory]);

  const watchlistPreview = useMemo(() => {
    return watchlistItems.slice(0, 4).map((w) => {
      let priceLabel = '—';
      let changePct: number | null = null;
      if (w.type === 'stock') {
        const sym = w.id.replace('stock:', '');
        const st = stocksList.find((s) => s.symbol === sym);
        if (st) {
          priceLabel = `${st.currency === 'USD' ? '$' : '₹'}${st.price.toLocaleString('en-IN')}`;
          changePct = st.changePercent;
        }
      } else if (w.type === 'mutual-fund') {
        const slug = w.id.replace('mf:', '');
        const mf = mockMutualFunds.find((m) => m.slug === slug);
        if (mf) {
          priceLabel = `₹${mf.nav.toLocaleString('en-IN')}`;
          changePct = mf.navChangePercent;
        }
      } else if (w.type === 'crypto') {
        const sym = w.id.replace('crypto:', '');
        const c = cryptoList.find((x) => x.symbol === sym);
        if (c) {
          priceLabel = `₹${c.priceINR.toLocaleString('en-IN')}`;
          changePct = c.change24h;
        }
      } else if (w.type === 'city') {
        const slug = w.id.replace('city:', '');
        const ct = cityRates.find((x) => x.slug === slug);
        if (ct) {
          priceLabel = `₹${ct.rate24KPerGram.toLocaleString('en-IN')}/g`;
          changePct = ct.changePercent;
        }
      }
      return { ...w, priceLabel, changePct };
    });
  }, [watchlistItems, stocksList, cryptoList, cityRates]);

  const heroData = useMemo(() => {
    const niftyObj = stocksList.find((s) => s.symbol === 'NIFTY50');
    const sensexObj = stocksList.find((s) => s.symbol === 'SENSEX');

    if (heroAsset === 'nifty50') {
      const series = (heroRange === 'short' ? niftyObj?.historical1D : niftyObj?.historical1M) || [
        { date: '09:15', price: 24220 },
        { date: '11:45', price: 24270 },
        { date: '14:15', price: 24380 },
        { date: '15:30', price: benchmarks.nifty50.price },
      ];
      const normalized = series.map((pt, idx) =>
        idx === series.length - 1 ? { ...pt, price: benchmarks.nifty50.price } : pt
      );
      return {
        title: 'NSE NIFTY 50',
        subtitle: '50 Bluechip Equities · NSE Benchmark',
        valueFormatted: benchmarks.nifty50.price.toLocaleString('en-IN'),
        deltaText: `${benchmarks.nifty50.change >= 0 ? '+' : ''}${benchmarks.nifty50.change.toFixed(2)} (${benchmarks.nifty50.changePercent >= 0 ? '+' : ''}${benchmarks.nifty50.changePercent.toFixed(2)}%)`,
        isUp: benchmarks.nifty50.changePercent >= 0,
        strokeColor: benchmarks.nifty50.changePercent >= 0 ? '#10b981' : '#f43f5e',
        shortLabel: '1D',
        longLabel: '1M',
        series: normalized,
        metrics: [
          { label: 'Open', value: (niftyObj?.open ?? 24220).toLocaleString('en-IN') },
          { label: 'Day Low', value: (niftyObj?.low ?? 24190.5).toLocaleString('en-IN') },
          { label: 'Day High', value: (niftyObj?.high ?? 24395.1).toLocaleString('en-IN') },
          { label: 'Prev Close', value: (niftyObj?.previousClose ?? 24207.45).toLocaleString('en-IN') },
        ],
        ctaLabel: 'Open Nifty 50 Analysis',
        ctaPath: '/stocks/nifty50/',
      };
    }

    if (heroAsset === 'sensex') {
      const series = (heroRange === 'short' ? sensexObj?.historical1D : sensexObj?.historical1M) || [
        { date: '09:15', price: 79850 },
        { date: '11:45', price: 79980 },
        { date: '14:15', price: 80310 },
        { date: '15:30', price: benchmarks.sensex.price },
      ];
      const normalized = series.map((pt, idx) =>
        idx === series.length - 1 ? { ...pt, price: benchmarks.sensex.price } : pt
      );
      return {
        title: 'BSE SENSEX',
        subtitle: '30 Flagship Enterprises · BSE Benchmark',
        valueFormatted: benchmarks.sensex.price.toLocaleString('en-IN'),
        deltaText: `${benchmarks.sensex.change >= 0 ? '+' : ''}${benchmarks.sensex.change.toFixed(2)} (${benchmarks.sensex.changePercent >= 0 ? '+' : ''}${benchmarks.sensex.changePercent.toFixed(2)}%)`,
        isUp: benchmarks.sensex.changePercent >= 0,
        strokeColor: benchmarks.sensex.changePercent >= 0 ? '#10b981' : '#f43f5e',
        shortLabel: '1D',
        longLabel: '1M',
        series: normalized,
        metrics: [
          { label: 'Open', value: (sensexObj?.open ?? 79850).toLocaleString('en-IN') },
          { label: 'Day Low', value: (sensexObj?.low ?? 79780.4).toLocaleString('en-IN') },
          { label: 'Day High', value: (sensexObj?.high ?? 80350.2).toLocaleString('en-IN') },
          { label: 'Prev Close', value: (sensexObj?.previousClose ?? 79725.6).toLocaleString('en-IN') },
        ],
        ctaLabel: 'Open Sensex Analysis',
        ctaPath: '/stocks/sensex/',
      };
    }

    if (heroAsset === 'gold') {
      const sliceCount = heroRange === 'short' ? 7 : 30;
      const ordered = [...goldHistory.slice(0, sliceCount)].reverse().map((d) => ({
        date: d.label.replace(/,\s*\d{4}$/, ''),
        price: d.rate24KPerGram,
      }));
      const prices = ordered.map((x) => x.price);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const chg = selectedGoldCity.change24K ?? -185.2;
      const chgPct = selectedGoldCity.changePercent ?? -1.27;
      const spot = selectedGoldCity.rate24KPerGram || benchmarks.gold24KPerGram;
      return {
        title: `24K Gold /g · ${selectedGoldCity.city.split(' (')[0]}`,
        subtitle: '99.9% Fine Bullion · IBJA & MCX Spot',
        valueFormatted: `₹${spot.toLocaleString('en-IN')}`,
        deltaText: `${chg >= 0 ? '+' : '-'}₹${Math.abs(chg)} (${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%)`,
        isUp: chg >= 0,
        strokeColor: '#f59e0b',
        shortLabel: '7D',
        longLabel: '30D',
        series: ordered,
        metrics: [
          { label: '22K /g', value: `₹${selectedGoldCity.rate22KPerGram.toLocaleString('en-IN')}` },
          { label: `${heroRange === 'short' ? '7D' : '30D'} Low`, value: `₹${minP.toLocaleString('en-IN')}` },
          { label: `${heroRange === 'short' ? '7D' : '30D'} High`, value: `₹${maxP.toLocaleString('en-IN')}` },
          { label: '10g Spot', value: `₹${(spot * 10).toLocaleString('en-IN')}` },
        ],
        ctaLabel: 'Open Bullion History',
        ctaPath:
          selectedGoldCity.slug === 'national'
            ? '/gold-rate-today/'
            : `/gold-rate-today/${selectedGoldCity.slug}/`,
      };
    }

    const sliceCount = heroRange === 'short' ? 7 : 30;
    const ordered = [...silverHistory.slice(0, sliceCount)].reverse().map((d) => ({
      date: d.label.replace(/,\s*\d{4}$/, ''),
      price: d.ratePerKg,
    }));
    const prices = ordered.map((x) => x.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const chg = selectedGoldCity.silverChange ?? 500;
    const spot = selectedGoldCity.silverPerKg || benchmarks.silverPerKg;
    return {
      title: `Silver /kg · ${selectedGoldCity.city.split(' (')[0]}`,
      subtitle: '999 Refined Kilobar · Bullion Benchmark',
      valueFormatted: `₹${spot.toLocaleString('en-IN')}`,
      deltaText: `${chg >= 0 ? '+' : '-'}₹${Math.abs(chg).toLocaleString('en-IN')} today`,
      isUp: chg >= 0,
      strokeColor: '#38bdf8',
      shortLabel: '7D',
      longLabel: '30D',
      series: ordered,
      metrics: [
        { label: '1g Spot', value: `₹${selectedGoldCity.silverPerGram.toLocaleString('en-IN')}` },
        { label: `${heroRange === 'short' ? '7D' : '30D'} Low`, value: `₹${minP.toLocaleString('en-IN')}` },
        { label: `${heroRange === 'short' ? '7D' : '30D'} High`, value: `₹${maxP.toLocaleString('en-IN')}` },
        { label: 'USD / INR', value: `₹${benchmarks.usdInr.toFixed(2)}` },
      ],
      ctaLabel: 'Open Silver History',
      ctaPath:
        selectedGoldCity.slug === 'national'
          ? '/silver-rate-today/'
          : `/silver-rate-today/${selectedGoldCity.slug}/`,
    };
  }, [heroAsset, heroRange, stocksList, benchmarks, selectedGoldCity, goldHistory, silverHistory]);

  const compareCities = useMemo(() => {
    const preferred = ['national', 'mumbai', 'delhi', 'bangalore', 'chennai'];
    return preferred
      .map((slug) => cityRates.find((c) => c.slug === slug))
      .filter((c): c is GoldCityRate => Boolean(c))
      .slice(0, 4);
  }, [cityRates]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* 1. HERO MARKET PULSE SPLIT (Desktop Command Focal Anchor + Benchmark Ledger) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left: Deep Forest-Obsidian Market Pulse Chart Console */}
        <div className="lg:col-span-7 bg-[#0B1714] text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div className="space-y-4">
            {/* Switcher Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-lg overflow-x-auto max-w-full">
                {(
                  [
                    { key: 'nifty50', label: 'NIFTY 50' },
                    { key: 'sensex', label: 'SENSEX' },
                    { key: 'gold', label: '24K Gold' },
                    { key: 'silver', label: 'Silver' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setHeroAsset(item.key)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      heroAsset === item.key
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHeroRange('short')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                    heroRange === 'short'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {heroData.shortLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setHeroRange('long')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                    heroRange === 'long'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {heroData.longLabel}
                </button>
              </div>
            </div>

            {/* Hero Headline Figure */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-emerald-300/90 tracking-wide">
                  {heroData.title}
                </div>
                <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums tracking-tight text-white mt-1">
                  {heroData.valueFormatted}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-mono tabular-nums font-semibold ${
                      heroData.isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {heroData.isUp ? (
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{heroData.deltaText}</span>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-300 truncate">{heroData.subtitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(heroData.ctaPath)}
                className="self-start sm:self-end inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>{heroData.ctaLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Sparkline / Area Chart */}
            <div className="h-40 sm:h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heroData.series} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroMarketGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={heroData.strokeColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={heroData.strokeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(val) => {
                      const num = Number(val ?? 0);
                      return [
                        heroAsset === 'gold' || heroAsset === 'silver'
                          ? `₹${num.toLocaleString('en-IN')}`
                          : num.toLocaleString('en-IN'),
                        'Price',
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={heroData.strokeColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#heroMarketGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 mt-3 border-t border-white/10">
            {heroData.metrics.map((m) => (
              <div key={m.label} className="min-w-0">
                <span className="text-[11px] text-slate-400 block">{m.label}</span>
                <span className="text-xs sm:text-sm font-mono tabular-nums font-semibold text-white mt-0.5 block truncate">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Clean All-4 Benchmark Ledger & Market Breadth */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between overflow-hidden min-w-0">
          <div>
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h1 className="text-sm font-bold text-slate-900">Market Benchmarks</h1>
                <p className="text-[11px] text-slate-500">Select a row to chart or open full desk</p>
              </div>
              <select
                aria-label="Bullion City"
                value={selectedGoldCity.slug}
                onChange={(e) => {
                  const found = cityRates.find((c) => c.slug === e.target.value);
                  if (found) setSelectedGoldCity(found);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-slate-400 max-w-[140px] truncate"
              >
                {cityRates.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.city.split(' (')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                {
                  key: 'nifty50' as HeroBenchmarkKey,
                  label: 'NIFTY 50',
                  sub: 'NSE India · 50 Stocks',
                  price: benchmarks.nifty50.price.toLocaleString('en-IN'),
                  delta: `${benchmarks.nifty50.changePercent >= 0 ? '+' : ''}${benchmarks.nifty50.changePercent.toFixed(2)}%`,
                  isUp: benchmarks.nifty50.changePercent >= 0,
                  onOpen: () => setActiveTab('stocks'),
                },
                {
                  key: 'sensex' as HeroBenchmarkKey,
                  label: 'SENSEX',
                  sub: 'BSE India · 30 Bluechips',
                  price: benchmarks.sensex.price.toLocaleString('en-IN'),
                  delta: `${benchmarks.sensex.changePercent >= 0 ? '+' : ''}${benchmarks.sensex.changePercent.toFixed(2)}%`,
                  isUp: benchmarks.sensex.changePercent >= 0,
                  onOpen: () => setActiveTab('stocks'),
                },
                {
                  key: 'gold' as HeroBenchmarkKey,
                  label: '24K GOLD /g',
                  sub: `${selectedGoldCity.city.split(' (')[0]} · 99.9% Fine`,
                  price: `₹${(selectedGoldCity.rate24KPerGram || benchmarks.gold24KPerGram).toLocaleString('en-IN')}`,
                  delta: `${(selectedGoldCity.change24K ?? -185.2) >= 0 ? '+' : '-'}₹${Math.abs(selectedGoldCity.change24K ?? -185.2)}`,
                  isUp: (selectedGoldCity.change24K ?? -185.2) >= 0,
                  onOpen: () => {
                    setActiveTab('gold');
                    setSelectedMetal('gold');
                    setSelectedGoldPurity('24K');
                    setShowGoldHistory(true);
                  },
                },
                {
                  key: 'silver' as HeroBenchmarkKey,
                  label: 'SILVER /kg',
                  sub: `${selectedGoldCity.city.split(' (')[0]} · 999 Refined`,
                  price: `₹${(selectedGoldCity.silverPerKg || benchmarks.silverPerKg).toLocaleString('en-IN')}`,
                  delta: `${(selectedGoldCity.silverChange ?? 0) >= 0 ? '+' : '-'}₹${Math.abs(selectedGoldCity.silverChange ?? 0).toLocaleString('en-IN')}`,
                  isUp: (selectedGoldCity.silverChange ?? 0) >= 0,
                  onOpen: () => {
                    setActiveTab('silver');
                    setSelectedMetal('silver');
                    setSelectedSilverUnit('1kg');
                    setShowSilverHistory(true);
                  },
                },
              ].map((row) => {
                const isActiveHero = heroAsset === row.key;
                return (
                  <div
                    key={row.key}
                    onClick={() => setHeroAsset(row.key)}
                    className={`px-4 sm:px-5 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isActiveHero ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{row.label}</span>
                        {isActiveHero && (
                          <span className="text-[10px] font-semibold text-emerald-700">Charted</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">{row.sub}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-sm font-bold text-slate-900 block">{row.price}</span>
                        <span
                          className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${
                            row.isUp ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {row.isUp ? (
                            <TrendingUp className="w-3 h-3 shrink-0" />
                          ) : (
                            <TrendingDown className="w-3 h-3 shrink-0" />
                          )}
                          <span>{row.delta}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroAsset(row.key);
                          row.onOpen();
                        }}
                        title={`Open ${row.label} desk`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Breadth & FX Footer inside Ledger */}
          <div className="px-4 sm:px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">
                Market Breadth ({marketBreadth.advances} Adv / {marketBreadth.declines} Dec)
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">
                USD/INR ₹{benchmarks.usdInr.toFixed(2)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-rose-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${marketBreadth.advPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. ASYMMETRIC DESKTOP WORKBENCH (8-col Main Feed + 4-col Sticky Live Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAIN WORKBENCH (8 Columns on Desktop) */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Workbench Segmented Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center overflow-x-auto text-xs font-medium scrollbar-none">
            <div className="flex items-center space-x-1 shrink-0 min-w-full sm:min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'news'
                    ? 'bg-[#0B1714] text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Market News</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('gold');
                  setSelectedMetal('gold');
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'gold'
                    ? 'bg-[#0B1714] text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Gold Rate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('silver');
                  setSelectedMetal('silver');
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'silver'
                    ? 'bg-[#0B1714] text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Silver Rate</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stocks')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'stocks'
                    ? 'bg-[#0B1714] text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Equities Screener</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('crypto')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'crypto'
                    ? 'bg-[#0B1714] text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Crypto &amp; Commodities</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MARKET NEWS FEED (Editorial Broadsheet Grid) */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Financial Briefings
                  </h2>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {filteredNews.length} stories
                  </span>
                </div>

                <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto scrollbar-none max-w-full">
                  {(['all', 'stocks', 'banking', 'economy', 'global'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewsCategory(cat)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        newsCategory === cat
                          ? 'bg-[#0B1714] text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredNews.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    No briefings in this category right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewsCategory('all')}
                    className="text-xs font-semibold text-emerald-700 underline cursor-pointer"
                  >
                    Show all market news
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lead Story */}
                  {(() => {
                    const lead = filteredNews[0];
                    return (
                      <article
                        onClick={() => navigate(`/news/${lead.slug}/`)}
                        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-slate-300 transition-colors cursor-pointer group space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-emerald-700 capitalize">
                            {lead.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-800">
                            {lead.source || lead.author || 'Market Desk'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{lead.readTime}</span>
                          <span aria-hidden="true">·</span>
                          <span>{lead.publishedAt}</span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          {lead.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {lead.summary}
                        </p>

                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-900">
                            Key Takeaways
                          </div>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {lead.aiBullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start text-xs text-slate-600">
                                <span className="text-emerald-600 font-bold mr-1.5">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    );
                  })()}

                  {/* 2-Column Editorial Grid for Remaining Stories on Desktop */}
                  {filteredNews.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredNews.slice(1).map((article, idx) => (
                        <article
                          key={`${article.id || article.slug}-${idx}`}
                          onClick={() => navigate(`/news/${article.slug}/`)}
                          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="font-semibold text-emerald-700 capitalize">
                                {article.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-700 truncate">
                                {article.source || article.author || 'Market Desk'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{article.readTime}</span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                              {article.title}
                            </h3>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {article.summary}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 space-y-1">
                            {article.aiBullets.slice(0, 2).map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start text-[11px] text-slate-600">
                                <span className="text-slate-400 font-bold mr-1.5">•</span>
                                <span className="line-clamp-2">{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & 3: BULLION DESK */}
          {(activeTab === 'gold' || activeTab === 'silver') && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-900 space-y-4">
              {/* Controls Bar: Date + City */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 tracking-tight">
                    Bullion Session:
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {activeGoldDay.label}
                        {activeGoldDay.isToday ? ' (Today)' : ''}
                      </span>
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
                                isCurrent ? 'text-emerald-700 font-semibold bg-emerald-50/50' : 'text-slate-700'
                              }`}
                            >
                              <span>
                                {d.label}
                                {d.isToday ? ' (Today)' : ''}
                              </span>
                              {isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
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
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      Reset to Today
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
              <div className="flex items-center justify-between gap-2">
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
                        className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                  IBJA &amp; MCX Spot (Landed)
                </span>
              </div>

              {/* GOLD CARDS */}
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
                              ? 'bg-white border-2 border-slate-900'
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

                            <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono tabular-nums mt-0.5 gap-2">
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

              {/* SILVER CARDS */}
              {selectedMetal === 'silver' && (() => {
                const silverItems = [
                  {
                    unitKey: '1g' as SilverUnit,
                    label: 'Fine Silver /g',
                    price: activeSilverDay.ratePerGram,
                    change: activeSilverDay.changePerGram,
                  },
                  {
                    unitKey: '10g' as SilverUnit,
                    label: 'Silver Bar /10g',
                    price: activeSilverDay.ratePer10g,
                    change: activeSilverDay.changePer10g,
                  },
                  {
                    unitKey: '1kg' as SilverUnit,
                    label: 'Silver Kilobar /1kg',
                    price: activeSilverDay.ratePerKg,
                    change: activeSilverDay.changePerKg,
                  },
                ];
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {silverItems.map((item) => {
                        const isUp = item.change >= 0;
                        const isSelectedCard =
                          showSilverHistory && selectedSilverUnit === item.unitKey;
                        return (
                          <button
                            key={item.unitKey}
                            type="button"
                            onClick={() => {
                              if (showSilverHistory && selectedSilverUnit === item.unitKey) {
                                setShowSilverHistory(false);
                              } else {
                                setSelectedSilverUnit(item.unitKey);
                                setShowSilverHistory(true);
                              }
                            }}
                            className={`text-left rounded-xl p-3.5 sm:p-4 transition-all min-w-0 flex sm:block items-center justify-between gap-3 cursor-pointer group ${
                              isSelectedCard
                                ? 'bg-white border-2 border-slate-900'
                                : 'bg-slate-50/70 border border-slate-200 hover:border-slate-400 hover:bg-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">
                                {item.label}
                              </span>
                              <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">
                                999 Refined
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
                              <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono tabular-nums font-semibold mt-0.5">
                                <span className={isUp ? 'text-emerald-600' : 'text-rose-600'}>
                                  {isUp ? '+' : '-'}₹{Math.abs(item.change).toLocaleString('en-IN')}
                                </span>
                                <span className="text-slate-500 hidden sm:inline font-normal">
                                  999 Refined
                                </span>
                              </div>
                              <div className="hidden sm:flex items-center justify-between mt-2 text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">
                                <span className="inline-flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  <span>
                                    {isSelectedCard
                                      ? 'Showing date history'
                                      : 'Click for date history'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {showSilverHistory && (
                      <SilverHistoryPanel
                        city={selectedGoldCity}
                        selectedUnit={selectedSilverUnit}
                        onSelectUnit={setSelectedSilverUnit}
                        selectedDateIso={activeSilverDay.isoDate}
                        onSelectDate={(day) =>
                          setSelectedDateIso(day.isToday ? null : day.isoDate)
                        }
                        onClose={() => setShowSilverHistory(false)}
                        onOpenFullPage={() =>
                          navigate(
                            selectedGoldCity.slug === 'national'
                              ? '/silver-rate-today/'
                              : `/silver-rate-today/${selectedGoldCity.slug}/`
                          )
                        }
                      />
                    )}
                  </div>
                );
              })()}

              {/* PLATINUM */}
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
                        <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">
                          950 Pt Hallmark
                        </span>
                      </div>
                      <div className="text-right sm:text-left min-w-0">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono tabular-nums text-emerald-600 font-semibold mt-0.5">
                          <span>+₹{item.change.toLocaleString('en-IN')}</span>
                          <span className="text-slate-500 hidden sm:inline font-normal">
                            950 Pt Hallmark
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DIAMOND */}
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
                        <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">
                          IGI / GIA Certified
                        </span>
                      </div>
                      <div className="text-right sm:text-left min-w-0">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono tabular-nums text-emerald-600 font-semibold mt-0.5">
                          <span>+₹{item.change.toLocaleString('en-IN')}</span>
                          <span className="text-slate-500 hidden sm:inline font-normal">
                            IGI / GIA Certified
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EQUITIES SCREENER (Institutional Multi-Column Density) */}
          {activeTab === 'stocks' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm">Equity Market Screener</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Filter symbol..."
                      className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 w-36 sm:w-44"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5 pointer-events-none" />
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                    {(['all', 'gainers', 'losers'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setStockTab(tab)}
                        className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          stockTab === tab
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold text-[11px]">
                      <th className="py-2.5 px-4">Company &amp; Symbol</th>
                      <th className="py-2.5 px-3 text-right">LTP</th>
                      <th className="py-2.5 px-3 text-right">Change</th>
                      <th className="py-2.5 px-3 hidden md:table-cell">Day Range</th>
                      <th className="py-2.5 px-3 text-right hidden lg:table-cell">Mkt Cap</th>
                      <th className="py-2.5 px-4 text-right hidden xl:table-cell">P/E</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {displayedStocks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center font-sans text-xs text-slate-500">
                          No equities match this filter.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setStockTab('all');
                              setStockSearch('');
                            }}
                            className="text-emerald-700 font-semibold underline cursor-pointer"
                          >
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      displayedStocks.map((stock) => {
                        const isPositive = stock.changePercent >= 0;
                        const rangeSpan = Math.max(stock.high - stock.low, 0.01);
                        const rangePct = Math.min(
                          100,
                          Math.max(0, ((stock.price - stock.low) / rangeSpan) * 100)
                        );
                        return (
                          <tr
                            key={stock.symbol}
                            onClick={() => navigate(`/stocks/${stock.slug}/`)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-4 font-sans">
                              <div className="flex items-center gap-2.5 min-w-0">
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
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block">
                                    {stock.symbol}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block max-w-[190px] truncate">
                                    {stock.name}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {stock.currency === 'USD' ? '$' : '₹'}
                              {stock.price.toLocaleString('en-IN')}
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-semibold ${
                                isPositive ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              <span className="inline-flex items-center justify-end gap-1">
                                {isPositive ? (
                                  <TrendingUp className="w-3 h-3 shrink-0" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 shrink-0" />
                                )}
                                <span>
                                  {isPositive ? '+' : ''}
                                  {stock.changePercent.toFixed(2)}%
                                </span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell">
                              <div className="w-28 space-y-1">
                                <div className="h-1.5 bg-slate-200 rounded-full relative">
                                  <div
                                    className="w-2 h-2 rounded-full bg-slate-900 absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                    style={{ left: `${rangePct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{stock.low.toLocaleString('en-IN')}</span>
                                  <span>{stock.high.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 hidden lg:table-cell">
                              {stock.marketCap}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-600 hidden xl:table-cell">
                              {stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CRYPTO & COMMODITIES */}
          {activeTab === 'crypto' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Cryptocurrency Spot</h3>
                  <span className="text-[11px] text-slate-500">CoinGecko Ref</span>
                </div>
                <div className="divide-y divide-slate-100 font-mono tabular-nums text-xs">
                  {cryptoList.map((coin) => (
                    <div
                      key={coin.symbol}
                      onClick={() => navigate(`/crypto/${coin.slug}/`)}
                      className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <WatchlistButton
                          compact
                          item={{
                            id: `crypto:${coin.symbol}`,
                            type: 'crypto',
                            label: coin.symbol,
                            sublabel: coin.name,
                            path: `/crypto/${coin.slug}/`,
                          }}
                        />
                        <div className="min-w-0 font-sans">
                          <span className="font-semibold text-slate-900 block truncate">
                            {coin.name}
                          </span>
                          <span className="text-[11px] text-slate-500">{coin.symbol}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 block">
                          ${coin.priceUSD.toLocaleString('en-US')}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            coin.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {coin.change24h >= 0 ? '+' : ''}
                          {coin.change24h}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Commodities Futures</h3>
                  <span className="text-[11px] text-slate-500">Global Benchmarks</span>
                </div>
                <div className="divide-y divide-slate-100 font-mono tabular-nums text-xs">
                  {commoditiesList.map((c) => (
                    <div
                      key={c.slug}
                      onClick={() => navigate(`/commodities/${c.slug}/`)}
                      className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 font-sans">
                        <span className="font-semibold text-slate-900 block truncate">{c.name}</span>
                        <span className="text-[11px] text-slate-500">{c.unit}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 block">${c.price}</span>
                        <span
                          className={`text-[11px] font-semibold ${
                            c.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {c.changePercent >= 0 ? '+' : ''}
                          {c.changePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PERSISTENT DESKTOP LIVE RAIL (4 Columns on Desktop, Flows Below Feed on Mobile) */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-[108px] min-w-0">
          {/* 1. Equities Pulse (Top Movers Board) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-slate-900">Equities Pulse</h2>
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPulseTab('gainers')}
                  className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                    pulseTab === 'gainers'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gainers
                </button>
                <button
                  type="button"
                  onClick={() => setPulseTab('losers')}
                  className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                    pulseTab === 'losers'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Losers
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {pulseMovers.map((stock) => {
                const isUp = stock.changePercent >= 0;
                return (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => navigate(`/stocks/${stock.slug}/`)}
                    className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">
                        {stock.symbol}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[155px]">
                        {stock.sector}
                      </span>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <span className="text-xs font-bold text-slate-900 block">
                        {stock.currency === 'USD' ? '$' : '₹'}
                        {stock.price.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isUp ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('stocks')}
              className="w-full px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-between cursor-pointer"
            >
              <span>Open Full Equities Screener</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. City Bullion Quick-Compare */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-slate-900">City Bullion Desk</h2>
              <button
                type="button"
                onClick={() => navigate('/gold-rate-today/')}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>All Cities</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {compareCities.map((city) => {
                const isSelected = city.slug === selectedGoldCity.slug;
                return (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => {
                      setSelectedGoldCity(city);
                      setHeroAsset('gold');
                    }}
                    className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 block truncate">
                        {city.city.split(' (')[0]}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        22K: ₹{city.rate22KPerGram.toLocaleString('en-IN')}/g
                      </span>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <span className="text-xs font-bold text-slate-900 block">
                        ₹{city.rate24KPerGram.toLocaleString('en-IN')}/g
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ag ₹{city.silverPerKg.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Your Watchlist */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900">Your Watchlist</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portfolio/')}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Portfolio</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {watchlistPreview.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Star any stock, fund, or city bullion desk to track it here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/portfolio/')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Manage Watchlist &amp; Holdings
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {watchlistPreview.map((w) => {
                  const isUp = (w.changePct ?? 0) >= 0;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => navigate(w.path)}
                      className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {w.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {w.sublabel}
                        </span>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <span className="text-xs font-bold text-slate-900 block">
                          {w.priceLabel}
                        </span>
                        {w.changePct !== null && (
                          <span
                            className={`text-[11px] font-semibold block ${
                              isUp ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isUp ? '+' : ''}
                            {w.changePct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Tools & Calculators Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => navigate('/portfolio/')}
              className="w-full px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-left group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Briefcase className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">Portfolio Tracker</span>
                  <span className="text-[11px] text-slate-500 block">
                    Live P&amp;L across stocks, gold &amp; mutual funds
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/calculator/')}
              className="w-full px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-left group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Calculator className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">
                    SIP &amp; Gold GST Calculator
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Compute making charges, GST &amp; SIP growth
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/mutual-funds/')}
              className="w-full px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-left group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Scale className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">
                    Compare Mutual Funds
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Side-by-side 3Y/5Y CAGR &amp; expense ratios
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 shrink-0" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
