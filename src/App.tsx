import { useCallback, useMemo, useState } from "react";
import {
  clampSeed,
  exportPng,
  exportSvg,
  listEngines,
  randomSeed,
  resultToPreviewSvg,
  runEngine,
  type EngineParams,
  type EngineResult,
  type HistoryEntry,
} from "./engine";
import { Collapsible } from "./ui/Collapsible";

const DEFAULT_PARAMS: EngineParams = {
  seed: 1952,
  density: 0.72,
  scale: 0.48,
  ink: 0.82,
};

function padSeed(n: number): string {
  return String(n).padStart(6, "0");
}

export function App() {
  const engines = useMemo(() => listEngines(), []);
  const [engineId, setEngineId] = useState(engines[0].id);
  const [params, setParams] = useState<EngineParams>(DEFAULT_PARAMS);
  const [seedDraft, setSeedDraft] = useState(String(DEFAULT_PARAMS.seed));
  const [result, setResult] = useState<EngineResult>(() => runEngine(engines[0].id, DEFAULT_PARAMS));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const engine = engines.find((e) => e.id === engineId) ?? engines[0];
  const svg = useMemo(() => resultToPreviewSvg(result), [result]);

  const commit = useCallback(
    (nextEngine: string, nextParams: EngineParams, record: boolean) => {
      const next = runEngine(nextEngine, nextParams);
      setResult(next);
      setParams(nextParams);
      setSeedDraft(String(nextParams.seed));
      if (record) {
        setHistory((prev) => {
          const entry: HistoryEntry = {
            id: `${next.engineId}-${next.params.seed}-${Date.now()}`,
            at: Date.now(),
            result: next,
          };
          return [entry, ...prev].slice(0, 8);
        });
      }
    },
    [],
  );

  const generate = useCallback(
    (mode: "keep" | "fresh") => {
      const seed = mode === "fresh" ? randomSeed() : clampSeed(Number(seedDraft) || params.seed);
      commit(engineId, { ...params, seed }, true);
    },
    [commit, engineId, params, seedDraft],
  );

  const applyHistory = useCallback(
    (entry: HistoryEntry) => {
      setEngineId(entry.result.engineId);
      commit(entry.result.engineId, entry.result.params, false);
    },
    [commit],
  );

  const onSeedBlur = () => {
    const seed = clampSeed(Number(seedDraft) || params.seed);
    setSeedDraft(String(seed));
    setParams((p) => ({ ...p, seed }));
  };

  const onExportSvg = () => {
    setExporting("svg");
    setExportNote(null);
    try {
      exportSvg(result);
      setExportNote("SVG saved.");
    } finally {
      setExporting(null);
    }
  };

  const onExportPng = async () => {
    setExporting("png");
    setExportNote(null);
    try {
      await exportPng(result);
      setExportNote("PNG saved.");
    } catch {
      setExportNote("PNG export failed — try SVG.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="shell">
      <div className="grain" aria-hidden="true" />

      <header className="mast">
        <div className="brand">
          <span className="ribbon" aria-hidden="true" />
          <div>
            <p className="eyebrow">platen-peachy · v0</p>
            <h1>The page still in the machine.</h1>
          </div>
        </div>
        <p className="mast-meta">
          SM3 · {result.cols} × {result.rows} · {engine.name} · seed {padSeed(result.params.seed)}
        </p>
      </header>

      <main className="dash">
        <section className="hero card" aria-label="Artwork">
          <div className="hero-head">
            <span>recto</span>
            <span>scroll the sheet</span>
          </div>
          <div className="hero-frame" tabIndex={0}>
            <div
              className="sheet"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </section>

        <aside className="rail">
          <section className="card generate-card">
            <p className="card-kicker">primary</p>
            <button
              type="button"
              className="generate"
              onClick={() => generate("keep")}
            >
              Generate
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => generate("fresh")}
            >
              New seed, then generate
            </button>
            <p className="hint">
              One action. Not Randomize. Not Regenerate. Press the platen.
            </p>
          </section>

          <div className="stack card">
            <Collapsible title="Essentials" subtitle="seed · params · save" defaultOpen>
              <label className="field">
                <span>Seed</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  value={seedDraft}
                  onChange={(e) => setSeedDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                  onBlur={onSeedBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") generate("keep");
                  }}
                />
              </label>

              <label className="field">
                <span>Engine</span>
                <select
                  value={engineId}
                  onChange={(e) => {
                    setEngineId(e.target.value);
                  }}
                >
                  {engines.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} — {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="engine-blurb">{engine.blurb}</p>

              <label className="field range">
                <span>
                  Density <em>{params.density.toFixed(2)}</em>
                </span>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.01}
                  value={params.density}
                  onChange={(e) => setParams((p) => ({ ...p, density: Number(e.target.value) }))}
                />
              </label>

              <label className="field range">
                <span>
                  Scale <em>{params.scale.toFixed(2)}</em>
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={params.scale}
                  onChange={(e) => setParams((p) => ({ ...p, scale: Number(e.target.value) }))}
                />
              </label>

              <label className="field range">
                <span>
                  Ink <em>{params.ink.toFixed(2)}</em>
                </span>
                <input
                  type="range"
                  min={0.25}
                  max={1}
                  step={0.01}
                  value={params.ink}
                  onChange={(e) => setParams((p) => ({ ...p, ink: Number(e.target.value) }))}
                />
              </label>

              <div className="export-row">
                <button type="button" className="export" onClick={onExportSvg} disabled={!!exporting}>
                  {exporting === "svg" ? "Saving…" : "Save SVG"}
                </button>
                <button type="button" className="export" onClick={() => void onExportPng()} disabled={!!exporting}>
                  {exporting === "png" ? "Saving…" : "Save PNG"}
                </button>
              </div>
              <p className="hint">
                SVG is archival inches (10 CPI / 6 LPI). PNG is a 2× raster.
              </p>
              {exportNote ? <p className="note-ok">{exportNote}</p> : null}
            </Collapsible>

            <Collapsible title="Latest work" subtitle={`${history.length} kept`} defaultOpen={false}>
              {history.length === 0 ? (
                <p className="empty">Nothing struck yet. Generate once and it lands here.</p>
              ) : (
                <ul className="history">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button type="button" onClick={() => applyHistory(entry)}>
                        <span className="hist-engine">{entry.result.engineId}</span>
                        <span className="hist-seed">{padSeed(entry.result.params.seed)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Collapsible>

            <Collapsible title="About peachy" subtitle="vs rosy" defaultOpen={false}>
              <div className="prose">
                <p>
                  <strong>platen-peachy</strong> is the second Platen skin — a single-screen
                  dashboard. Art is the hero. Controls stay tight. Sections fold so a phone
                  does not bury the sheet.
                </p>
                <p>
                  <strong>platen-rosy</strong> is the full cockpit: Randomize, Regenerate,
                  Curate, Gallery, Motus, Stack. Useful, crowded. Peachy answers that pain
                  with one unmistakable Generate.
                </p>
                <p>
                  Live rosy stays at{" "}
                  <a href="https://platen-rosy.vercel.app" target="_blank" rel="noreferrer">
                    platen-rosy.vercel.app
                  </a>
                  . This repo does not touch it.
                </p>
              </div>
            </Collapsible>

            <Collapsible title="Engine" subtitle="placeholder → Platen" defaultOpen={false}>
              <div className="prose">
                <p>
                  The canvas is a seeded typewriter-glyph field. Weights are closed-form;
                  jitter, normalize, floor, and five-band glyph mapping already follow
                  the SM3 pipeline in{" "}
                  <a href="https://github.com/artistdbjohnson/Platen" target="_blank" rel="noreferrer">
                    artistdbjohnson/Platen
                  </a>
                  .
                </p>
                <p>
                  Register a real engine in <code>src/engine/index.ts</code> by wrapping{" "}
                  <code>calcMotifWeight(x, y, w, h, engine, params)</code>. Do not rewrite
                  generate or export.
                </p>
              </div>
            </Collapsible>
          </div>
        </aside>
      </main>

      <footer className="colophon">
        <span>platen-peachy</span>
        <span className="dot" />
        <span>memory / degraded americana</span>
        <span className="dot" />
        <span>, . + x * / # -</span>
      </footer>
    </div>
  );
}
