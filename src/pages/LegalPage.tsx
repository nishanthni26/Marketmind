import React, { useEffect } from 'react';
import { FileText, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { updatePageSeo } from '../utils/seo';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'disclaimer';
  navigate: (path: string) => void;
}

interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'terms-1',
    title: '1. Acceptance of Terms & Eligibility',
    paragraphs: [
      'Welcome to MarketMind. By accessing, browsing, or using the MarketMind website, market data dashboards, calculators, portfolio tools, or educational resources (collectively, the "Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"), together with our Privacy Policy and Statutory Financial Disclaimer.',
      'If you do not agree with any provision of these Terms, you must immediately discontinue accessing or using the Platform. You represent that you are at least 18 years of age (or accessing the Platform under the supervision of a parent or legal guardian) and possess the legal capacity to enter into a binding agreement under applicable Indian law.',
    ],
  },
  {
    id: 'terms-2',
    title: '2. Scope of Platform & Non-Advisory Nature',
    paragraphs: [
      'MarketMind is an informational and financial awareness platform providing indicative quotes for Indian equity benchmarks (BSE Sensex, NSE Nifty 50, listed shares), city-wise bullion benchmarks (Gold, Silver, Platinum, Diamond), Mutual Fund data, Cryptocurrency prices, Commodities, financial news aggregation, and financial planning calculators.',
      'MarketMind does not execute trades, accept client funds, facilitate order routing, offer brokerage services, manage portfolios on your behalf, or provide personalized investment, tax, or legal advice.',
    ],
  },
  {
    id: 'terms-3',
    title: '3. Browser-Local Tools: Portfolio & Watchlist Storage',
    paragraphs: [
      'Certain interactive features on MarketMind—specifically the Portfolio Holdings Tracker and Watchlist—persist your entries locally in your web browser storage (localStorage). You retain full control over this data and may clear or edit it at any time directly from your browser or within the Portfolio page.',
    ],
    bullets: [
      'MarketMind does not store your personal brokerage credentials, Demat account details, PAN, Aadhaar, or banking information.',
      'Clearing your browser cache or switching devices will remove locally stored holdings and watchlists because data is not synced to a remote account server.',
      'You are solely responsible for verifying quantities, average purchase prices, and transaction taxes when logging personal holdings.',
    ],
  },
  {
    id: 'terms-4',
    title: '4. Permitted Use & Prohibited Conduct',
    paragraphs: [
      'You are granted a limited, non-exclusive, non-transferable, revocable license to access and use MarketMind strictly for personal, non-commercial informational and educational reference.',
    ],
    bullets: [
      'You may not scrape, crawl, harvest, mirror, frame, or systematically extract live market quotes, historical series, or editorial summaries through automated bots or scripts without prior written consent.',
      'You may not redistribute, resell, sublicense, or commercially broadcast data retrieved from the Platform.',
      'You may not attempt to interfere with, overload, reverse-engineer, bypass security controls, or disrupt the underlying servers and API endpoints powering MarketMind.',
    ],
  },
  {
    id: 'terms-5',
    title: '5. Third-Party Market Feeds & Data Attribution',
    paragraphs: [
      'Indicative prices, foreign exchange conversion rates (USD/INR), bullion spot quotes, cryptocurrency prices, and financial news headlines are sourced from independent third-party providers and public exchange feeds (including Yahoo Finance, Gold Spot feeds, Open Exchange Rates, CoinGecko, and Google News RSS).',
      'Exchange figures and commodities quotes may experience network latency, rate-limiting, temporary upstream outages, or rounding variances relative to live exchange order books or local retail dealer boards.',
    ],
  },
  {
    id: 'terms-6',
    title: '6. Financial Calculators & Estimates',
    paragraphs: [
      'All calculators provided on MarketMind—including SIP, Lumpsum, EMI, and Gold/Silver Jewellery invoice estimators—generate mathematical projections solely from user-entered parameters, standard compounding formulas, and indicative GST/making-charge assumptions.',
      'Actual mutual fund returns vary with market performance and exit loads, while physical jewellery billing varies by jeweller purity certification, wastage, hallmarked making charges, and local state levies.',
    ],
  },
  {
    id: 'terms-7',
    title: '7. Intellectual Property Rights',
    paragraphs: [
      'All software code, visual layout, page architecture, typography, bespoke charts, educational guides, and branding elements ("MarketMind") belong to MarketMind or its respective licensors and are protected under applicable copyright, trademark, and intellectual property statutes.',
      'Company names, index trademarks (including NIFTY, SENSEX, BSE, NSE), mutual fund scheme names, and news headlines remain the property of their respective owners and exchanges.',
    ],
  },
  {
    id: 'terms-8',
    title: '8. Disclaimer of Warranties ("As Is")',
    paragraphs: [
      'The Platform and all content, quotes, historical charts, calculators, and news summaries are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, or statutory, including implied warranties of merchantability, accuracy, timeliness, completeness, or fitness for a particular purpose.',
    ],
  },
  {
    id: 'terms-9',
    title: '9. Limitation of Liability & Indemnification',
    paragraphs: [
      'To the maximum extent permitted by applicable law, MarketMind and its developers, contributors, and data providers shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages—including loss of profits, trading losses, missed opportunities, or data loss—arising from your use of or reliance on any rate, chart, calculation, or article on the Platform.',
      'You agree to indemnify and hold harmless MarketMind from any claims, liabilities, or expenses resulting from your violation of these Terms or misuse of the Platform.',
    ],
  },
  {
    id: 'terms-10',
    title: '10. Changes to Terms, Governing Law & Jurisdiction',
    paragraphs: [
      'We may revise these Terms at any time by updating the Effective Date on this page. Continued use of the Platform after modifications constitutes acceptance of the updated Terms.',
      'These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict-of-law principles, and any disputes shall be subject to the exclusive jurisdiction of the competent courts in India.',
    ],
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'privacy-1',
    title: '1. Overview & Privacy Commitment',
    paragraphs: [
      'MarketMind respects your privacy and is committed to protecting personal information in accordance with the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023 (DPDPA), and recognized web privacy standards.',
      'This Privacy Policy explains what information is processed when you visit MarketMind, how local browser preferences work, and what rights you hold over your data.',
    ],
  },
  {
    id: 'privacy-2',
    title: '2. Information We Collect — And What We Never Ask For',
    paragraphs: [
      'MarketMind operates as an open-access market research and utility portal. You can view stock quotes, city gold/silver rates, mutual funds, crypto benchmarks, news, and calculators without registering an account.',
    ],
    bullets: [
      'Sensitive Financial KYC Not Collected: MarketMind never requests your PAN card, Aadhaar number, Demat/brokerage login credentials, UPI ID, credit/debit card details, or bank account numbers.',
      'Voluntary Submissions: If you voluntarily submit an inquiry or feedback form containing your name, email address, or message, that information is used solely to review and respond to your request.',
      'Technical Request Metadata: Standard web server request logs (such as anonymized IP routing headers, browser type, requested URL path, and response timestamps) may be temporarily processed to protect service availability and prevent abuse.',
    ],
  },
  {
    id: 'privacy-3',
    title: '3. Local Browser Storage (Portfolio, Watchlist & Preferences)',
    paragraphs: [
      'To provide personalized features like the Portfolio Holdings Tracker, Saved Watchlist, selected bullion city, and chart timeframe preferences without requiring login accounts, MarketMind stores these preferences locally on your own device using standard browser localStorage.',
    ],
    bullets: [
      'Local-Only Control: Holdings and Watchlist items reside inside your browser on your device and are not uploaded to external marketing databases.',
      'Instant Erasure: You can delete individual holdings or watchlist pins inside the app or wipe all local data at any time via your browser site-data settings.',
    ],
  },
  {
    id: 'privacy-4',
    title: '4. Cookies & Essential Functional State',
    paragraphs: [
      'MarketMind does not deploy invasive cross-site behavioral advertising trackers. Minimal functional browser storage is used exclusively to preserve interface continuity (selected delivery city, active calculator parameters, and watchlists).',
    ],
  },
  {
    id: 'privacy-5',
    title: '5. Third-Party Data Providers & Outbound Links',
    paragraphs: [
      'MarketMind fetches market prices, currency exchange rates, cryptocurrency stats, and financial news headlines server-side from upstream public financial data providers before serving normalized quotes to your browser, minimizing direct third-party exposure of your browser identity.',
      'When you click outbound links to external news publishers or referenced resources, their independent privacy policies govern your visit.',
    ],
  },
  {
    id: 'privacy-6',
    title: '6. Data Security & Transport Encryption',
    paragraphs: [
      'All traffic between your browser and the MarketMind server is encrypted using modern HTTPS / Transport Layer Security (TLS). While no internet transmission can guarantee 100% immunity from unforeseen risks, we enforce strict input validation and minimize data collection by design.',
    ],
  },
  {
    id: 'privacy-7',
    title: '7. Data Retention & Children’s Privacy',
    paragraphs: [
      'Technical server logs are retained only for short operational diagnostics and security monitoring windows. Browser-stored holdings and preferences remain on your device until you remove them.',
      'MarketMind is designed for general financial education and is not directed at children under 18 years of age without parental guidance.',
    ],
  },
  {
    id: 'privacy-8',
    title: '8. Your Rights & Grievance Redressal',
    paragraphs: [
      'Under applicable Indian data protection frameworks, you have the right to know what personal data (if any) you have submitted via contact forms, request correction or deletion of any submitted contact information, and withdraw consent for voluntary communications.',
      'For privacy inquiries or deletion requests, please reach out via the contact details listed on the Platform with your request details.',
    ],
  },
];

const DISCLAIMER_SECTIONS: LegalSection[] = [
  {
    id: 'disclaimer-1',
    title: '1. SEBI Non-Registration Disclosure',
    paragraphs: [
      'MarketMind is an independent financial information, rate aggregation, and educational tools platform. MarketMind is NOT a SEBI-registered Investment Adviser (RIA), Research Analyst (RA), Stock Broker, Depository Participant, Asset Management Company, or Portfolio Manager.',
      'Nothing published on MarketMind—including stock pages, index movement explanations, mutual fund comparisons, bullion rates, news summaries, or calculator outputs—should be construed as a solicitation, recommendation, endorsement, or offer to buy, sell, or hold any security, commodity, mutual fund, or digital asset.',
    ],
  },
  {
    id: 'disclaimer-2',
    title: '2. Equity, Index & Mutual Fund Market Risks',
    paragraphs: [
      'Investments in the securities market are subject to market risks. Read all scheme-related documents, Key Information Memorandums (KIM), and Scheme Information Documents (SID) carefully before investing.',
    ],
    bullets: [
      'Past performance—including 1Y, 3Y, or 5Y CAGR returns displayed for mutual funds or historical equity price charts—does not guarantee or predict future returns.',
      'Mutual fund NAVs, AUM figures, expense ratios, and constituent weightages change periodically based on AMC disclosures and market closing valuations.',
      'Sensex, Nifty 50, and individual equity quotes are provided for informational awareness only and may experience exchange feed delays.',
    ],
  },
  {
    id: 'disclaimer-3',
    title: '3. Gold, Silver & Physical Bullion Rate Methodology',
    paragraphs: [
      'City-wise 24K (999), 22K (916 Hallmark), and 18K Gold rates alongside Fine Silver (999) rates per gram, 10g, and 1kg are indicative landed Indian retail benchmarks derived from international spot feeds, USD/INR conversion, customs duty, and typical regional clearing differentials.',
    ],
    bullets: [
      'Actual retail jewellery invoices typically include 3% GST plus jeweller making charges (fixed per gram or percentage of gold value), wastage, and stone charges.',
      'Historical date-by-date Gold and Silver trend series combine current live landed spot rates with historical trajectory adjustments for city-level trend visualization and should not be treated as official IBJA closing tax audit certificates.',
    ],
  },
  {
    id: 'disclaimer-4',
    title: '4. Cryptocurrency & Virtual Digital Asset (VDA) Notice',
    paragraphs: [
      'Crypto products and NFTs are unregulated in India in terms of traditional investor protection frameworks and carry high market volatility and capital-loss risk. There may be no regulatory recourse for losses from VDA transactions.',
      'Taxation Alert: Under Section 115BBH of the Indian Income Tax Act, gains arising from the transfer of Virtual Digital Assets are taxed at a flat rate of 30% (plus applicable surcharge and cess) without deduction of expenses other than cost of acquisition, and 1% Tax Deducted at Source (TDS) applies under Section 194S above statutory thresholds.',
    ],
  },
  {
    id: 'disclaimer-5',
    title: '5. Portfolio Tracker & Calculator Disclaimers',
    paragraphs: [
      'The Portfolio Tracker and SIP/EMI/Bullion Calculators rely on user-entered quantities, buy prices, and return assumptions combined with indicative live spot feeds. Estimated Profit & Loss (P&L) figures exclude brokerage commissions, STT, stamp duty, DP charges, exit loads, and short-term or long-term capital gains taxation.',
    ],
  },
  {
    id: 'disclaimer-6',
    title: '6. Data Latency, Errors & Independent Verification',
    paragraphs: [
      'While MarketMind strives to fetch and normalize live feeds reliably, technical disruptions, upstream API delays, currency fluctuations, or sudden exchange circuit halts may cause temporary discrepancies. Always verify live quotes directly on NSE/BSE terminals, AMC portals, or authorized bullion dealers before committing capital.',
      'Before making any financial decision, consult a qualified, SEBI-registered financial planner or certified tax advisor aligned with your individual risk tolerance and investment horizon.',
    ],
  },
];

export const LegalPage: React.FC<LegalPageProps> = ({ type, navigate }) => {
  const metaMap = {
    terms: {
      pageTitle: 'Terms and Conditions | MarketMind',
      heading: 'Terms and Conditions',
      subtitle: 'Governing rules, data licensing boundaries, browser-local tools, and liability terms for using MarketMind.',
      breadcrumb: 'Terms & Conditions',
      canonical: '/terms-of-service/',
      updated: 'Effective Date: November 12, 2026',
      sections: TERMS_SECTIONS,
      icon: FileText,
    },
    privacy: {
      pageTitle: 'Privacy Policy | MarketMind',
      heading: 'Privacy Policy',
      subtitle: 'How MarketMind protects visitor privacy, handles local browser storage for holdings & watchlists, and limits data collection.',
      breadcrumb: 'Privacy Policy',
      canonical: '/privacy-policy/',
      updated: 'Effective Date: November 12, 2026',
      sections: PRIVACY_SECTIONS,
      icon: ShieldCheck,
    },
    disclaimer: {
      pageTitle: 'Statutory Financial & Regulatory Disclaimer | MarketMind',
      heading: 'Financial & Regulatory Disclaimer',
      subtitle: 'Mandatory SEBI non-registration disclosure, bullion pricing methodology, VDA tax notice, and risk disclosures.',
      breadcrumb: 'Disclaimer',
      canonical: '/disclaimer/',
      updated: 'Updated: November 12, 2026',
      sections: DISCLAIMER_SECTIONS,
      icon: AlertTriangle,
    },
  } as const;

  const active = metaMap[type];
  const HeaderIcon = active.icon;

  useEffect(() => {
    updatePageSeo({
      title: active.pageTitle,
      description: active.subtitle,
      canonicalPath: active.canonical,
    });
  }, [type, active.pageTitle, active.subtitle, active.canonical]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      <Breadcrumbs
        navigate={navigate}
        items={[{ label: active.breadcrumb }]}
      />

      {/* Top Legal Document Switcher + Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex flex-wrap items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => navigate('/terms-of-service/')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                type === 'terms'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terms &amp; Conditions
            </button>
            <button
              type="button"
              onClick={() => navigate('/privacy-policy/')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                type === 'privacy'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('/disclaimer/')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                type === 'disclaimer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disclaimer
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono">{active.updated}</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <HeaderIcon className="w-4 h-4 shrink-0" />
            <span>MarketMind Official Legal Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {active.heading}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {active.subtitle}
          </p>
        </div>

        {type === 'disclaimer' && (
          <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mandatory Indian Securities &amp; Investment Warning</span>
            </div>
            <p>
              Investments in securities market are subject to market risks. Read all the related documents carefully before investing. MarketMind is an informational portal and is <strong>not</strong> registered with SEBI as an Investment Adviser, Research Analyst, or Broker.
            </p>
          </div>
        )}

        {type === 'privacy' && (
          <div className="p-4 sm:p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1.5">
            <div className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Privacy-First Architecture</span>
            </div>
            <p>
              MarketMind never asks for PAN, Aadhaar, Demat passwords, or bank account credentials. Portfolio holdings and Watchlist pins are saved locally in your own browser storage.
            </p>
          </div>
        )}

        {/* Section Index */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Quick Section Index
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {active.sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="text-left text-xs sm:text-[13px] font-medium text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer py-0.5"
              >
                {sec.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Document Clauses */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 shadow-xs divide-y divide-slate-200">
        {active.sections.map((sec, idx) => (
          <section
            key={sec.id}
            id={sec.id}
            className={`${idx === 0 ? 'pb-6' : idx === active.sections.length - 1 ? 'pt-6' : 'py-6'} space-y-3 scroll-mt-20`}
          >
            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
              {sec.title}
            </h2>
            {sec.paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="text-sm text-slate-600 leading-relaxed">
                {p}
              </p>
            ))}
            {sec.bullets && sec.bullets.length > 0 && (
              <ul className="space-y-2 pt-1 pl-1">
                {sec.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Bottom Cross-Navigation Links */}
        <div className="pt-6 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Have a question or grievance regarding MarketMind legal terms or data handling? Write to support or inspect related disclosures.
          </span>
          <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-800 shrink-0">
            {type !== 'terms' && (
              <button
                type="button"
                onClick={() => navigate('/terms-of-service/')}
                className="hover:text-emerald-700 underline cursor-pointer"
              >
                Read Terms &amp; Conditions
              </button>
            )}
            {type !== 'privacy' && (
              <button
                type="button"
                onClick={() => navigate('/privacy-policy/')}
                className="hover:text-emerald-700 underline cursor-pointer"
              >
                Read Privacy Policy
              </button>
            )}
            {type !== 'disclaimer' && (
              <button
                type="button"
                onClick={() => navigate('/disclaimer/')}
                className="hover:text-emerald-700 underline cursor-pointer"
              >
                Read Full Disclaimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
