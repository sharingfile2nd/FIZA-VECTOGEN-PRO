import React, { useRef, useEffect, useState } from 'react';
import {
  VectorSquare,
  Image as ImageIcon,
  Download,
  Maximize,
  Copy,
  Check,
  Code2,
  Terminal as TerminalIcon,
  Trash2,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Grid,
} from 'lucide-react';
import { TerminalLog } from '../types/vector';

interface CenterViewportProps {
  originalRaster?: string;
  svgString?: string;
  pngDataUrl?: string;
  dimensions?: { width: number; height: number };
  isProcessing: boolean;
  progressPercent: number;
  loadingStageTitle: string;
  loadingStageSubtitle: string;
  logs: TerminalLog[];
  onClearLogs: () => void;
  onDownloadCurrent: (formatOverride?: 'svg' | 'png' | 'eps') => void;
  outputFormat: 'svg' | 'png' | 'eps';
}

export const CenterViewport: React.FC<CenterViewportProps> = ({
  originalRaster,
  svgString,
  pngDataUrl,
  dimensions,
  isProcessing,
  progressPercent,
  loadingStageTitle,
  loadingStageSubtitle,
  logs,
  onClearLogs,
  onDownloadCurrent,
  outputFormat,
}) => {
  const [bgMode, setBgMode] = useState<'checker' | 'white' | 'dark'>('white');
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const vectorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const hasResult = Boolean(originalRaster || svgString || pngDataUrl);

  const handleCopySvg = async () => {
    if (!svgString) return;
    try {
      await navigator.clipboard.writeText(svgString);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleFullscreen = () => {
    if (!vectorContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      vectorContainerRef.current.requestFullscreen?.();
    }
  };

  const mpValue = dimensions
    ? ((dimensions.width * dimensions.height) / 1000000).toFixed(1)
    : '16.0';

  return (
    <section className="flex-1 flex flex-col relative min-h-[500px] lg:min-h-0 bg-[#08080a] overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="h-10 border-b border-zinc-800 bg-[#0e0e11] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white font-medium bg-[#17171a] border border-zinc-700/80 px-2.5 py-1 rounded flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-[11px]">VIEWPORT</span>
            {dimensions && (
              <span className="text-[10px] text-zinc-400 font-mono pl-1 border-l border-zinc-700">
                {dimensions.width}×{dimensions.height} ({mpValue} MP)
              </span>
            )}
          </span>

          {/* Background Canvas Mode Selector */}
          <div className="hidden sm:flex items-center bg-[#17171a] border border-zinc-800 rounded p-0.5 text-[10px]">
            <button
              onClick={() => setBgMode('checker')}
              title="Transparansi Kotak-Kotak"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                bgMode === 'checker' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-2.5 h-2.5" />
              <span>Checker</span>
            </button>
            <button
              onClick={() => setBgMode('white')}
              title="Canvas Putih Solid"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                bgMode === 'white' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sun className="w-2.5 h-2.5" />
              <span>White</span>
            </button>
            <button
              onClick={() => setBgMode('dark')}
              title="Canvas Gelap"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                bgMode === 'dark' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Moon className="w-2.5 h-2.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {svgString && (
            <>
              <button
                onClick={handleCopySvg}
                title="Salin Kode SVG ke Clipboard"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors"
              >
                {copiedSvg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copiedSvg ? 'Tersalin' : 'Copy SVG'}</span>
              </button>

              <button
                onClick={() => setShowXmlModal(true)}
                title="Lihat Raw SVG XML"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3 h-3" />
                <span className="hidden sm:inline">XML</span>
              </button>
            </>
          )}

          {hasResult && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDownloadCurrent(outputFormat)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="uppercase font-mono font-semibold">
                  {outputFormat === 'eps' ? 'EPS 3.0' : outputFormat === 'png' ? 'PNG 16MP' : 'SVG (16MP)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas View Area */}
      <div
        ref={vectorContainerRef}
        className="flex-1 canvas-bg relative flex items-center justify-center p-3 lg:p-6 overflow-hidden shadow-inner"
      >
        {/* Placeholder State */}
        {!hasResult && !isProcessing && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md animate-fade-in select-none">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-xl">
              <Sparkles className="w-8 h-8 text-blue-500/80" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-1.5">
              Tracer Engine Ready
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ketik deskripsi elemen atau pilih inspirasi dari{' '}
              <span className="text-blue-400 font-semibold">TrendHub</span> di panel kanan.
              Dilengkapi Upscaler 16 MP dan auto-SEO untuk Microstock.
            </p>
          </div>
        )}

        {/* Dual Viewer: Side-by-side or stacked on small screens */}
        {hasResult && (
          <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-4 animate-fade-in">
            {/* Left Card: Original Raster (AI) */}
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-[#0d0d10] border border-zinc-800 rounded-xl p-3 relative shadow-2xl overflow-hidden group">
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10 bg-black/80 backdrop-blur border border-zinc-800 px-2.5 py-1 rounded-md shadow-lg">
                <ImageIcon className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-zinc-300 font-mono font-medium">Original Raster (AI)</span>
              </div>

              {originalRaster ? (
                <img
                  src={originalRaster.startsWith('data:') ? originalRaster : `data:image/png;base64,${originalRaster}`}
                  alt="Original AI generated raster"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-zinc-600 text-xs font-mono">Menunggu gambar awal...</div>
              )}
            </div>

            {/* Right Card: Vector Traced / Cutout Preview */}
            <div
              className={`flex-1 w-full h-full flex flex-col items-center justify-center border border-zinc-800 rounded-xl p-3 relative shadow-2xl overflow-hidden group ${
                bgMode === 'checker'
                  ? 'canvas-checkerboard'
                  : bgMode === 'dark'
                  ? 'bg-[#121214]'
                  : 'bg-white'
              }`}
            >
              <div
                className={`absolute top-3 left-3 flex items-center gap-2 z-10 backdrop-blur px-2.5 py-1 rounded-md shadow-lg border ${
                  bgMode === 'white'
                    ? 'bg-white/90 border-zinc-300 text-zinc-800'
                    : 'bg-black/80 border-zinc-800 text-white'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold">
                  {outputFormat === 'png' ? 'Raster Clean (PNG 16MP)' : 'Vector Traced (SVG)'}
                </span>
              </div>

              {/* Toolbar in corner */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={handleFullscreen}
                  title="Fullscreen View"
                  className="bg-black/75 hover:bg-black text-white p-1.5 rounded border border-zinc-700 shadow"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Render Vector SVG or PNG */}
              {outputFormat === 'png' && pngDataUrl ? (
                <img
                  src={pngDataUrl}
                  alt="Clean Transparent PNG"
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              ) : svgString ? (
                <div
                  className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: svgString }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <div className="loader w-5 h-5" />
                  <span className="text-xs font-mono">Memproses kalkulasi kurva...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Loader Box */}
        {isProcessing && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-auto">
            <div className="bg-[#0f0f13]/95 border border-blue-900/60 p-4 rounded-xl flex flex-col items-center gap-3 shadow-2xl backdrop-blur-md min-w-[340px]">
              <div className="flex items-center gap-2.5 w-full">
                <div className="loader w-4 h-4 border-t-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs text-white font-bold tracking-wide truncate">
                    {loadingStageTitle || 'Memproses Asset Vector...'}
                  </h4>
                  <p className="text-[10px] text-blue-300 font-mono truncate">
                    {loadingStageSubtitle || 'Melakukan kalkulasi kurva...'}
                  </p>
                </div>
                <span className="text-xs text-blue-400 font-mono font-bold">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Log Area */}
      <div className="h-32 border-t border-zinc-800 bg-[#050507] flex flex-col shrink-0 z-20 shadow-2xl">
        <div className="h-7 bg-[#0c0c0f] border-b border-zinc-800 flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-400 tracking-wider">SYSTEM LOG</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500 font-mono">{logs.length} entries</span>
            <button
              onClick={onClearLogs}
              title="Bersihkan Log"
              className="text-zinc-500 hover:text-zinc-300 text-[10px] transition-colors p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-2.5 overflow-y-auto flex-1 font-mono text-[10.5px] space-y-1 select-text">
          {logs.map((log) => {
            let color = 'text-zinc-300';
            let badgeBg = 'bg-zinc-800 text-zinc-400';

            if (log.type === 'ok') {
              color = 'text-emerald-400';
              badgeBg = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40';
            } else if (log.type === 'err') {
              color = 'text-rose-400';
              badgeBg = 'bg-rose-950/80 text-rose-300 border border-rose-800/40';
            } else if (log.type === 'net') {
              color = 'text-sky-300';
              badgeBg = 'bg-sky-950/80 text-sky-300 border border-sky-800/40';
            } else if (log.type === 'prc') {
              color = 'text-purple-300';
              badgeBg = 'bg-purple-950/80 text-purple-300 border border-purple-800/40';
            } else if (log.type === 'wrn') {
              color = 'text-amber-300';
              badgeBg = 'bg-amber-950/80 text-amber-300 border border-amber-800/40';
            }

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-600 select-none shrink-0">[{log.timestamp}]</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${badgeBg}`}>
                  {log.type}
                </span>
                <span className={`${color} break-all flex-1`}>{log.message}</span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Raw SVG XML Modal */}
      {showXmlModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-700 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                Raw SVG Code
              </span>
              <button
                onClick={() => setShowXmlModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-[10px] text-zinc-300 bg-[#0a0a0c]">
              <pre className="whitespace-pre-wrap">{svgString}</pre>
            </div>
            <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={handleCopySvg}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1.5"
              >
                {copiedSvg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSvg ? 'Tersalin' : 'Salin Semua'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
