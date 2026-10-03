import React from 'react';
import { Layers, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  serverConnected: boolean;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ serverConnected, isProcessing }) => {
  return (
    <header className="h-12 border-b border-zinc-800 bg-[#0c0c0e] flex items-center justify-between px-4 shrink-0 z-20 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              FIZAVectogen
              <span className="text-[10px] bg-white text-black font-extrabold px-1.5 py-0.2 rounded tracking-wide shadow-sm">
                PRO
              </span>
            </h1>
            <span className="hidden sm:inline-block text-xs text-zinc-400">
              Microstock Studio (SVG & EPS 16MP+)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-[11px] font-medium text-zinc-300 bg-zinc-900/90 px-3 py-1 rounded-md border border-zinc-800 flex items-center gap-2 shadow-inner">
          <div
            className={`w-2 h-2 rounded-full ${
              isProcessing
                ? 'bg-amber-400 animate-ping'
                : serverConnected
                ? 'bg-blue-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span className="font-mono text-[10.5px]">
            {isProcessing ? 'Processing Queue...' : 'Engine: Tracer OmniV2 + 16MP'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 bg-blue-950/40 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded text-[10px] font-mono">
          <Sparkles className="w-3 h-3" />
          <span>Adobe Stock & Shutterstock Ready</span>
        </div>
      </div>
    </header>
  );
};
