import { LEVEL_BANDS, type EngineResult } from "./types";

/** Blank row between telemetry and the glyph field — rosy sheet. */
export const HEADER_GAP = 1;

function fit(line: string, width: number): string {
  return line.length >= width ? line.slice(0, width) : line.padEnd(width, " ");
}

function utcStamp(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function titleLine(seed: number, width: number): string {
  const left = "PLATEN";
  const mid = "-  BY DGLXSS  -";
  const right = `SEED #${seed}`;
  const full = `${left}  ${mid}  ${right}`;
  const med = `${left}  -  DGLXSS  -  ${right}`;
  const compact = `${left}  -  DGLXSS  -  #${seed}`;

  if (width >= full.length) {
    const totalSides = width - mid.length;
    const leftW = Math.floor(totalSides / 2);
    const rightW = totalSides - leftW;
    const s1 = leftW - left.length;
    const s2 = rightW - right.length;
    if (s1 >= 0 && s2 >= 0) {
      return left + " ".repeat(s1) + mid + " ".repeat(s2) + right;
    }
    return fit(full, width);
  }
  if (width >= med.length) return fit(med, width);
  return fit(compact, width);
}

function levelLine(band: (typeof LEVEL_BANDS)[number], width: number): string {
  const long = `LEVEL ${band.level}    GLYPH: ${band.glyph}    DENSITY: ${band.density}`;
  const mid = `LEVEL ${band.level}  GLYPH: ${band.glyph}  DENSITY: ${band.density}`;
  const short = `L${band.level}  GLYPH: ${band.glyph}  DEN: ${band.density.replace(/ /g, "")}`;
  if (width >= long.length) return fit(long, width);
  if (width >= 46) return fit(long, width);
  if (width >= 38) return fit(mid, width);
  return fit(short, width);
}

function infoLines(result: EngineResult, width: number): string[] {
  const dateSpace = `DATE: ${utcStamp()} \\\\ SPACE: CARTESIAN`;
  const restLong = `ENGINE: ${result.engineId} - SYMMETRY: NONE - INK: RIBBON`;
  const restShort = `ENG: ${result.engineId} - SYM: NONE - INK: RIBBON`;
  const one = `${dateSpace} - ${restShort}`;
  if (width >= one.length) return [fit(one, width)];
  return [fit(dateSpace, width), fit(width >= restLong.length ? restLong : restShort, width)];
}

/** Exact rosy telemetry block. Do not replace with UI captions. */
export function plateHeaderLines(result: EngineResult): string[] {
  const w = result.cols;
  return [
    titleLine(result.params.seed, w),
    ...LEVEL_BANDS.map((band) => levelLine(band, w)),
    ...infoLines(result, w),
  ];
}

export function headerRowCount(result: EngineResult): number {
  return plateHeaderLines(result).length + HEADER_GAP;
}
