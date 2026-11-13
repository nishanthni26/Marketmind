import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Star,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calculator,
  X,
} from 'lucide-react';
import {
  mockStocks as fallbackStocks,
  goldCityRates as fallbackGoldCities,
  mockMutualFunds,
  mockCrypto as fallbackCrypto,
} from '../data/financialData';
import { StockData, GoldCityRate, CryptoData } from '../types';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useWatchlist } from '../utils/watchlist';

interface PortfolioPageProps {
  navigate: (path: string) => void;
}

type HoldingAssetType = 'stock' | 'gold' | 'silver' | 'mutual-fund' | 'crypto';

interface PortfolioHolding {
  id: string;
  assetType: HoldingAssetType;
  symbolOrSlug: string;
  name: string;
  quantity: number;
  unitLabel: string;
  avgBuyPriceInr: number;
  addedAt: string;
}

const HOLDINGS_STORAGE_KEY = 'marketmind_portfolio_holdings_v1';

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'watchlist'>('holdings');
  const [showAddForm, setShowAddForm] = useState(false);

  const [stocks, setStocks] = useState<StockData[]>(fallbackStocks);
  const [cities, setCities] = useState<GoldCityRate[]>(fallbackGoldCities);
  const [crypto, setCrypto] = useState<CryptoData[]>(fallbackCrypto);
  const [usdInr, setUsdInr] = useState<number>(93.85);

  const { items: watchlistItems, removeWatch } = useWatchlist();

  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    try {
      const raw = localStorage.getItem(HOLDINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(holdings));
    } catch {
      // ignore storage errors
    }
  }, [holdings]);

  useEffect(() => {
    updatePageSeo({
      title: 'My Portfolio & Watchlist – Holdings Valuation | MarketMind',
      description:
        'Track your Indian stocks, 24K/22K gold, silver bullion, mutual funds, and crypto holdings against live market prices.',
      canonicalPath: '/portfolio/',
    });

    const loadLive = async () => {
      try {
        const [bmRes, stRes, gsRes, crRes] = await Promise.allSettled([
          fetch('/api/benchmarks'),
          fetch('/api/stocks'),
          fetch('/api/gold-silver'),
          fetch('/api/crypto'),
        ]);
        if (bmRes.status === 'fulfilled' && bmRes.value.ok) {
          const b = await bmRes.value.json();
          if (b.usdInr) setUsdInr(Number(b.usdInr));
        }
        if (stRes.status === 'fulfilled' && stRes.value.ok) {
          const s = await stRes.value.json();
          if (Array.isArray(s.stocks) && s.stocks.length > 0) setStocks(s.stocks);
        }
        if (gsRes.status === 'fulfilled' && gsRes.value.ok) {
          const g = await gsRes.value.json();
          if (Array.isArray(g.cities) && g.cities.length > 0) setCities(g.cities);
        }
        if (crRes.status === 'fulfilled' && crRes.value.ok) {
          const c = await crRes.value.json();
          if (Array.isArray(c.crypto) && c.crypto.length > 0) setCrypto(c.crypto);
        }
      } catch {
        // fallback already loaded
      }
    };

    loadLive();
    const interval = setInterval(loadLive, 30000);
    return () => clearInterval(interval);
  }, []);

  const nationalCity = cities[0] || fallbackGoldCities[0];
  const equityStocks = useMemo(
    () => stocks.filter((s) => s.symbol !== 'SENSEX' && s.symbol !== 'NIFTY50'),
    [stocks]
  );

  // Add Holding form state
  const [formAssetType, setFormAssetType] = useState<HoldingAssetType>('stock');
  const [formSelection, setFormSelection] = useState<string>('RELIANCE');
  const [formQty, setFormQty] = useState<string>('10');
  const [formBuyPrice, setFormBuyPrice] = useState<string>('');

  const getSuggestedUnitPriceInr = (type: HoldingAssetType, sel: string): number => {
    if (type === 'stock') {
      const st = equityStocks.find((s) => s.symbol === sel);
      if (!st) return 0;
      return st.currency === 'USD' ? Math.round(st.price * usdInr) : st.price;
    }
    if (type === 'gold') {
      return sel === '22K' ? nationalCity.rate22KPerGram : nationalCity.rate24KPerGram;
    }
    if (type === 'silver') {
      return sel === '1kg' ? nationalCity.silverPerKg : nationalCity.silverPerGram;
    }
    if (type === 'mutual-fund') {
      const mf = mockMutualFunds.find((m) => m.slug === sel);
      return mf ? mf.nav : 0;
    }
    const coin = crypto.find((c) => c.symbol === sel);
    return coin ? coin.priceINR : 0;
  };

  useEffect(() => {
    if (formAssetType === 'stock') {
      const defaultSym = equityStocks[0]?.symbol || 'RELIANCE';
      setFormSelection(defaultSym);
      setFormBuyPrice(String(Math.round(getSuggestedUnitPriceInr('stock', defaultSym))));
    } else if (formAssetType === 'gold') {
      setFormSelection('24K');
      setFormBuyPrice(String(nationalCity.rate24KPerGram));
    } else if (formAssetType === 'silver') {
      setFormSelection('1g');
      setFormBuyPrice(String(nationalCity.silverPerGram));
    } else if (formAssetType === 'mutual-fund') {
      const defaultMf = mockMutualFunds[0]?.slug || '';
      setFormSelection(defaultMf);
      setFormBuyPrice(String(mockMutualFunds[0]?.nav || 0));
    } else if (formAssetType === 'crypto') {
      const defaultCoin = crypto[0]?.symbol || 'BTC';
      setFormSelection(defaultCoin);
      setFormBuyPrice(String(Math.round(crypto[0]?.priceINR || 0)));
    }
  }, [formAssetType]);

  const handleSelectionChange = (nextSel: string) => {
    setFormSelection(nextSel);
    const suggested = getSuggestedUnitPriceInr(formAssetType, nextSel);
    if (suggested > 0) setFormBuyPrice(String(Math.round(suggested * 100) / 100));
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formQty);
    const buyPrice = Number(formBuyPrice);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(buyPrice) || buyPrice <= 0) return;

    let name = formSelection;
    let unitLabel = 'units';

    if (formAssetType === 'stock') {
      const st = equityStocks.find((s) => s.symbol === formSelection);
      name = st ? `${st.name} (${st.symbol})` : formSelection;
      unitLabel = 'shares';
    } else if (formAssetType === 'gold') {
      name = formSelection === '22K' ? '22K Hallmark Gold' : '24K Pure Gold';
      unitLabel = 'g';
    } else if (formAssetType === 'silver') {
      name = formSelection === '1kg' ? 'Silver Kilobar (999)' : 'Fine Silver (999)';
      unitLabel = formSelection === '1kg' ? 'kg' : 'g';
    } else if (formAssetType === 'mutual-fund') {
      const mf = mockMutualFunds.find((m) => m.slug === formSelection);
      name = mf ? mf.name : formSelection;
      unitLabel = 'units';
    } else if (formAssetType === 'crypto') {
      const coin = crypto.find((c) => c.symbol === formSelection);
      name = coin ? `${coin.name} (${coin.symbol})` : formSelection;
      unitLabel = formSelection;
    }

    const newItem: PortfolioHolding = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      assetType: formAssetType,
      symbolOrSlug: formSelection,
      name,
      quantity: qty,
      unitLabel,
      avgBuyPriceInr: buyPrice,
      addedAt: new Date().toISOString(),
    };

    setHoldings((prev) => [newItem, ...prev]);
    setShowAddForm(false);
  };

  const handleLoadStarter = () => {
    const relPrice = getSuggestedUnitPriceInr('stock', 'RELIANCE') || 1520;
    const tcsPrice = getSuggestedUnitPriceInr('stock', 'TCS') || 3180;
    const gold24 = nationalCity.rate24KPerGram || 14362;
    const silverGram = nationalCity.silverPerGram || 200;
    const mfNav = mockMutualFunds[0]?.nav || 84.5;

    setHoldings([
      {
        id: 'starter-1',
        assetType: 'stock',
        symbolOrSlug: 'RELIANCE',
        name: 'Reliance Industries (RELIANCE)',
        quantity: 25,
        unitLabel: 'shares',
        avgBuyPriceInr: Math.round(relPrice * 0.92),
        addedAt: new Date().toISOString(),
      },
      {
        id: 'starter-2',
        assetType: 'stock',
        symbolOrSlug: 'TCS',
        name: 'Tata Consultancy Services (TCS)',
        quantity: 12,
        unitLabel: 'shares',
        avgBuyPriceInr: Math.round(tcsPrice * 0.95),
        addedAt: new Date().toISOString(),
      },
      {
        id: 'starter-3',
        assetType: 'gold',
        symbolOrSlug: '24K',
        name: '24K Pure Gold',
        quantity: 10,
        unitLabel: 'g',
        avgBuyPriceInr: Math.round(gold24 * 0.88),
        addedAt: new Date().toISOString(),
      },
      {
        id: 'starter-4',
        assetType: 'silver',
        symbolOrSlug: '1g',
        name: 'Fine Silver (999)',
        quantity: 250,
        unitLabel: 'g',
        avgBuyPriceInr: Math.round(silverGram * 0.91),
        addedAt: new Date().toISOString(),
      },
      {
        id: 'starter-5',
        assetType: 'mutual-fund',
        symbolOrSlug: mockMutualFunds[0]?.slug || 'parag-parikh-flexi-cap',
        name: mockMutualFunds[0]?.name || 'Parag Parikh Flexi Cap Fund',
        quantity: 450,
        unitLabel: 'units',
        avgBuyPriceInr: Math.round(mfNav * 0.84 * 100) / 100,
        addedAt: new Date().toISOString(),
      },
    ]);
  };

  // Enrich holdings with live market valuation
  const valuedHoldings = useMemo(() => {
    return holdings.map((h) => {
      let currentPriceInr = h.avgBuyPriceInr;
      let dayChangePct = 0;
      let targetPath = '/';

      if (h.assetType === 'stock') {
        const st = equityStocks.find((s) => s.symbol === h.symbolOrSlug);
        if (st) {
          currentPriceInr = st.currency === 'USD' ? st.price * usdInr : st.price;
          dayChangePct = st.changePercent;
          targetPath = `/stocks/${st.slug}/`;
        }
      } else if (h.assetType === 'gold') {
        currentPriceInr =
          h.symbolOrSlug === '22K' ? nationalCity.rate22KPerGram : nationalCity.rate24KPerGram;
        dayChangePct = nationalCity.changePercent || 0;
        targetPath = '/gold-rate-today/';
      } else if (h.assetType === 'silver') {
        currentPriceInr =
          h.symbolOrSlug === '1kg' ? nationalCity.silverPerKg : nationalCity.silverPerGram;
        dayChangePct =
          nationalCity.silverPerKg > 0
            ? Math.round(((nationalCity.silverChange || 0) / nationalCity.silverPerKg) * 10000) / 100
            : 0;
        targetPath = '/silver-rate-today/';
      } else if (h.assetType === 'mutual-fund') {
        const mf = mockMutualFunds.find((m) => m.slug === h.symbolOrSlug);
        if (mf) {
          currentPriceInr = mf.nav;
          dayChangePct = mf.navChangePercent;
          targetPath = `/mutual-funds/${mf.slug}/`;
        }
      } else if (h.assetType === 'crypto') {
        const coin = crypto.find((c) => c.symbol === h.symbolOrSlug);
        if (coin) {
          currentPriceInr = coin.priceINR;
          dayChangePct = coin.change24h;
          targetPath = `/crypto/${coin.slug}/`;
        }
      }

      const invested = h.quantity * h.avgBuyPriceInr;
      const currentValue = h.quantity * currentPriceInr;
      const pnl = currentValue - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
      const dayPnl = currentValue * (dayChangePct / 100);

      return {
        ...h,
        currentPriceInr,
        invested,
        currentValue,
        pnl,
        pnlPct,
        dayChangePct,
        dayPnl,
        targetPath,
      };
    });
  }, [holdings, equityStocks, nationalCity, crypto, usdInr]);

  const totals = useMemo(() => {
    const invested = valuedHoldings.reduce((acc, h) => acc + h.invested, 0);
    const current = valuedHoldings.reduce((acc, h) => acc + h.currentValue, 0);
    const dayPnl = valuedHoldings.reduce((acc, h) => acc + h.dayPnl, 0);
    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    const dayPct = current > 0 ? (dayPnl / current) * 100 : 0;

    const buckets: Record<'Stocks' | 'Gold & Silver' | 'Mutual Funds' | 'Crypto', number> = {
      Stocks: 0,
      'Gold & Silver': 0,
      'Mutual Funds': 0,
      Crypto: 0,
    };
    valuedHoldings.forEach((h) => {
      if (h.assetType === 'stock') buckets.Stocks += h.currentValue;
      else if (h.assetType === 'gold' || h.assetType === 'silver') buckets['Gold & Silver'] += h.currentValue;
      else if (h.assetType === 'mutual-fund') buckets['Mutual Funds'] += h.currentValue;
      else buckets.Crypto += h.currentValue;
    });

    const allocation = (Object.entries(buckets) as Array<[keyof typeof buckets, number]>)
      .filter(([, val]) => val > 0)
      .map(([label, val]) => ({
        label,
        value: val,
        pct: current > 0 ? Math.round((val / current) * 1000) / 10 : 0,
      }));

    return { invested, current, pnl, pnlPct, dayPnl, dayPct, allocation };
  }, [valuedHoldings]);

  // Resolve live price + % change for watched items
  const resolvedWatchlist = useMemo(() => {
    return watchlistItems.map((item) => {
      let priceLabel = '—';
      let changePct: number | null = null;

      if (item.type === 'stock') {
        const sym = item.id.replace('stock:', '');
        const st = stocks.find((s) => s.symbol === sym);
        if (st) {
          priceLabel = `${st.currency === 'USD' ? '$' : '₹'}${st.price.toLocaleString('en-IN')}`;
          changePct = st.changePercent;
        }
      } else if (item.type === 'mutual-fund') {
        const slug = item.id.replace('mf:', '');
        const mf = mockMutualFunds.find((m) => m.slug === slug);
        if (mf) {
          priceLabel = `₹${mf.nav.toLocaleString('en-IN')}`;
          changePct = mf.navChangePercent;
        }
      } else if (item.type === 'crypto') {
        const sym = item.id.replace('crypto:', '');
        const c = crypto.find((x) => x.symbol === sym);
        if (c) {
          priceLabel = `₹${c.priceINR.toLocaleString('en-IN')}`;
          changePct = c.change24h;
        }
      } else if (item.type === 'city') {
        const slug = item.id.replace('city:', '');
        const ct = cities.find((c) => c.slug === slug);
        if (ct) {
          priceLabel = `₹${ct.rate24KPerGram.toLocaleString('en-IN')}/g`;
          changePct = ct.changePercent;
        }
      }

      return { ...item, priceLabel, changePct };
    });
  }, [watchlistItems, stocks, crypto, cities]);

  const allocColors: Record<string, string> = {
    Stocks: 'bg-emerald-600',
    'Gold & Silver': 'bg-amber-500',
    'Mutual Funds': 'bg-blue-600',
    Crypto: 'bg-slate-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <Breadcrumbs
        navigate={navigate}
        items={[{ label: 'Portfolio & Watchlist' }]}
      />

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Investments & Watchlist</span>
              <span>·</span>
              <span>Live Spot Valuation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Your Portfolio
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track stocks, 24K/22K gold, silver bullion, mutual funds, and crypto saved locally in your browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('holdings')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'holdings'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Holdings ({holdings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('watchlist')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'watchlist'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Watchlist ({watchlistItems.length})
              </button>
            </div>

            {activeTab === 'holdings' && (
              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddForm ? 'Close' : 'Add Holding'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'holdings' && (
        <>
          {/* Add Holding Drawer */}
          {showAddForm && (
            <form
              onSubmit={handleAddHolding}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Log New Holding</h2>
                <span className="text-[11px] text-slate-500">Saved privately on this device</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit text-xs font-semibold">
                {(
                  [
                    { id: 'stock', label: 'Stocks' },
                    { id: 'gold', label: 'Gold' },
                    { id: 'silver', label: 'Silver' },
                    { id: 'mutual-fund', label: 'Mutual Funds' },
                    { id: 'crypto', label: 'Crypto' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormAssetType(t.id)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      formAssetType === t.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Select Asset
                  </label>
                  <select
                    value={formSelection}
                    onChange={(e) => handleSelectionChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium outline-none focus:border-slate-400"
                  >
                    {formAssetType === 'stock' &&
                      equityStocks.map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} — {s.name}
                        </option>
                      ))}
                    {formAssetType === 'gold' && (
                      <>
                        <option value="24K">24K Fine Gold (per gram)</option>
                        <option value="22K">22K Hallmark Gold (per gram)</option>
                      </>
                    )}
                    {formAssetType === 'silver' && (
                      <>
                        <option value="1g">Fine Silver 999 (per gram)</option>
                        <option value="1kg">Silver Kilobar 999 (per kg)</option>
                      </>
                    )}
                    {formAssetType === 'mutual-fund' &&
                      mockMutualFunds.map((mf) => (
                        <option key={mf.slug} value={mf.slug}>
                          {mf.name}
                        </option>
                      ))}
                    {formAssetType === 'crypto' &&
                      crypto.map((c) => (
                        <option key={c.symbol} value={c.symbol}>
                          {c.symbol} — {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Quantity ({formAssetType === 'gold' ? 'grams' : formAssetType === 'silver' ? (formSelection === '1kg' ? 'kg' : 'grams') : 'units'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Avg. Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Holding
                </button>
              </div>
            </form>
          )}

          {valuedHoldings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center space-y-4 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Track your investments in one place
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Add your stocks, 24K/22K gold grams, silver, or mutual fund units to see real-time market value, allocation, and profit &amp; loss.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log First Holding</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadStarter}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Load Sample Portfolio
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Groww-Style Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Current Value
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5 break-words">
                    ₹{Math.round(totals.current).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-1 break-words">
                    Invested: ₹{Math.round(totals.invested).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Returns
                  </span>
                  <div
                    className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1.5 break-words ${
                      totals.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {totals.pnl >= 0 ? '+' : '-'}₹{Math.abs(Math.round(totals.pnl)).toLocaleString('en-IN')}
                  </div>
                  <div
                    className={`text-[11px] font-mono font-semibold mt-1 ${
                      totals.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {totals.pnlPct >= 0 ? '+' : ''}
                    {totals.pnlPct.toFixed(2)}% overall
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    1D Change (Est.)
                  </span>
                  <div
                    className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1.5 break-words ${
                      totals.dayPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {totals.dayPnl >= 0 ? '+' : '-'}₹{Math.abs(Math.round(totals.dayPnl)).toLocaleString('en-IN')}
                  </div>
                  <div
                    className={`text-[11px] font-mono font-semibold mt-1 ${
                      totals.dayPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {totals.dayPct >= 0 ? '+' : ''}
                    {totals.dayPct.toFixed(2)}% today
                  </div>
                </div>
              </div>

              {/* Asset Allocation Bar */}
              {totals.allocation.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Asset Allocation
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigate('/calculator/')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Plan SIP / Jewellery</span>
                    </button>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    {totals.allocation.map((slice) => (
                      <div
                        key={slice.label}
                        style={{ width: `${slice.pct}%` }}
                        className={`${allocColors[slice.label] || 'bg-slate-400'} h-full`}
                        title={`${slice.label}: ${slice.pct}%`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                    {totals.allocation.map((slice) => (
                      <div key={slice.label} className="flex items-center gap-2 font-mono tabular-nums">
                        <span
                          className={`w-2.5 h-2.5 rounded-sm ${allocColors[slice.label] || 'bg-slate-400'}`}
                        />
                        <span className="font-sans font-semibold text-slate-700">{slice.label}</span>
                        <span className="text-slate-900 font-bold">{slice.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Holdings Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Holdings Breakdown</h3>
                  <button
                    type="button"
                    onClick={() => setHoldings([])}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] bg-slate-50/60">
                        <th className="py-2.5 px-4">Asset</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Avg. Price</th>
                        <th className="py-2.5 px-3 text-right">Live Price</th>
                        <th className="py-2.5 px-3 text-right">Current Value</th>
                        <th className="py-2.5 px-3 text-right">Returns</th>
                        <th className="py-2.5 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {valuedHoldings.map((h) => {
                        const isUp = h.pnl >= 0;
                        return (
                          <tr
                            key={h.id}
                            onClick={() => navigate(h.targetPath)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-sans">
                              <div className="font-semibold text-slate-900">{h.name}</div>
                              <div className="text-[11px] text-slate-500 capitalize">
                                {h.assetType.replace('-', ' ')}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-700">
                              {h.quantity} {h.unitLabel}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              ₹{Math.round(h.avgBuyPriceInr).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900">
                              ₹{Math.round(h.currentPriceInr).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              ₹{Math.round(h.currentValue).toLocaleString('en-IN')}
                            </td>
                            <td
                              className={`py-3 px-3 text-right font-bold ${
                                isUp ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              <div>
                                {isUp ? '+' : '-'}₹{Math.abs(Math.round(h.pnl)).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] font-semibold">
                                ({isUp ? '+' : ''}
                                {h.pnlPct.toFixed(2)}%)
                              </div>
                            </td>
                            <td
                              className="py-3 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                aria-label={`Remove ${h.name}`}
                                onClick={() =>
                                  setHoldings((prev) => prev.filter((item) => item.id !== h.id))
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'watchlist' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Saved Watchlist</h2>
              <p className="text-[11px] text-slate-500">
                Star stocks, mutual funds, crypto, or city bullion rates anywhere across MarketMind.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/stocks/')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Browse Stocks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {resolvedWatchlist.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Star className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                Your watchlist is empty. Tap the star icon on any stock, mutual fund, or city gold page to track it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {resolvedWatchlist.map((w) => {
                const isUp = (w.changePct ?? 0) >= 0;
                return (
                  <div
                    key={w.id}
                    onClick={() => navigate(w.path)}
                    className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{w.label}</span>
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {w.type.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block truncate">{w.sublabel}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-slate-900 text-sm">{w.priceLabel}</div>
                        {w.changePct !== null && (
                          <div
                            className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${
                              isUp ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>
                              {isUp ? '+' : ''}
                              {w.changePct.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${w.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWatch(w.id);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:text-rose-600 hover:border-rose-200 bg-white transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
