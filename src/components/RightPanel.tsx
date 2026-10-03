import React, { useState } from 'react';
import {
  Wand2,
  Calendar,
  Sparkles,
  Tag,
  Copy,
  Check,
  Square,
  Flame,
  FileSpreadsheet,
  Archive,
  Layers,
  CornerDownLeft,
} from 'lucide-react';
import { TrendEvent, VectorMetadata, BatchItem } from '../types/vector';

interface RightPanelProps {
  promptText: string;
  setPromptText: React.Dispatch<React.SetStateAction<string>>;
  onGenerate: () => void;
  onStop: () => void;
  isProcessing: boolean;
  months: string[];
  activeMonthIdx: number;
  onSelectMonth: (idx: number) => void;
  trendEvents: TrendEvent[];
  isLoadingTrends: boolean;
  onExtractPromptsForEvent: (event: TrendEvent) => void;
  isExtractingPrompts: boolean;
  metadata?: VectorMetadata | null;
  isLoadingMetadata: boolean;
  batchItems: BatchItem[];
  onDownloadBatchZip: () => void;
  onDownloadCsv: () => void;
}

const PRESET_IDEAS = [
  'Set elemen semak-semak hijau (Bushes)',
  'Minimalist business & finance glyph icons',
  'Cute Japanese sushi & bento stickers',
  'Flat isometric modern home office workspace',
  'Vintage retro 1970s mountain badge logo',
];

export const RightPanel: React.FC<RightPanelProps> = ({
  promptText,
  setPromptText,
  onGenerate,
  onStop,
  isProcessing,
  months,
  activeMonthIdx,
  onSelectMonth,
  trendEvents,
  isLoadingTrends,
  onExtractPromptsForEvent,
  isExtractingPrompts,
  metadata,
  isLoadingMetadata,
  batchItems,
  onDownloadBatchZip,
  onDownloadCsv,
}) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);

  const handleCopyTitle = async () => {
    if (!metadata?.title) return;
    await navigator.clipboard.writeText(metadata.title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyKeywords = async () => {
    if (!metadata?.keywords) return;
    await navigator.clipboard.writeText(metadata.keywords);
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const promptCount = promptText
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;

  const kwCount = metadata?.keywords
    ? metadata.keywords.split(',').filter((k) => k.trim().length > 0).length
    : 0;

  const completedBatchCount = batchItems.filter((b) => b.status === 'done').length;

  return (
    <aside className="w-full lg:w-[330px] border-t lg:border-t-0 border-l border-zinc-800 bg-[#0f0f11] flex flex-col shrink-0 z-10 overflow-y-auto">
      <div className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/60 shrink-0 sticky top-0 backdrop-blur z-10 justify-between">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Vector Prompter</span>
        </h2>
        {promptCount > 1 && (
          <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono font-medium">
            {promptCount} Antrean Batch
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        {/* Manual Prompt Input */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg p-3 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="promptInputArea" className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Ide Elemen Vector
            </label>
            <span
              className="text-[9px] text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded bg-black/40 font-mono"
              title="Pisahkan dengan tombol Enter untuk mode antrean batch"
            >
              Multi-line Batch
            </span>
          </div>

          <textarea
            id="promptInputArea"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Contoh: Set elemen semak-semak hijau (Bushes).&#10;Tekan Enter untuk prompt baru (Batch Processing)"
            className="w-full h-[85px] bg-[#1a1a1d] border border-zinc-700/80 rounded p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-y text-xs leading-relaxed font-sans"
          />

          {/* Quick preset chips */}
          <div className="mt-2 flex flex-wrap gap-1">
            {PRESET_IDEAS.slice(0, 3).map((idea, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptText((prev) => (prev.trim() ? `${prev}\n${idea}` : idea));
                }}
                className="text-[9px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded-full transition-colors truncate max-w-[280px]"
              >
                + {idea}
              </button>
            ))}
          </div>
        </div>

        {/* TrendHub Auto Prompt */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="px-3 py-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Flame className="w-3 h-3" />
              </div>
              <h3 className="text-[11px] font-semibold text-white tracking-wide">
                TrendHub (Vector Microstock)
              </h3>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">Adobe Stock Trends</span>
          </div>

          <div className="p-2.5 flex flex-col gap-2">
            {/* Month Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {months.map((m, idx) => {
                const isActive = activeMonthIdx === idx;
                return (
                  <button
                    key={m}
                    onClick={() => onSelectMonth(idx)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors shrink-0 border ${
                      isActive
                        ? 'bg-white text-black border-white shadow-sm'
                        : 'bg-[#1b1b1e] text-zinc-400 border-zinc-800 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Event list */}
            <div className="bg-[#18181c] border border-zinc-800/80 rounded-md flex flex-col max-h-[160px] overflow-y-auto">
              {isLoadingTrends ? (
                <div className="text-[10px] text-zinc-400 text-center py-6 flex flex-col items-center gap-2">
                  <div className="loader w-4 h-4 border-t-blue-500" />
                  <span>Melacak tren vector microstock...</span>
                </div>
              ) : trendEvents.length === 0 ? (
                <div className="text-[10px] text-zinc-500 text-center py-6 px-3">
                  <Calendar className="w-6 h-6 mx-auto mb-1 text-zinc-600" />
                  <span>Pilih bulan di atas untuk memuat ide desain terlaris.</span>
                </div>
              ) : (
                trendEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col border-b border-zinc-800/60 p-2 hover:bg-zinc-800/40 transition-colors group last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-black/60 border border-zinc-800 text-zinc-200 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 font-mono">
                        {ev.date}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-200 truncate flex-1" title={ev.eventName}>
                        {ev.eventName}
                      </span>
                    </div>

                    <button
                      disabled={isExtractingPrompts}
                      onClick={() => onExtractPromptsForEvent(ev)}
                      className="w-full bg-[#202025] group-hover:bg-white text-zinc-300 group-hover:text-black border border-zinc-700/80 group-hover:border-white text-[9px] py-1 rounded transition-all flex items-center justify-center gap-1.5 font-medium cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Jadikan 5 Ide Vector (Line & Flat)</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Auto Metadata (SEO Microstock) */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="bg-zinc-800/30 px-3 py-2 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-blue-400" />
              <span>Auto Meta Data (SEO)</span>
            </h3>
            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
              Adobe Stock Ready
            </span>
          </div>

          <div className="p-3 flex flex-col gap-2.5 relative">
            {isLoadingMetadata && (
              <div className="absolute inset-0 bg-[#141416]/90 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                <div className="loader w-4 h-4 border-t-blue-500 mb-2" />
                <span className="text-[9px] text-zinc-400 font-mono">Menyusun Keyword & Kategori...</span>
              </div>
            )}

            {/* Title / Description */}
            <div className="flex flex-col gap-1">
              <label htmlFor="metaTitleInput" className="text-[10px] font-medium text-zinc-300">Title / Deskripsi</label>
              <div className="flex gap-1.5">
                <input
                  id="metaTitleInput"
                  type="text"
                  readOnly
                  value={metadata?.title || ''}
                  placeholder="Title otomatis akan muncul di sini..."
                  className="w-full bg-[#1b1b1e] border border-zinc-700/80 rounded text-[10px] p-2 text-white focus:outline-none"
                />
                <button
                  onClick={handleCopyTitle}
                  disabled={!metadata?.title}
                  title="Copy Title"
                  className="bg-[#1b1b1e] border border-zinc-700/80 hover:bg-zinc-700 text-zinc-300 p-2 rounded transition-colors disabled:opacity-40"
                >
                  {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Keywords */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <label htmlFor="metaKeywordsArea" className="font-medium text-zinc-300">Keywords (Max 50)</label>
                <span className="font-mono text-blue-400 text-[9px]">{kwCount}/50</span>
              </div>
              <div className="flex gap-1.5">
                <textarea
                  id="metaKeywordsArea"
                  readOnly
                  value={metadata?.keywords || ''}
                  placeholder="Keywords teroptimasi SEO akan muncul di sini..."
                  className="w-full h-[55px] bg-[#1b1b1e] border border-zinc-700/80 rounded text-[10px] p-2 text-white focus:outline-none resize-none"
                />
                <button
                  onClick={handleCopyKeywords}
                  disabled={!metadata?.keywords}
                  title="Copy Keywords"
                  className="bg-[#1b1b1e] border border-zinc-700/80 hover:bg-zinc-700 text-zinc-300 p-2 rounded transition-colors flex flex-col justify-center items-center disabled:opacity-40"
                >
                  {copiedKeywords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Category tag */}
            {metadata?.categoryId && (
              <div className="flex items-center justify-between text-[10px] bg-black/40 border border-zinc-800 p-2 rounded">
                <span className="text-zinc-400">Adobe Stock Category:</span>
                <span className="text-blue-300 font-mono font-semibold">
                  Cat #{metadata.categoryId} ({metadata.categoryName || 'Graphic Resources'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Batch Queue Summary (if any) */}
        {completedBatchCount > 0 && (
          <div className="border border-emerald-900/40 bg-emerald-950/20 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-300">
                {completedBatchCount} file berhasil diproses
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onDownloadCsv}
                title="Unduh Adobe Stock Metadata CSV"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[9px] px-2 py-1 rounded flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={onDownloadBatchZip}
                title="Unduh Semua File dalam ZIP"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] px-2 py-1 rounded font-bold flex items-center gap-1"
              >
                <Archive className="w-3 h-3" />
                <span>ZIP Semua</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Button Bar */}
        <div className="mt-auto pt-2 border-t border-zinc-800 flex gap-2">
          <button
            onClick={onGenerate}
            disabled={isProcessing}
            className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="loader w-3.5 h-3.5 border-t-black" />
                <span>Memproses Batch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Generate & Trace (Ctrl+Enter)</span>
              </>
            )}
          </button>

          <button
            onClick={onStop}
            disabled={!isProcessing}
            title="Hentikan Proses Batch"
            className="w-11 bg-[#1b1b1e] hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-900 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
