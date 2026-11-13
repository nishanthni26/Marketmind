import React, { useState, useEffect, useMemo } from 'react';
import { Search, Scale, ArrowUpRight, Calculator, X } from 'lucide-react';
import { mockMutualFunds } from '../data/financialData';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SvgChart } from '../components/SvgChart';
import { WatchlistButton } from '../utils/watchlist';

interface MutualFundsPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const MutualFundsPage: React.FC<MutualFundsPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const subCategoryOrSlug = pathParts[1] || '';

  const matchedFund = mockMutualFunds.find((f) => f.slug === subCategoryOrSlug);
  const categoryFilter = subCategoryOrSlug;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'3y' | '5y' | 'expense' | 'nav'>('3y');
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSlugs, setCompareSlugs] = useState<[string, string]>([
    mockMutualFunds[0]?.slug || '',
    mockMutualFunds[1]?.slug || mockMutualFunds[0]?.slug || '',
  ]);

  const filteredFunds = useMemo(() => {
    let base = mockMutualFunds;
    if (categoryFilter === 'best-performing') {
      base = base.filter((f) => f.isBestPerforming);
    } else if (categoryFilter && categoryFilter !== '') {
      base = base.filter((f) => f.category === categoryFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.subCategory.toLowerCase().includes(q) ||
          f.fundManager.toLowerCase().includes(q)
      );
    }

    return [...base].sort((a, b) => {
      if (sortBy === '5y') return b.returns5Y - a.returns5Y;
      if (sortBy === 'expense') return a.expenseRatio - b.expenseRatio;
      if (sortBy === 'nav') return b.nav - a.nav;
      return b.returns3Y - a.returns3Y;
    });
  }, [categoryFilter, searchQuery, sortBy]);

  const fundA = mockMutualFunds.find((f) => f.slug === compareSlugs[0]) || mockMutualFunds[0];
  const fundB = mockMutualFunds.find((f) => f.slug === compareSlugs[1]) || mockMutualFunds[1] || mockMutualFunds[0];

  const handleToggleCompareCard = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareOpen(true);
    setCompareSlugs((prev) => {
      if (prev[0] === slug || prev[1] === slug) return prev;
      return [prev[1], slug];
    });
  };

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

        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <span className="uppercase font-bold text-slate-700 tracking-wider text-[11px]">
                  {matchedFund.subCategory}
                </span>
                <span>·</span>
                <span className="text-amber-700 font-semibold">{matchedFund.riskRating} Risk</span>
                <span>·</span>
                <span>Min SIP ₹{matchedFund.minSip}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {matchedFund.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Benchmark: {matchedFund.benchmark} · Manager: {matchedFund.fundManager} · Inception: {matchedFund.launchDate}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <WatchlistButton
                  item={{
                    id: `mf:${matchedFund.slug}`,
                    type: 'mutual-fund',
                    label: matchedFund.name,
                    sublabel: `${matchedFund.subCategory} · Direct Growth`,
                    path: `/mutual-funds/${matchedFund.slug}/`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigate('/calculator/')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculate SIP Returns</span>
                </button>
              </div>
            </div>

            <div className="lg:text-right font-mono min-w-0">
              <span className="text-[11px] text-slate-500 block font-sans">Net Asset Value (NAV)</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums break-words">
                ₹{matchedFund.nav}
              </div>
              <div
                className={`text-xs font-bold mt-0.5 tabular-nums ${
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
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 tabular-nums break-words">
              +{matchedFund.returns1Y}%
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Annualized</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">3-Year CAGR</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 tabular-nums break-words">
              +{matchedFund.returns3Y}%
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Compounded</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">5-Year CAGR</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 tabular-nums break-words">
              +{matchedFund.returns5Y}%
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Compounded</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Expense Ratio</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums break-words">
              {matchedFund.expenseRatio}%
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Direct Plan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
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

          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-0.5">Top Holdings</h3>
            <p className="text-xs text-slate-500 mb-3">Key enterprise asset allocations</p>
            <div className="space-y-2 text-xs">
              {matchedFund.topHoldings.map((holding, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="font-semibold text-slate-900">{holding.company}</span>
                  <span className="font-mono font-bold text-emerald-600 tabular-nums">
                    {holding.percentage}%
                  </span>
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
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

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Mutual Fund Explorer · Direct Plans
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight capitalize">
              {categoryFilter === 'index-funds'
                ? 'Low Cost Index Funds'
                : categoryFilter === 'best-performing'
                ? 'Best Performing Mutual Funds in India'
                : `${categoryFilter || 'All'} Mutual Funds`}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Filter by category, sort by 3Y/5Y CAGR or lowest expense ratio, and compare two schemes side-by-side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCompareOpen((prev) => !prev)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                compareOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{compareOpen ? 'Hide Comparison' : 'Compare Funds'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/calculator/')}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>SIP Calculator</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Sort Controls */}
        <div className="pt-3 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
            <div className="relative flex-1 sm:w-52">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fund or manager..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg text-slate-900 placeholder-slate-400 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              aria-label="Sort mutual funds"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as '3y' | '5y' | 'expense' | 'nav')}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-semibold outline-none cursor-pointer focus:border-slate-400"
            >
              <option value="3y">Sort: Highest 3Y CAGR</option>
              <option value="5y">Sort: Highest 5Y CAGR</option>
              <option value="expense">Sort: Lowest Expense Ratio</option>
              <option value="nav">Sort: Highest NAV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Panel */}
      {compareOpen && fundA && fundB && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Side-by-Side Fund Comparison</h2>
            </div>
            <button
              type="button"
              onClick={() => setCompareOpen(false)}
              aria-label="Close fund comparison"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fund 1</label>
              <select
                value={fundA.slug}
                onChange={(e) => setCompareSlugs([e.target.value, fundB.slug])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
              >
                {mockMutualFunds.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fund 2</label>
              <select
                value={fundB.slug}
                onChange={(e) => setCompareSlugs([fundA.slug, e.target.value])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
              >
                {mockMutualFunds.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Metric</th>
                  <th className="py-2.5 px-3 text-right">{fundA.name}</th>
                  <th className="py-2.5 px-3 text-right">{fundB.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">Category</td>
                  <td className="py-2.5 px-3 text-right font-sans text-slate-900">{fundA.subCategory}</td>
                  <td className="py-2.5 px-3 text-right font-sans text-slate-900">{fundB.subCategory}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">Current NAV</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{fundA.nav}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{fundB.nav}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">1Y Return</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundA.returns1Y >= fundB.returns1Y ? 'text-emerald-600' : 'text-slate-800'}`}>
                    +{fundA.returns1Y}%
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundB.returns1Y >= fundA.returns1Y ? 'text-emerald-600' : 'text-slate-800'}`}>
                    +{fundB.returns1Y}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">3Y CAGR</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundA.returns3Y >= fundB.returns3Y ? 'text-emerald-600' : 'text-slate-800'}`}>
                    +{fundA.returns3Y}%
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundB.returns3Y >= fundA.returns3Y ? 'text-emerald-600' : 'text-slate-800'}`}>
                    +{fundB.returns3Y}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">5Y CAGR</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundA.returns5Y >= fundB.returns5Y ? 'text-emerald-600' : 'text-slate-800'}`}>
                    +{fundA.returns5Y}%
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundB.returns5Y >= fundA.returns5Y ? 'text-emerald-600' : 'text-slate-800'}`}>
                    +{fundB.returns5Y}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">Expense Ratio</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundA.expenseRatio <= fundB.expenseRatio ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {fundA.expenseRatio}%
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${fundB.expenseRatio <= fundA.expenseRatio ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {fundB.expenseRatio}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">AUM</td>
                  <td className="py-2.5 px-3 text-right text-slate-900">{fundA.aum}</td>
                  <td className="py-2.5 px-3 text-right text-slate-900">{fundB.aum}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-600">Min SIP / Risk</td>
                  <td className="py-2.5 px-3 text-right font-sans text-slate-700">₹{fundA.minSip} · {fundA.riskRating}</td>
                  <td className="py-2.5 px-3 text-right font-sans text-slate-700">₹{fundB.minSip} · {fundB.riskRating}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fund Cards Grid */}
      {filteredFunds.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No mutual funds match &ldquo;{searchQuery}&rdquo;. Try clearing the search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFunds.map((fund) => {
            const isInCompare =
              compareOpen && (compareSlugs[0] === fund.slug || compareSlugs[1] === fund.slug);
            return (
              <div
                key={fund.id}
                onClick={() => navigate(`/mutual-funds/${fund.slug}/`)}
                className={`bg-white rounded-xl border p-5 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group ${
                  isInCompare ? 'border-emerald-500' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {fund.subCategory} · {fund.riskRating} Risk
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleCompareCard(fund.slug, e)}
                        className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                          isInCompare
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isInCompare ? 'Comparing' : 'Compare'}
                      </button>
                      <WatchlistButton
                        compact
                        item={{
                          id: `mf:${fund.slug}`,
                          type: 'mutual-fund',
                          label: fund.name,
                          sublabel: `${fund.subCategory} · Direct Growth`,
                          path: `/mutual-funds/${fund.slug}/`,
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors mb-1.5">
                    {fund.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Manager: {fund.fundManager} · AUM: {fund.aum}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 font-mono tabular-nums text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-sans block">NAV Today</span>
                    <span className="font-bold text-slate-900 text-sm break-words">₹{fund.nav}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-sans block">3Y CAGR</span>
                    <span className="font-bold text-emerald-600 text-sm">+{fund.returns3Y}%</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-sans block">5Y CAGR</span>
                    <span className="font-bold text-emerald-600 text-sm">+{fund.returns5Y}%</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-sans block">Expense</span>
                    <span className="font-semibold text-slate-700">{fund.expenseRatio}%</span>
                  </div>
                  <span className="text-slate-900 font-sans font-semibold inline-flex items-center gap-0.5 group-hover:text-emerald-700">
                    <span>Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
