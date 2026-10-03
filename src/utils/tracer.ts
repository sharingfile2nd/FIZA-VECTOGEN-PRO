import JSZip from 'jszip';
import { VectorMetadata } from '../types/vector';

// Declare ImageTracer on window
declare global {
  interface Window {
    ImageTracer?: any;
  }
}

export interface TraceProgressCallback {
  (progressPercent: number, statusMessage: string): void;
}

export interface TraceOptions {
  style: string;
  outputFormat: 'svg' | 'png' | 'eps';
  upscaleFactor: number;
  abortSignal?: AbortSignal;
  onProgress?: TraceProgressCallback;
  blurRadius?: number;
  curveSmoothness?: number;
  numberOfColors?: number;
}

export interface TraceResult {
  isPng: boolean;
  svgString?: string;
  pngDataUrl?: string;
  epsString?: string;
  width: number;
  height: number;
}

/**
 * Enhanced Microstock Vector Tracing Engine (SOP 16MP+ Ready)
 * 1. Super-Sampling
 * 2. Adaptive Background Thresholding & Edge Smoothing
 * 3. Bézier Curve Vectorization via ImageTracer
 * 4. Microstock ViewBox Scaling & Path coordinate multiplication
 */
export async function processAndTrace(
  base64Image: string,
  options: TraceOptions
): Promise<TraceResult> {
  const {
    style,
    outputFormat,
    upscaleFactor = 4,
    abortSignal,
    onProgress = () => {},
    blurRadius: customBlur,
    curveSmoothness: customSmooth,
    numberOfColors: customColors,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        if (abortSignal?.aborted) {
          return reject(new Error('Dibatalkan pengguna'));
        }

        onProgress(15, 'Tahap 1: Super-Sampling & Anti-Aliasing...');

        // Base super sampling factor for crisp edges
        const SUPER_SAMPLE_SCALE = 2; // 2x base upscale before binarization
        let targetW = Math.round(img.width * SUPER_SAMPLE_SCALE);
        let targetH = Math.round(img.height * SUPER_SAMPLE_SCALE);

        // Hardware safety clamp
        const MAX_CANVAS = 4000;
        if (targetW > MAX_CANVAS || targetH > MAX_CANVAS) {
          const ratio = Math.min(MAX_CANVAS / targetW, MAX_CANVAS / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context tidak tersedia');
        }

        const isMonochrome = style === 'silhouette' || style === 'lineart';

        // Apply pre-filter Gaussian blur for smoother vector borders
        const blurAmount = customBlur !== undefined
          ? customBlur
          : (isMonochrome ? 2 : 1);

        ctx.filter = `blur(${blurAmount}px)`;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);
        ctx.filter = 'none';

        if (abortSignal?.aborted) return reject(new Error('Dibatalkan pengguna'));
        onProgress(30, 'Tahap 2: Binarization & Adaptive Edge Cutout...');

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Microstock isolated background removal & binarization
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = (r * 299 + g * 587 + b * 114) / 1000;

          if (isMonochrome) {
            // Silhouette & Lineart: threshold cut to pure black on transparent
            if (luminance > 130) {
              data[i + 3] = 0; // Transparent
            } else {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
              data[i + 3] = 255;
            }
          } else {
            // Colored vectors: remove near-white background halos (#F0F0F0 and above)
            if (r > 238 && g > 238 && b > 238) {
              data[i + 3] = 0; // Cut white background to transparent
            } else {
              data[i + 3] = 255; // Solid opaque colors
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);

        // If user requested PNG output
        if (outputFormat === 'png') {
          onProgress(70, 'Tahap 3: Upscaling PNG Transparan...');
          const scaleMult = Math.max(1, upscaleFactor / 2);
          const upscaledCanvas = document.createElement('canvas');
          upscaledCanvas.width = Math.round(targetW * scaleMult);
          upscaledCanvas.height = Math.round(targetH * scaleMult);
          const upCtx = upscaledCanvas.getContext('2d');
          if (upCtx) {
            upCtx.imageSmoothingEnabled = true;
            upCtx.imageSmoothingQuality = 'high';
            upCtx.drawImage(canvas, 0, 0, upscaledCanvas.width, upscaledCanvas.height);
          }

          onProgress(100, 'Selesai: File PNG siap.');
          resolve({
            isPng: true,
            pngDataUrl: upscaledCanvas.toDataURL('image/png'),
            width: upscaledCanvas.width,
            height: upscaledCanvas.height,
          });
          return;
        }

        // Trace to SVG
        onProgress(50, 'Tahap 3: Tracing Vector Curves (ImageTracer Engine)...');

        const colorCount = customColors !== undefined
          ? customColors
          : (isMonochrome ? 2 : (style === 'duotone' ? 8 : 96));

        const smoothValue = customSmooth !== undefined ? customSmooth : 4.0;

        const tracerOptions: any = {
          corsenabled: false,
          strokewidth: 0,
          roundcoords: 3,
          rightangleenhance: false, // Turn off for ultra smooth organic curves
          colorsampling: 2,
          numberofcolors: colorCount,
          mincolorratio: 0,
          colorquantcycles: 3,
          blurradius: isMonochrome ? 4 : 2,
          blurdelta: 20,
          ltres: smoothValue,
          qtres: smoothValue,
          pathomit: isMonochrome ? 24 : 16,
        };

        if (isMonochrome) {
          tracerOptions.palette = [
            { r: 0, g: 0, b: 0, a: 255 },
            { r: 255, g: 255, b: 255, a: 0 },
          ];
        }

        // Check if window.ImageTracer is ready
        if (!window.ImageTracer || typeof window.ImageTracer.imagedataToSVG !== 'function') {
          // Wait briefly in case script is still loading
          await new Promise((r) => setTimeout(r, 400));
        }

        if (!window.ImageTracer || typeof window.ImageTracer.imagedataToSVG !== 'function') {
          throw new Error('ImageTracer library tidak tersedia di browser. Silakan muat ulang halaman.');
        }

        onProgress(75, 'Tahap 4: Mengkalkulasi Bézier Paths...');
        let rawSvg = window.ImageTracer.imagedataToSVG(imageData, tracerOptions);

        if (!rawSvg) {
          throw new Error('Gagal menghasilkan string SVG dari gambar.');
        }

        onProgress(90, 'Tahap 5: Upscaling ViewBox & Koordinat Artboard...');
        const scaled = scaleVectorContent(rawSvg, targetW, targetH, upscaleFactor);

        let epsString: string | undefined = undefined;
        if (outputFormat === 'eps') {
          epsString = convertSvgToEps(scaled.svg, scaled.w, scaled.h);
        }

        onProgress(100, 'Selesai: Vector berhasil dibuat.');
        resolve({
          isPng: false,
          svgString: scaled.svg,
          epsString,
          width: scaled.w,
          height: scaled.h,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Gagal membaca gambar dari AI.'));
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
  });
}

/**
 * Rescales SVG paths and standardizes viewBox for crisp rendering and responsive fit
 */
export function scaleVectorContent(
  svgString: string,
  origW: number,
  origH: number,
  scale: number
): { svg: string; w: number; h: number } {
  const newW = Math.round(origW * scale);
  const newH = Math.round(origH * scale);

  let scaledSvg = svgString;

  // Ensure standard SVG XML namespace
  if (!scaledSvg.includes('xmlns=')) {
    scaledSvg = scaledSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  }

  // Inject or update viewBox
  if (!scaledSvg.includes('viewBox=')) {
    scaledSvg = scaledSvg.replace('<svg ', `<svg viewBox="0 0 ${newW} ${newH}" `);
  } else {
    scaledSvg = scaledSvg.replace(/viewBox="[^"]*"/, `viewBox="0 0 ${newW} ${newH}"`);
  }

  // Ensure responsive width & height or standard unit
  scaledSvg = scaledSvg
    .replace(/width="[^"]*"/, `width="100%"`)
    .replace(/height="[^"]*"/, `height="100%"`);

  // Scale internal path data if scale !== 1
  if (scale !== 1) {
    scaledSvg = scaledSvg.replace(/d="([^"]*)"/g, (match, dVal) => {
      const scaledD = dVal.replace(/[MLQZCSAHV][^MLQZCSAHV]*/gi, (cmdStr: string) => {
        const type = cmdStr[0];
        if (type.toUpperCase() === 'Z') return 'Z';
        const rawArgs = cmdStr.slice(1).trim().split(/[\s,]+/).filter(Boolean);
        const args = rawArgs.map(parseFloat);
        const scaledArgs = args.map((val: number) => (isNaN(val) ? '0' : (val * scale).toFixed(2)));
        return type + scaledArgs.join(' ');
      });
      return `d="${scaledD}"`;
    });
  }

  return { svg: scaledSvg, w: newW, h: newH };
}

/**
 * Renders an SVG string onto a canvas to generate a high-definition raster data URL
 */
export function svgToRasterDataUrl(
  svgString: string,
  width: number = 1000,
  height: number = 1000
): Promise<string> {
  return new Promise((resolve) => {
    // Ensure clean XML string
    const cleanSvg = svgString.includes('xmlns=')
      ? svgString
      : svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback data URI
      resolve('data:image/svg+xml;utf8,' + encodeURIComponent(cleanSvg));
    };

    img.src = url;
  });
}

/**
 * Encapsulated PostScript (EPS 3.0) Vector Exporter
 * Generates industry-standard EPS vector file for microstock platforms
 */
export function convertSvgToEps(svgString: string, width: number, height: number): string {
  const epsHeader = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${width} ${height}`,
    `%%HiResBoundingBox: 0.00 0.00 ${width}.00 ${height}.00`,
    '%%Creator: FIZAVectogen Microstock Vector Studio',
    '%%Title: Vector Graphic',
    '%%Pages: 1',
    '%%DocumentData: Clean7Bit',
    '%%LanguageLevel: 2',
    '%%EndComments',
    '%%Page: 1 1',
    '/m { moveto } bind def',
    '/l { lineto } bind def',
    '/c { curveto } bind def',
    '/cp { closepath } bind def',
    '/rgb { setrgbcolor } bind def',
    '/f { fill } bind def',
    'gsave',
    // Invert coordinate system to match PostScript bottom-left origin
    `0 ${height} translate`,
    '1 -1 scale',
    '',
  ].join('\n');

  let body = '';

  // Extract path and fill color
  const pathRegex = /<path([^>]+)\/?>/g;
  let match;

  while ((match = pathRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const fillMatch = attrs.match(/fill="([^"]+)"/);
    const dMatch = attrs.match(/d="([^"]+)"/);

    if (dMatch) {
      const d = dMatch[1];
      let r = 0, g = 0, b = 0;

      if (fillMatch) {
        const fill = fillMatch[1].trim();
        if (fill.startsWith('rgb')) {
          const rgbNums = fill.replace(/[^\d,]/g, '').split(',').map(Number);
          r = (rgbNums[0] || 0) / 255;
          g = (rgbNums[1] || 0) / 255;
          b = (rgbNums[2] || 0) / 255;
        } else if (fill.startsWith('#')) {
          const hex = fill.slice(1);
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
          } else if (hex.length >= 6) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
          }
        }
      }

      body += `newpath\n`;
      body += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rgb\n`;

      // Convert SVG Path commands to PostScript commands
      const cmds = d.match(/[MLQZCSAHV][^MLQZCSAHV]*/gi) || [];
      for (const cmdStr of cmds) {
        const type = cmdStr[0].toUpperCase();
        const args = cmdStr.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter((n) => !isNaN(n));

        if (type === 'M' && args.length >= 2) {
          body += `${args[0]} ${args[1]} m\n`;
        } else if (type === 'L' && args.length >= 2) {
          body += `${args[0]} ${args[1]} l\n`;
        } else if (type === 'Q' && args.length >= 4) {
          // Quadratic bezier converted roughly to cubic
          body += `${args[0]} ${args[1]} ${args[2]} ${args[3]} ${args[2]} ${args[3]} c\n`;
        } else if (type === 'C' && args.length >= 6) {
          body += `${args[0]} ${args[1]} ${args[2]} ${args[3]} ${args[4]} ${args[5]} c\n`;
        } else if (type === 'Z') {
          body += `cp\n`;
        }
      }
      body += `f\n\n`;
    }
  }

  const epsFooter = ['grestore', 'showpage', '%%EOF'].join('\n');

  return epsHeader + body + epsFooter;
}

/**
 * Triggers instant browser download of a text or blob asset
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Bundles all batch processed assets into a single clean Microstock Zip archive
 */
export async function createBatchZip(
  items: Array<{
    filename: string;
    svgString?: string;
    pngDataUrl?: string;
    epsString?: string;
    metadata?: VectorMetadata;
  }>,
  csvContent?: string,
  zipName: string = 'FIZA_Microstock_Batch.zip'
): Promise<Blob> {
  const zip = new JSZip();

  const vectorFolder = zip.folder('vectors');
  const pngFolder = zip.folder('rasters_16mp');

  items.forEach((item, index) => {
    const baseName = item.filename.replace(/\.[^/.]+$/, '') || `vector_${index + 1}`;

    if (item.svgString && vectorFolder) {
      vectorFolder.file(`${baseName}.svg`, item.svgString);
    }

    if (item.epsString && vectorFolder) {
      vectorFolder.file(`${baseName}.eps`, item.epsString);
    }

    if (item.pngDataUrl && pngFolder) {
      const base64Data = item.pngDataUrl.split(',')[1];
      if (base64Data) {
        pngFolder.file(`${baseName}.png`, base64Data, { base64: true });
      }
    }
  });

  if (csvContent) {
    zip.file('Adobe_Stock_Metadata.csv', csvContent);
  }

  return await zip.generateAsync({ type: 'blob' });
}
