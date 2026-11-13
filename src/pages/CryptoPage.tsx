import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { mockCrypto as fallbackMockCrypto } from '../data/financialData';
import { CryptoData } from '../types';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { RechartsTrendChart } from '../components/RechartsTrendChart';
import { WatchlistButton } from '../utils/watchlist';

interface CryptoPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const CryptoPage: React.FC<CryptoPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const coinSlug = pathParts[1] || '';

  const [liveCrypto, setLiveCrypto] = useState<CryptoData[]>(fallbackMockCrypto);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await fetch('/api/crypto');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.crypto) && data.crypto.length > 0) {
            setLiveCrypto(data.crypto);
          }
        }
      } catch (e) {
        console.warn('Error fetching live crypto:', e);
      }
    };
    fetchCrypto();
    const interval = setInterval(fetchCrypto, 30000);
    return () => clearInterval(interval);
  }, []);

  const matchedCoin = liveCrypto.find(
    (c) => c.slug === coinSlug || c.symbol.toLowerCase() === coinSlug.toLowerCase()
  );

  useEffect(() => {
    if (matchedCoin) {
      const title = `${matchedCoin.name} (${matchedCoin.symbol}) Price Today in INR & USD | MarketMind`;
      const desc = `Live ${matchedCoin.name} (${matchedCoin.symbol}) price today in INR (₹) and USD ($). Real-time 24h change, market cap, circulating supply, price chart, and India VDA tax guidance.`;
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    } else {
      const title = 'Cryptocurrency Prices Today in India – Bitcoin, Ethereum & Altcoins | MarketMind';
      const desc = 'Check real-time cryptocurrency prices in INR & USD. Track Bitcoin, Ethereum, Solana, and top crypto assets with market cap, 24h volume, and Indian tax notes.';
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedCoin?.slug]);

  if (matchedCoin) {
    const isUp = matchedCoin.change24h >= 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'Cryptocurrency', path: '/crypto/' },
            { label: `${matchedCoin.name} (${matchedCoin.symbol})` },
          ]}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-bold uppercase text-[10px]">
                  Rank #{matchedCoin.rank}
                </span>
                <span>•</span>
                <span className="text-slate-900 font-mono font-bold">{matchedCoin.symbol}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {matchedCoin.name} Price Today
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {matchedCoin.description}
              </p>
              <div className="mt-3">
                <WatchlistButton
                  item={{
                    id: `crypto:${matchedCoin.symbol}`,
                    type: 'crypto',
                    label: matchedCoin.symbol,
                    sublabel: matchedCoin.name,
                    path: `/crypto/${matchedCoin.slug}/`,
                  }}
                />
              </div>
            </div>

            <div className="lg:text-right font-mono min-w-0">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                ₹{matchedCoin.priceINR.toLocaleString('en-IN')}
              </div>
              <div className="text-sm font-semibold text-slate-500 break-words">
                ${matchedCoin.priceUSD.toLocaleString('en-US')} USD
              </div>
              <div
                className={`flex items-center lg:justify-end text-xs font-bold mt-1 ${
                  isUp ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 mr-1 shrink-0" />}
                <span>
                  {isUp ? '+' : ''}
                  {matchedCoin.change24h}% (24h)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-0.5">30-Day Price Trend (USD)</h3>
          <p className="text-xs text-slate-500 mb-3">Historical dollar valuation trajectory</p>
          <RechartsTrendChart
            data={matchedCoin.historical30D}
            height={230}
            currency="$"
            isPositive={isUp}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Market Cap (USD)</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 break-words">{matchedCoin.marketCapUSD}</div>
            <span className="text-[10px] text-slate-400 font-sans break-words block">{matchedCoin.marketCapINR}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">24h Volume</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 break-words">{matchedCoin.volume24hUSD}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Supply</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 break-words">{matchedCoin.circulatingSupply}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">All-Time High</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 break-words">${matchedCoin.allTimeHighUSD.toLocaleString('en-US')}</div>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-slate-900 mb-1">
              Indian VDA Tax Guidance Notice
            </h4>
            <p className="text-slate-600">
              Under Section 115BBH of the Indian Income Tax Act, transfer of Virtual Digital Assets is taxed at a flat rate of 30% plus applicable surcharge. Additionally, 1% TDS under Section 194S applies to transactions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs navigate={navigate} items={[{ label: 'Cryptocurrency' }]} />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
          Decentralized Digital Assets
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Cryptocurrency Market Capitalisation & Live Spot Rates
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Live converted INR and USD spot rates for major decentralized blockchain assets.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3 text-right">Price (INR)</th>
                <th className="py-2.5 px-3 text-right">Price (USD)</th>
                <th className="py-2.5 px-3 text-right">24h Change</th>
                <th className="py-2.5 px-3 text-right">Market Cap</th>
                <th className="py-2.5 px-3 text-right">24h Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {liveCrypto.map((coin) => (
                <tr
                  key={coin.symbol}
                  onClick={() => navigate(`/crypto/${coin.slug}/`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
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
                      <div>
                        <span className="font-bold text-slate-900 font-sans text-xs">{coin.name}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{coin.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ₹{coin.priceINR.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700">
                    ${coin.priceUSD.toLocaleString('en-US')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      coin.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {coin.change24h >= 0 ? '+' : ''}
                    {coin.change24h}%
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">{coin.marketCapUSD}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{coin.volume24hUSD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
