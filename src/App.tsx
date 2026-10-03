import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { CenterViewport } from './components/CenterViewport';
import { RightPanel } from './components/RightPanel';
import {
  AspectRatio,
  VectorStyleId,
  OutputFormat,
  UpscaleFactor,
  TrendEvent,
  VectorMetadata,
  TerminalLog,
  BatchItem,
} from './types/vector';
import {
  processAndTrace,
  convertSvgToEps,
  scaleVectorContent,
  svgToRasterDataUrl,
  downloadFile,
  createBatchZip,
} from './utils/tracer';

const MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ags',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const FULL_MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function App() {
  // Config state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [vectorStyle, setVectorStyle] = useState<VectorStyleId>('auto');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('svg');
  const [upscaleFactor, setUpscaleFactor] = useState<UpscaleFactor>(4);
  const [customPrefix, setCustomPrefix] = useState<string>('FIZA');
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  // Advanced tracing parameters
  const [blurRadius, setBlurRadius] = useState<number>(1);
  const [curveSmoothness, setCurveSmoothness] = useState<number>(4.0);
  const [numberOfColors, setNumberOfColors] = useState<number>(96);

  // Prompter & TrendHub state
  const [promptText, setPromptText] = useState<string>(
    'Set elemen semak-semak hijau (Bushes)'
  );
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(new Date().getMonth());
  const [trendEvents, setTrendEvents] = useState<TrendEvent[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(false);
  const [isExtractingPrompts, setIsExtractingPrompts] = useState<boolean>(false);

  // Viewport / Active item state
  const [originalRaster, setOriginalRaster] = useState<string | undefined>(undefined);
  const [svgString, setSvgString] = useState<string | undefined>(undefined);
  const [pngDataUrl, setPngDataUrl] = useState<string | undefined>(undefined);
  const [epsString, setEpsString] = useState<string | undefined>(undefined);
  const [currentDimensions, setCurrentDimensions] = useState<
    { width: number; height: number } | undefined
  >(undefined);
  const [activeMetadata, setActiveMetadata] = useState<VectorMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Execution & Progress state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [loadingStageTitle, setLoadingStageTitle] = useState<string>('');
  const [loadingStageSubtitle, setLoadingStageSubtitle] = useState<string>('');
  const [serverConnected, setServerConnected] = useState<boolean>(true);

  // Batch queue & Logs
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'sys',
      message: 'Vector Tracer Engine & 16MP Upscaler siap...',
    },
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (message: string, type: TerminalLog['type'] = 'sys') => {
    const newLog: TerminalLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Check backend health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerConnected(Boolean(data.hasKey));
        addLog(`Terhubung ke backend AI Studio (${data.engine})`, 'ok');
      })
      .catch(() => {
        setServerConnected(false);
        addLog('Peringatan: Gagal menghubungi server proxy.', 'wrn');
      });

    // Auto-fetch initial trend events for current month
    fetchTrendEvents(activeMonthIdx);
  }, []);

  // Keyboard shortcut Ctrl+Enter to trigger generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing) {
          handleGenerate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, promptText, aspectRatio, vectorStyle, outputFormat, upscaleFactor, customPrefix]);

  const fetchTrendEvents = async (monthIndex: number) => {
    setActiveMonthIdx(monthIndex);
    const monthName = FULL_MONTH_NAMES_ID[monthIndex];
    setIsLoadingTrends(true);
    addLog(`TrendHub: Melacak topik desain Vector untuk bulan ${monthName}...`, 'net');

    try {
      const res = await fetch('/api/trend-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthName }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      setTrendEvents(data.events || []);
      addLog(`TrendHub: Berhasil memuat ${data.events?.length || 0} tema untuk ${monthName}.`, 'ok');
    } catch (err: any) {
      addLog(`TrendHub Error: ${err.message}`, 'err');
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleExtractPromptsForEvent = async (event: TrendEvent) => {
    setIsExtractingPrompts(true);
    addLog(`Menyusun 5 ide Vector untuk tema '${event.eventName}'...`, 'net');

    try {
      const res = await fetch('/api/extract-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: event.eventName }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      const prompts: string[] = data.prompts || [];

      if (prompts.length > 0) {
        const textToAppend = prompts.join('\n');
        setPromptText((prev) => (prev.trim() ? `${prev}\n${textToAppend}` : textToAppend));
        addLog(`5 Ide Vector ditambahkan ke antrean batch untuk '${event.eventName}'.`, 'ok');
      }
    } catch (err: any) {
      addLog(`Gagal ekstraksi prompt: ${err.message}`, 'err');
    } finally {
      setIsExtractingPrompts(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      addLog('Menghentikan proses batch vector...', 'wrn');
      abortControllerRef.current.abort();
    }
  };

  const enhancePromptForStyle = (rawPrompt: string, style: VectorStyleId): string => {
    const baseVectorRules =
      ', High Definition, ultra-crisp anti-aliased edges, lossless PNG quality, vector flat design style, pure absolute white background #FFFFFF, golden ratio composition, precise geometric curves, exact symmetry, perfect geometric shapes, super ultra smooth edges, no shading, no artifacts, no pixelation, isolated.';

    switch (style) {
      case 'auto':
        return `${rawPrompt}${baseVectorRules} high quality flat color vector illustration.`;
      case 'silhouette':
        return `${rawPrompt}, solid absolute pure black shape${baseVectorRules} minimal vector logo style, flat 2d graphic, no gradients.`;
      case 'lineart':
        return `${rawPrompt}, minimalist monoline line art vector, bold black continuous outlines only, uncolored, coloring book style${baseVectorRules} no gradients.`;
      case 'duotone':
        return `${rawPrompt}, modern duotone vector illustration, using only two contrasting vibrant colors, flat design${baseVectorRules} clean distinct color blocks.`;
      case 'corporate':
        return `${rawPrompt}, corporate memphis style vector illustration, modern tech startup style, vibrant flat colors, abstract geometric shapes${baseVectorRules}`;
      case 'kawaii':
        return `${rawPrompt}, kawaii cute vector sticker style, adorable, thick clean outlines, pastel flat colors${baseVectorRules}`;
      case 'isometric':
        return `${rawPrompt}, flat 2D isometric vector illustration, orthographic projection, clean 3D geometric shapes${baseVectorRules}`;
      case 'retro':
        return `${rawPrompt}, retro 1970s vintage vector illustration, muted vintage color palette, flat colors${baseVectorRules}`;
      case 'lowpoly':
        return `${rawPrompt}, low poly geometric vector illustration, composed of sharp flat colored triangles, polygon art${baseVectorRules}`;
      case 'popart':
        return `${rawPrompt}, pop art comic style vector, bold thick black outlines, bright vivid primary colors, halftone dots${baseVectorRules}`;
      case 'flatcolor':
      default:
        return `${rawPrompt}, 2D flat color vector illustration, clean distinct color blocks${baseVectorRules} no gradients.`;
    }
  };

  const handleGenerate = async () => {
    const prompts = promptText
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (prompts.length === 0) {
      addLog('Prompt kosong. Silakan masukkan deskripsi elemen.', 'err');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setLoadingStageTitle(`Menyiapkan ${prompts.length} Antrean Vector...`);
    setLoadingStageSubtitle('Menghubungkan ke Gemini AI Engine...');

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    addLog(`Memulai Proses Vektorisasi: ${prompts.length} Antrean Batch...`, 'sys');

    const newBatchItems: BatchItem[] = prompts.map((p) => ({
      id: Math.random().toString(36).substring(2, 9),
      prompt: p,
      status: 'pending',
      progress: 0,
    }));
    setBatchItems(newBatchItems);

    let completedSuccess = 0;
    const prefix = customPrefix.trim() || 'FIZA';

    try {
      for (let i = 0; i < prompts.length; i++) {
        if (signal.aborted) break;

        const currentPrompt = prompts[i];
        const enhancedPrompt = enhancePromptForStyle(currentPrompt, vectorStyle);
        const queueTitle = `(${i + 1}/${prompts.length})`;

        addLog(`Tahap 1: Sintesis Raster HD ${queueTitle} untuk '${currentPrompt}'...`, 'net');
        setLoadingStageTitle(`Generating Raster HD ${queueTitle}`);
        setLoadingStageSubtitle('Menghasilkan base visual melalui Gemini AI...');
        setProgressPercent(20);

        // Update batch item status
        setBatchItems((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: 'generating', progress: 20 } : item))
        );

        // Call server to generate image or direct vector
        const imgResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            aspectRatio,
            style: vectorStyle,
          }),
          signal,
        });

        if (!imgResponse.ok) {
          const errData = await imgResponse.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${imgResponse.status}`);
        }

        const imgData = await imgResponse.json();
        const base64Image = imgData.imageBase64;
        const directSvg = imgData.directSvg;

        if (!base64Image && !directSvg) {
          throw new Error('Tidak ada data visual yang diterima dari AI.');
        }

        const safePrompt = currentPrompt
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .substring(0, 20) || 'asset';
        const timestamp = Date.now();
        const extension = outputFormat === 'eps' ? 'eps' : outputFormat === 'png' ? 'png' : 'svg';
        const filename = `${prefix}_${safePrompt}_${upscaleFactor}x_${timestamp}.${extension}`;

        let finalSvgString: string | undefined = undefined;
        let finalPngDataUrl: string | undefined = undefined;
        let finalEpsString: string | undefined = undefined;
        let finalDimensions: { width: number; height: number } = { width: 4000, height: 4000 };

        if (directSvg) {
          // Path A: Direct Omni Vector Synthesizer (Zero Quota / High-Precision Vector)
          addLog(`Tahap 2: Omni Vector AI berhasil merancang kurva SVG presisi.`, 'ok');
          setLoadingStageTitle(`Upscaling Vector ${queueTitle}`);
          setLoadingStageSubtitle('Menghitung resolusi Microstock & raster preview...');
          setProgressPercent(60);

          // Generate raster preview for left card
          const rasterPreview = await svgToRasterDataUrl(directSvg, 1000, 1000);
          setOriginalRaster(rasterPreview);

          // Scale SVG to requested upscale factor
          const scaled = scaleVectorContent(directSvg, 1000, 1000, upscaleFactor);
          finalDimensions = { width: scaled.w, height: scaled.h };

          if (outputFormat === 'png') {
            finalPngDataUrl = await svgToRasterDataUrl(scaled.svg, scaled.w, scaled.h);
            setPngDataUrl(finalPngDataUrl);
            setSvgString(undefined);
            setEpsString(undefined);
          } else {
            finalSvgString = scaled.svg;
            finalEpsString = convertSvgToEps(scaled.svg, scaled.w, scaled.h);
            setSvgString(finalSvgString);
            setEpsString(finalEpsString);
            setPngDataUrl(undefined);
          }

          setCurrentDimensions(finalDimensions);
        } else if (base64Image) {
          // Path B: Raster AI + ImageTracer
          setOriginalRaster(base64Image);
          addLog(`Tahap 2: Raster HD siap. Memulai Deep Scanning & Tracing Vector...`, 'ok');
          setLoadingStageTitle(`Tracing Vector Curves ${queueTitle}`);
          setProgressPercent(40);

          setBatchItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'tracing', progress: 40, originalRaster: base64Image } : item
            )
          );

          // Vector tracing through ImageTracer on client
          const traceResult = await processAndTrace(base64Image, {
            style: vectorStyle,
            outputFormat,
            upscaleFactor,
            abortSignal: signal,
            blurRadius,
            curveSmoothness,
            numberOfColors,
            onProgress: (pct, msg) => {
              setProgressPercent(40 + Math.round(pct * 0.45));
              setLoadingStageSubtitle(msg);
            },
          });

          finalDimensions = { width: traceResult.width, height: traceResult.height };
          if (traceResult.isPng && traceResult.pngDataUrl) {
            finalPngDataUrl = traceResult.pngDataUrl;
            setPngDataUrl(finalPngDataUrl);
            setSvgString(undefined);
            setEpsString(undefined);
          } else {
            finalSvgString = traceResult.svgString;
            finalEpsString = traceResult.epsString;
            setSvgString(finalSvgString);
            setEpsString(finalEpsString);
            setPngDataUrl(undefined);
          }

          setCurrentDimensions(finalDimensions);
        }

        // Auto metadata generation
        setIsLoadingMetadata(true);
        addLog(`Tahap 4: Menyusun Metadata SEO & Kategori Adobe Stock...`, 'net');

        let metadataResult: VectorMetadata | null = null;
        try {
          const metaRes = await fetch('/api/generate-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: currentPrompt, style: vectorStyle }),
            signal,
          });

          if (metaRes.ok) {
            metadataResult = await metaRes.json();
            setActiveMetadata(metadataResult);
            addLog(
              `Metadata SEO terbuat (Kategori #${metadataResult?.categoryId}: ${metadataResult?.categoryName})`,
              'ok'
            );
          }
        } catch (err: any) {
          addLog(`Gagal generate metadata: ${err.message}`, 'wrn');
        } finally {
          setIsLoadingMetadata(false);
        }

        // Update item in batch list
        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'done',
                  progress: 100,
                  svgString: finalSvgString,
                  pngDataUrl: finalPngDataUrl,
                  epsString: finalEpsString,
                  metadata: metadataResult || undefined,
                  dimensions: finalDimensions,
                  filename,
                }
              : item
          )
        );

        // Auto download if toggle is on
        if (autoDownload) {
          if (outputFormat === 'png' && finalPngDataUrl) {
            downloadFile(finalPngDataUrl, filename, 'image/png');
            addLog(`Auto-Unduh PNG: ${filename}`, 'ok');
          } else if (outputFormat === 'eps' && finalEpsString) {
            downloadFile(finalEpsString, filename, 'application/postscript');
            addLog(`Auto-Unduh EPS: ${filename}`, 'ok');
          } else if (finalSvgString) {
            downloadFile(finalSvgString, filename, 'image/svg+xml;charset=utf-8');
            addLog(`Auto-Unduh SVG: ${filename}`, 'ok');
          }
        }

        completedSuccess++;

        if (i < prompts.length - 1 && !signal.aborted) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Dibatalkan pengguna') {
        addLog('Proses dihentikan oleh pengguna.', 'wrn');
      } else {
        addLog(`Engine Error: ${err.message}`, 'err');
      }
    } finally {
      setIsProcessing(false);
      setProgressPercent(100);
      abortControllerRef.current = null;

      addLog(`===========================================`, 'sys');
      addLog(`[SELESAI] Total ${completedSuccess} file vector berhasil diproduksi.`, 'ok');
    }
  };

  const handleDownloadCurrent = (formatOverride?: 'svg' | 'png' | 'eps') => {
    const fmt = formatOverride || outputFormat;
    const prefix = customPrefix.trim() || 'FIZA';
    const timestamp = Date.now();
    const safePrompt = (promptText.split('\n')[0] || 'asset')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 20);

    if (fmt === 'png' && pngDataUrl) {
      const filename = `${prefix}_${safePrompt}_${timestamp}.png`;
      downloadFile(pngDataUrl, filename, 'image/png');
      addLog(`Berhasil mengunduh PNG: ${filename}`, 'ok');
    } else if (fmt === 'eps') {
      const filename = `${prefix}_${safePrompt}_${timestamp}.eps`;
      const content =
        epsString ||
        (svgString && currentDimensions
          ? convertSvgToEps(svgString, currentDimensions.width, currentDimensions.height)
          : null);
      if (content) {
        downloadFile(content, filename, 'application/postscript');
        addLog(`Berhasil mengunduh EPS 3.0: ${filename}`, 'ok');
      }
    } else if (svgString) {
      const filename = `${prefix}_${safePrompt}_${timestamp}.svg`;
      downloadFile(svgString, filename, 'image/svg+xml;charset=utf-8');
      addLog(`Berhasil mengunduh SVG 16MP: ${filename}`, 'ok');
    }
  };

  const handleDownloadCsv = () => {
    const csvHeader = 'Filename,Title,Keywords,Category,Releases\n';
    const csvLines = batchItems
      .filter((b) => b.status === 'done' && b.metadata)
      .map((b) => {
        const title = (b.metadata?.title || '').replace(/"/g, '""');
        const keywords = (b.metadata?.keywords || '').replace(/"/g, '""');
        const catId = b.metadata?.categoryId || 8;
        return `"${b.filename}","${title}","${keywords}",${catId},""`;
      });

    if (csvLines.length === 0) {
      addLog('Belum ada metadata batch yang selesai untuk diekspor ke CSV.', 'wrn');
      return;
    }

    const csvContent = csvHeader + csvLines.join('\n');
    downloadFile(
      csvContent,
      `${customPrefix || 'FIZA'}_Adobe_Stock_Metadata_${Date.now()}.csv`,
      'text/csv;charset=utf-8'
    );
    addLog(`Berhasil mengunduh CSV metadata untuk Adobe Stock & Shutterstock!`, 'ok');
  };

  const handleDownloadBatchZip = async () => {
    const completed = batchItems.filter((b) => b.status === 'done');
    if (completed.length === 0) {
      addLog('Tidak ada file batch yang selesai untuk di-zip.', 'wrn');
      return;
    }

    addLog('Mengompresi semua file SVG, PNG, EPS & CSV ke dalam ZIP...', 'sys');

    const csvHeader = 'Filename,Title,Keywords,Category,Releases\n';
    const csvLines = completed
      .filter((b) => b.metadata)
      .map((b) => {
        const title = (b.metadata?.title || '').replace(/"/g, '""');
        const keywords = (b.metadata?.keywords || '').replace(/"/g, '""');
        const catId = b.metadata?.categoryId || 8;
        return `"${b.filename}","${title}","${keywords}",${catId},""`;
      });
    const csvContent = csvHeader + csvLines.join('\n');

    const zipBlob = await createBatchZip(
      completed.map((c) => ({
        filename: c.filename || `asset_${c.id}`,
        svgString: c.svgString,
        pngDataUrl: c.pngDataUrl,
        epsString: c.epsString,
        metadata: c.metadata,
      })),
      csvContent,
      `${customPrefix || 'FIZA'}_Microstock_Batch_${Date.now()}.zip`
    );

    downloadFile(
      zipBlob,
      `${customPrefix || 'FIZA'}_Microstock_Batch_${Date.now()}.zip`,
      'application/zip'
    );
    addLog(`Berhasil mengunduh seluruh batch (.zip)!`, 'ok');
  };

  return (
    <div className="bg-black text-white h-screen w-full flex items-center justify-center font-sans overflow-hidden selection:bg-blue-600 selection:text-white lg:p-3">
      {/* App Window Wrapper */}
      <div className="w-full h-full max-w-[1920px] max-h-[1080px] bg-[#08080a] border border-zinc-800 lg:rounded-xl flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] relative">
        <Header serverConnected={serverConnected} isProcessing={isProcessing} />

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <LeftPanel
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            vectorStyle={vectorStyle}
            setVectorStyle={setVectorStyle}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
            upscaleFactor={upscaleFactor}
            setUpscaleFactor={setUpscaleFactor}
            customPrefix={customPrefix}
            setCustomPrefix={setCustomPrefix}
            autoDownload={autoDownload}
            setAutoDownload={setAutoDownload}
            blurRadius={blurRadius}
            setBlurRadius={setBlurRadius}
            curveSmoothness={curveSmoothness}
            setCurveSmoothness={setCurveSmoothness}
            numberOfColors={numberOfColors}
            setNumberOfColors={setNumberOfColors}
          />

          <CenterViewport
            originalRaster={originalRaster}
            svgString={svgString}
            pngDataUrl={pngDataUrl}
            dimensions={currentDimensions}
            isProcessing={isProcessing}
            progressPercent={progressPercent}
            loadingStageTitle={loadingStageTitle}
            loadingStageSubtitle={loadingStageSubtitle}
            logs={logs}
            onClearLogs={() => setLogs([])}
            onDownloadCurrent={handleDownloadCurrent}
            outputFormat={outputFormat}
          />

          <RightPanel
            promptText={promptText}
            setPromptText={setPromptText}
            onGenerate={handleGenerate}
            onStop={handleStop}
            isProcessing={isProcessing}
            months={MONTH_NAMES_ID}
            activeMonthIdx={activeMonthIdx}
            onSelectMonth={fetchTrendEvents}
            trendEvents={trendEvents}
            isLoadingTrends={isLoadingTrends}
            onExtractPromptsForEvent={handleExtractPromptsForEvent}
            isExtractingPrompts={isExtractingPrompts}
            metadata={activeMetadata}
            isLoadingMetadata={isLoadingMetadata}
            batchItems={batchItems}
            onDownloadBatchZip={handleDownloadBatchZip}
            onDownloadCsv={handleDownloadCsv}
          />
        </main>
      </div>
    </div>
  );
}
