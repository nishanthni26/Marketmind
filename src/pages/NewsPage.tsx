import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Share2,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { mockNewsArticles as fallbackArticles } from '../data/financialData';
import { NewsArticle } from '../types';
import { updatePageSeo } from '../utils/seo';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface NewsPageProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({ currentPath, navigate }) => {
  const pathParts = currentPath.split('/').filter(Boolean);

  let categorySlug = '';
  let articleSlug = '';

  if (pathParts[1] === 'category' && pathParts[2]) {
    categorySlug = pathParts[2];
  } else if (pathParts[1] && pathParts[1] !== 'category') {
    articleSlug = pathParts[1];
  }

  const [articlesList, setArticlesList] = useState<NewsArticle[]>(fallbackArticles);
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  // Fetch news list and matched article
  useEffect(() => {
    async function loadNewsData() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.articles) && data.articles.length > 0) {
            setArticlesList(data.articles);
          }
        }

        if (articleSlug) {
          const singleRes = await fetch(`/api/news/${encodeURIComponent(articleSlug)}`);
          if (singleRes.ok) {
            const singleData = await singleRes.json();
            if (singleData && singleData.title) {
              setActiveArticle(singleData);
            }
          }
        } else {
          setActiveArticle(null);
        }
      } catch (err) {
        console.warn('News page fetch error:', err);
      }
    }

    loadNewsData();
  }, [articleSlug]);

  const matchedArticle = activeArticle || (articleSlug
    ? articlesList.find((a) => a.slug === articleSlug || a.id === articleSlug) ||
      fallbackArticles.find((a) => a.slug === articleSlug || a.id === articleSlug)
    : null);

  const filteredArticles = categorySlug
    ? articlesList.filter((a) => a.category === categorySlug)
    : articlesList;

  useEffect(() => {
    if (matchedArticle) {
      updatePageSeo({
        title: `${matchedArticle.title} | MarketMind Financial News`,
        description: matchedArticle.summary,
        canonicalPath: currentPath,
        ogType: 'article',
      });
    } else {
      const categoryTitles: Record<string, string> = {
        stocks: 'Stock Market News & Share Price Updates | MarketMind',
        business: 'Indian Business News & Corporate Updates | MarketMind',
        banking: 'Banking News, RBI Repo Rates & Financial Sector | MarketMind',
        economy: 'Indian Economy & Macroeconomic News | MarketMind',
        global: 'Global Financial Markets & Wall Street News | MarketMind',
        announcements: 'Company Announcements & Exchange Filings | MarketMind',
      };
      const title = categoryTitles[categorySlug] || 'Financial News Today – Stocks, Economy & Markets | MarketMind';
      const desc = 'Read verified Indian financial news, corporate earnings reports, RBI monetary policies, and global market coverage.';
      updatePageSeo({
        title,
        description: desc,
        canonicalPath: currentPath,
      });
    }
  }, [currentPath, matchedArticle?.slug, categorySlug]);

  if (matchedArticle) {
    const related = articlesList.filter((a) => a.id !== matchedArticle.id).slice(0, 3);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <Breadcrumbs
          navigate={navigate}
          items={[
            { label: 'News', path: '/news/' },
            {
              label: matchedArticle.category.toUpperCase(),
              path: `/news/category/${matchedArticle.category}/`,
            },
            { label: matchedArticle.title },
          ]}
        />

        <article className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-slate-700">
              {matchedArticle.category}
            </span>
            <span>•</span>
            <span className="text-slate-500 font-medium">{matchedArticle.readTime}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-snug mb-4">
            {matchedArticle.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 text-xs text-slate-500 gap-2 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                {matchedArticle.author.charAt(0)}
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">{matchedArticle.author}</span>
                <span className="text-[11px] text-slate-500">{matchedArticle.source}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-[11px]">
              <span className="flex items-center text-slate-500">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {matchedArticle.publishedAt}
              </span>
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Article URL copied to clipboard!');
                  }
                }}
                className="hover:text-blue-600 flex items-center text-slate-600 font-medium transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 mb-6">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Key Takeaways</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {matchedArticle.aiBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed sm:text-base sm:leading-relaxed">
            {matchedArticle.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="text-slate-500 font-medium mr-1">Filed Under:</span>
            {matchedArticle.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>

        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((rel, idx) => (
              <div
                key={`${rel.id || rel.slug}-${idx}`}
                onClick={() => navigate(`/news/${rel.slug}/`)}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-max mb-2">
                    {rel.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-blue-600 transition-colors mb-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 mt-3 text-[11px] text-blue-600 font-semibold">
                  Read Article →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    { slug: '', label: 'All News' },
    { slug: 'stocks', label: 'Stocks' },
    { slug: 'business', label: 'Business' },
    { slug: 'banking', label: 'Banking' },
    { slug: 'economy', label: 'Economy' },
    { slug: 'global', label: 'Global' },
    { slug: 'announcements', label: 'Announcements' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs navigate={navigate} items={[{ label: 'Financial News' }]} />

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Financial Newsroom
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight capitalize">
              {categorySlug ? `${categorySlug} Financial News` : 'Financial News & Analysis'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Updates covering Sensex, Nifty 50, bullion rates, and the macroeconomic landscape.
            </p>
          </div>

          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex flex-wrap items-center gap-1 text-xs font-semibold">
            {categories.map((cat) => {
              const active = categorySlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() =>
                    navigate(cat.slug ? `/news/category/${cat.slug}/` : '/news/')
                  }
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 font-semibold border border-slate-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.map((article, idx) => (
          <div
            key={`${article.id || article.slug}-${idx}`}
            onClick={() => navigate(`/news/${article.slug}/`)}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-500 mb-2">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {article.category}
                </span>
                <span>{article.readTime}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors mb-2">
                {article.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                {article.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">{article.author}</span>
              <span className="text-blue-600 font-semibold group-hover:underline">
                Read Story →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
