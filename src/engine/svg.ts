import { headerRowCount, plateHeaderLines } from "./plate";
import { SM3, type EngineResult } from "./types";

/** Rosy black canvas — no gradient cards. */
const PAPER = "#0a0a0a";
const INK = "#e8e4dc";

/** 72 user units per inch so font-size="11" is a true 11pt strike. */
const U = 72;

function pageSize(result: EngineResult) {
  const pad = 0.32 * U;
  const rows = result.rows + headerRowCount(result);
  const width = result.cols * SM3.cellIn * U + pad * 2;
  const height = rows * SM3.lineIn * U + pad * 2;
  return { pad, width, height, widthIn: width / U, heightIn: height / U, rows };
}

function cellText(cx: number, cy: number, ch: string, pad: number, seed: number, drift: boolean): string {
  const x = pad + cx * SM3.cellIn * U + (SM3.cellIn * U) / 2;
  const y = pad + cy * SM3.lineIn * U + SM3.lineIn * U * 0.72;
  const dx = drift ? ((cx * 17 + cy * 9 + seed) % 7) * 0.12 - 0.36 : 0;
  return `<text x="${(x + dx).toFixed(2)}" y="${y.toFixed(2)}">${escapeXml(ch)}</text>`;
}

function marks(result: EngineResult, pad: number): string {
  const header = plateHeaderLines(result);
  const offset = headerRowCount(result);
  const head = header.flatMap((line, cy) =>
    [...fitRow(line, result.cols)].flatMap((ch, cx) =>
      ch === " " ? [] : [cellText(cx, cy, ch, pad, result.params.seed, false)],
    ),
  );
  const field = result.cells.map((c) =>
    cellText(c.cx, c.cy + offset, c.glyph, pad, result.params.seed, true),
  );
  return [...head, ...field].join("");
}

function fitRow(line: string, cols: number): string {
  return line.length >= cols ? line.slice(0, cols) : line.padEnd(cols, " ");
}

export function resultToSvg(
  result: EngineResult,
  opts?: { paper?: string; ink?: string; declaration?: boolean },
): string {
  const paper = opts?.paper ?? PAPER;
  const ink = opts?.ink ?? INK;
  const { pad, width, height, widthIn, heightIn } = pageSize(result);
  const opacity = 0.55 + result.params.ink * 0.45;

  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthIn.toFixed(3)}in" height="${heightIn.toFixed(3)}in" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}" role="img" aria-label="Platen plate">
  <rect width="100%" height="100%" fill="${paper}"/>
  <g fill="${ink}" fill-opacity="${opacity.toFixed(3)}" font-family="Courier New, Courier, monospace" font-size="11" text-anchor="middle">
    ${marks(result, pad)}
  </g>
</svg>`;

  if (opts?.declaration === false) return body;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

export function resultToPreviewSvg(result: EngineResult): string {
  return resultToSvg(result, { declaration: false });
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
  const { width, height } = pageSize(result);
  const scale = 2;
  const svg = resultToSvg(result);
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
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });
    downloadBlob(png, filenameFor(result, "png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
