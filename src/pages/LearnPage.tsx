import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Award,
} from 'lucide-react';
import { mockLearnArticles } from '../data/financialData';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface LearnPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);
  const guideSlug = pathParts[1] || '';

  const matchedGuide = mockLearnArticles.find((g) => g.slug === guideSlug);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (matchedGuide) {
      updatePageSeo({
        title: `${matchedGuide.title} | MarketMind Learn Finance`,
        description: matchedGuide.summary,
        canonicalPath: currentPath,
      });
    } else {
      updatePageSeo({
        title: 'Learn Finance: Comprehensive Guides on Stocks, SIPs & Gold | MarketMind',
        description:
          'Master financial literacy with free guides on stock market investing, mutual fund SIPs, gold vs SGBs, personal finance, and Indian capital gains taxation.',
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedGuide?.slug]);

  if (matchedGuide) {
    const related = mockLearnArticles.filter((g) => g.id !== matchedGuide.id).slice(0, 2);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'Learn Finance', path: '/learn/' },
            { label: matchedGuide.title },
          ]}
        />

        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold">
              {matchedGuide.level} Level
            </span>
            <span>•</span>
            <span className="text-slate-500 font-medium">{matchedGuide.readTime}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-snug mb-4">
            {matchedGuide.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 border-b border-slate-200 mb-6">
            {matchedGuide.summary}
          </p>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-8">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
              <Award className="w-4 h-4 text-slate-700 mr-2" />
              Essential Key Takeaways
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {matchedGuide.takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6 text-slate-700">
            {matchedGuide.sections.map((section, idx) => (
              <section key={idx} className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {section.heading}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <HelpCircle className="w-5 h-5 text-slate-700 mr-2" />
              Frequently Asked Questions (FAQs)
            </h3>
            <div className="space-y-3">
              {matchedGuide.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 border-t border-slate-200">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-lg">Recommended Financial Guides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigate(`/learn/${rel.slug}/`)}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                    {rel.level} • {rel.readTime}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-slate-700 transition-colors mb-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 mt-3 text-xs text-slate-900 font-semibold flex items-center">
                  <span>Start Reading</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs navigate={navigate} items={[{ label: 'Learn Finance' }]} />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
          MarketMind Academy
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Learn Finance Simply
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Master personal finance, stock valuation, systematic investing, capital gains tax, and bullion preservation through jargon-free modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockLearnArticles.map((guide) => (
          <div
            key={guide.id}
            onClick={() => navigate(`/learn/${guide.slug}/`)}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 mb-2">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {guide.level}
                </span>
                <span>{guide.readTime}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-slate-700 transition-colors mb-2">
                {guide.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                {guide.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>Read Guide</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
