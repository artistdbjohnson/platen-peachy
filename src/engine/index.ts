/**
 * Engine registry — the plug-in point for artistdbjohnson/Platen.
 *
 * Later:
 *   1. Port or import `calcMotifWeight` from js/platen-engines.js
 *   2. registerEngine({
 *        id: 'VERNA',
 *        name: 'VERNA',
 *        blurb: 'Perlin field at rotated coordinates',
 *        weight: (x, y, w, h, params) =>
 *          calcMotifWeight(x, y, w, h, 'VERNA', toPlatenParams(params)),
 *      })
 *   3. Leave generate() / svg.ts alone — they already match the SM3 pipeline.
 */

import { generate, PREVIEW_GRID } from "./generate";
import { getEngine, PLACEHOLDER_ENGINES, toPlatenParams } from "./placeholder";
import type { EngineParams, PlatenEngine } from "./types";

const registry = new Map<string, PlatenEngine>(
  PLACEHOLDER_ENGINES.map((engine) => [engine.id, engine]),
);

export function listEngines(): PlatenEngine[] {
  return [...registry.values()];
}

export function registerEngine(engine: PlatenEngine): void {
  registry.set(engine.id, engine);
}

export function resolveEngine(id: string): PlatenEngine {
  return registry.get(id) ?? getEngine(id);
}

export function runEngine(engineId: string, params: EngineParams) {
  return generate(resolveEngine(engineId), params, PREVIEW_GRID);
}

export { generate, PREVIEW_GRID, toPlatenParams };
export { PLACEHOLDER_ENGINES, getEngine } from "./placeholder";
export { makePRNG, randomSeed, clampSeed } from "./prng";
export { resultToSvg, resultToPreviewSvg, exportSvg, exportPng, filenameFor } from "./svg";
export type { EngineParams, EngineResult, HistoryEntry, PlatenEngine, Cell, Glyph } from "./types";
export { SM3, GLYPHS, GLYPH_BY_LEVEL } from "./types";
