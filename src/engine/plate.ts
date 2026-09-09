import { LEVEL_BANDS, type EngineResult } from "./types";

/**
 * Exact rosy `getTypewriterHeaderLines` block:
 *   [blank, title, blank, L1–L5, blank, DATE\\SPACE - ENG - SYM - INK]
 * infoRow = 9
 */

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
  const fullTitle = `${left}  ${mid}  ${right}`;
  const medTitle = `${left}  -  DGLXSS  -  ${right}`;
  const compTitle = `${left}  -  DGLXSS  -  #${seed}`;

  if (width >= fullTitle.length) {
    const totalSidesWidth = width - mid.length;
    const targetLeftWidth = Math.floor(totalSidesWidth / 2);
    const targetRightWidth = totalSidesWidth - targetLeftWidth;
    const space1 = targetLeftWidth - left.length;
    const space2 = targetRightWidth - right.length;
    if (space1 >= 0 && space2 >= 0) {
      return left + " ".repeat(space1) + mid + " ".repeat(space2) + right;
    }
    return fullTitle;
  }
  if (width >= medTitle.length) return medTitle;
  return compTitle.slice(0, width);
}

function levelLine(band: (typeof LEVEL_BANDS)[number], width: number): string {
  let line = `LEVEL ${band.level}    GLYPH: ${band.glyph}    DENSITY: ${band.density}`;
  if (width < 46) {
    line = `LEVEL ${band.level}  GLYPH: ${band.glyph}  DENSITY: ${band.density}`;
  }
  if (width < 38) {
    line = `L${band.level}  GLYPH: ${band.glyph}  DEN: ${band.density.replace(/ /g, "")}`;
  }
  return line.slice(0, width);
}

function infoLine(result: EngineResult, width: number): string {
  const p1 = `DATE: ${utcStamp()} \\\\ SPACE: CARTESIAN`;
  let p2 = `ENGINE: ${result.engineId}`;
  let p3 = "SYMMETRY: NONE";
  const p4 = "INK: RIBBON";
  const fullLen = p1.length + p2.length + p3.length + p4.length + 9;
  if (width < fullLen) {
    p2 = `ENG: ${result.engineId}`;
    p3 = "SYM: NONE";
  }

  const totalPartsLen = p1.length + p2.length + p3.length + p4.length;
  const minSpacersLen = 9;
  const neededSpacesInfo = width - totalPartsLen;

  if (neededSpacesInfo >= minSpacersLen) {
    const remainingSpaces = neededSpacesInfo - 3;
    const space1 = Math.floor(remainingSpaces / 6);
    const extra = remainingSpaces - space1 * 6;
    const padL1 = " ".repeat(space1 + (extra > 0 ? 1 : 0));
    const padR1 = " ".repeat(space1 + (extra > 1 ? 1 : 0));
    const padL2 = " ".repeat(space1 + (extra > 2 ? 1 : 0));
    const padR2 = " ".repeat(space1 + (extra > 3 ? 1 : 0));
    const padL3 = " ".repeat(space1 + (extra > 4 ? 1 : 0));
    const padR3 = " ".repeat(space1);
    return p1 + padL1 + "-" + padR1 + p2 + padL2 + "-" + padR2 + p3 + padL3 + "-" + padR3 + p4;
  }

  return `${p1} - ${p2} - ${p3} - ${p4}`.slice(0, width);
}

/** Exact rosy telemetry block. Do not replace with UI captions. */
export function plateHeaderLines(result: EngineResult): string[] {
  const w = result.cols;
  return [
    "",
    titleLine(result.params.seed, w),
    "",
    ...LEVEL_BANDS.map((band) => levelLine(band, w)),
    "",
    infoLine(result, w),
  ];
}

export function headerRowCount(result: EngineResult): number {
  return plateHeaderLines(result).length;
}

export function assertRosyPlateHeader(lines: string[]): void {
  if (lines.length !== 10) {
    throw new Error(`rosy header must be 10 lines, got ${lines.length}`);
  }
  if (lines[0] !== "" || lines[2] !== "" || lines[8] !== "") {
    throw new Error("rosy header blanks are rows 0, 2, 8");
  }
  if (!lines[1].includes("PLATEN") || !lines[1].includes("DGLXSS") || !lines[1].includes("SEED #")) {
    throw new Error(`title line must be PLATEN / BY DGLXSS / SEED #: ${lines[1]}`);
  }
  for (let i = 0; i < 5; i++) {
    const line = lines[3 + i];
    if (!line.includes(`LEVEL ${i + 1}`) || !line.includes("GLYPH:") || !line.includes("DENSITY:")) {
      throw new Error(`level line ${i + 1} invalid: ${line}`);
    }
  }
  const info = lines[9];
  for (const token of ["DATE:", "SPACE:", "ENG", "SYM", "INK:"]) {
    if (!info.includes(token)) {
      throw new Error(`info line missing ${token}: ${info}`);
    }
  }
}
