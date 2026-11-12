import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { CommandPalette } from './components/CommandPalette';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { GoldSilverPage } from './pages/GoldSilverPage';
import { StocksPage } from './pages/StocksPage';
import { MutualFundsPage } from './pages/MutualFundsPage';
import { CryptoPage } from './pages/CryptoPage';
import { CommoditiesPage } from './pages/CommoditiesPage';
import { NewsPage } from './pages/NewsPage';
import { LearnPage } from './pages/LearnPage';
import { InsightsPage } from './pages/InsightsPage';
import { AdminPage } from './pages/AdminPage';
import { LegalPage } from './pages/LegalPage';
import { CalculatorPage } from './pages/CalculatorPage';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const renderPage = () => {
    const cleanPath = currentPath.toLowerCase();

    if (cleanPath === '/' || cleanPath === '') {
      return <HomePage navigate={navigate} />;
    }

    if (
      cleanPath.startsWith('/gold-silver') ||
      cleanPath.startsWith('/gold-rate-today') ||
      cleanPath.startsWith('/silver-rate-today')
    ) {
      return <GoldSilverPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (
      cleanPath.startsWith('/stocks') ||
      cleanPath.startsWith('/sensex') ||
      cleanPath.startsWith('/nifty')
    ) {
      const normalizedPath = cleanPath.startsWith('/sensex')
        ? '/stocks/sensex/'
        : cleanPath.startsWith('/nifty')
        ? '/stocks/nifty50/'
        : cleanPath;
      return <StocksPage currentPath={normalizedPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/mutual-funds')) {
      return <MutualFundsPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/crypto')) {
      return <CryptoPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/commodities')) {
      return <CommoditiesPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/news')) {
      return <NewsPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/learn')) {
      return <LearnPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/insights')) {
      return <InsightsPage currentPath={cleanPath} navigate={navigate} />;
    }

    if (cleanPath.startsWith('/admin')) {
      return <AdminPage navigate={navigate} />;
    }

    if (cleanPath.startsWith('/calculator')) {
      return <CalculatorPage navigate={navigate} />;
    }

    if (cleanPath.startsWith('/privacy-policy')) {
      return <LegalPage type="privacy" navigate={navigate} />;
    }
    if (cleanPath.startsWith('/terms-of-service')) {
      return <LegalPage type="terms" navigate={navigate} />;
    }
    if (cleanPath.startsWith('/disclaimer')) {
      return <LegalPage type="disclaimer" navigate={navigate} />;
    }

    return <HomePage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Header
        currentPath={currentPath}
        navigate={navigate}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <main className="flex-1">{renderPage()}</main>

      <Footer navigate={navigate} />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        navigate={navigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
