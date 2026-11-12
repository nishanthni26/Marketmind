/**
 * SEO & Structured Data Management Utility
 */

export interface SeoConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  schema?: Record<string, any>;
  ogType?: string;
}

export function updatePageSeo(config: SeoConfig) {
  // Update document title
  const fullTitle = config.title.includes('MarketMind') ? config.title : `${config.title} | MarketMind`;
  document.title = fullTitle;

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', config.description);

  // Update OpenGraph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', fullTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', config.description);

  const ogType = document.querySelector('meta[property="og:type"]');
  if (ogType) ogType.setAttribute('content', config.ogType || 'website');

  // Update Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  const origin = window.location.origin;
  const path = config.canonicalPath || window.location.pathname;
  canonical.setAttribute('href', `${origin}${path}`);

  // Inject or update Schema.org JSON-LD
  let schemaScript = document.getElementById('marketmind-jsonld');
  if (config.schema) {
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'marketmind-jsonld';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(config.schema);
  } else if (schemaScript) {
    schemaScript.remove();
  }
}
