import { useCallback, useEffect, useMemo, useState } from "react";
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

const CURATED: Array<{ engineId: string; params: EngineParams }> = [
  { engineId: "SEIGH", params: { seed: 1952, density: 0.72, scale: 0.48, ink: 0.82 } },
  { engineId: "LATIC", params: { seed: 715865, density: 0.64, scale: 0.36, ink: 0.88 } },
  { engineId: "ROLLR", params: { seed: 2017, density: 0.7, scale: 0.55, ink: 0.78 } },
];

function padSeed(n: number): string {
  return String(n).padStart(6, "0");
}

function plateLabel(result: EngineResult): string {
  return `${result.engineId} · SEED #${result.params.seed}`;
}

export function App() {
  const engines = useMemo(() => listEngines(), []);
  const curated = useMemo<HistoryEntry[]>(
    () =>
      CURATED.map((item, i) => ({
        id: `curated-${item.engineId}-${item.params.seed}`,
        at: i,
        result: runEngine(item.engineId, item.params),
      })),
    [],
  );

  const [engineId, setEngineId] = useState(engines[0].id);
  const [params, setParams] = useState<EngineParams>(DEFAULT_PARAMS);
  const [seedDraft, setSeedDraft] = useState(String(DEFAULT_PARAMS.seed));
  const [result, setResult] = useState<EngineResult>(() => runEngine(engines[0].id, DEFAULT_PARAMS));
  const [generated, setGenerated] = useState<HistoryEntry[]>([]);
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [openFold, setOpenFold] = useState<string | null>(null);
  const [viewer, setViewer] = useState<EngineResult | null>(null);

  const engine = engines.find((e) => e.id === engineId) ?? engines[0];
  const svg = useMemo(() => resultToPreviewSvg(result), [result]);
  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const out: HistoryEntry[] = [];
    for (const entry of [...generated, ...curated]) {
      const key = `${entry.result.engineId}-${entry.result.params.seed}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entry);
    }
    return out;
  }, [curated, generated]);

  const toggleFold = useCallback((id: string) => {
    setOpenFold((current) => (current === id ? null : id));
  }, []);

  const commit = useCallback((nextEngine: string, nextParams: EngineParams, record: boolean) => {
    const next = runEngine(nextEngine, nextParams);
    setResult(next);
    setParams(nextParams);
    setSeedDraft(String(nextParams.seed));
    if (record) {
      setGenerated((prev) => {
        const entry: HistoryEntry = {
          id: `${next.engineId}-${next.params.seed}-${Date.now()}`,
          at: Date.now(),
          result: next,
        };
        return [entry, ...prev].slice(0, 12);
      });
    }
  }, []);

  const generate = useCallback(
    (mode: "keep" | "fresh") => {
      const seed = mode === "fresh" ? randomSeed() : clampSeed(Number(seedDraft) || params.seed);
      commit(engineId, { ...params, seed }, true);
    },
    [commit, engineId, params, seedDraft],
  );

  const openSheet = useCallback(
    (entry: HistoryEntry) => {
      setEngineId(entry.result.engineId);
      commit(entry.result.engineId, entry.result.params, false);
      setViewer(entry.result);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (viewer) setViewer(null);
      else setOpenFold(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (viewer) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [viewer]);

  return (
    <div className="shell">
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <p className="logo">
          <span className="ribbon" aria-hidden="true" />
          platen-peachy
        </p>
        <nav className="menu" aria-label="Sections">
          <a href="#gallery">Gallery</a>
          <a href="#about">About</a>
        </nav>
        <button
          type="button"
          className="generate"
          onClick={() => {
            setOpenFold(null);
            generate("keep");
          }}
        >
          Generate
        </button>
        <p className="top-meta">
          SM3 · {result.cols}×{result.rows} · {engine.name} · {padSeed(result.params.seed)}
        </p>
      </header>

      <main className="stage">
        <aside className="rail rail-l" aria-label="Parameters">
        <Collapsible
          id="essentials"
          title="Essentials"
          subtitle="seed · params · save"
          open={openFold === "essentials"}
          onToggle={toggleFold}
        >
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
                <select value={engineId} onChange={(e) => setEngineId(e.target.value)}>
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

              <button type="button" className="ghost" onClick={() => generate("fresh")}>
                New seed, then generate
              </button>

              <div className="export-row">
                <button type="button" className="export" onClick={onExportSvg} disabled={!!exporting}>
                  {exporting === "svg" ? "Saving…" : "Save SVG"}
                </button>
                <button type="button" className="export" onClick={() => void onExportPng()} disabled={!!exporting}>
                  {exporting === "png" ? "Saving…" : "Save PNG"}
                </button>
              </div>
              <p className="hint">SVG is archival inches (10 CPI / 6 LPI). PNG is a 2× raster.</p>
              {exportNote ? <p className="note-ok">{exportNote}</p> : null}
        </Collapsible>
        </aside>

        <section className="hero" aria-label="Artwork">
          <div className="sheet page-sheet" dangerouslySetInnerHTML={{ __html: svg }} />
        </section>

        <aside className="rail rail-r" aria-label="Folders">
        <Collapsible
          id="latest"
          title="Latest work"
          subtitle={`${generated.length} kept`}
          open={openFold === "latest"}
          onToggle={toggleFold}
        >
              {generated.length === 0 ? (
                <p className="empty">Nothing struck yet. Generate, then open a sheet from the list.</p>
              ) : (
                <ul className="menu-list">
                  {generated.map((entry) => (
                    <li key={entry.id}>
                      <button type="button" className="menu-link" onClick={() => openSheet(entry)}>
                        {plateLabel(entry.result)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Collapsible>

            <Collapsible
              id="engine"
              title="Engine"
              subtitle="placeholder → Platen"
              open={openFold === "engine"}
              onToggle={toggleFold}
            >
              <div className="prose">
                <p>
                  Seeded typewriter-glyph field. Register a real engine in{" "}
                  <code>src/engine/index.ts</code> by wrapping{" "}
                  <code>calcMotifWeight(x, y, w, h, engine, params)</code>.
                </p>
              </div>
        </Collapsible>
        </aside>
      </main>

      <section className="about-card" id="about">
        <p className="card-kicker">about peachy</p>
        <h2>The page still in the machine.</h2>
        <div className="prose">
          <p>
            <strong>platen-peachy</strong> is one central rosy sheet. Folder tabs sit around it.
            About and the gallery are cards below — full pages, never a clipped grid on the home.
          </p>
          <p>
            <strong>platen-rosy</strong> is the full cockpit. Peachy answers with one Generate. The
            plate itself stays rosy-format.
          </p>
          <p>
            Live rosy stays at{" "}
            <a href="https://platen-rosy.vercel.app" target="_blank" rel="noreferrer">
              platen-rosy.vercel.app
            </a>
            .
          </p>
        </div>
      </section>

      <section className="gallery" id="gallery">
        <header className="gallery-head">
          <h2>Gallery</h2>
          <p>Full pages. Open the sheet — never a cropped tile.</p>
        </header>
        <ul className="gallery-grid">
          {gallery.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="plate-card" onClick={() => openSheet(entry)}>
                <div
                  className="plate-card-sheet page-sheet"
                  dangerouslySetInnerHTML={{ __html: resultToPreviewSvg(entry.result) }}
                />
                <span className="plate-card-meta">{plateLabel(entry.result)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {viewer ? (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={plateLabel(viewer)}>
          <div className="viewer-bar">
            <p>{plateLabel(viewer)}</p>
            <button type="button" className="viewer-close" onClick={() => setViewer(null)}>
              Close
            </button>
          </div>
          <div
            className="viewer-page page-sheet"
            dangerouslySetInnerHTML={{ __html: resultToPreviewSvg(viewer) }}
          />
        </div>
      ) : null}
    </div>
  );
}
