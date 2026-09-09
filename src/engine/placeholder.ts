import type { EngineParams, PlatenEngine } from "./types";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function safeMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Placeholder engines — closed-form weights only.
 * Structured as drop-in stand-ins for Platen's forty named patterns.
 * Do not port the full motif catalog here; register real engines later.
 */

/** Concentric wave fans — seigaiha / platen-roller memory. */
export const seigaiha: PlatenEngine = {
  id: "SEIGH",
  name: "Seigaiha",
  blurb: "Overlapping fans. A roller remembering water.",
  weight(x, y, w, h, params) {
    const freq = 0.22 + params.scale * 0.55;
    const tileW = Math.max(8, w / (2.2 + params.scale * 2.4));
    const tileH = Math.max(6, h / (2.6 + params.scale * 1.8));
    const col = Math.floor(x / tileW);
    const ox = safeMod(x, tileW) - tileW * 0.5;
    const oy = safeMod(y + (col % 2) * tileH * 0.45, tileH);
    const d = Math.hypot(ox, oy);
    const wave = Math.sin(d * freq);
    const grain = Math.sin(x * 0.31 + y * 0.17) * 0.08;
    return clamp01((wave + 1) * 0.5 + grain);
  },
};

/** Lattice / moiré — drafting-table interference. */
export const lattice: PlatenEngine = {
  id: "LATIC",
  name: "Lattice",
  blurb: "Two grids slightly out of register. The shop fluorescent.",
  weight(x, y, _w, _h, params) {
    const f1 = 0.16 + params.scale * 0.22;
    const f2 = f1 * 1.12;
    const g1 = Math.sin(x * f1) * Math.sin(y * f1);
    const g2 = Math.sin((x + 7) * f2) * Math.sin((y + 4) * f2);
    const moire = (g1 + g2) * 0.5;
    return clamp01((moire + 1) * 0.5);
  },
};

/** Log spiral — the platen itself, turning. */
export const roller: PlatenEngine = {
  id: "ROLLR",
  name: "Roller",
  blurb: "A log spiral around the cylinder. Ink still wet.",
  weight(x, y, w, h, params) {
    const dx = x - w / 2;
    const dy = y - h / 2;
    const r = Math.max(0.0001, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const turns = 3.2 + params.scale * 3.8;
    const spiral = Math.sin(turns * angle - (2.2 + params.scale) * Math.log(r));
    const ring = Math.sin(r * (0.18 + params.scale * 0.12));
    return clamp01((spiral * 0.72 + ring * 0.28 + 1) * 0.5);
  },
};

export const PLACEHOLDER_ENGINES: PlatenEngine[] = [seigaiha, lattice, roller];

export function getEngine(id: string): PlatenEngine {
  return PLACEHOLDER_ENGINES.find((e) => e.id === id) ?? seigaiha;
}

/** Reserved — map peachy params toward Platen engine param bags later. */
export function toPlatenParams(params: EngineParams): Record<string, number> {
  return {
    seed: params.seed,
    scale: 2 + params.scale * 10,
    freq: 0.04 + params.scale * 0.12,
    amp: 0.6 + params.ink * 0.8,
    cell: 8,
  };
}
