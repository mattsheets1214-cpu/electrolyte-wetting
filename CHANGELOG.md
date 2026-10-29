# Changelog

All significant changes. Newest first. Dates are YYYY-MM-DD.

## [1.1.0] — 2026-10-29

### Removed (requested by the owner)
- "AI lab" and "Presentation" pages, their navigation links and content files (`src/content/aiLab.js`, `src/content/presentation.js`). Old links to them now open the Overview.

### Changed
- The Overview keeps a "Video explanation" slot, now configured in `src/content/video.js`.
- AI-model credits moved to `AI_MODELS` in `src/content/references.js` (still listed on the References page).
- The Model A blueprint and site-build prompt moved from `public/evidence/` (published) to `docs/evidence/` (kept in the repository, not published).

## [1.0.0] — 2026-10-29 — first complete version (branch `feature/v1-site`, awaiting review)

Built with Claude Opus 5.5 from the Model A blueprint (2026-10-22) and the master build prompt (now in `docs/evidence/`).

### Added
- Physics core (`src/physics/`): Young–Laplace capillary pressure (cylinder and slit), Mode A open capillary (exact), Mode B dead-end pore with isothermal trapped gas (adaptive Dormand–Prince 5(4) in `y = (L/L_p)²`), input validation, dimensionless validity checks (inertia, Re, Ca, Bo, θ, pore size, slenderness), challenge inverse solutions, parameter sweeps.
- Exact implicit Mode B trajectory `t̂(λ)`, derived during the build; used to verify the numerical solution point by point.
- Verification suite (`src/physics/checks.js`, 28 checks) run by Vitest and live on the site.
- Independent Python model (`python/wetting/model.py`, RK4 with step doubling), pytest suite with SciPy Radau cross-check, Pyodide test, and in-browser Pyodide run.
- Closed-form shared reference cases (`python/make_reference_cases.py` → `tests/fixtures/reference_cases.json`).
- Website: Overview (slide-rule hero, edge-wetting cell, trapped-gas figure, video slot), Interactive lab (two modes, 9 inputs, presets, 3 plots + gas-pressure plot, physics-linked animation, validity panel, model-vs-reality, guided challenge), Theory (9 lessons, interactive diagrams, quiz), Code & verification, AI lab templates, Presentation placeholders, References & credits.
- GitHub Actions workflow: tests + build on every PR; deploy to Pages only from `main`. Dependabot, PR template.
- README, AI_CONTEXT, CLAUDE.md, Copilot instructions, docs/.

### Corrections relative to the blueprint
- Electrolyte property source identified as Hofmann et al. 2015, IJMS 16, 20258–20276 (DOI 10.3390/ijms160920258). Surface tension was measured at 25 °C, viscosity at 20 °C (the blueprint said 20 °C for both).
- The "~50 vs ~100 min" and "~10 % less uptake" figures are attributed to the TUM press release; the journal abstract (Weydanz et al. 2018) states "about a factor of two".
- The 65.4° separator contact angle (Nano-Micro Letters 2021) is for an unnamed separator, not specifically Celgard; reported as such.
- Contact-angle default now justified by Hofmann et al.'s measured 46.2° / 15.2° for the same electrolyte; pore-radius default bounded by Sheng et al. 2014 porosimetry.
- Added dead-end pore length `L_p` as a Mode B input (required by the model).

### Not verified / not used
- USPTO 9,083,034 and KRÜSS material cited in the blueprint (not opened; not used).
