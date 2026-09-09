/**
 * Platen-compatible engine contract.
 *
 * Real engines from github.com/artistdbjohnson/Platen expose:
 *   calcMotifWeight(x, y, w, h, engine, params) -> number
 *
 * This app keeps that shape. Swap `weight()` for a thin wrapper around
 * calcMotifWeight; `generate()` already does jitter, normalize, floor,
 * and the five-band glyph map used by the SM3 pipeline.
 */

/** Olympia SM3 Pica mechanical specs — inherited exactly. */
export const SM3 = {
  cpi: 10,
  lpi: 6,
  slugWidthIn: 0.082,
  cellIn: 0.1,
  lineIn: 1 / 6,
} as const;

/** Eight natively typeable SM3 glyphs. */
export const GLYPHS = [",", ".", "+", "x", "X", "*", "/", "#", "-"] as const;
export type Glyph = (typeof GLYPHS)[number];

/** Rosy header legend — slash / dot / plus / X / asterisk. */
export const GLYPH_BY_LEVEL: readonly Glyph[] = ["/", ".", "+", "X", "*"];

export const LEVEL_BANDS = [
  { level: 1, glyph: "/", density: "0.20 - 0.36" },
  { level: 2, glyph: ".", density: "0.36 - 0.51" },
  { level: 3, glyph: "+", density: "0.51 - 0.66" },
  { level: 4, glyph: "X", density: "0.66 - 0.81" },
  { level: 5, glyph: "*", density: "0.81 - 1.00" },
] as const;

export type GlyphLevel = 0 | 1 | 2 | 3 | 4;

export interface EngineParams {
  seed: number;
  /** 0–1. Higher keeps more of the field (lower discard floor). */
  density: number;
  /** Pattern frequency. */
  scale: number;
  /** Strike darkness 0–1. */
  ink: number;
}

export interface GridSpec {
  cols: number;
  rows: number;
}

export interface Cell {
  cx: number;
  cy: number;
  wt: number;
  level: GlyphLevel;
  glyph: Glyph;
}

export interface EngineResult {
  engineId: string;
  params: EngineParams;
  cols: number;
  rows: number;
  cells: Cell[];
}

/**
 * Plug-in surface for artistdbjohnson/Platen.
 * Implement `weight` as calcMotifWeight(..., this.id, platenParams).
 */
export interface PlatenEngine {
  id: string;
  name: string;
  blurb: string;
  weight: (
    x: number,
    y: number,
    w: number,
    h: number,
    params: EngineParams,
  ) => number;
}

export interface HistoryEntry {
  id: string;
  at: number;
  result: EngineResult;
}
