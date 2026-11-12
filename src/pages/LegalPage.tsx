import React, { useEffect } from 'react';
import { FileText, AlertTriangle, Lock } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { updatePageSeo } from '../utils/seo';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'disclaimer';
  navigate: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, navigate }) => {
  const titles = {
    privacy: 'Privacy Policy | MarketMind',
    terms: 'Terms of Service | MarketMind',
    disclaimer: 'Statutory Financial & SEBI Regulatory Disclaimer | MarketMind',
  };

  useEffect(() => {
    updatePageSeo({
      title: titles[type],
      description: `Official regulatory disclosures, terms of usage, and privacy guidelines for MarketMind financial portal readers.`,
      canonicalPath: `/${type === 'privacy' ? 'privacy-policy' : type === 'terms' ? 'terms-of-service' : 'disclaimer'}/`,
    });
  }, [type]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <Breadcrumbs
        navigate={navigate}
        items={[
          {
            label:
              type === 'privacy'
                ? 'Privacy Policy'
                : type === 'terms'
                ? 'Terms of Service'
                : 'Statutory Disclaimer',
          },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900 space-y-6 text-xs sm:text-sm leading-relaxed">
        {type === 'privacy' && (
          <>
            <div className="flex items-center space-x-2 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>User Data Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              MarketMind Privacy Policy
            </h1>
            <p className="text-slate-500 text-xs">Effective Date: November 10, 2026</p>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Information We Collect</h2>
              <p className="text-slate-600">
                MarketMind operates as an open-access financial information destination. We do not require visitors to create mandatory user accounts to browse live stock prices, gold rates, mutual fund profiles, or educational articles.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Cookies and Disclosures</h2>
              <p className="text-slate-600">
                We use strictly functional cookies to save local preference states (e.g. your selected gold city or chart timeframe).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Data Security</h2>
              <p className="text-slate-600">
                All communications between your browser and MarketMind are encrypted via standard Secure Socket Layer (TLS 1.3) protocols.
              </p>
            </section>
          </>
        )}

        {type === 'terms' && (
          <>
            <div className="flex items-center space-x-2 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Portal Usage Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-slate-500 text-xs">Last Updated: November 2026</p>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p className="text-slate-600">
                By accessing MarketMind, you agree to comply with and be bound by these Terms of Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Intellectual Property and Content Use</h2>
              <p className="text-slate-600">
                All proprietary texts, design motifs, custom charts, algorithms, and AI explanations hosted on MarketMind are protected under copyright laws.
              </p>
            </section>
          </>
        )}

        {type === 'disclaimer' && (
          <>
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Indian Regulatory Disclosures</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Statutory Financial Disclaimer
            </h1>
            <p className="text-slate-500 text-xs">Mandatory Indian Securities Notice</p>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-slate-800 font-medium">
              Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing. MarketMind is not a SEBI-registered Investment Adviser or Research Analyst.
            </div>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Educational Purpose Only</h2>
              <p className="text-slate-600">
                All content, data, price tables, calculations, and AI-generated movement analyses provided on MarketMind are compiled strictly for general educational and informational awareness. None of the materials constitute investment advice or recommendations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Data Accuracy & Delays</h2>
              <p className="text-slate-600">
                Market quotes for equities and commodities are delayed as per standard exchange provisions.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
