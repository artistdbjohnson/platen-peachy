import { makePRNG } from "./prng";
import { GLYPH_BY_LEVEL, GLYPHS, type Cell, type EngineParams, type EngineResult, type Glyph, type GlyphLevel, type GridSpec, type PlatenEngine } from "./types";

const DEFAULT_GRID: GridSpec = { cols: 39, rows: 51 };

function levelFromWeight(wt: number): GlyphLevel {
  if (wt < 0.36) return 0;
  if (wt < 0.51) return 1;
  if (wt < 0.66) return 2;
  if (wt < 0.81) return 3;
  return 4;
}

/**
 * Same pipeline as Platen's worker:
 * raw weight + deterministic jitter → normalize → discard bottom ~7%
 * (density shifts the floor) → five glyph bands.
 *
 * Alternate SM3 marks (slash, hash, dash) are seed-biased, the way
 * symmetry-aware vocabularies will be when real engines plug in.
 */
export function generate(
  engine: PlatenEngine,
  params: EngineParams,
  grid: GridSpec = DEFAULT_GRID,
): EngineResult {
  const { cols, rows } = grid;
  const raw: number[] = [];
  let wMax = 0;

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const base = engine.weight(cx, cy, cols, rows, params);
      const jitter = base > 0 ? (((cx * 37 + cy * 13 + params.seed) % 100) / 400) : 0;
      const wt = base + jitter;
      raw.push(wt);
      if (wt > wMax) wMax = wt;
    }
  }

  const isFlat = wMax <= 0;
  const wRange = isFlat ? 1 : wMax;
  const floor = 0.07 + (1 - params.density) * 0.22;
  const rng = makePRNG(params.seed);
  const altChance = 0.12;

  const cells: Cell[] = [];
  let i = 0;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const norm = raw[i++] / wRange;
      if (norm <= floor) continue;
      const wt = (norm - floor) / (1 - floor);
      const level = levelFromWeight(wt);
      let glyph: Glyph = GLYPH_BY_LEVEL[level];
      if (rng.rfl() < altChance) {
        glyph = GLYPHS[5 + rng.rin(0, 2)];
      }
      cells.push({ cx, cy, wt, level, glyph });
    }
  }

  return {
    engineId: engine.id,
    params: { ...params },
    cols,
    rows,
    cells,
  };
}

export const PREVIEW_GRID = DEFAULT_GRID;
