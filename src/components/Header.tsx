import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Search,
  Menu,
  X,
  Calculator,
} from 'lucide-react';
import { mockStocks, goldCityRates, mockMutualFunds, mockCrypto } from '../data/financialData';
import { MarketTickerBar } from './MarketTickerBar';

interface HeaderProps {
  currentPath: string;
  navigate: (path: string) => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  navigate,
  onOpenCommandPalette,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase();
  const searchResults = cleanQuery
    ? {
        stocks: mockStocks.filter(
          (s) =>
            s.name.toLowerCase().includes(cleanQuery) ||
            s.symbol.toLowerCase().includes(cleanQuery)
        ),
        goldCities: goldCityRates.filter(
          (g) => g.city.toLowerCase().includes(cleanQuery) || g.state.toLowerCase().includes(cleanQuery)
        ),
        mutualFunds: mockMutualFunds.filter((f) => f.name.toLowerCase().includes(cleanQuery)),
        crypto: mockCrypto.filter(
          (c) => c.name.toLowerCase().includes(cleanQuery) || c.symbol.toLowerCase().includes(cleanQuery)
        ),
      }
    : null;

  const totalResultsCount = searchResults
    ? searchResults.stocks.length +
      searchResults.goldCities.length +
      searchResults.mutualFunds.length +
      searchResults.crypto.length
    : 0;

  const handleSelectResult = (path: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    navigate(path);
  };

  const navLinks = [
    { label: 'Gold & Silver', path: '/gold-rate-today/' },
    { label: 'Stocks', path: '/stocks/' },
    { label: 'Mutual Funds', path: '/mutual-funds/' },
    { label: 'Crypto', path: '/crypto/' },
    { label: 'Commodities', path: '/commodities/' },
    { label: 'Portfolio', path: '/portfolio/' },
  ];

  const mobileNavLinks = [
    { label: 'Home', path: '/' },
    { label: 'Portfolio & Watchlist', path: '/portfolio/' },
    { label: 'Gold & Silver', path: '/gold-rate-today/' },
    { label: 'Sensex', path: '/stocks/sensex/' },
    { label: 'Nifty 50', path: '/stocks/nifty50/' },
    { label: 'Stocks', path: '/stocks/' },
    { label: 'Mutual Funds', path: '/mutual-funds/' },
    { label: 'Crypto', path: '/crypto/' },
    { label: 'Commodities', path: '/commodities/' },
    { label: 'Calculator', path: '/calculator/' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => navigate('/')}
          className="cursor-pointer flex items-center space-x-2.5 shrink-0 select-none group whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0B1714] flex items-center justify-center text-emerald-400 font-black group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Market<span className="text-emerald-700">Mind</span>
          </span>
        </div>

        {/* Zone 2: Clean Typographic Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] h-full">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`h-full inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath === '/'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Home
          </button>
          {navLinks.map((link) => {
            const isActive = currentPath.startsWith(link.path);
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className={`h-full inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div ref={searchRef} className="relative hidden lg:block w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search stocks, cities..."
              className="w-full pl-8 pr-12 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                title="Open Quick Jump (Ctrl+K)"
                className="absolute right-1.5 top-1 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded cursor-pointer"
              >
                ⌘K
              </button>
            )}

            {searchOpen && searchResults && totalResultsCount > 0 && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100 text-xs text-slate-700">
                {searchResults.stocks.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Stocks</div>
                    {searchResults.stocks.map((s) => (
                      <div
                        key={s.symbol}
                        onClick={() => handleSelectResult(`/stocks/${s.slug}/`)}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-slate-900">{s.symbol}</span>
                        <span className="font-mono tabular-nums">₹{s.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.goldCities.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] uppercase font-bold text-amber-700 px-2 py-1">Gold Rates</div>
                    {searchResults.goldCities.map((g) => (
                      <div
                        key={g.slug}
                        onClick={() => handleSelectResult(`/gold-rate-today/${g.slug}/`)}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-slate-900">{g.city}</span>
                        <span className="font-mono tabular-nums text-amber-700">₹{g.rate24KPerGram.toLocaleString('en-IN')}/g</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.mutualFunds.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] uppercase font-bold text-emerald-700 px-2 py-1">Mutual Funds</div>
                    {searchResults.mutualFunds.slice(0, 4).map((mf) => (
                      <div
                        key={mf.id}
                        onClick={() => handleSelectResult(`/mutual-funds/${mf.slug}/`)}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex justify-between gap-2"
                      >
                        <span className="font-medium text-slate-900 truncate">{mf.name}</span>
                        <span className="font-mono tabular-nums shrink-0">₹{mf.nav}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.crypto.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Crypto</div>
                    {searchResults.crypto.slice(0, 4).map((c) => (
                      <div
                        key={c.symbol}
                        onClick={() => handleSelectResult(`/crypto/${c.slug}/`)}
                        className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-slate-900">{c.symbol}</span>
                        <span className="font-mono tabular-nums">${c.priceUSD.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/calculator/')}
            className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath.startsWith('/calculator')
                ? 'bg-emerald-700 text-white'
                : 'bg-[#0B1714] text-white hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <MarketTickerBar navigate={navigate} />

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-1">
          {mobileNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded text-sm font-medium hover:bg-slate-50 text-slate-700 hover:text-slate-900"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
