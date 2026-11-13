import React from 'react';
import { TrendingUp } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const columns = [
    {
      title: 'Markets',
      links: [
        { label: 'Gold Rates', path: '/gold-rate-today/' },
        { label: 'Silver Rates', path: '/silver-rate-today/' },
        { label: 'Stocks & Indices', path: '/stocks/' },
        { label: 'Mutual Funds', path: '/mutual-funds/' },
      ],
    },
    {
      title: 'Explore',
      links: [
        { label: 'Portfolio Tracker', path: '/portfolio/' },
        { label: 'Cryptocurrency', path: '/crypto/' },
        { label: 'Commodities', path: '/commodities/' },
        { label: 'Market News', path: '/news/' },
        { label: 'Calculators', path: '/calculator/' },
      ],
    },
    {
      title: 'Resources & Legal',
      links: [
        { label: 'Learn Finance', path: '/learn/' },
        { label: 'Terms & Conditions', path: '/terms-of-service/' },
        { label: 'Privacy Policy', path: '/privacy-policy/' },
        { label: 'Disclaimer', path: '/disclaimer/' },
      ],
    },
  ];

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2.5">
            <div
              onClick={() => navigate('/')}
              className="cursor-pointer inline-flex items-center space-x-2 select-none"
            >
              <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white font-black shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Market<span className="text-emerald-600">Mind</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Indian bullion benchmarks, live equity indices, mutual funds, and financial calculators in one clean workspace.
            </p>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
            {columns.map((col) => (
              <div key={col.title} className="space-y-2.5 min-w-0">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.path}>
                      <button
                        type="button"
                        onClick={() => navigate(link.path)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors text-left cursor-pointer"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 space-y-3">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-700 font-semibold">Disclaimer:</strong> Investments in securities market are subject to market risks. Read all related documents carefully before investing. MarketMind is an informational portal and is not a SEBI-registered Investment Adviser or Research Analyst. Bullion, FX, crypto, and equity prices are indicative.{' '}
            <button
              type="button"
              onClick={() => navigate('/disclaimer/')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
            >
              Read full disclaimer
            </button>
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>© {new Date().getFullYear()} MarketMind. Real-time indicative spot data.</span>
            <div className="flex flex-wrap items-center gap-3 text-slate-500">
              <button
                type="button"
                onClick={() => navigate('/terms-of-service/')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => navigate('/privacy-policy/')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => navigate('/disclaimer/')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Disclaimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
