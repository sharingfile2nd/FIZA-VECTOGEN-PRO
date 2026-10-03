import React, { useState } from 'react';
import {
  Maximize2,
  Palette,
  FileCode,
  Sliders,
  ChevronDown,
  Info,
  Layers,
  Settings2,
} from 'lucide-react';
import { AspectRatio, VectorStyleId, OutputFormat, UpscaleFactor } from '../types/vector';

interface LeftPanelProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  vectorStyle: VectorStyleId;
  setVectorStyle: (vs: VectorStyleId) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (of: OutputFormat) => void;
  upscaleFactor: UpscaleFactor;
  setUpscaleFactor: (uf: UpscaleFactor) => void;
  customPrefix: string;
  setCustomPrefix: (prefix: string) => void;
  autoDownload: boolean;
  setAutoDownload: (val: boolean) => void;
  // Advanced tuning
  blurRadius: number;
  setBlurRadius: (val: number) => void;
  curveSmoothness: number;
  setCurveSmoothness: (val: number) => void;
  numberOfColors: number;
  setNumberOfColors: (val: number) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  aspectRatio,
  setAspectRatio,
  vectorStyle,
  setVectorStyle,
  outputFormat,
  setOutputFormat,
  upscaleFactor,
  setUpscaleFactor,
  customPrefix,
  setCustomPrefix,
  autoDownload,
  setAutoDownload,
  blurRadius,
  setBlurRadius,
  curveSmoothness,
  setCurveSmoothness,
  numberOfColors,
  setNumberOfColors,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <aside className="w-full lg:w-[280px] border-r-0 lg:border-r border-b lg:border-b-0 border-zinc-800 bg-[#0f0f11] flex flex-col shrink-0 z-10 overflow-y-auto">
      <div className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/60 shrink-0 sticky top-0 backdrop-blur z-10">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          <span>Vector Parameter</span>
        </h2>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Group: Base Dimensions */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="bg-zinc-800/30 px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 text-zinc-400" />
              <span>Dimensi Base</span>
            </h3>
            <span className="text-[9px] text-zinc-500 font-mono">Aspect Ratio</span>
          </div>

          <div className="p-3">
            <label htmlFor="aspectRatioSelect" className="text-[11px] font-medium text-zinc-300 block mb-1.5">
              Rasio Aspek Gambar
            </label>
            <div className="relative">
              <select
                id="aspectRatioSelect"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-[#1b1b1e] border border-zinc-700/80 rounded text-xs p-2 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer pr-8"
              >
                <option value="1:1">1:1 (Square - Terbaik u/ Icon/Set)</option>
                <option value="16:9">16:9 (Landscape - Banner/Web)</option>
                <option value="9:16">9:16 (Vertical - Mobile/Story)</option>
                <option value="4:3">4:3 (Classic Artboard)</option>
                <option value="3:4">3:4 (Portrait Artboard)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Group: Vector Style */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="bg-zinc-800/30 px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3 h-3 text-zinc-400" />
              <span>Tracing Style</span>
            </h3>
            <span className="text-[9px] text-blue-400/90 font-mono">11 Styles</span>
          </div>

          <div className="p-3">
            <label htmlFor="vectorStyleSelect" className="text-[11px] font-medium text-zinc-300 block mb-1.5">
              Tipe Visual Vector
            </label>
            <div className="relative">
              <select
                id="vectorStyleSelect"
                value={vectorStyle}
                onChange={(e) => setVectorStyle(e.target.value as VectorStyleId)}
                className="w-full bg-[#1b1b1e] border border-zinc-700/80 rounded text-xs p-2 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer pr-8"
              >
                <option value="auto">0. Otomatis (Sesuai Prompt & Trend)</option>
                <option value="silhouette">1. Silhouette (Hitam Putih Solid - Ikon/Bentuk)</option>
                <option value="flatcolor">2. Flat Color (Warna Solid - Semak/Elemen Datar)</option>
                <option value="lineart">3. Minimalist Line Art (Garis Outline - Bersih & Elegan)</option>
                <option value="duotone">4. Modern Duotone (Dua Warna Kontras - Tren UI/UX)</option>
                <option value="corporate">5. Corporate Memphis (Geometris Abstrak - Web/Startup)</option>
                <option value="kawaii">6. Kawaii Cute (Gaya Maskot & Stiker Jepang Imut)</option>
                <option value="isometric">7. Flat Isometric (Prespektif 3D Datar - Infografis)</option>
                <option value="retro">8. Retro Vintage (Gaya 70s/80s - Badge & Label)</option>
                <option value="lowpoly">9. Low Poly / Polygonal (Seni Segitiga Geometris)</option>
                <option value="popart">10. Pop-Art Comic (Titik Halftone & Warna Mencolok)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800/80 leading-relaxed">
              {vectorStyle === 'auto' && 'Otomatis menganalisis tema prompt dan mencocokkan gaya komersial terbaik.'}
              {vectorStyle === 'silhouette' && 'Menggunakan siluet hitam pekat 1-bit dengan binarisasi agresif untuk logo dan stensil.'}
              {vectorStyle === 'lineart' && 'Outline hitam bersih tanpa warna, siap untuk buku mewarnai atau glyph presisi.'}
              {vectorStyle === 'flatcolor' && 'Palet warna solid berbatas tegas tanpa gradasi, format terfavorit di Adobe Stock.'}
              {vectorStyle === 'duotone' && 'Hanya 2 warna kontras tajam untuk estetika poster modern dan antarmuka app.'}
              {vectorStyle === 'corporate' && 'Karakter proporsi unik dengan warna pastel modern ala ilustrasi tech.'}
              {vectorStyle === 'kawaii' && 'Stiker Jepang lucu dengan outline tebal manis dan warna lembut.'}
              {vectorStyle === 'isometric' && 'Proyeksi ortografis 3D datar cocok untuk aset game dan diagram teknis.'}
              {vectorStyle === 'retro' && 'Palet warna hangat era 70-an dengan estetika lencana dan stempel antik.'}
              {vectorStyle === 'lowpoly' && 'Faset bidang segitiga geometris bersih tanpa bayangan kabur.'}
              {vectorStyle === 'popart' && 'Warna primer terang berani dengan karakter komik klasik.'}
            </div>
          </div>
        </div>

        {/* Group: Output Format & Upscaler (16MP+) */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="bg-zinc-800/30 px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3 h-3 text-zinc-400" />
              <span>Format & Upscale (16 MP)</span>
            </h3>
            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
              PRO
            </span>
          </div>

          <div className="p-3 flex flex-col gap-3">
            <div className="text-[10px] text-zinc-300 leading-relaxed bg-blue-950/20 p-2 rounded border border-blue-900/30">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-0.5">
                <Info className="w-3 h-3" />
                <span>Microstock Upscale Standard</span>
              </div>
              Menu Upscale melipatgandakan resolusi artboard ke standar microstock (≥ 16 MP / 4000x4000px+).
            </div>

            {/* Final File Format */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="outputFormatSelect" className="text-[11px] font-medium text-zinc-300">Format File Final</label>
              <div className="relative">
                <select
                  id="outputFormatSelect"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="w-full bg-[#1b1b1e] border border-blue-800/40 rounded text-xs p-2 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer pr-8 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
                >
                  <option value="svg">Vector (SVG) - Tracer Aktif (Microstock Ready)</option>
                  <option value="eps">Vector (EPS 3.0) - Adobe Illustrator / Shutterstock</option>
                  <option value="png">Raster (PNG Transparan) - Cutout 16 MP Instan</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Upscale Select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="upscaleFactorSelect" className="text-[11px] font-medium text-zinc-300">Resolusi Output (Upscale)</label>
              <div className="relative">
                <select
                  id="upscaleFactorSelect"
                  value={upscaleFactor}
                  onChange={(e) => setUpscaleFactor(Number(e.target.value) as UpscaleFactor)}
                  className="w-full bg-[#1b1b1e] border border-zinc-700/80 rounded text-[11px] p-2 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer pr-8"
                >
                  <option value="1">Base (Asli ~1000px - Standar Preview)</option>
                  <option value="4">16 MP (4000px+ - Standar Utama Microstock)</option>
                  <option value="6">36 MP (6000px+ - Banner & Cetak Besar)</option>
                  <option value="8">64 MP (8000px+ - Ultra High Definition)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Custom Prefix */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customPrefixInput" className="text-[11px] font-medium text-zinc-300">Penamaan File (Prefiks)</label>
              <input
                id="customPrefixInput"
                type="text"
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                placeholder="Contoh: FIZA_VECTOR"
                className="w-full bg-[#1b1b1e] border border-zinc-700/80 rounded text-[11px] p-2 text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Auto Download Switch */}
            <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                Auto Unduh Saat Selesai
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={(e) => setAutoDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Pro Vector Tuning Accordion */}
        <div className="border border-zinc-800/80 bg-[#141416] rounded-lg overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full bg-zinc-800/30 px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
          >
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-3 h-3 text-zinc-400" />
              <span>Advanced Vector Tuning</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="p-3 flex flex-col gap-3 bg-[#111113]">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Curve Smoothness (Toleransi)</span>
                  <span className="font-mono text-blue-400">{curveSmoothness.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={curveSmoothness}
                  onChange={(e) => setCurveSmoothness(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-zinc-700 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Anti-Alias Blur (Pre-filter)</span>
                  <span className="font-mono text-blue-400">{blurRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-zinc-700 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Max Color Palette</span>
                  <span className="font-mono text-blue-400">{numberOfColors} warna</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="128"
                  step="2"
                  value={numberOfColors}
                  onChange={(e) => setNumberOfColors(parseInt(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-zinc-700 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
