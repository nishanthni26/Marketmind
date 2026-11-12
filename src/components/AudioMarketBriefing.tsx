import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { mockMarketInsights } from '../data/financialData';

export const AudioMarketBriefing: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [isSupported, setIsSupported] = useState(false);

  const insight = mockMarketInsights[0];
  const audioText = `${insight.title}. ${insight.summary}. Key market drivers today: ${insight.keyDrivers.join('. ')}. This briefing is compiled objectively by MarketMind intelligence.`;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const handleTogglePlay = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.rate = rate;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleCycleRate = () => {
    const nextRate = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(nextRate);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.rate = nextRate;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="bg-[#022c22] text-white rounded-xl p-3.5 border border-emerald-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={handleTogglePlay}
          className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-900 flex items-center justify-center shrink-0 transition-all shadow-xs cursor-pointer"
          title={isPlaying ? 'Pause Audio Briefing' : 'Listen to Market Briefing'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-stone-900" /> : <Play className="w-4 h-4 fill-stone-900 ml-0.5" />}
        </button>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center">
              <Volume2 className="w-3 h-3 mr-1" />
              Audio Market Briefing
            </span>
            <span className="text-[10px] text-stone-400 font-mono-num">3 Min Audio</span>
          </div>
          <h4 className="text-xs font-bold text-stone-100 line-clamp-1 max-w-md">
            {insight.title}
          </h4>
        </div>
      </div>

      {/* Playback Controls & Waveform animation */}
      <div className="flex items-center space-x-3 self-end sm:self-center">
        {/* Animated waveform bars when playing */}
        {isPlaying && (
          <div className="flex items-end space-x-1 h-5 px-2">
            <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.1s] h-5"></span>
            <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.2s] h-4"></span>
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2"></span>
          </div>
        )}

        <button
          onClick={handleCycleRate}
          className="text-[11px] font-mono-num font-bold px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors"
          title="Change playback speed"
        >
          {rate}x Speed
        </button>

        {isPlaying && (
          <button
            onClick={handleStop}
            className="text-stone-400 hover:text-white p-1"
            title="Stop audio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
