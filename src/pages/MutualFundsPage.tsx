import React, { useState, useEffect } from 'react';
import { mockMutualFunds } from '../data/financialData';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SvgChart } from '../components/SvgChart';

interface MutualFundsPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const MutualFundsPage: React.FC<MutualFundsPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const subCategoryOrSlug = pathParts[1] || '';

  const matchedFund = mockMutualFunds.find((f) => f.slug === subCategoryOrSlug);

  let categoryFilter = subCategoryOrSlug;

  const filteredFunds = (() => {
    if (categoryFilter === 'best-performing') {
      return mockMutualFunds.filter((f) => f.isBestPerforming);
    } else if (categoryFilter && categoryFilter !== '') {
      return mockMutualFunds.filter((f) => f.category === categoryFilter);
    }
    return mockMutualFunds;
  })();

  useEffect(() => {
    if (matchedFund) {
      const title = `${matchedFund.name} NAV Today, Returns & Portfolio | MarketMind`;
      const desc = `Check current NAV for ${matchedFund.name}. 1Y, 3Y, 5Y CAGR returns, expense ratio (${matchedFund.expenseRatio}%), AUM, top portfolio holdings, and SIP calculator.`;
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    } else {
      const categoryTitles: Record<string, string> = {
        equity: 'Best Equity Mutual Funds – High Return Growth Schemes',
        debt: 'Top Debt Mutual Funds – Safe Fixed Income & Liquid Funds',
        hybrid: 'Hybrid Mutual Funds – Balanced Equity and Debt Portfolios',
        'index-funds': 'Low Cost Index Mutual Funds – Nifty 50 & Sensex Trackers',
        'best-performing': 'Best Performing Mutual Funds in India – Top 5-Star CAGR Schemes',
      };
      const title = categoryTitles[categoryFilter] || 'Mutual Funds in India – NAV & Performance';
      const desc = `Explore top mutual funds in India across Equity, Debt, Hybrid, and Index Funds. Compare NAVs, 3Y/5Y returns, expense ratios, and fund manager profiles.`;
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedFund?.slug, categoryFilter]);

  if (matchedFund) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'Mutual Funds', path: '/mutual-funds/' },
            {
              label: matchedFund.category === 'equity' ? 'Equity' : matchedFund.subCategory,
              path: `/mutual-funds/${matchedFund.category}/`,
            },
            { label: matchedFund.name },
          ]}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 uppercase font-bold text-[10px]">
                  {matchedFund.subCategory}
                </span>
                <span>•</span>
                <span className="text-amber-700 font-bold">{matchedFund.riskRating} Risk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {matchedFund.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Benchmark: {matchedFund.benchmark} • Manager: {matchedFund.fundManager} • Inception: {matchedFund.launchDate}
              </p>
            </div>

            <div className="lg:text-right font-mono min-w-0">
              <span className="text-[11px] text-slate-500 block">Net Asset Value (NAV)</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">₹{matchedFund.nav}</div>
              <div
                className={`text-xs font-bold mt-0.5 ${
                  matchedFund.navChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {matchedFund.navChange >= 0 ? '+' : ''}₹{matchedFund.navChange} ({matchedFund.navChangePercent}%)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">1-Year Return</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 break-words">+{matchedFund.returns1Y}%</div>
            <span className="text-[10px] text-slate-400 font-sans">Annualized</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">3-Year CAGR</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 break-words">+{matchedFund.returns3Y}%</div>
            <span className="text-[10px] text-slate-400 font-sans">Compounded</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">5-Year CAGR</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 break-words">+{matchedFund.returns5Y}%</div>
            <span className="text-[10px] text-slate-400 font-sans">Compounded</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Expense Ratio</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 break-words">{matchedFund.expenseRatio}%</div>
            <span className="text-[10px] text-slate-400 font-sans">Direct Plan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-0.5">NAV Trajectory</h3>
            <p className="text-xs text-slate-500 mb-3">Multi-year unit growth trajectory</p>
            <SvgChart
              data={matchedFund.historicalNav}
              height={220}
              currency="₹"
              valuePrefix="NAV: "
              isPositive={true}
            />
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-0.5">Top Holdings</h3>
            <p className="text-xs text-slate-500 mb-3">Key enterprise asset allocations</p>
            <div className="space-y-2 text-xs">
              {matchedFund.topHoldings.map((holding, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-900">{holding.company}</span>
                  <span className="font-mono font-bold text-emerald-600">{holding.percentage}%</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>AUM: {matchedFund.aum}</span>
              <span>Min SIP: ₹{matchedFund.minSip}</span>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs
        navigate={navigate}
        items={[
          { label: 'Mutual Funds', path: '/mutual-funds/' },
          {
            label:
              categoryFilter === 'equity'
                ? 'Equity Funds'
                : categoryFilter === 'debt'
                ? 'Debt Funds'
                : categoryFilter === 'hybrid'
                ? 'Hybrid Funds'
                : categoryFilter === 'index-funds'
                ? 'Index Funds'
                : categoryFilter === 'best-performing'
                ? 'Best Performing Funds'
                : 'All Schemes',
          },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Mutual Fund Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight capitalize">
              {categoryFilter === 'index-funds'
                ? 'Low Cost Index Funds'
                : categoryFilter === 'best-performing'
                ? 'Best Performing Mutual Funds in India'
                : `${categoryFilter || 'All'} Mutual Funds`}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Explore NAVs, annualized historical CAGR returns, and expense ratios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {[
              { id: '', label: 'All Funds' },
              { id: 'equity', label: 'Equity' },
              { id: 'debt', label: 'Debt' },
              { id: 'hybrid', label: 'Hybrid' },
              { id: 'index-funds', label: 'Index Funds' },
              { id: 'best-performing', label: 'Best Performing' },
            ].map((tab) => {
              const active = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id ? `/mutual-funds/${tab.id}/` : '/mutual-funds/')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white font-semibold border border-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFunds.map((fund) => (
          <div
            key={fund.id}
            onClick={() => navigate(`/mutual-funds/${fund.slug}/`)}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {fund.subCategory}
                </span>
                <span className="text-slate-500 font-mono font-medium">AUM: {fund.aum}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-slate-700 transition-colors mb-2">
                {fund.name}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Manager: {fund.fundManager} • Risk: {fund.riskRating}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block">NAV Today</span>
                <span className="font-bold text-slate-900 text-sm break-words">₹{fund.nav}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block">3Y CAGR</span>
                <span className="font-bold text-emerald-600 text-sm">+{fund.returns3Y}%</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block">Expense Ratio</span>
                <span className="font-semibold text-slate-700">{fund.expenseRatio}%</span>
              </div>
              <span className="text-slate-900 font-semibold group-hover:underline">
                Explore →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
