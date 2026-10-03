export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type VectorStyleId =
  | 'auto'
  | 'silhouette'
  | 'flatcolor'
  | 'lineart'
  | 'duotone'
  | 'corporate'
  | 'kawaii'
  | 'isometric'
  | 'retro'
  | 'lowpoly'
  | 'popart';

export interface VectorStyleOption {
  id: VectorStyleId;
  label: string;
  description: string;
  isMonochrome?: boolean;
}

export type OutputFormat = 'svg' | 'png' | 'eps';

export type UpscaleFactor = 1 | 4 | 6 | 8; // 1: Base, 4: ~16 MP, 6: ~36 MP, 8: ~64 MP

export interface TrendEvent {
  date: string;
  eventName: string;
  category?: string;
  commercialValue?: string;
}

export interface VectorMetadata {
  title: string;
  keywords: string;
  categoryId: number;
  categoryName?: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'sys' | 'ok' | 'err' | 'net' | 'prc' | 'wrn';
  message: string;
}

export interface BatchItem {
  id: string;
  prompt: string;
  status: 'pending' | 'generating' | 'tracing' | 'done' | 'error';
  progress: number;
  originalRaster?: string; // base64 / dataUrl
  svgString?: string;
  pngDataUrl?: string;
  epsString?: string;
  metadata?: VectorMetadata;
  dimensions?: { width: number; height: number };
  filename?: string;
  error?: string;
}
