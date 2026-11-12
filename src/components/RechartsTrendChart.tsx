import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { PricePoint } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RechartsTrendChartProps {
  data: PricePoint[];
  height?: number;
  currency?: string;
  isPositive?: boolean;
  valuePrefix?: string;
  chartTheme?: 'emerald' | 'amber' | 'blue' | 'auto';
  showControls?: boolean;
}

export const RechartsTrendChart: React.FC<RechartsTrendChartProps> = ({
  data,
  height = 240,
  currency = '₹',
  isPositive,
  valuePrefix = '',
  chartTheme = 'auto',
  showControls = true,
}) => {
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  if (!data || data.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium"
      >
        Insufficient price history available for interactive chart.
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const changeVal = lastPrice - firstPrice;
  const changePercent = ((changeVal / (firstPrice || 1)) * 100).toFixed(2);

  const positive = isPositive !== undefined ? isPositive : changeVal >= 0;

  // Determine color scheme based on chartTheme or trend direction
  let primaryColor = positive ? '#10b981' : '#f43f5e';
  if (chartTheme === 'amber') {
    primaryColor = '#f59e0b';
  } else if (chartTheme === 'emerald') {
    primaryColor = '#10b981';
  } else if (chartTheme === 'blue') {
    primaryColor = '#3b82f6';
  }

  const gradientId = `recharts-gradient-${Math.random().toString(36).substring(2, 7)}`;

  // Formatter for YAxis ticks
  const formatYAxisTick = (val: number) => {
    if (val >= 100000) return `${(val / 1000).toFixed(0)}k`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return `${val}`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as PricePoint;
      const pointChangePercent = (((dataPoint.price - firstPrice) / (firstPrice || 1)) * 100).toFixed(2);
      const isPointPositive = Number(pointChangePercent) >= 0;

      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs text-slate-900 font-mono z-50">
          <div className="text-[10px] text-slate-500 font-sans font-medium mb-1">
            {dataPoint.date}
          </div>

          <div className="text-sm font-bold" style={{ color: primaryColor }}>
            {valuePrefix}
            {currency}
            {dataPoint.price.toLocaleString('en-IN', {
              maximumFractionDigits: 2,
              minimumFractionDigits: dataPoint.price < 100 ? 2 : 0,
            })}
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-semibold mt-0.5">
            <span className={isPointPositive ? 'text-emerald-600' : 'text-rose-600'}>
              {isPointPositive ? '+' : ''}
              {pointChangePercent}%
            </span>
            <span className="text-[10px] text-slate-400 font-sans font-normal">vs start</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full select-none">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between mb-3 text-xs gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-medium text-[11px]">Period Change:</span>
            <span
              className={`flex items-center text-xs font-bold font-mono px-2 py-0.5 rounded-lg border ${
                positive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {positive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              <span>
                {positive ? '+' : ''}
                {changePercent}%
              </span>
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Range: {currency}
            {minPrice.toLocaleString('en-IN')} - {currency}
            {maxPrice.toLocaleString('en-IN')}
          </span>
        </div>

        {showControls && (
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 border border-slate-200 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bars
            </button>
          </div>
        )}
      </div>

      {/* Recharts Render Container */}
      <div style={{ width: '100%', height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={formatYAxisTick}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={primaryColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 5, fill: '#ffffff', stroke: primaryColor, strokeWidth: 2 }}
              />
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={formatYAxisTick}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={primaryColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#ffffff', stroke: primaryColor, strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={formatYAxisTick}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="price" fill={primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
