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
        { label: 'Disclaimer', path: '/disclaimer/' },
        { label: 'Privacy Policy', path: '/privacy-policy/' },
        { label: 'Terms of Service', path: '/terms-of-service/' },
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

        <div className="border-t border-slate-200 mt-8 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} MarketMind. Real-time indicative spot data.</span>
          <span className="text-slate-400">For informational and educational use only.</span>
        </div>
      </div>
    </footer>
  );
};
