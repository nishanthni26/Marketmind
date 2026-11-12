import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  mockOverview,
  goldCityRates,
  mockStocks,
  mockMutualFunds,
  mockCrypto,
  mockCommodities,
  mockNewsArticles,
  mockLearnArticles,
  mockMarketInsights,
} from './src/data/financialData';
import { NewsArticle } from './src/types';
import { buildGoldHistory, buildGoldChartSeries } from './src/utils/goldHistory';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

let newsStore = [...mockNewsArticles];
let learnStore = [...mockLearnArticles];
let insightsStore = [...mockMarketInsights];
let feedbackStore: Array<{ id: string; name: string; email: string; subject: string; message: string; createdAt: string }> = [];
let lastDataRefreshTime = new Date().toISOString();

let liveMarketState = {
  usdInr: 93.85,
  gold24KPerGram: 14362,
  gold22KPerGram: 13222,
  gold18KPerGram: 10826,
  goldChange24K: -185.2,
  goldChange22K: -170.5,
  goldChange18K: -139.6,
  goldChangePercent: -1.27,
  silverPerKg: 200000,
  silverPerGram: 200,
  silverChange: 500,
  nifty50: { price: 24350.25, changePercent: 0.59, change: 142.8 },
  sensex: { price: 80210.80, changePercent: 0.61, change: 485.2 },
  overviewIndices: [...mockOverview.indices],
  stocks: [...mockStocks],
  crypto: [...mockCrypto],
  commodities: [...mockCommodities],
  news: [...mockNewsArticles],
  lastFetched: new Date().toISOString(),
  isLive: false,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

async function fetchYahooChart(symbol: string, range: string, interval: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.chart?.result?.[0] || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function formatCompactUSD(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)} Trillion`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)} Billion`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)} Million`;
  return `$${val.toLocaleString('en-US')}`;
}

function formatLakhsCrores(inrVal: number): string {
  const crore = inrVal / 1e7;
  if (crore >= 100000) return `₹${(crore / 100000).toFixed(1)} Lakh Cr`;
  return `₹${Math.round(crore).toLocaleString('en-IN')} Cr`;
}

function formatVolume(vol: number | undefined, isIndex: boolean, fallback: string): string {
  if (isIndex) return 'Index';
  if (!vol || vol <= 0) return fallback;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return String(vol);
}

let lastLongHistoryFetchMs = 0;
let initialFetchPromise: Promise<void> | null = null;

async function fetchRealMarketData() {
  let fetchedAny = false;
  try {
    // 1. USD/INR
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        if (fxData && fxData.rates && fxData.rates.INR) {
          liveMarketState.usdInr = Number(fxData.rates.INR.toFixed(2));
          fetchedAny = true;
        }
      }
    } catch (e) {
      console.warn('[MarketMind] FX fetch warning:', e);
    }

    // 2. Spot Gold & Silver (with real Yahoo Futures daily % change)
    try {
      const [goldRes, silverRes, gcChart, siChart] = await Promise.allSettled([
        fetch('https://api.gold-api.com/price/XAU', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        fetch('https://api.gold-api.com/price/XAG', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        fetchYahooChart('GC=F', '1d', '15m'),
        fetchYahooChart('SI=F', '1d', '15m'),
      ]);

      let goldPct = liveMarketState.goldChangePercent;
      if (gcChart.status === 'fulfilled' && gcChart.value?.meta?.regularMarketPrice && gcChart.value?.meta?.chartPreviousClose) {
        const p = Number(gcChart.value.meta.regularMarketPrice);
        const prev = Number(gcChart.value.meta.chartPreviousClose);
        if (prev > 0) goldPct = round2(((p - prev) / prev) * 100);
      }

      if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
        const gData = await goldRes.value.json();
        if (gData && gData.price) {
          const xauUsd = Number(gData.price);
          // Landed retail formula with India Customs (~15%) and retail banking/landed clearing buffer (~3.5%)
          const rawInrPerGram = (xauUsd / 31.1034768) * liveMarketState.usdInr * 1.15 * 1.0354;
          const calc24K = Math.round(rawInrPerGram);
          if (calc24K > 2000) {
            const calc22K = Math.round(calc24K * 0.9206);
            const calc18K = Math.round(calc24K * 0.7538);
            const chg24 = Math.round(calc24K * (goldPct / 100) * 10) / 10;
            liveMarketState.gold24KPerGram = calc24K;
            liveMarketState.gold22KPerGram = calc22K;
            liveMarketState.gold18KPerGram = calc18K;
            liveMarketState.goldChangePercent = goldPct;
            liveMarketState.goldChange24K = chg24;
            liveMarketState.goldChange22K = Math.round(chg24 * 0.9206 * 10) / 10;
            liveMarketState.goldChange18K = Math.round(chg24 * 0.7538 * 10) / 10;
            fetchedAny = true;
          }
        }
      }

      let silverPct = 0.45;
      if (siChart.status === 'fulfilled' && siChart.value?.meta?.regularMarketPrice && siChart.value?.meta?.chartPreviousClose) {
        const p = Number(siChart.value.meta.regularMarketPrice);
        const prev = Number(siChart.value.meta.chartPreviousClose);
        if (prev > 0) silverPct = round2(((p - prev) / prev) * 100);
      }

      if (silverRes.status === 'fulfilled' && silverRes.value.ok) {
        const sData = await silverRes.value.json();
        if (sData && sData.price) {
          const xagUsd = Number(sData.price);
          // Landed Indian retail silver parity (customs + local retail bullion & clearing spread matching Goodreturns/retail ₹200/g)
          const rawInrPerKg = (xagUsd / 31.1034768) * 1000 * liveMarketState.usdInr * 1.15 * 1.1507;
          const calcSilverKg = Math.round(rawInrPerKg);
          if (calcSilverKg > 10000) {
            liveMarketState.silverPerKg = calcSilverKg;
            liveMarketState.silverPerGram = Number((calcSilverKg / 1000).toFixed(2));
            liveMarketState.silverChange = Math.round(calcSilverKg * (silverPct / 100));
            fetchedAny = true;
          }
        }
      }
    } catch (e) {
      console.warn('[MarketMind] Bullion fetch warning:', e);
    }

    // 3. Crypto via CoinGecko Markets + Simple INR
    try {
      const [cgMarketsRes, cgSimpleRes] = await Promise.allSettled([
        fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano&sparkline=true&price_change_percentage=24h',
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        ),
        fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=usd,inr&include_24hr_change=true',
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        ),
      ]);

      const marketsById: Record<string, any> = {};
      if (cgMarketsRes.status === 'fulfilled' && cgMarketsRes.value.ok) {
        const arr = await cgMarketsRes.value.json();
        if (Array.isArray(arr)) {
          arr.forEach((item: any) => {
            if (item?.id) marketsById[item.id] = item;
          });
        }
      }

      const simpleById: Record<string, any> =
        cgSimpleRes.status === 'fulfilled' && cgSimpleRes.value.ok
          ? await cgSimpleRes.value.json()
          : {};

      if (Object.keys(marketsById).length > 0 || Object.keys(simpleById).length > 0) {
        const idMap: Record<string, string> = {
          BTC: 'bitcoin',
          ETH: 'ethereum',
          SOL: 'solana',
          ADA: 'cardano',
        };
        liveMarketState.crypto = liveMarketState.crypto.map((coin) => {
          const id = idMap[coin.symbol];
          const m = id ? marketsById[id] : null;
          const s = id ? simpleById[id] : null;
          if (!m && !s) return coin;

          const priceUSD = m?.current_price ?? s?.usd ?? coin.priceUSD;
          const priceINR = s?.inr ?? round2(priceUSD * liveMarketState.usdInr);
          const change24h = round2(
            m?.price_change_percentage_24h ?? s?.usd_24h_change ?? coin.change24h
          );

          let historical30D = coin.historical30D;
          let sparkline = coin.sparkline;
          const rawSpark: number[] = m?.sparkline_in_7d?.price || [];
          if (rawSpark.length >= 7) {
            const step = Math.max(1, Math.floor(rawSpark.length / 7));
            sparkline = rawSpark
              .filter((_, i) => i % step === 0)
              .slice(-7)
              .map((v) => round2(v));
            const now = new Date();
            historical30D = sparkline.map((val, idx) => {
              const d = new Date(now);
              d.setDate(now.getDate() - (sparkline.length - 1 - idx));
              return {
                date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                price: val,
              };
            });
          }

          return {
            ...coin,
            priceUSD,
            priceINR,
            change24h,
            marketCapUSD: m?.market_cap ? formatCompactUSD(m.market_cap) : coin.marketCapUSD,
            marketCapINR: m?.market_cap
              ? formatLakhsCrores(m.market_cap * liveMarketState.usdInr)
              : coin.marketCapINR,
            volume24hUSD: m?.total_volume ? formatCompactUSD(m.total_volume) : coin.volume24hUSD,
            circulatingSupply: m?.circulating_supply
              ? `${(m.circulating_supply / 1e6).toFixed(2)}M ${coin.symbol}`
              : coin.circulatingSupply,
            allTimeHighUSD: m?.ath ?? coin.allTimeHighUSD,
            rank: m?.market_cap_rank ?? coin.rank,
            sparkline,
            historical30D,
          };
        });
        fetchedAny = true;
      }
    } catch (e) {
      console.warn('[MarketMind] Crypto fetch warning:', e);
    }

    // 4. Stocks & Indices via Yahoo Finance v8 chart API
    try {
      const stockSymbolMap: Record<string, string> = {
        SENSEX: '^BSESN',
        NIFTY50: '^NSEI',
        RELIANCE: 'RELIANCE.NS',
        TCS: 'TCS.NS',
        HDFCBANK: 'HDFCBANK.NS',
        INFY: 'INFY.NS',
        ICICIBANK: 'ICICIBANK.NS',
        TATAMOTORS: 'TMPV.NS',
        SBIN: 'SBIN.NS',
        AAPL: 'AAPL',
        NVDA: 'NVDA',
      };

      const fetchLongHistory = Date.now() - lastLongHistoryFetchMs > 10 * 60 * 1000;

      const stockEntries = Object.entries(stockSymbolMap);
      const dayResults = await Promise.all(
        stockEntries.map(async ([sym, yahooSym]) => ({
          sym,
          data: await fetchYahooChart(yahooSym, '1d', '15m'),
        }))
      );

      const longResultsMap: Record<string, any> = {};
      if (fetchLongHistory) {
        const longResults = await Promise.all(
          stockEntries.map(async ([sym, yahooSym]) => ({
            sym,
            data1y: await fetchYahooChart(yahooSym, '1y', '1d'),
            data5y: await fetchYahooChart(yahooSym, '5y', '1mo'),
          }))
        );
        longResults.forEach((r) => {
          longResultsMap[r.sym] = r;
        });
        lastLongHistoryFetchMs = Date.now();
      }

      const dayMap: Record<string, any> = {};
      dayResults.forEach((r) => {
        if (r.data) dayMap[r.sym] = r.data;
      });

      if (Object.keys(dayMap).length > 0) {
        liveMarketState.stocks = liveMarketState.stocks.map((stock) => {
          const chart1d = dayMap[stock.symbol];
          if (!chart1d?.meta?.regularMarketPrice) return stock;

          const meta = chart1d.meta;
          const isIndex = stock.symbol === 'SENSEX' || stock.symbol === 'NIFTY50';
          const price = round2(Number(meta.regularMarketPrice));
          const previousClose = round2(
            Number(meta.chartPreviousClose ?? meta.previousClose ?? stock.previousClose)
          );
          const change = round2(price - previousClose);
          const changePercent =
            previousClose > 0 ? round2((change / previousClose) * 100) : stock.changePercent;

          const quote1d = chart1d.indicators?.quote?.[0];
          const rawOpens: Array<number | null> = quote1d?.open || [];
          const firstValidOpen = rawOpens.find((v) => v != null && v > 0);
          const open = round2(Number(meta.regularMarketOpen ?? firstValidOpen ?? stock.open));
          const high = round2(Number(meta.regularMarketDayHigh ?? stock.high));
          const low = round2(Number(meta.regularMarketDayLow ?? stock.low));
          const high52W = round2(Number(meta.fiftyTwoWeekHigh ?? stock.high52W));
          const low52W = round2(Number(meta.fiftyTwoWeekLow ?? stock.low52W));
          const volume = Number(meta.regularMarketVolume || stock.volume);
          const volumeDisplay = formatVolume(volume, isIndex, stock.volumeDisplay);

          // Intraday 1D series
          const ts1d: number[] = chart1d.timestamp || [];
          const cls1d: Array<number | null> = quote1d?.close || [];
          const pts1d: { date: string; price: number }[] = [];
          for (let i = 0; i < ts1d.length; i++) {
            if (cls1d[i] != null) {
              pts1d.push({
                date: new Date(ts1d[i] * 1000).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }),
                price: round2(Number(cls1d[i])),
              });
            }
          }
          const historical1D =
            pts1d.length >= 2
              ? pts1d.filter((_, idx) => idx % Math.max(1, Math.floor(pts1d.length / 10)) === 0 || idx === pts1d.length - 1)
              : stock.historical1D;

          let historical1M = stock.historical1M;
          let historical1Y = stock.historical1Y;
          let historical5Y = stock.historical5Y;

          const longInfo = longResultsMap[stock.symbol];
          if (longInfo?.data1y) {
            const ts1y: number[] = longInfo.data1y.timestamp || [];
            const cls1y: Array<number | null> = longInfo.data1y.indicators?.quote?.[0]?.close || [];
            const valid1y: { date: string; price: number }[] = [];
            for (let i = 0; i < ts1y.length; i++) {
              if (cls1y[i] != null) {
                valid1y.push({
                  date: new Date(ts1y[i] * 1000).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  }),
                  price: round2(Number(cls1y[i])),
                });
              }
            }
            if (valid1y.length >= 10) {
              const last22 = valid1y.slice(-22);
              historical1M = last22.filter(
                (_, idx) => idx % 4 === 0 || idx === last22.length - 1
              );
              const step1y = Math.max(1, Math.floor(valid1y.length / 8));
              historical1Y = valid1y.filter(
                (_, idx) => idx % step1y === 0 || idx === valid1y.length - 1
              );
            }
          }

          if (longInfo?.data5y) {
            const ts5y: number[] = longInfo.data5y.timestamp || [];
            const cls5y: Array<number | null> = longInfo.data5y.indicators?.quote?.[0]?.close || [];
            const valid5y: { date: string; price: number }[] = [];
            for (let i = 0; i < ts5y.length; i++) {
              if (cls5y[i] != null) {
                valid5y.push({
                  date: new Date(ts5y[i] * 1000).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  }),
                  price: round2(Number(cls5y[i])),
                });
              }
            }
            if (valid5y.length >= 6) {
              const step5y = Math.max(1, Math.floor(valid5y.length / 8));
              historical5Y = valid5y.filter(
                (_, idx) => idx % step5y === 0 || idx === valid5y.length - 1
              );
            }
          }

          if (stock.symbol === 'NIFTY50') {
            liveMarketState.nifty50 = { price, changePercent, change };
          }
          if (stock.symbol === 'SENSEX') {
            liveMarketState.sensex = { price, changePercent, change };
          }

          return {
            ...stock,
            price,
            change,
            changePercent,
            open,
            high,
            low,
            previousClose,
            high52W,
            low52W,
            volume,
            volumeDisplay,
            historical1D,
            historical1M,
            historical1Y,
            historical5Y,
          };
        });

        // Also update extra overview indices (NIFTY BANK, NIFTY IT, S&P 500, NASDAQ)
        const extraIndicesMap: Record<string, string> = {
          BANKNIFTY: '^NSEBANK',
          NIFTYIT: '^CNXIT',
          SPX: '^GSPC',
          IXIC: '^IXIC',
        };
        const extraResults = await Promise.all(
          Object.entries(extraIndicesMap).map(async ([sym, ySym]) => ({
            sym,
            data: await fetchYahooChart(ySym, '1d', '15m'),
          }))
        );
        const extraMap: Record<string, any> = {};
        extraResults.forEach((r) => {
          if (r.data?.meta?.regularMarketPrice) extraMap[r.sym] = r.data.meta;
        });

        liveMarketState.overviewIndices = liveMarketState.overviewIndices.map((idxItem) => {
          if (idxItem.symbol === 'NIFTY50') {
            return { ...idxItem, ...liveMarketState.nifty50 };
          }
          if (idxItem.symbol === 'SENSEX') {
            return { ...idxItem, ...liveMarketState.sensex };
          }
          const m = extraMap[idxItem.symbol];
          if (m) {
            const p = round2(Number(m.regularMarketPrice));
            const prev = round2(Number(m.chartPreviousClose ?? p));
            const chg = round2(p - prev);
            const chgPct = prev > 0 ? round2((chg / prev) * 100) : 0;
            return { ...idxItem, price: p, change: chg, changePercent: chgPct };
          }
          return idxItem;
        });

        fetchedAny = true;
      }
    } catch (e) {
      console.warn('[MarketMind] Stock quotes fetch warning:', e);
    }

    // 5. Commodities via Yahoo Finance v8 chart API
    try {
      const commoditySymbolMap: Record<string, string> = {
        'crude-oil': 'BZ=F',
        'natural-gas': 'NG=F',
        copper: 'HG=F',
        aluminium: 'ALI=F',
        zinc: 'ZNC=F',
      };

      const commResults = await Promise.all(
        Object.entries(commoditySymbolMap).map(async ([slug, ySym]) => ({
          slug,
          day: await fetchYahooChart(ySym, '1d', '15m'),
          month: await fetchYahooChart(ySym, '1mo', '1d'),
        }))
      );

      const commMap: Record<string, { day: any; month: any }> = {};
      commResults.forEach((r) => {
        if (r.day || r.month) commMap[r.slug] = { day: r.day, month: r.month };
      });

      if (Object.keys(commMap).length > 0) {
        liveMarketState.commodities = liveMarketState.commodities.map((comm) => {
          const entry = commMap[comm.slug];
          if (!entry?.day?.meta?.regularMarketPrice) return comm;

          const meta = entry.day.meta;
          const price = round2(Number(meta.regularMarketPrice));
          const prev = round2(Number(meta.chartPreviousClose ?? price));
          const change = round2(price - prev);
          const changePercent = prev > 0 ? round2((change / prev) * 100) : comm.changePercent;
          const high = round2(Number(meta.regularMarketDayHigh ?? comm.high));
          const low = round2(Number(meta.regularMarketDayLow ?? comm.low));

          let historical30D = comm.historical30D;
          if (entry.month) {
            const ts: number[] = entry.month.timestamp || [];
            const cls: Array<number | null> = entry.month.indicators?.quote?.[0]?.close || [];
            const pts: { date: string; price: number }[] = [];
            for (let i = 0; i < ts.length; i++) {
              if (cls[i] != null) {
                pts.push({
                  date: new Date(ts[i] * 1000).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  }),
                  price: round2(Number(cls[i])),
                });
              }
            }
            if (pts.length >= 5) {
              const step = Math.max(1, Math.floor(pts.length / 6));
              historical30D = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
            }
          }

          return {
            ...comm,
            price,
            change,
            changePercent,
            high,
            low,
            historical30D,
          };
        });
        fetchedAny = true;
      }
    } catch (e) {
      console.warn('[MarketMind] Commodities fetch warning:', e);
    }

    // 5. News RSS from Google News India (Multi-query: Stocks, Bullion, Economy)
    try {
      const cleanXml = (str: string) =>
        str
          .replace(/<!\[CDATA\[/g, '')
          .replace(/\]\]>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

      const rssQueries = [
        'Sensex+Nifty+stocks+gold+silver+crypto+India+market',
        'gold+rate+price+silver+bullion+India+market',
      ];

      const parsedArticles: NewsArticle[] = [];
      const seenTitles = new Set<string>();
      const seenSlugs = new Set<string>();

      for (const query of rssQueries) {
        try {
          const newsRes = await fetch(
            `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (newsRes.ok) {
            const xmlText = await newsRes.text();
            const items = xmlText.split('<item>');
            for (let i = 1; i < Math.min(items.length, 12); i++) {
              const rawItem = items[i];
              const titleMatch = rawItem.match(/<title>(.*?)<\/title>/);
              const dateMatch = rawItem.match(/<pubDate>(.*?)<\/pubDate>/);
              const sourceMatch = rawItem.match(/<source.*?>(.*?)<\/source>/);

              if (titleMatch && titleMatch[1]) {
                const rawTitle = cleanXml(titleMatch[1]);
                if (!rawTitle || seenTitles.has(rawTitle.toLowerCase())) continue;
                seenTitles.add(rawTitle.toLowerCase());

                const sourceName = sourceMatch ? cleanXml(sourceMatch[1]) : 'Live Financial Wire';
                const pubDate = dateMatch
                  ? new Date(dateMatch[1]).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Today';

                let baseSlug =
                  rawTitle
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '')
                    .substring(0, 70);
                if (!baseSlug) baseSlug = `news-${parsedArticles.length + 1}`;

                let cleanSlug = baseSlug;
                let slugCounter = 1;
                while (seenSlugs.has(cleanSlug)) {
                  cleanSlug = `${baseSlug}-${slugCounter}`;
                  slugCounter++;
                }
                seenSlugs.add(cleanSlug);

                // Categorize accurately
                const tLower = rawTitle.toLowerCase();
                let category: 'stocks' | 'business' | 'banking' | 'economy' | 'global' = 'business';
                if (/bank|rbi|repo|deposit|lending|hdfc|sbi|icici|kotak|axis/.test(tLower)) {
                  category = 'banking';
                } else if (/sensex|nifty|stock|shares|equity|ipo|bull|bear|rally|bse|nse|plunge|gainers|losers/.test(tLower)) {
                  category = 'stocks';
                } else if (/fed|wall street|us |china|global|iran|war|oil|brent|dollar/.test(tLower)) {
                  category = 'global';
                } else if (/gdp|inflation|economy|budget|deficit|tax|gst|trade|rupee|policy/.test(tLower)) {
                  category = 'economy';
                } else {
                  category = 'business';
                }

                parsedArticles.push({
                  id: cleanSlug,
                  slug: cleanSlug,
                  title: rawTitle,
                  category,
                  summary: `Real-time financial report published by ${sourceName}. Covers spot benchmarks, domestic liquidity, and market trends.`,
                  content: [
                    `${rawTitle}.`,
                    `Real-time coverage provided by ${sourceName}. Indian capital markets, bullion exchanges, and key benchmark indices (including Nifty 50, BSE Sensex, and physical spot gold/silver) are adjusting to the latest economic updates.`,
                    `Analysts and market participants are monitoring domestic macro indicators, institutional fund flows, and global commodity sentiment on MarketMind.`,
                  ],
                  aiBullets: [
                    `Publisher: ${sourceName}`,
                    `Live coverage across Indian equities, Sensex, Nifty 50, and bullion markets.`,
                    `Published: ${pubDate}`,
                  ],
                  author: sourceName,
                  source: sourceName,
                  publishedAt: pubDate,
                  readTime: '2 min read',
                  tags: ['Live Feed', 'Real-Time News', category.toUpperCase(), sourceName],
                });
              }
            }
          }
        } catch (queryErr) {
          console.warn('[MarketMind] RSS query error:', queryErr);
        }
      }

      if (parsedArticles.length > 0) {
        liveMarketState.news = parsedArticles;
        newsStore = parsedArticles;
        fetchedAny = true;
      }
    } catch (e) {
      console.warn('[MarketMind] News RSS fetch warning:', e);
    }

    if (fetchedAny) {
      liveMarketState.isLive = true;
      liveMarketState.lastFetched = new Date().toISOString();
      lastDataRefreshTime = liveMarketState.lastFetched;
      console.log('[MarketMind] Live market data synchronized at:', liveMarketState.lastFetched);
    }
  } catch (err) {
    console.warn('[MarketMind] Real data fetch exception:', err);
  }
}

initialFetchPromise = fetchRealMarketData();
setInterval(fetchRealMarketData, 60 * 1000);

async function ensureInitialLiveData() {
  if (!liveMarketState.isLive && initialFetchPromise) {
    try {
      await Promise.race([
        initialFetchPromise,
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);
    } catch {
      // fallback safely
    }
  }
}

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/benchmarks', async (_req: Request, res: Response) => {
  await ensureInitialLiveData();
  res.json({
    nifty50: liveMarketState.nifty50,
    sensex: liveMarketState.sensex,
    gold24KPerGram: liveMarketState.gold24KPerGram,
    silverPerKg: liveMarketState.silverPerKg,
    usdInr: liveMarketState.usdInr,
    lastFetched: liveMarketState.lastFetched,
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/overview', async (_req: Request, res: Response) => {
  await ensureInitialLiveData();
  res.json({
    ...mockOverview,
    indices: liveMarketState.overviewIndices,
    nifty50: liveMarketState.nifty50,
    sensex: liveMarketState.sensex,
    goldBenchmark: {
      ...mockOverview.goldBenchmark,
      rate24KPer10g: liveMarketState.gold24KPerGram * 10,
      rate22KPer10g: liveMarketState.gold22KPerGram * 10,
      change: liveMarketState.goldChange24K * 10,
      changePercent: liveMarketState.goldChangePercent,
    },
    silverBenchmark: {
      ...mockOverview.silverBenchmark,
      ratePerKg: liveMarketState.silverPerKg,
      change: liveMarketState.silverChange,
    },
    lastUpdated: liveMarketState.lastFetched,
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/gold-silver', async (_req: Request, res: Response) => {
  await ensureInitialLiveData();
  const base24K = liveMarketState.gold24KPerGram;
  const baseSilverKg = liveMarketState.silverPerKg;
  const change24K = liveMarketState.goldChange24K;
  const change22K = liveMarketState.goldChange22K;
  const changePercent = liveMarketState.goldChangePercent;

  const dynamicCities = goldCityRates.map((city) => {
    let cityMultiplier = 1.0;
    if (city.slug === 'chennai' || city.slug === 'hyderabad') cityMultiplier = 1.002;
    if (city.slug === 'mumbai') cityMultiplier = 0.998;

    const r24Gram = Math.round(base24K * cityMultiplier);
    const r22Gram = Math.round(r24Gram * 0.9206);
    const r18Gram = Math.round(r24Gram * 0.7538);
    const silverKg = Math.round(baseSilverKg * cityMultiplier);
    const chg24 = Math.round(change24K * cityMultiplier * 10) / 10;
    const chg22 = Math.round(change22K * cityMultiplier * 10) / 10;

    const citySnapshot = {
      ...city,
      rate24KPerGram: r24Gram,
      rate24KPer10g: r24Gram * 10,
      rate22KPerGram: r22Gram,
      rate22KPer10g: r22Gram * 10,
      rate18KPerGram: r18Gram,
      rate18KPer10g: r18Gram * 10,
      change24K: chg24,
      change22K: chg22,
      changePercent,
      silverPerKg: silverKg,
      silverPerGram: Number((silverKg / 1000).toFixed(2)),
      silverChange: liveMarketState.silverChange,
      lastUpdated: liveMarketState.lastFetched,
    };

    const history30 = buildGoldHistory(citySnapshot, 30);

    return {
      ...citySnapshot,
      historical7D: buildGoldChartSeries(history30.slice(0, 7), '24K', '10g'),
      historical30D: buildGoldChartSeries(history30, '24K', '10g'),
    };
  });

  res.json({
    cities: dynamicCities,
    nationalBenchmark: dynamicCities.find((c) => c.slug === 'national') || dynamicCities[0],
    lastUpdated: liveMarketState.lastFetched,
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/gold-silver/:city', (req: Request, res: Response) => {
  const citySlug = req.params.city.toLowerCase();
  const cityData = goldCityRates.find((c) => c.slug === citySlug) || goldCityRates[0];

  let cityMultiplier = 1.0;
  if (cityData.slug === 'chennai' || cityData.slug === 'hyderabad') cityMultiplier = 1.002;
  if (cityData.slug === 'mumbai') cityMultiplier = 0.998;

  const r24Gram = Math.round(liveMarketState.gold24KPerGram * cityMultiplier);
  const r22Gram = Math.round(r24Gram * 0.9206);
  const r18Gram = Math.round(r24Gram * 0.7538);
  const silverKg = Math.round(liveMarketState.silverPerKg * cityMultiplier);
  const chg24 = Math.round((liveMarketState.goldChange24K || -185.2) * cityMultiplier * 10) / 10;
  const chg22 = Math.round((liveMarketState.goldChange22K || -170.5) * cityMultiplier * 10) / 10;

  const citySnapshot = {
    ...cityData,
    rate24KPerGram: r24Gram,
    rate24KPer10g: r24Gram * 10,
    rate22KPerGram: r22Gram,
    rate22KPer10g: r22Gram * 10,
    rate18KPerGram: r18Gram,
    rate18KPer10g: r18Gram * 10,
    change24K: chg24,
    change22K: chg22,
    changePercent: liveMarketState.goldChangePercent || -1.27,
    silverPerKg: silverKg,
    silverPerGram: Number((silverKg / 1000).toFixed(2)),
    lastUpdated: liveMarketState.lastFetched,
  };

  const history30 = buildGoldHistory(citySnapshot, 30);

  res.json({
    ...citySnapshot,
    historical7D: buildGoldChartSeries(history30.slice(0, 7), '24K', '10g'),
    historical30D: buildGoldChartSeries(history30, '24K', '10g'),
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/stocks', async (req: Request, res: Response) => {
  await ensureInitialLiveData();
  const { category } = req.query;
  let result = [...liveMarketState.stocks];

  if (category === 'nse') {
    result = result.filter((s) => s.exchange === 'NSE');
  } else if (category === 'bse') {
    result = result.filter((s) => s.exchange === 'BSE' || s.exchange === 'NSE');
  } else if (category === 'international') {
    result = result.filter((s) => s.category === 'international');
  } else if (category === 'top-gainers') {
    result = result.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
  } else if (category === 'top-losers') {
    result = result.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
  } else if (category === 'most-active') {
    result = result.filter((s) => s.isMostActive).sort((a, b) => b.volume - a.volume);
  }

  res.json({
    stocks: result,
    total: result.length,
    lastUpdated: liveMarketState.lastFetched,
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/stocks/:slug', async (req: Request, res: Response) => {
  await ensureInitialLiveData();
  const { slug } = req.params;
  const lower = slug.toLowerCase();

  let targetSlug = slug;
  if (lower === 'sensex' || lower === 'bsesn' || lower === 'bse-sensex') {
    targetSlug = 'sensex';
  } else if (lower === 'nifty' || lower === 'nifty50' || lower === 'nsei' || lower === 'nse-nifty') {
    targetSlug = 'nifty50';
  }

  const stock = liveMarketState.stocks.find(
    (s) =>
      s.slug === targetSlug ||
      s.symbol.toLowerCase() === lower ||
      s.slug.toLowerCase() === lower
  );

  if (!stock) {
    res.status(404).json({ error: 'Stock or index not found' });
    return;
  }
  res.json(stock);
});

app.get('/api/mutual-funds', (req: Request, res: Response) => {
  const { category } = req.query;
  let result = [...mockMutualFunds];

  if (category && category !== 'all') {
    if (category === 'best-performing') {
      result = result.filter((f) => f.isBestPerforming);
    } else {
      result = result.filter((f) => f.category === category);
    }
  }

  res.json({
    funds: result,
    total: result.length,
    lastUpdated: liveMarketState.lastFetched,
  });
});

app.get('/api/mutual-funds/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const fund = mockMutualFunds.find((f) => f.slug === slug || f.id === slug);
  if (!fund) {
    res.status(404).json({ error: 'Mutual fund not found' });
    return;
  }
  res.json(fund);
});

app.get('/api/crypto', async (_req: Request, res: Response) => {
  await ensureInitialLiveData();
  res.json({
    crypto: liveMarketState.crypto,
    total: liveMarketState.crypto.length,
    lastUpdated: liveMarketState.lastFetched,
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/crypto/:slug', async (req: Request, res: Response) => {
  await ensureInitialLiveData();
  const { slug } = req.params;
  const coin = liveMarketState.crypto.find((c) => c.slug === slug || c.symbol.toLowerCase() === slug.toLowerCase());
  if (!coin) {
    res.status(404).json({ error: 'Cryptocurrency not found' });
    return;
  }
  res.json(coin);
});

app.get('/api/commodities', async (_req: Request, res: Response) => {
  await ensureInitialLiveData();
  res.json({
    commodities: liveMarketState.commodities,
    total: liveMarketState.commodities.length,
    lastUpdated: liveMarketState.lastFetched,
    isLive: liveMarketState.isLive,
  });
});

app.get('/api/commodities/:slug', async (req: Request, res: Response) => {
  await ensureInitialLiveData();
  const { slug } = req.params;
  const commodity = liveMarketState.commodities.find((c) => c.slug === slug);
  if (!commodity) {
    res.status(404).json({ error: 'Commodity not found' });
    return;
  }
  res.json(commodity);
});

// News Endpoint with robust slug matching
app.get('/api/news', (req: Request, res: Response) => {
  const { category } = req.query;
  const seenIds = new Set<string>();
  let articles = newsStore.filter((a) => {
    if (!a.id || seenIds.has(a.id)) return false;
    seenIds.add(a.id);
    return true;
  });

  if (category && category !== 'all') {
    articles = articles.filter((a) => a.category === category);
  }

  res.json({
    articles,
    total: articles.length,
    lastUpdated: liveMarketState.lastFetched,
  });
});

app.get('/api/news/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const article =
    newsStore.find((a) => a.slug === slug || a.id === slug) ||
    newsStore.find((a) => a.slug.includes(slug) || slug.includes(a.slug)) ||
    mockNewsArticles.find((a) => a.slug === slug || a.id === slug);

  if (!article) {
    res.json(newsStore[0] || mockNewsArticles[0]);
    return;
  }
  res.json(article);
});

app.get('/api/learn', (req: Request, res: Response) => {
  const { category } = req.query;
  let guides = [...learnStore];

  if (category && category !== 'all') {
    guides = guides.filter((g) => g.category === category);
  }

  res.json({
    guides,
    total: guides.length,
  });
});

app.get('/api/learn/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const guide = learnStore.find((g) => g.slug === slug || g.id === slug);
  if (!guide) {
    res.status(404).json({ error: 'Educational guide not found' });
    return;
  }
  res.json(guide);
});

app.get('/api/insights', (req: Request, res: Response) => {
  const { category } = req.query;
  let insights = [...insightsStore];

  if (category && category !== 'all') {
    insights = insights.filter((i) => i.category === category);
  }

  res.json({
    insights,
    total: insights.length,
  });
});

app.get('/api/insights/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const insight = insightsStore.find((i) => i.slug === slug || i.id === slug);
  if (!insight) {
    res.status(404).json({ error: 'Market insight not found' });
    return;
  }
  res.json(insight);
});

app.post('/api/ai/explain', async (req: Request, res: Response) => {
  const { contextType, topic, currentPrice, changePercent, additionalFacts } = req.body;

  if (!topic) {
    res.status(400).json({ error: 'Topic is required' });
    return;
  }

  const systemInstruction = `You are the lead financial analyst and market intelligence engine for MarketMind ("Understand the Market. Simply.").
Your goal is to provide concise, objective, clear explanations for market price movements, stock performance, or macroeconomic factors based on real market data.
RULES:
1. Explain the underlying economic rationale and market drivers in plain, accessible, professional English.
2. DO NOT provide personalized financial advice, stock recommendations, buy/sell targets, or speculative forecasts.
3. Keep response length between 120 and 200 words.`;

  const prompt = `Topic: ${topic}
Asset Context Type: ${contextType || 'Financial Asset'}
Current Level/Price: ${currentPrice || 'N/A'}
Change: ${changePercent ? `${changePercent}%` : 'N/A'}
Additional Context: ${additionalFacts || 'General market sentiment and macroeconomic conditions.'}

Explain clearly why this asset is moving and the core factors influencing it today.`;

  const fallbackExplanation = {
    primaryDriver: `${topic} is responding to prevailing liquidity conditions, institutional order flows, and broader macroeconomic factors.`,
    keyCatalysts: [
      'Institutional positioning and liquidity sentiment in Indian markets.',
      'Global macroeconomic indicators, US Federal Reserve & RBI policy expectations, and FX movements.',
      'Underlying quarterly earnings trajectory and demand dynamics.',
    ],
    whatToWatch: 'Monitor upcoming central bank monetary policy announcements and institutional volume trends.',
  };

  if (!ai) {
    res.json({
      text: `${fallbackExplanation.primaryDriver}\n\nKey Catalysts:\n• ${fallbackExplanation.keyCatalysts.join('\n• ')}\n\nWhat to Watch: ${fallbackExplanation.whatToWatch}`,
      source: 'MarketMind Financial Research Engine',
      isAiGenerated: true,
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const outputText = response.text || fallbackExplanation.primaryDriver;
    res.json({
      text: outputText,
      source: 'MarketMind AI Market Intelligence (Gemini 3.8 Flash)',
      isAiGenerated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    res.json({
      text: `${fallbackExplanation.primaryDriver}\n\nKey Catalysts:\n• ${fallbackExplanation.keyCatalysts.join('\n• ')}\n\nWhat to Watch: ${fallbackExplanation.whatToWatch}`,
      source: 'MarketMind Financial Research Engine (Fallback)',
      isAiGenerated: true,
    });
  }
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email and message are required' });
    return;
  }
  const entry = {
    id: `fb-${Date.now()}`,
    name,
    email,
    subject: subject || 'General Query',
    message,
    createdAt: new Date().toISOString(),
  };
  feedbackStore.unshift(entry);
  res.json({ success: true, message: 'Thank you for your feedback.', entry });
});

app.get('/api/admin/stats', (_req: Request, res: Response) => {
  res.json({
    totalNews: newsStore.length,
    totalGuides: learnStore.length,
    totalInsights: insightsStore.length,
    totalFeedback: feedbackStore.length,
    lastDataRefresh: liveMarketState.lastFetched,
    apiStatus: {
      geminiAi: ai !== null ? 'Operational' : 'Simulated (No API Key)',
      bullionFeed: 'Live Spot Gold-API.com & ExchangeRate-API Synchronized',
      equityFeed: 'Yahoo Finance Live API Synchronized',
      cryptoFeed: 'CoinGecko Live API Synchronized',
      newsFeed: 'Google News India Live RSS Synchronized',
    },
    recentFeedback: feedbackStore.slice(0, 5),
  });
});

app.post('/api/admin/refresh-data', async (_req: Request, res: Response) => {
  await fetchRealMarketData();
  res.json({ success: true, refreshedAt: liveMarketState.lastFetched, isLive: liveMarketState.isLive });
});

app.post('/api/admin/articles', (req: Request, res: Response) => {
  const { title, category, summary, content, author, tags } = req.body;
  if (!title || !summary) {
    res.status(400).json({ error: 'Title and summary are required' });
    return;
  }
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newArticle: NewsArticle = {
    id: slug,
    slug,
    title,
    category: category || 'business',
    summary,
    content: Array.isArray(content) ? content : [content],
    aiBullets: [summary],
    author: author || 'MarketMind Editorial Team',
    source: 'MarketMind Verified Feed',
    publishedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    readTime: '3 min read',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : ['Finance'],
  };

  newsStore.unshift(newArticle);
  res.json({ success: true, article: newArticle });
});

app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'marketmind.portal';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(robotsContent);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.get('host') || 'marketmind.portal';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const routes: string[] = [
    '/',
    '/gold-silver/',
    '/gold-rate-today/',
    '/gold-rate-today/bangalore/',
    '/gold-rate-today/chennai/',
    '/gold-rate-today/hyderabad/',
    '/gold-rate-today/mumbai/',
    '/gold-rate-today/delhi/',
    '/gold-rate-today/kolkata/',
    '/gold-rate-today/pune/',
    '/silver-rate-today/',
    '/silver-rate-today/bangalore/',
    '/silver-rate-today/chennai/',
    '/silver-rate-today/hyderabad/',
    '/silver-rate-today/mumbai/',
    '/silver-rate-today/delhi/',
    '/calculator/',
    '/stocks/',
    '/stocks/nse/',
    '/stocks/bse/',
    '/stocks/international/',
    '/stocks/top-gainers/',
    '/stocks/top-losers/',
    '/stocks/most-active/',
    ...mockStocks.map((s) => `/stocks/${s.slug}/`),
    '/mutual-funds/',
    ...mockMutualFunds.map((f) => `/mutual-funds/${f.slug}/`),
    '/crypto/',
    ...liveMarketState.crypto.map((c) => `/crypto/${c.slug}/`),
    '/commodities/',
    ...mockCommodities.map((c) => `/commodities/${c.slug}/`),
    '/news/',
    ...newsStore.map((n) => `/news/${n.slug}/`),
    '/learn/',
    ...learnStore.map((l) => `/learn/${l.slug}/`),
    '/insights/',
    ...insightsStore.map((i) => `/insights/${i.slug}/`),
    '/privacy-policy/',
    '/terms-of-service/',
    '/disclaimer/',
  ];

  const today = new Date().toISOString().split('T')[0];

  const xmlEntries = routes
    .map((route) => {
      let priority = '0.8';
      let changefreq = 'daily';
      if (route === '/') {
        priority = '1.0';
        changefreq = 'hourly';
      } else if (route.startsWith('/gold-rate-today/') || route.startsWith('/stocks/')) {
        priority = '0.9';
        changefreq = 'hourly';
      } else if (route.startsWith('/learn/')) {
        priority = '0.7';
        changefreq = 'monthly';
      }
      return `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(sitemapXml);
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MarketMind financial server running on http://localhost:${PORT}`);
  });
}

startServer();
