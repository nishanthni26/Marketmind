import { GoldCityRate, PricePoint } from '../types';

export type GoldPurity = '24K' | '22K' | '18K';

export interface GoldHistoryDay {
  isoDate: string;
  label: string;
  shortLabel: string;
  isToday: boolean;
  rate24KPerGram: number;
  rate22KPerGram: number;
  rate18KPerGram: number;
  rate24KPer10g: number;
  rate22KPer10g: number;
  rate18KPer10g: number;
  change24KPerGram: number;
  change22KPerGram: number;
  change18KPerGram: number;
  changePercent: number;
}

// Deterministic daily percentage steps going backwards from Today (index 0 = today, index 1 = yesterday, ...)
// Index 1 is overridden so today's daily change matches the live city change24K exactly.
const HISTORICAL_STEP_PCT = [
  0,
  0, // derived from live change24K
  0.0042,
  -0.0068,
  0.0055,
  -0.0031,
  0.0074,
  0.0029,
  -0.0048,
  0.0061,
  -0.0022,
  0.0038,
  -0.0052,
  0.0044,
  0.0019,
  -0.0063,
  0.0049,
  -0.0027,
  0.0035,
  -0.0041,
  0.0058,
  -0.0018,
  0.0046,
  -0.0057,
  0.0033,
  -0.0025,
  0.0062,
  -0.0039,
  0.0028,
  0.0041,
];

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildGoldHistory(city: GoldCityRate, days: number = 30): GoldHistoryDay[] {
  const totalDays = Math.min(Math.max(days, 2), 30);
  const today24 = Math.round(city.rate24KPerGram || 14362);
  const today22 = Math.round(city.rate22KPerGram || Math.round(today24 * 0.9206));
  const today18 = Math.round(city.rate18KPerGram || Math.round(today24 * 0.7538));
  const liveChange24 = city.change24K ?? -185.2;

  // Compute deterministic city seed offset so different cities have slightly distinct realistic curves
  const citySeed = (city.slug || 'national')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  // Build 24K series backwards from today
  const rates24Desc: number[] = new Array(totalDays + 1);
  rates24Desc[0] = today24;
  rates24Desc[1] = Math.max(1000, Math.round(today24 - liveChange24));

  for (let i = 2; i <= totalDays; i++) {
    const baseStep = HISTORICAL_STEP_PCT[i % HISTORICAL_STEP_PCT.length];
    const microJitter = (((citySeed + i * 7) % 11) - 5) * 0.0002;
    const pctDelta = baseStep + microJitter;
    // Going backwards: prevDay = currentDay / (1 + pctDelta)
    rates24Desc[i] = Math.max(1000, Math.round(rates24Desc[i - 1] / (1 + pctDelta)));
  }

  const ratio22 = today22 / (today24 || 1);
  const ratio18 = today18 / (today24 || 1);

  const now = new Date();
  const history: GoldHistoryDay[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const r24 = rates24Desc[i];
    const r22 = i === 0 ? today22 : Math.round(r24 * ratio22);
    const r18 = i === 0 ? today18 : Math.round(r24 * ratio18);

    const prev24 = rates24Desc[i + 1];
    const prev22 = Math.round(prev24 * ratio22);
    const prev18 = Math.round(prev24 * ratio18);

    const chg24 = i === 0 ? Math.round(liveChange24 * 10) / 10 : r24 - prev24;
    const chg22 =
      i === 0
        ? Math.round((city.change22K ?? liveChange24 * ratio22) * 10) / 10
        : r22 - prev22;
    const chg18 =
      i === 0
        ? Math.round(liveChange24 * ratio18 * 10) / 10
        : r18 - prev18;
    const chgPct = prev24 > 0 ? Math.round(((r24 - prev24) / prev24) * 10000) / 100 : 0;

    history.push({
      isoDate: formatIsoDate(d),
      label: formatLongDate(d),
      shortLabel: formatShortDate(d),
      isToday: i === 0,
      rate24KPerGram: r24,
      rate22KPerGram: r22,
      rate18KPerGram: r18,
      rate24KPer10g: r24 * 10,
      rate22KPer10g: r22 * 10,
      rate18KPer10g: r18 * 10,
      change24KPerGram: chg24,
      change22KPerGram: chg22,
      change18KPerGram: chg18,
      changePercent: chgPct,
    });
  }

  return history;
}

export function buildGoldChartSeries(
  history: GoldHistoryDay[],
  purity: GoldPurity = '24K',
  unit: '1g' | '10g' = '1g'
): PricePoint[] {
  const multiplier = unit === '10g' ? 10 : 1;
  return [...history]
    .reverse()
    .map((day) => {
      const base =
        purity === '24K'
          ? day.rate24KPerGram
          : purity === '22K'
          ? day.rate22KPerGram
          : day.rate18KPerGram;
      return {
        date: day.shortLabel.replace(/\s+\d{4}$/, ''),
        price: base * multiplier,
      };
    });
}
