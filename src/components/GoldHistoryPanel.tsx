import React, { useMemo, useState } from 'react';
import { Calendar, ArrowUpRight, X, TrendingUp, TrendingDown } from 'lucide-react';
import { GoldCityRate } from '../types';
import {
  buildGoldHistory,
  buildGoldChartSeries,
  GoldHistoryDay,
  GoldPurity,
} from '../utils/goldHistory';
import { RechartsTrendChart } from './RechartsTrendChart';

interface GoldHistoryPanelProps {
  city: GoldCityRate;
  selectedPurity: GoldPurity;
  onSelectPurity: (purity: GoldPurity) => void;
  selectedDateIso?: string;
  onSelectDate?: (day: GoldHistoryDay) => void;
  onClose?: () => void;
  onOpenFullPage?: () => void;
}

export const GoldHistoryPanel: React.FC<GoldHistoryPanelProps> = ({
  city,
  selectedPurity,
  onSelectPurity,
  selectedDateIso,
  onSelectDate,
  onClose,
  onOpenFullPage,
}) => {
  const [timeframe, setTimeframe] = useState<7 | 15 | 30>(7);
  const [unit, setUnit] = useState<'1g' | '10g'>('1g');

  const fullHistory = useMemo(() => buildGoldHistory(city, 30), [city]);
  const visibleHistory = useMemo(
    () => fullHistory.slice(0, timeframe),
    [fullHistory, timeframe]
  );

  const chartData = useMemo(
    () => buildGoldChartSeries(visibleHistory, selectedPurity, unit),
    [visibleHistory, selectedPurity, unit]
  );

  const stats = useMemo(() => {
    const prices = visibleHistory.map((d) => {
      const base =
        selectedPurity === '24K'
          ? d.rate24KPerGram
          : selectedPurity === '22K'
          ? d.rate22KPerGram
          : d.rate18KPerGram;
      return unit === '10g' ? base * 10 : base;
    });
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const latest = prices[0] ?? 0;
    const earliest = prices[prices.length - 1] ?? latest;
    const diff = latest - earliest;
    const diffPct = earliest > 0 ? Math.round((diff / earliest) * 10000) / 100 : 0;
    return { high, low, diff, diffPct };
  }, [visibleHistory, selectedPurity, unit]);

  const multiplier = unit === '10g' ? 10 : 1;

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700 shrink-0" />
            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight break-words">
              {city.city} Gold Rate History ({selectedPurity})
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daily historical {selectedPurity} gold benchmark prices per {unit} with calendar dates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenFullPage && (
            <button
              type="button"
              onClick={onOpenFullPage}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>City Benchmarks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close gold rate history"
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Purity Tabs */}
        <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 text-xs font-semibold">
          {(['24K', '22K', '18K'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSelectPurity(p)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedPurity === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p} Gold
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle */}
          <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 text-xs font-semibold">
            {(['1g', '10g'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  unit === u
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                /{u}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 text-xs font-semibold">
            {([7, 15, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeframe(days)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeframe === days
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex sm:block items-center justify-between gap-2 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 block">
            {timeframe}D High ({selectedPurity} /{unit})
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm sm:mt-0.5 block break-words">
            ₹{stats.high.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex sm:block items-center justify-between gap-2 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 block">
            {timeframe}D Low ({selectedPurity} /{unit})
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm sm:mt-0.5 block break-words">
            ₹{stats.low.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex sm:block items-center justify-between gap-2 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 block">
            {timeframe}D Net Change
          </span>
          <span
            className={`font-mono font-bold text-sm sm:mt-0.5 inline-flex items-center gap-1 break-words ${
              stats.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {stats.diff >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {stats.diff >= 0 ? '+' : '-'}₹{Math.abs(stats.diff).toLocaleString('en-IN')} (
              {stats.diffPct >= 0 ? '+' : ''}
              {stats.diffPct}%)
            </span>
          </span>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
        <RechartsTrendChart
          data={chartData}
          height={210}
          currency="₹"
          chartTheme="amber"
        />
      </div>

      {/* Date-by-Date Historical Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900">
            Historical Gold Rates by Date ({unit})
          </span>
          {onSelectDate && (
            <span className="text-[11px] text-slate-500">
              Click any date row to view that day&apos;s rate
            </span>
          )}
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10 border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-2.5 px-3 sm:px-4">Date</th>
                <th
                  className={`py-2.5 px-3 text-right ${
                    selectedPurity === '24K' ? 'text-slate-900 font-bold bg-slate-50/70' : ''
                  }`}
                >
                  24K ({unit})
                </th>
                <th
                  className={`py-2.5 px-3 text-right ${
                    selectedPurity === '22K' ? 'text-slate-900 font-bold bg-slate-50/70' : ''
                  }`}
                >
                  22K ({unit})
                </th>
                <th
                  className={`py-2.5 px-3 text-right ${
                    selectedPurity === '18K' ? 'text-slate-900 font-bold bg-slate-50/70' : ''
                  }`}
                >
                  18K ({unit})
                </th>
                <th className="py-2.5 px-3 sm:px-4 text-right">
                  {selectedPurity} Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {visibleHistory.map((day) => {
                const isSelected = selectedDateIso === day.isoDate;
                const activeChange =
                  selectedPurity === '24K'
                    ? day.change24KPerGram * multiplier
                    : selectedPurity === '22K'
                    ? day.change22KPerGram * multiplier
                    : day.change18KPerGram * multiplier;
                const isUp = activeChange >= 0;

                return (
                  <tr
                    key={day.isoDate}
                    onClick={() => onSelectDate?.(day)}
                    className={`transition-colors ${
                      onSelectDate ? 'cursor-pointer hover:bg-slate-50' : ''
                    } ${isSelected ? 'bg-slate-100/80' : ''}`}
                  >
                    <td className="py-2.5 px-3 sm:px-4 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">
                          {day.shortLabel}
                        </span>
                        {day.isToday && (
                          <span className="text-[10px] font-semibold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        selectedPurity === '24K'
                          ? 'font-bold text-slate-900 bg-slate-50/50'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      ₹{(day.rate24KPerGram * multiplier).toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        selectedPurity === '22K'
                          ? 'font-bold text-slate-900 bg-slate-50/50'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      ₹{(day.rate22KPerGram * multiplier).toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        selectedPurity === '18K'
                          ? 'font-bold text-slate-900 bg-slate-50/50'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      ₹{(day.rate18KPerGram * multiplier).toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-2.5 px-3 sm:px-4 text-right font-semibold ${
                        isUp ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isUp ? '+' : '-'}₹
                      {Math.abs(Math.round(activeChange * 10) / 10).toLocaleString('en-IN')}
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
