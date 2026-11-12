import React from 'react';

interface AdBannerProps {
  format?: 'horizontal-leaderboard' | 'in-feed-card' | 'sidebar-banner';
  variant?: 'demat-broker' | 'gold-loan' | 'term-insurance' | 'generic';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  format = 'horizontal-leaderboard',
  variant = 'demat-broker',
}) => {
  const adContent = {
    'demat-broker': {
      title: 'Open Free Demat & Trading Account',
      tagline: 'Zero brokerage on equity delivery investments with SEBI-registered partner brokers.',
      cta: 'Explore Partners',
      sponsor: 'Verified Partner Spotlight',
    },
    'gold-loan': {
      title: 'Lowest Interest Gold Loans in Your City',
      tagline: 'Instant doorstep valuation and safe RBI-regulated locker storage from 8.85% p.a.',
      cta: 'Check Eligibility',
      sponsor: 'Financial Service Partner',
    },
    'term-insurance': {
      title: 'Compare ₹1 Crore Term Life Cover',
      tagline: 'Secure your family’s financial future with claims settlement ratio above 99.2%.',
      cta: 'Compare Plans',
      sponsor: 'Insurance Network Partner',
    },
    'generic': {
      title: 'MarketMind Financial Literacy Network',
      tagline: 'Connect with certified financial planners and accredited wealth advisors.',
      cta: 'Learn More',
      sponsor: 'Educational Sponsor',
    },
  }[variant];

  if (format === 'sidebar-banner') {
    return (
      <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-4 my-4 relative overflow-hidden">
        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5 flex items-center justify-between">
          <span>{adContent.sponsor}</span>
          <span className="text-[9px] bg-stone-200/70 text-stone-600 px-1.5 py-0.5 rounded">Ad</span>
        </div>
        <h4 className="font-bold text-sm text-stone-900 leading-snug mb-1">{adContent.title}</h4>
        <p className="text-xs text-stone-600 mb-3">{adContent.tagline}</p>
        <button
          type="button"
          onClick={() => alert('Affiliate Partner Disclosure: You will be redirected to our SEBI-registered partner portal in a full production setup.')}
          className="w-full text-center text-xs font-semibold py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded transition-colors"
        >
          {adContent.cta}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full my-6 bg-gradient-to-r from-emerald-950/[0.03] to-stone-100 border border-stone-200/70 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
            Ad
          </span>
          <span className="text-[10px] text-stone-600 font-medium">{adContent.sponsor}</span>
        </div>
        <h4 className="font-bold text-stone-900 text-sm md:text-base">{adContent.title}</h4>
        <p className="text-xs text-stone-600 mt-0.5">{adContent.tagline}</p>
      </div>
      <button
        type="button"
        onClick={() => alert('Partner Link: In production, this links securely to verified financial service partners.')}
        className="shrink-0 text-xs font-bold py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md transition-colors shadow-xs"
      >
        {adContent.cta} →
      </button>
    </div>
  );
};
