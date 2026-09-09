import { assertRosyPlateHeader, plateHeaderLines, runEngine } from "./index";

const result = runEngine("SEIGH", { seed: 1952, density: 0.72, scale: 0.48, ink: 0.82 });
const lines = plateHeaderLines(result);
assertRosyPlateHeader(lines);

if (result.cols !== 85) {
  throw new Error(`plate must be 85-col letter so DATE\\SPACE/ENG/SYM/INK stays one line, got ${result.cols}`);
}

if (lines[9].includes("\n") || lines[9].split("DATE:").length !== 2) {
  throw new Error("info must be a single DATE line");
}

console.log(lines.join("\n"));
console.log("rosy plate header ok");
