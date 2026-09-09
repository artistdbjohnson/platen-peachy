# platen-peachy

Minimal single-screen dashboard for [Platen](https://github.com/artistdbjohnson/Platen) — the second design option beside [platen-rosy](https://platen-rosy.vercel.app).

Artwork is the hero. One unmistakable **Generate**. Tight essentials (seed, engine, density / scale / ink). Save SVG and PNG. Everything else folds away, especially on a phone.

v0 ships a seeded placeholder typewriter-glyph renderer. Real Platen engines plug in later without rewriting the dashboard.

## peachy vs rosy

| | **peachy** (this repo) | **rosy** (do not modify) |
| --- | --- | --- |
| Role | Second skin. Portfolio dashboard. | First skin. Full minting cockpit. |
| Live reference | this app | https://platen-rosy.vercel.app |
| Primary action | **Generate** | Randomize / Regenerate (easy to miss) |
| Controls | Seed + a few params + export | Symmetry, Motif, Motus, Stack, Curate, Gallery, Autocycle… |
| Layout | Hero sheet + collapsible rail. Single column on mobile. | Dense studio console |
| Tone | Dark editorial, warm paper, restrained peach. Memory / degraded Americana. | Existing rosy language |

Rosy is the reference, not the source. This repo does not change rosy.

## Stack

Vite + React + TypeScript.

`vercel.json` is exactly:

```json
{ "cleanUrls": true, "trailingSlash": false }
```

No `public` key.

```bash
npm install
npm run dev
```

Build: `npm run build`. Preview: `npm run preview`.

## Using the dashboard

1. The sheet is the first thing you see. Scroll it — the frame is the viewport, the page is taller/wider.
2. Press **Generate** (desktop rail and sticky on ~390px). Optional: **New seed, then generate**.
3. Tune seed / engine / density / scale / ink. Keep it small on purpose.
4. **Save SVG** (archival inches, 10 CPI / 6 LPI, 0.082" slug) or **Save PNG** (150 dpi preview).
5. **Latest work**, **Essentials**, **About peachy**, and **Engine** are a Hanssen-style link stack. On a phone they start closed so the sheet stays the hero. Desktop opens Essentials.

## Engine scaffold

Olympia SM3 Pica specs are inherited exactly: **10 CPI, 6 LPI, 0.082" type slug** inside a 0.100" cell.

Placeholder engines (`SEIGH`, `LATIC`, `ROLLR`) only return a closed-form **weight** per cell — the same job as Platen’s `calcMotifWeight(x, y, w, h, engine, params)`.

`generate()` then does the real pipeline:

1. raw weight + deterministic jitter per cell (`cx * 37 + cy * 13`)
2. normalize
3. discard the bottom band (density shifts the ~7% floor)
4. five glyph levels: `,` `.` `+` `x` `*` (with occasional `/ # -`)

Plug-in point: [`src/engine/index.ts`](src/engine/index.ts).

```ts
import { registerEngine, toPlatenParams } from "./engine";

registerEngine({
  id: "VERNA",
  name: "VERNA",
  blurb: "Perlin field at rotated coordinates",
  weight: (x, y, w, h, params) =>
    calcMotifWeight(x, y, w, h, "VERNA", toPlatenParams(params)),
});
```

Leave `generate()` and `svg.ts` alone. They already match the SM3 strike → archival SVG path.

## Layout notes

Dark, rounded cards, editorial type (Fraunces + IBM Plex Mono). Soft peach is an accent, not a theme.

Layout follows the public [Hanssen](https://hanssen-template.framer.website/) pattern, not a Framer login: full-height hero sheet, identity card, high-contrast **Generate** (Hanssen’s “Contact Me”), then a link-stack of folds — Latest work, Essentials, About, Engine. Single column under ~860px. On a phone the folds start closed so the sheet stays on screen. The Gemini refresh prototype was stripped to this dashboard — not copied.

Anti-slop: no kitchen-sink panel, no Inter, no purple gradient.

## License

Private worksheet unless the author says otherwise. Platen itself lives at [artistdbjohnson/Platen](https://github.com/artistdbjohnson/Platen).
