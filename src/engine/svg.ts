import { SM3, type EngineResult } from "./types";

const PAPER = "#161310";
const INK = "#f0d8bc";
const RULE = "#2c261f";

export function resultToSvg(result: EngineResult, opts?: { paper?: string; ink?: string }): string {
  const paper = opts?.paper ?? PAPER;
  const ink = opts?.ink ?? INK;
  const { cols, rows, cells, params } = result;
  const pad = 0.35;
  const widthIn = cols * SM3.cellIn + pad * 2;
  const heightIn = rows * SM3.lineIn + pad * 2;
  const opacity = 0.45 + params.ink * 0.55;
  const fontPt = 11;

  const marks = cells
    .map((c) => {
      const x = pad + c.cx * SM3.cellIn + SM3.cellIn * 0.5;
      const y = pad + c.cy * SM3.lineIn + SM3.lineIn * 0.72;
      const drift = ((c.cx * 17 + c.cy * 9 + params.seed) % 7) * 0.004 - 0.012;
      return `<text x="${(x + drift).toFixed(4)}" y="${y.toFixed(4)}">${escapeXml(c.glyph)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${widthIn}in" height="${heightIn}in" viewBox="0 0 ${widthIn} ${heightIn}">
  <rect width="100%" height="100%" fill="${paper}"/>
  <rect x="${pad / 2}" y="${pad / 2}" width="${(widthIn - pad).toFixed(4)}" height="${(heightIn - pad).toFixed(4)}" fill="none" stroke="${RULE}" stroke-width="0.01"/>
  <g fill="${ink}" fill-opacity="${opacity.toFixed(3)}" font-family="Courier New, Courier, monospace" font-size="${fontPt}pt" text-anchor="middle">
    ${marks}
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function filenameFor(result: EngineResult, ext: "svg" | "png"): string {
  const { engineId, params } = result;
  return `platen-peachy-${engineId.toLowerCase()}-${params.seed}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportSvg(result: EngineResult): void {
  const svg = resultToSvg(result);
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filenameFor(result, "svg"));
}

export async function exportPng(result: EngineResult): Promise<void> {
  const svg = resultToSvg(result);
  const widthPx = Math.round((result.cols * SM3.cellIn + 0.7) * 150);
  const heightPx = Math.round((result.rows * SM3.lineIn + 0.7) * 150);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("PNG raster failed"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, widthPx, heightPx);
    ctx.drawImage(img, 0, 0, widthPx, heightPx);

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });
    downloadBlob(png, filenameFor(result, "png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
