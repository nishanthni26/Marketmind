/**
 * MarketMind Data Types & Interfaces
 */

export interface PricePoint {
  date: string;
  price: number;
}

export interface GoldCityRate {
  city: string;
  slug: string;
  state: string;
  rate24KPerGram: number;
  rate22KPerGram: number;
  rate18KPerGram: number;
  rate24KPer10g: number;
  rate22KPer10g: number;
  rate18KPer10g: number;
  change24K: number;
  change22K: number;
  changePercent: number;
  silverPerGram: number;
  silverPerKg: number;
  silverChange: number;
  historical7D: PricePoint[];
  historical30D: PricePoint[];
  lastUpdated: string;
  source: string;
  jewelerMakingRange: string;
  localMarketInfo: string;
}

export interface StockData {
  symbol: string;
  name: string;
  slug: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  category: 'nse' | 'bse' | 'international';
  price: number;
  currency: 'INR' | 'USD';
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  volumeDisplay: string;
  marketCap: string;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  high52W: number;
  low52W: number;
  sector: string;
  description: string;
  isGainer?: boolean;
  isLoser?: boolean;
  isMostActive?: boolean;
  historical1D: PricePoint[];
  historical1M: PricePoint[];
  historical1Y: PricePoint[];
  historical5Y: PricePoint[];
  financials: {
    revenue: string;
    netProfit: string;
    profitMargin: string;
    roe: string;
    debtToEquity: string;
  };
  announcements: Array<{
    date: string;
    title: string;
    category: string;
  }>;
  aiExplanation?: string;
  lastUpdated: string;
}

export interface MutualFundData {
  id: string;
  slug: string;
  name: string;
  category: 'equity' | 'debt' | 'hybrid' | 'index-funds';
  subCategory: string;
  nav: number;
  navChange: number;
  navChangePercent: number;
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  aum: string;
  expenseRatio: number;
  riskRating: 'Very High' | 'High' | 'Moderate' | 'Low';
  fundManager: string;
  launchDate: string;
  benchmark: string;
  minSip: number;
  historicalNav: PricePoint[];
  topHoldings: Array<{ company: string; percentage: number }>;
  isBestPerforming?: boolean;
}

export interface CryptoData {
  symbol: string;
  name: string;
  slug: string;
  priceUSD: number;
  priceINR: number;
  change24h: number;
  marketCapUSD: string;
  marketCapINR: string;
  volume24hUSD: string;
  circulatingSupply: string;
  allTimeHighUSD: number;
  rank: number;
  sparkline: number[];
  historical30D: PricePoint[];
  description: string;
}

export interface CommodityData {
  name: string;
  slug: string;
  category: 'Energy' | 'Metals' | 'Agriculture';
  price: number;
  currency: 'USD' | 'INR';
  unit: string;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  historical30D: PricePoint[];
  description: string;
  factors: string[];
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: 'stocks' | 'business' | 'banking' | 'economy' | 'global' | 'announcements';
  summary: string;
  content: string[];
  aiBullets: string[];
  author: string;
  source: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  imageUrl?: string;
}

export interface EducationalArticle {
  id: string;
  slug: string;
  title: string;
  category: 'stocks' | 'mutual-funds' | 'sips' | 'gold' | 'personal-finance' | 'banking' | 'taxation' | 'crypto';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  readTime: string;
  summary: string;
  takeaways: string[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  publishedAt: string;
}

export interface MarketInsight {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: 'daily-summary' | 'movement-explanation' | 'gold-silver' | 'sector-trends' | 'weekly-report';
  summary: string;
  keyDrivers: string[];
  bullishFactors: string[];
  bearishFactors: string[];
  deepDive: string;
  indicesImpact: Array<{
    name: string;
    level: string;
    change: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }>;
  isAiGenerated: boolean;
  generatedAt: string;
}

export interface MarketOverview {
  indices: Array<{
    name: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    exchange: string;
  }>;
  goldBenchmark: {
    rate24KPer10g: number;
    rate22KPer10g: number;
    change: number;
    changePercent: number;
  };
  silverBenchmark: {
    ratePerKg: number;
    change: number;
    changePercent: number;
  };
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  advanceDeclineRatio: {
    advances: number;
    declines: number;
    unchanged: number;
  };
  lastUpdated: string;
}

export interface FeedbackSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}
