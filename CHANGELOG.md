# Changelog

All significant changes. Newest first. Dates are YYYY-MM-DD.

## [1.2.0] — 2026-10-29 — Phase 3 of the scientific audit (branch `phase3-audit-fixes`, awaiting review)

Implements the corrections from "Electrolyte Wetting Website — Scientific Audit (Phase 1–2)" (commit 75faa77). No solver equation changed; every number the site displayed before is unchanged except the lesson 1 distance ratio (m5).

### Added
- Lesson 7: Darcy's law, superficial vs interstitial velocity, sharp-front Darcy imbibition X² = 2k·p_c·t/(εμ), and the capillary-bundle permeability k = εr²/(8τ²) that reduces it to the lab's single-pore formula (porosity cancels; bundle model only). Kozeny–Carman comparison (d = 10 µm, ε = 0.35 → ≈ 48 s to 1 cm vs ≈ 69 s). (M1)
- `src/physics/porous.js`: closed-form Darcy helpers used only by lesson 7 and the checks. Not a solver; the lab does not call it; Mode A is unchanged.
- Lesson 4: Young–Laplace derivation from interface curvature (R = r/cos θ; slit R₁ = h/cos θ, R₂ = ∞), definition p_c ≡ p_g − p_ℓ with its sign convention, and capillary vs applied pressure. (M2)
- Two verification checks in the "Independent physical route" category (curvature-route p_c; Darcy bundle equivalence, 176.96 s at ε = 0.35, τ = 1.6). 30 checks in total.
- Validity panel: "Gravity on a vertical front" (ρgH/Δp and Jurin height). (m1)
- References: de Gennes, Brochard-Wyart & Quéré (2004); Bear, *Dynamics of Fluids in Porous Media* (pages to be confirmed for both); Sigma-Aldrich DMC vapour pressure.
- Tests: curvature-route p_c, Darcy equivalence and Kozeny–Carman, active-mode error isolation, gravity criterion (25 new Vitest tests; 104 total).

### Changed
- Lessons 2–3: interfacial-tension wording, σ ≡ γ_LG notation note, conditions for Young's equation, real contact angles (hysteresis, roughness, heterogeneity, contamination, measurement time). (M4)
- Lesson 8, parameter notes, lab text: p_g0 is the initial **non-condensable** gas pressure; the Mode B scenario (evacuate, seal with liquid, vent to 101.3 kPa) is stated; notes on solvent vapour and gas dissolution; which pores are dead ends. (M3, m7)
- Bond-number check now describes meniscus shape, not vertical filling. (m1)
- Lab reports input errors for the active mode only (`src/ui/modeErrors.js`). (m3)
- Lesson 5 radial coordinate renamed r′ (ρ is density); Washburn assumption list completed. (m4, m11)
- Lesson 1 distance ratio computed: 714 and ≈ 510 000 (was 700 / 500 000 / 490 000). (m5)
- Overview no longer says vacuum filling is used "for exactly the reason Mode B shows". (m6)
- Tortuosity definition stated (path ÷ straight line; some texts use its square). (m10)
- Constants imported instead of typed (lesson 5 example, lab challenge). (m8)
- "Independent" reworded to "numerically independent" where the checks share the solver's equations (checks.js, quiz Q6, verification page). (m2)
- Capillary-number threshold described as a rough rule of thumb. (m12)

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
