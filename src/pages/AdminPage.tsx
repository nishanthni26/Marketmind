import React, { useState } from 'react';
import {
  FileText,
  RefreshCw,
  PlusCircle,
  Database,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { mockNewsArticles, mockMarketInsights } from '../data/financialData';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface AdminPageProps {
  navigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'data-status' | 'ai-summaries' | 'feedback'>('articles');

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'stocks' | 'business' | 'banking' | 'economy' | 'global' | 'announcements'>('stocks');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('MarketMind Editorial Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Background auto-sync');

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary || !newContent) {
      alert('Please fill out title, summary and content.');
      return;
    }
    setIsSubmitting(true);
    setFormSuccess('');

    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          summary: newSummary,
          content: [newContent],
          author: newAuthor,
          tags: [newCategory, 'MarketUpdate'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(`Article "${data.article.title}" published successfully! URL: /news/${data.article.slug}/`);
        setNewTitle('');
        setNewSummary('');
        setNewContent('');
      }
    } catch (err) {
      console.error(err);
      alert('Error publishing article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/refresh-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastRefreshed(new Date(data.refreshedAt).toLocaleTimeString('en-IN') + ' IST');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      <Breadcrumbs navigate={navigate} items={[{ label: 'Admin Dashboard' }]} />

      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>MarketMind Editorial & Data Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Admin Management Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage financial news dispatches, oversee background Gemini AI digests, inspect SEO indices, and monitor market feeds.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-mono font-semibold">
            Role: Super Admin (Verified)
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-3 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'articles'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Publish & Edit Articles</span>
        </button>

        <button
          onClick={() => setActiveTab('data-status')}
          className={`px-3 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'data-status'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>API Feeds & Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-summaries')}
          className={`px-3 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'ai-summaries'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Intelligence Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>User Inquiries</span>
        </button>
      </div>

      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-slate-900">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center">
              <PlusCircle className="w-4 h-4 text-slate-700 mr-2" />
              Publish Verified Financial News
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Published stories generate SEO-friendly canonical URLs, OpenGraph cards, and schema tags.
            </p>

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RBI Keeps Liquidity Window Tight Ahead of Inflation Index"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none focus:bg-white focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none focus:bg-white focus:border-slate-400 cursor-pointer"
                  >
                    <option value="stocks">Stocks</option>
                    <option value="business">Business</option>
                    <option value="banking">Banking</option>
                    <option value="economy">Economy</option>
                    <option value="global">Global Markets</option>
                    <option value="announcements">Announcements</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Author / Bylines *</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Short Executive Summary *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="1-2 sentences summarizing market development..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none focus:bg-white focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Article Body *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Full verified report text..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none focus:bg-white focus:border-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
              >
                <span>{isSubmitting ? 'Publishing...' : 'Publish Article'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-slate-900">
            <h3 className="font-bold text-slate-900 text-base mb-1">Live Articles ({mockNewsArticles.length})</h3>
            <p className="text-xs text-slate-500 mb-3">Live index of editorial items</p>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {mockNewsArticles.map((article, idx) => (
                <div key={`${article.id}-${idx}`} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase mb-1">
                    <span className="text-slate-800 font-bold">{article.category}</span>
                    <span>{article.publishedAt}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 leading-snug mb-1">{article.title}</h4>
                  <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500">{article.author}</span>
                    <button
                      onClick={() => navigate(`/news/${article.slug}/`)}
                      className="text-slate-900 font-semibold hover:underline cursor-pointer"
                    >
                      View Live →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data-status' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Financial Data Feeds & Status</h3>
              <p className="text-xs text-slate-500">
                Data pipeline health, exchange delay conformity, and silent background synchronization
              </p>
            </div>
            <button
              onClick={handleRefreshCache}
              disabled={refreshing}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 self-start shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Background Data'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                IBJA / Spot Gold-API
              </span>
              <span className="font-semibold text-emerald-700 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                Active Auto-Sync
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                City rates benchmarked across 8 metro hubs in India.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                Yahoo Finance Equities
              </span>
              <span className="font-semibold text-emerald-700 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                Active Auto-Sync
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                NIFTY 50, SENSEX, and top equities synced in background.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                Gemini 3.8 Flash AI Engine
              </span>
              <span className="font-semibold text-emerald-700 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                Operational
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Server-side `@google/genai` active for market reasoning.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                Sync Engine
              </span>
              <span className="font-semibold text-slate-900 text-sm block mt-0.5 font-mono">
                {lastRefreshed}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Silent intervals running automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai-summaries' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-slate-900 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">AI Explanation & Summary Registry</h3>
          <p className="text-xs text-slate-500">
            Audit log of AI-generated summaries. Ensures objective market reasoning is emitted.
          </p>

          <div className="space-y-3">
            {mockMarketInsights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{insight.title}</span>
                  <span className="text-slate-500 text-[10px]">{insight.date}</span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">{insight.summary}</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status: Verified Objective</span>
                  <button
                    onClick={() => navigate(`/insights/${insight.slug}/`)}
                    className="text-slate-900 font-semibold hover:underline cursor-pointer"
                  >
                    Inspect Public Page →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-slate-900 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">User Inquiries & Editorial Queries</h3>
          <p className="text-xs text-slate-500">Direct questions and data discrepancy notices submitted by readers.</p>

          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            No unresolved reader inquiries. All data feeds operating cleanly within nominal thresholds.
          </div>
        </div>
      )}
    </div>
  );
};
