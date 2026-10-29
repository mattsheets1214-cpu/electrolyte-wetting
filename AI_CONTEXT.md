# AI_CONTEXT.md — read this before editing

This file tells an AI coding assistant (Claude Code, Copilot, Cursor, …) and any human contributor how this project is built and what must not break. Keep it up to date when the architecture changes.

## What the project is

A static, client-side teaching website for an introductory fluid mechanics course (University of Cincinnati, 2026, author Matthew Sheets): why lithium-ion cells take tens of minutes to wet with electrolyte although one pore fills in milliseconds. Priority order: **correct physics → clear teaching → working interactivity → honest verification/validation → design → easy editing.**

Pages: Overview, Interactive lab, Theory, Code & verification, References. Deployed to GitHub Pages by `.github/workflows/site.yml` after tests pass on `main`. The owner approves every change by pull request. **Never push directly to `main`.**

## Architecture

- Vite 8 + plain ES modules. No UI framework. Hash routing (`#/lab`, `#/theory/lesson-washburn`) so GitHub Pages needs no server config. `vite.config.js` uses `base: './'`.
- `src/main.js` — router; each page is `src/sections/<page>.js` exporting `render(container)` that may return a cleanup function.
- `src/physics/` — **all** equations and numerics, SI units only, no DOM. Import through `src/physics/index.js`.
  - `capillary.js` Young–Laplace, Washburn coefficient, Mode A (closed form) and `integrateModeA` (numerical plumbing check).
  - `deadEnd.js` Mode B (dead-end pore + Boyle gas), solved in `y = (L/L_p)²` and dimensionless time; exact equilibrium and exact implicit trajectory.
  - `ode.js` hand-written Dormand–Prince 5(4) with step rejection on non-finite stages, plus Hermite event location.
  - `validation.js` rejects meaningless inputs (never clamps). `validity.js` dimensionless warnings (inertia, Re, Ca, Bo, θ near 90°, tiny pores, slenderness).
  - `challenge.js` inverse problems with feasibility checks. `sweeps.js` data for Plots 2 and 3.
  - `checks.js` **the verification suite**, run by Vitest *and* live on the Code & verification page.
- `src/data/parameters.js` every lab input: unit, range, default, `basis` (`measured` / `assumption` / `geometry`) and source note. `presets.js` scenarios.
- `src/content/` all editable text: `lessons.js` (9 lessons, required fields enforced by tests), `quiz.js`, `references.js`, `video.js` (YouTube id for the Overview video slot), `modelVsReality.js`.
- `src/charts/plot.js` small SVG plotting module (linear/log axes, legend with line styles, tooltips, keyboard).
- `src/diagrams/index.js` SVG diagrams drawn from geometry. `src/animations/pore.js` physics-linked animation (Anime.js Timer for playback); `motion.js` page/figure motion (Motion). Both degrade gracefully if the library fails and respect `prefers-reduced-motion`.
- `python/wetting/model.py` independent reference implementation (standard library only; RK4 with step doubling). Runs in the browser through Pyodide (loaded on demand from jsDelivr, version pinned in `src/sections/verification.js`) and in pytest.
- Styles: `src/styles/tokens.css` (design tokens) and `site.css`.

## Scientific conventions (do not change silently)

- SI internally; convert only at the UI edge (`toSIParams`, `units.js`).
- Contact angle θ is measured **through the liquid**. θ < 90° wets (p_c > 0), θ = 90° gives p_c = 0 exactly, θ > 90° gives p_c < 0.
- `Δp_a` = liquid-side minus gas-side pressure. Mode B pressures `p_L`, `p_g0`, `p_g` are **absolute**; `p_c` is a pressure jump.
- Cylindrical pore: `p_c = 2σcosθ/r`; slit: `σcosθ/h`.
- Mode A: `L² = r²(p_c+Δp_a)t/(4μ)`; path `L = τX`. Non-positive drive ⇒ `fills: false`, `tTarget: Infinity` — **never a negative time**.
- Mode B: `dy/dt̂ = 1 − β/(1−√y)`, `β = p_g0/(p_L+p_c)`, `T = 4μL_p²/(r²(p_L+p_c))`. Equilibrium `1−β`. Exact trajectory `t̂ = λ² − 2βλ + 2β(1−β)ln[(1−β)/(1−β−λ)]`.
- Liquid-side pressure fixed at 101.3 kPa abs (`P_LIQUID_ABS`). Density 1303 kg/m³ is used only in validity checks.
- Single idealized pore. Results are idealized estimates, **not** predictions for a real cell. Darcy / Kozeny–Carman, electrochemistry, CFD and pore networks are out of scope for v1.

## Honesty rules (hard requirements from the author)

1. Never invent experimental data, references, DOIs, URLs, quotes, transcripts, video ids, AI critiques, test results or personal reflections.
2. Every numerical input must have a source in `src/content/references.js` or be labelled `assumption`.
3. The video id in `src/content/video.js` stays `null` until a real video exists; the Overview then shows an empty, labelled slot. `tests/content.test.js` guards this — update that test deliberately when the real id is added. The AI-lab and Presentation pages were removed at the owner's request (2026-10-29); do not re-add them unless asked.
4. Code shown on the site is cut from the real source using `// #region name` … `// #endregion` markers (see `region()` in `src/sections/verification.js`). If you rename or remove a region, update the page.
5. Plots, outputs and animations must come from the solver. No hard-coded results.
6. Distinguish verification (code solves its equations) from validation (equations describe reality).

## Required workflow for any change

1. Work on a new branch.
2. If you touch `src/physics/`, add or update a test in `src/physics/checks.js` (shown on the site) or `tests/physics.test.js`, and the Python model if the equations change. Regenerate `tests/fixtures/reference_cases.json` with `python python/make_reference_cases.py` if the reference cases change.
3. Run `npm test`, `python -m pytest python/tests -q` and `npm run build`. All must pass.
4. Update `CHANGELOG.md` for significant changes and `docs/` if assumptions or equations change.
5. Open a pull request using the template. The owner reviews and merges; merging deploys.

## Common tasks — where to edit

| Request | Files |
|---|---|
| Rewrite or add a lesson | `src/content/lessons.js` (keep all required fields) |
| Add a quiz question | `src/content/quiz.js` (one correct option, every option explained) |
| Add an electrolyte parameter set | `src/data/presets.js` + reference in `src/content/references.js`; mark `basis` honestly |
| Change an input range/default | `src/data/parameters.js` (tests check default within range) |
| New plot | compute data in `src/physics/sweeps.js` (tested), draw with `createPlot` in a section |
| Improve an animation | `src/animations/pore.js`; keep it driven by solver output and keep reduced-motion behaviour |
| Fix a numerical error | `src/physics/`, plus a regression check in `checks.js` |
| Add the video explanation | `src/content/video.js` |

## Do not

- Add an AI chatbot, API keys, analytics or any backend.
- Store anything the site needs in the visitor's browser (only the theme choice uses `localStorage`).
- Add a second animation or charting library without a strong reason.
- Clamp invalid inputs silently.
