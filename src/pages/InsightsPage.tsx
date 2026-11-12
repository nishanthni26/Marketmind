import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { mockMarketInsights } from '../data/financialData';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface InsightsPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const insightSlug = pathParts[1] || '';

  const matchedInsight = mockMarketInsights.find(
    (i) => i.slug === insightSlug || i.id === insightSlug
  );

  const [aiGenerating, setAiGenerating] = useState(false);
  const [liveAiDigest, setLiveAiDigest] = useState<string | null>(null);

  useEffect(() => {
    if (matchedInsight) {
      updatePageSeo({
        title: `${matchedInsight.title} | MarketMind AI Intelligence`,
        description: matchedInsight.summary,
        canonicalPath: currentPath,
      });
    } else {
      updatePageSeo({
        title: 'Market Insights: Daily AI Market Summaries & Sector Trends | MarketMind',
        description:
          'Objective AI-generated market intelligence. Daily digests on Nifty and Sensex movements, gold-silver forecasts, and sectoral capital flows.',
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedInsight?.slug]);

  const handleGenerateLiveDigest = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Indian Equity Indices & Gold Bullion Session Analysis',
          contextType: 'Macro Market Intelligence',
          currentPrice: `Nifty 50: 24,350 (+0.59%), Sensex: 80,210 (+0.61%), Gold 24K: ₹78,920/10g`,
          changePercent: 0.59,
          additionalFacts:
            'IT index gained 1.09% on enterprise software contracts. Crude oil stabilized at $74.20. DII monthly mutual fund SIP inflows at ₹23,500+ Cr.',
        }),
      });
      const data = await res.json();
      setLiveAiDigest(data.text);
    } catch (e) {
      console.error(e);
      setLiveAiDigest(
        'Market resilience is anchored by ongoing domestic liquidity support from monthly mutual fund SIP contributions and softening imported energy costs.'
      );
    } finally {
      setAiGenerating(false);
    }
  };

  if (matchedInsight) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'Market Insights', path: '/insights/' },
            { label: matchedInsight.title },
          ]}
        />

        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 flex items-center text-[10px] font-bold">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-700" />
              AI Market Intelligence
            </span>
            <span>•</span>
            <span className="text-slate-500 font-medium">{matchedInsight.date}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-snug mb-4">
            {matchedInsight.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 border-b border-slate-200 mb-6">
            {matchedInsight.summary}
          </p>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Primary Catalysts & Forces</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {matchedInsight.keyDrivers.map((driver, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-slate-900 font-bold mr-2 text-base leading-none">•</span>
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200">
              <span className="text-xs font-bold uppercase text-emerald-800 flex items-center mb-2">
                <TrendingUp className="w-4 h-4 mr-1 text-emerald-700" />
                Constructive Tailwinds
              </span>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {matchedInsight.bullishFactors.map((f, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50/60 rounded-xl p-4 border border-rose-200">
              <span className="text-xs font-bold uppercase text-rose-800 flex items-center mb-2">
                <TrendingDown className="w-4 h-4 mr-1 text-rose-700" />
                Headwinds & Risks
              </span>
              <ul className="space-y-1.5 text-xs text-rose-950">
                {matchedInsight.bearishFactors.map((f, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-rose-600 font-bold mr-1.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {matchedInsight.indicesImpact.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Benchmark Impact
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {matchedInsight.indicesImpact.map((idxItem, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 min-w-0">
                    <span className="font-sans font-semibold text-slate-600 block text-[11px] break-words">
                      {idxItem.name}
                    </span>
                    <span className="text-slate-900 font-bold text-sm block mt-0.5 break-words">
                      {idxItem.level}
                    </span>
                    <span
                      className={`text-[11px] font-semibold break-words block ${
                        idxItem.sentiment === 'bullish'
                          ? 'text-emerald-600'
                          : idxItem.sentiment === 'bearish'
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {idxItem.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-base">In-Depth Analytical Commentary</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {matchedInsight.deepDive}
            </p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs navigate={navigate} items={[{ label: 'Market Insights' }]} />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Intelligence Reports
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            MarketMind AI Insights & Summaries
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Concise, objective explanations of why market prices rise or fall and sectoral capital rotation trends.
          </p>
        </div>

        <button
          onClick={handleGenerateLiveDigest}
          disabled={aiGenerating}
          className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 text-slate-300 ${aiGenerating ? 'animate-spin' : ''}`} />
          <span>{aiGenerating ? 'Synthesizing...' : 'Generate AI Digest'}</span>
        </button>
      </div>

      {liveAiDigest && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                AI Market Intelligence
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-medium">Session Analysis</span>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {liveAiDigest}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockMarketInsights.map((insight) => (
          <div
            key={insight.id}
            onClick={() => navigate(`/insights/${insight.slug}/`)}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-slate-600" />
                  {insight.category.replace('-', ' ')}
                </span>
                <span className="text-slate-500 text-[11px]">{insight.date}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-slate-700 transition-colors mb-2">
                {insight.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                {insight.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>Read Analysis</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
