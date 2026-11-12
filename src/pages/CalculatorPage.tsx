import React, { useState, useEffect } from 'react';
import { goldCityRates as fallbackGoldCityRates } from '../data/financialData';
import { GoldCityRate } from '../types';
import { updatePageSeo } from '../utils/seo';

interface CalculatorPageProps {
  navigate: (path: string) => void;
}

type CalculatorTab = 'gold' | 'silver' | 'sip' | 'stocks' | 'fd';

const TABS: { id: CalculatorTab; label: string }[] = [
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'sip', label: 'SIP' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'fd', label: 'FD' },
];

export const CalculatorPage: React.FC<CalculatorPageProps> = () => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('gold');
  const [liveRates, setLiveRates] = useState<GoldCityRate[]>(fallbackGoldCityRates);
  const [selectedCitySlug, setSelectedCitySlug] = useState('national');

  // Gold
  const [goldPurity, setGoldPurity] = useState<'24K' | '22K' | '18K'>('22K');
  const [goldWeight, setGoldWeight] = useState<number>(10);
  const [goldMaking, setGoldMaking] = useState<number>(10);
  const [goldGst, setGoldGst] = useState<number>(3);

  // Silver
  const [silverWeight, setSilverWeight] = useState<number>(100);
  const [silverMaking, setSilverMaking] = useState<number>(8);
  const [silverGst, setSilverGst] = useState<number>(3);

  // SIP
  const [sipMonthly, setSipMonthly] = useState<number>(5000);
  const [sipRate, setSipRate] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(10);

  // Stocks
  const [buyPrice, setBuyPrice] = useState<number>(1500);
  const [sellPrice, setSellPrice] = useState<number>(1750);
  const [shares, setShares] = useState<number>(50);

  // FD
  const [fdPrincipal, setFdPrincipal] = useState<number>(100000);
  const [fdRate, setFdRate] = useState<number>(7.1);
  const [fdYears, setFdYears] = useState<number>(3);

  useEffect(() => {
    fetch('/api/gold-silver')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.cities) && data.cities.length > 0) {
          setLiveRates(data.cities);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    updatePageSeo({
      title: 'Calculators – Gold, Silver, SIP, Stocks & FD | MarketMind',
      description: 'Simple, clean financial calculators for gold, silver, SIP returns, stock P&L, and fixed deposits.',
      canonicalPath: '/calculator/',
    });
  }, []);

  const currentCity = liveRates.find((c) => c.slug === selectedCitySlug) || liveRates[0];

  // Gold Math
  const goldRate =
    goldPurity === '24K'
      ? currentCity.rate24KPerGram
      : goldPurity === '22K'
      ? currentCity.rate22KPerGram
      : currentCity.rate18KPerGram;
  const goldBase = Math.round(goldRate * goldWeight);
  const goldMakingAmt = Math.round((goldBase * goldMaking) / 100);
  const goldGstAmt = Math.round(((goldBase + goldMakingAmt) * goldGst) / 100);
  const goldTotal = goldBase + goldMakingAmt + goldGstAmt;

  // Silver Math
  const silverRate = currentCity.silverPerGram;
  const silverBase = Math.round(silverRate * silverWeight);
  const silverMakingAmt = Math.round((silverBase * silverMaking) / 100);
  const silverGstAmt = Math.round(((silverBase + silverMakingAmt) * silverGst) / 100);
  const silverTotal = silverBase + silverMakingAmt + silverGstAmt;

  // SIP Math
  const sipMonths = sipYears * 12;
  const sipMonthlyRate = sipRate / 12 / 100;
  const sipInvested = sipMonthly * sipMonths;
  const sipTotal =
    sipMonthlyRate > 0
      ? Math.round(
          sipMonthly * ((Math.pow(1 + sipMonthlyRate, sipMonths) - 1) / sipMonthlyRate) * (1 + sipMonthlyRate)
        )
      : sipInvested;
  const sipReturns = Math.max(0, sipTotal - sipInvested);

  // Stocks Math
  const stockInvested = Math.round(buyPrice * shares);
  const stockExit = Math.round(sellPrice * shares);
  const stockPnl = stockExit - stockInvested;
  const stockRoi = stockInvested > 0 ? ((stockPnl / stockInvested) * 100).toFixed(2) : '0.00';

  // FD Math (Quarterly compounding)
  const fdTotal = Math.round(fdPrincipal * Math.pow(1 + fdRate / 100 / 4, 4 * fdYears));
  const fdInterest = Math.max(0, fdTotal - fdPrincipal);

  const handleReset = () => {
    if (activeTab === 'gold') {
      setSelectedCitySlug('national');
      setGoldPurity('22K');
      setGoldWeight(10);
      setGoldMaking(10);
      setGoldGst(3);
    } else if (activeTab === 'silver') {
      setSelectedCitySlug('national');
      setSilverWeight(100);
      setSilverMaking(8);
      setSilverGst(3);
    } else if (activeTab === 'sip') {
      setSipMonthly(5000);
      setSipRate(12);
      setSipYears(10);
    } else if (activeTab === 'stocks') {
      setBuyPrice(1500);
      setSellPrice(1750);
      setShares(50);
    } else if (activeTab === 'fd') {
      setFdPrincipal(100000);
      setFdRate(7.1);
      setFdYears(3);
    }
  };

  const inputClass =
    'w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 font-mono outline-none focus:border-slate-400 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Minimal Header & Clean Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Calculators
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Simple estimates for bullion, SIP, equities, and fixed deposits.
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 inline-flex items-center self-start sm:self-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Single Unified Calculator Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Clean Inputs */}
          <div className="md:col-span-7 p-5 sm:p-7 space-y-5">
            {activeTab === 'gold' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <select
                      aria-label="City"
                      value={selectedCitySlug}
                      onChange={(e) => setSelectedCitySlug(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      {liveRates.map((city) => (
                        <option key={city.slug} value={city.slug}>
                          {city.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Purity</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 h-10">
                      {(['24K', '22K', '18K'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setGoldPurity(p)}
                          className={`rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            goldPurity === p
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Weight (grams)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={goldWeight}
                    onChange={(e) => setGoldWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Making (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={goldMaking}
                      onChange={(e) => setGoldMaking(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>GST (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="28"
                      step="0.5"
                      value={goldGst}
                      onChange={(e) => setGoldGst(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'silver' && (
              <>
                <div>
                  <label className={labelClass}>City</label>
                  <select
                    aria-label="City"
                    value={selectedCitySlug}
                    onChange={(e) => setSelectedCitySlug(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-slate-400 cursor-pointer"
                  >
                    {liveRates.map((city) => (
                      <option key={city.slug} value={city.slug}>
                        {city.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Weight (grams)</label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={silverWeight}
                    onChange={(e) => setSilverWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Making (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={silverMaking}
                      onChange={(e) => setSilverMaking(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>GST (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="28"
                      step="0.5"
                      value={silverGst}
                      onChange={(e) => setSilverGst(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'sip' && (
              <>
                <div>
                  <label className={labelClass}>Monthly Investment (₹)</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Expected Return (% p.a.)</label>
                    <input
                      type="number"
                      min="1"
                      max="35"
                      step="0.5"
                      value={sipRate}
                      onChange={(e) => setSipRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Duration (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      step="1"
                      value={sipYears}
                      onChange={(e) => setSipYears(Math.max(1, parseInt(e.target.value) || 1))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={Math.min(30, sipYears)}
                    onChange={(e) => setSipYears(parseInt(e.target.value) || 1)}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                    <span>1 yr</span>
                    <span>{sipYears} years</span>
                    <span>30 yrs</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'stocks' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Buy Price (₹)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Sell Price (₹)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Quantity (Shares)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={shares}
                    onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {activeTab === 'fd' && (
              <>
                <div>
                  <label className={labelClass}>Deposit Amount (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={fdPrincipal}
                    onChange={(e) => setFdPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      step="0.1"
                      value={fdRate}
                      onChange={(e) => setFdRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tenure (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="1"
                      value={fdYears}
                      onChange={(e) => setFdYears(Math.max(1, parseInt(e.target.value) || 1))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={Math.min(10, fdYears)}
                    onChange={(e) => setFdYears(parseInt(e.target.value) || 1)}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                    <span>1 yr</span>
                    <span>{fdYears} years</span>
                    <span>10 yrs</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Clean Summary Output */}
          <div className="md:col-span-5 bg-slate-50/70 border-t md:border-t-0 md:border-l border-slate-200 p-5 sm:p-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Summary
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {activeTab === 'gold' && (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">
                      {goldPurity} Rate ({currentCity.city})
                    </span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{goldRate.toLocaleString('en-IN')}/g
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Metal Value ({goldWeight}g)</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{goldBase.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Making ({goldMaking}%)</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{goldMakingAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">GST ({goldGst}%)</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{goldGstAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'silver' && (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Silver Rate ({currentCity.city})</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{silverRate.toLocaleString('en-IN')}/g
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Metal Value ({silverWeight}g)</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{silverBase.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Making ({silverMaking}%)</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{silverMakingAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">GST ({silverGst}%)</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{silverGstAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'sip' && (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Invested Amount</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{sipInvested.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Estimated Returns</span>
                    <span className="font-mono font-semibold text-emerald-600 break-all text-right">
                      +₹{sipReturns.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex mt-2">
                    <div
                      style={{ width: `${Math.min(100, (sipInvested / (sipTotal || 1)) * 100)}%` }}
                      className="bg-slate-400 h-full"
                    />
                    <div className="bg-emerald-500 h-full flex-1" />
                  </div>
                </div>
              )}

              {activeTab === 'stocks' && (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Invested Capital</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{stockInvested.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Exit Value</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{stockExit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Return</span>
                    <span
                      className={`font-mono font-semibold break-all text-right ${
                        stockPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {stockPnl >= 0 ? `+${stockRoi}%` : `${stockRoi}%`}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'fd' && (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Principal</span>
                    <span className="font-mono font-medium text-slate-900 break-all text-right">
                      ₹{fdPrincipal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Interest Earned</span>
                    <span className="font-mono font-semibold text-emerald-600 break-all text-right">
                      +₹{fdInterest.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1">
                    <span className="text-slate-500">Compounding</span>
                    <span className="font-medium text-slate-700">Quarterly</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 min-w-0">
              <span className="text-xs text-slate-500 block mb-1">
                {activeTab === 'gold' || activeTab === 'silver'
                  ? 'Estimated Total'
                  : activeTab === 'sip'
                  ? 'Projected Value'
                  : activeTab === 'stocks'
                  ? 'Net Profit / Loss'
                  : 'Maturity Amount'}
              </span>
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight break-all ${
                  activeTab === 'stocks'
                    ? stockPnl >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                    : 'text-slate-900'
                }`}
              >
                {activeTab === 'gold' && `₹${goldTotal.toLocaleString('en-IN')}`}
                {activeTab === 'silver' && `₹${silverTotal.toLocaleString('en-IN')}`}
                {activeTab === 'sip' && `₹${sipTotal.toLocaleString('en-IN')}`}
                {activeTab === 'stocks' &&
                  `${stockPnl >= 0 ? '+' : '-'}₹${Math.abs(stockPnl).toLocaleString('en-IN')}`}
                {activeTab === 'fd' && `₹${fdTotal.toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
