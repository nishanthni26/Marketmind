import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  ChevronDown,
  CheckCircle2,
  History,
} from 'lucide-react';
import { goldCityRates as fallbackGoldCityRates } from '../data/financialData';
import { GoldCityRate } from '../types';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { RechartsTrendChart } from '../components/RechartsTrendChart';
import { GoldHistoryPanel } from '../components/GoldHistoryPanel';
import { SilverHistoryPanel } from '../components/SilverHistoryPanel';
import {
  buildGoldHistory,
  buildSilverHistory,
  GoldPurity,
  SilverUnit,
} from '../utils/goldHistory';
import { WatchlistButton } from '../utils/watchlist';

interface GoldSilverPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const GoldSilverPage: React.FC<GoldSilverPageProps> = ({
  currentPath,
  navigate,
}) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  let targetCitySlug = 'bangalore';
  if (pathParts.length >= 2 && pathParts[1] !== '') {
    targetCitySlug = pathParts[1];
  } else if (currentPath.includes('national')) {
    targetCitySlug = 'national';
  }

  const [allCities, setAllCities] = useState<GoldCityRate[]>(fallbackGoldCityRates);
  const [selectedCity, setSelectedCity] = useState<GoldCityRate>(
    fallbackGoldCityRates.find((c) => c.slug === targetCitySlug) || fallbackGoldCityRates[0]
  );

  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver' | 'platinum' | 'diamond'>(
    currentPath.includes('/silver-rate-today') ? 'silver' : 'gold'
  );

  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedGoldPurity, setSelectedGoldPurity] = useState<GoldPurity>('24K');
  const [selectedSilverUnit, setSelectedSilverUnit] = useState<SilverUnit>('1kg');
  const [usdInr, setUsdInr] = useState<number>(93.85);
  const [loading, setLoading] = useState(false);

  const historySectionRef = useRef<HTMLDivElement | null>(null);

  const [chartTimeframe, setChartTimeframe] = useState<'7D' | '30D'>('7D');

  const fetchLiveRates = async () => {
    setLoading(true);
    try {
      const [res, bmRes] = await Promise.allSettled([
        fetch('/api/gold-silver'),
        fetch('/api/benchmarks'),
      ]);
      if (res.status === 'fulfilled' && res.value.ok) {
        const data = await res.value.json();
        if (Array.isArray(data.cities) && data.cities.length > 0) {
          setAllCities(data.cities);
          const matched = data.cities.find((c: GoldCityRate) => c.slug === targetCitySlug);
          if (matched) {
            setSelectedCity(matched);
          } else {
            setSelectedCity(data.cities[0]);
          }
        }
      }
      if (bmRes.status === 'fulfilled' && bmRes.value.ok) {
        const b = await bmRes.value.json();
        if (b.usdInr) setUsdInr(Number(b.usdInr));
      }
    } catch (err) {
      console.warn('Gold/Silver live fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cityName = selectedCity.city;
    const metalLabel =
      selectedMetal === 'silver' ? 'Silver' : selectedMetal === 'platinum' ? 'Platinum' : 'Gold';
    updatePageSeo({
      title: `${metalLabel} Rate Today in ${cityName} – MarketMind`,
      description: `Check live ${metalLabel} Rate Today in ${cityName}. Real-time benchmark rates per gram.`,
      canonicalPath: currentPath,
    });
    fetchLiveRates();

    const interval = setInterval(fetchLiveRates, 15000);
    return () => clearInterval(interval);
  }, [currentPath, targetCitySlug, selectedMetal]);



  const goldHistory = useMemo(() => buildGoldHistory(selectedCity, 30), [selectedCity]);
  const activeGoldDay = useMemo(
    () => goldHistory.find((d) => d.isoDate === selectedDateIso) || goldHistory[0],
    [goldHistory, selectedDateIso]
  );

  const silverHistory = useMemo(() => buildSilverHistory(selectedCity, 30), [selectedCity]);
  const activeSilverDay = useMemo(
    () => silverHistory.find((d) => d.isoDate === selectedDateIso) || silverHistory[0],
    [silverHistory, selectedDateIso]
  );

  const availableDates = useMemo(() => goldHistory.slice(0, 7), [goldHistory]);

  const cityComparison = useMemo(() => {
    const specificCities = allCities.filter((c) => c.slug !== 'national');
    const pool = specificCities.length > 0 ? specificCities : allCities;
    const sorted = [...pool].sort((a, b) => a.rate24KPerGram - b.rate24KPerGram);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    const spread10g = highest && lowest ? (highest.rate24KPerGram - lowest.rate24KPerGram) * 10 : 0;
    return { lowest, highest, spread10g };
  }, [allCities]);

  const chartData = useMemo(() => {
    if (selectedMetal === 'silver') {
      const daysCount = chartTimeframe === '7D' ? 7 : 30;
      const silverSeries = buildGoldHistory(
        {
          ...selectedCity,
          rate24KPerGram: Math.round(selectedCity.silverPerKg),
          rate22KPerGram: Math.round(selectedCity.silverPerKg),
          rate18KPerGram: Math.round(selectedCity.silverPerKg),
          change24K: selectedCity.silverChange ?? 0,
        },
        daysCount
      );
      return [...silverSeries].reverse().map((d) => ({
        date: d.shortLabel.replace(/\s+\d{4}$/, ''),
        price: d.rate24KPerGram,
      }));
    }
    return chartTimeframe === '7D' ? selectedCity.historical7D : selectedCity.historical30D;
  }, [selectedMetal, chartTimeframe, selectedCity]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <Breadcrumbs
        navigate={navigate}
        items={[
          { label: 'Gold & Silver', path: '/gold-rate-today/' },
          {
            label: `${selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} Rate (${selectedCity.city})`,
          },
        ]}
      />

      {/* Main Bullion Terminal & Calculator Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs text-slate-900 relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{activeGoldDay.label}{activeGoldDay.isToday ? ' (Today)' : ''}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDatePicker && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30">
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
                          isCurrent ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>{d.label}{d.isToday ? ' (Today)' : ''}</span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
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
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                Reset to Today
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">City:</span>
              <select
                aria-label="Select City"
                value={selectedCity.slug}
                onChange={(e) => {
                  const slug = e.target.value;
                  const prefix = selectedMetal === 'silver' ? '/silver-rate-today' : '/gold-rate-today';
                  navigate(slug === 'national' ? `${prefix}/` : `${prefix}/${slug}/`);
                }}
                className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer"
              >
                {allCities.map((c) => (
                  <option key={c.slug} value={c.slug} className="text-slate-900">
                    {c.city}
                  </option>
                ))}
              </select>
            </div>
            <WatchlistButton
              item={{
                id: `city:${selectedCity.slug}`,
                type: 'city',
                label: selectedCity.city,
                sublabel: '24K Gold & Silver City Rate',
                path:
                  selectedCity.slug === 'national'
                    ? '/gold-rate-today/'
                    : `/gold-rate-today/${selectedCity.slug}/`,
              }}
            />
          </div>
        </div>

        {/* Metal Switcher */}
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex items-center space-x-1 mb-4">
          {(['gold', 'silver', 'platinum', 'diamond'] as const).map((metal) => {
            const isActive = selectedMetal === metal;
            return (
              <button
                key={metal}
                type="button"
                onClick={() => setSelectedMetal(metal)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
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

        {/* 3 RATE CARDS */}
        {selectedMetal === 'gold' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
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
              const isSelectedCard = selectedGoldPurity === item.purityKey;
              return (
                <button
                  key={item.purityKey}
                  type="button"
                  onClick={() => {
                    setSelectedGoldPurity(item.purityKey);
                    historySectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    });
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
                      <span>{isSelectedCard ? 'Selected' : 'View history'}</span>
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
                        <span>{isSelectedCard ? 'Showing date history below' : 'Click for date history'}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
              {silverItems.map((item) => {
                const isUp = item.change >= 0;
                const isSelectedCard = selectedSilverUnit === item.unitKey;
                return (
                  <button
                    key={item.unitKey}
                    type="button"
                    onClick={() => {
                      setSelectedSilverUnit(item.unitKey);
                      historySectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                      });
                    }}
                    className={`text-left rounded-xl p-3.5 sm:p-4 transition-all min-w-0 flex sm:block items-center justify-between gap-3 cursor-pointer group ${
                      isSelectedCard
                        ? 'bg-white border-2 border-slate-900 shadow-xs'
                        : 'bg-slate-50/70 border border-slate-200 hover:border-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs sm:text-[11px] font-semibold text-slate-700 sm:text-slate-500 block">{item.label}</span>
                      <span className="text-[11px] text-slate-400 sm:hidden font-mono block mt-0.5">999 Fine</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 mt-1 sm:hidden">
                        <History className="w-3 h-3" />
                        <span>{isSelectedCard ? 'Selected' : 'View history'}</span>
                      </span>
                    </div>
                    <div className="text-right sm:text-left min-w-0">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 font-mono tabular-nums sm:mt-1.5 tracking-tight break-words">
                        ₹{item.price.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center justify-end sm:justify-between sm:mt-2 sm:pt-2 sm:border-t sm:border-slate-200 text-[11px] font-mono font-semibold mt-0.5">
                        <span className={isUp ? 'text-emerald-600' : 'text-rose-600'}>
                          {isUp ? '+' : '-'}₹{Math.abs(item.change).toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 hidden sm:inline font-normal">999 Fine</span>
                      </div>
                      <div className="hidden sm:flex items-center justify-between mt-2 text-[10px] font-semibold text-slate-500 group-hover:text-slate-900">
                        <span className="inline-flex items-center gap-1">
                          <History className="w-3 h-3" />
                          <span>{isSelectedCard ? 'Showing date history below' : 'Click for date history'}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {selectedMetal === 'platinum' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
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

      {/* Historical Gold / Silver Rates with Dates (or Platinum/Diamond Chart) */}
      <div ref={historySectionRef}>
        {selectedMetal === 'gold' ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <GoldHistoryPanel
              city={selectedCity}
              selectedPurity={selectedGoldPurity}
              onSelectPurity={setSelectedGoldPurity}
              selectedDateIso={activeGoldDay.isoDate}
              onSelectDate={(day) =>
                setSelectedDateIso(day.isToday ? null : day.isoDate)
              }
            />
          </div>
        ) : selectedMetal === 'silver' ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <SilverHistoryPanel
              city={selectedCity}
              selectedUnit={selectedSilverUnit}
              onSelectUnit={setSelectedSilverUnit}
              selectedDateIso={activeSilverDay.isoDate}
              onSelectDate={(day) =>
                setSelectedDateIso(day.isToday ? null : day.isoDate)
              }
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedCity.city} Spot Trend
              </h3>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setChartTimeframe('7D')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    chartTimeframe === '7D' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setChartTimeframe('30D')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    chartTimeframe === '30D' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            <RechartsTrendChart data={chartData} height={230} currency="₹" chartTheme="amber" />
          </div>
        )}
      </div>

      {/* City Benchmark Insights Strip */}
      {cityComparison.lowest && cityComparison.highest && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Lowest 24K Rate Today
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-1.5">
              <span className="font-bold text-slate-900 text-sm truncate">
                {cityComparison.lowest.city}
              </span>
              <span className="font-mono font-bold text-emerald-600 text-sm shrink-0">
                ₹{cityComparison.lowest.rate24KPerGram.toLocaleString('en-IN')}/g
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Highest 24K Rate Today
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-1.5">
              <span className="font-bold text-slate-900 text-sm truncate">
                {cityComparison.highest.city}
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm shrink-0">
                ₹{cityComparison.highest.rate24KPerGram.toLocaleString('en-IN')}/g
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              City Spread &amp; FX
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-1.5">
              <span className="font-mono font-bold text-slate-900 text-sm">
                ₹{cityComparison.spread10g.toLocaleString('en-IN')}/10g
              </span>
              <span className="font-mono text-slate-500 text-xs shrink-0">
                USD/INR: ₹{usdInr.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* City Rates Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Compare Major Cities</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-right">24K Gold (1g)</th>
                <th className="py-2.5 px-3 text-right">22K Gold (1g)</th>
                <th className="py-2.5 px-3 text-right">Silver (1kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-num">
              {allCities.map((city) => (
                <tr
                  key={city.slug}
                  onClick={() =>
                    navigate(city.slug === 'national' ? '/gold-rate-today/' : `/gold-rate-today/${city.slug}/`)
                  }
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-sans font-semibold text-slate-900">{city.city}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ₹{city.rate24KPerGram.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-600">
                    ₹{city.rate22KPerGram.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">
                    ₹{city.silverPerKg.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
