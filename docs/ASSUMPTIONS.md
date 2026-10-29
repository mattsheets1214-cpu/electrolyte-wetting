# Assumptions, open questions and remaining tasks

## Model assumptions (shown on the site)

| Assumption | Where it matters | Checked live? |
|---|---|---|
| One cylindrical pore of uniform radius | Everything | Always-on "one idealized pore" note |
| Newtonian, incompressible liquid; no slip; fully developed laminar (Hagen–Poiseuille) flow | Front speed | Reynolds number |
| Quasi-steady: inertia neglected | First instants of filling | Inertial time ρr²/μ vs filling time |
| Static contact angle | Early, fast filling | Capillary number Ca = μv/σ |
| Gravity neglected | Large pores | Bond number |
| Continuum, sharp meniscus | Pores below ~10–50 nm | Pore-size flag |
| Long pore (entrance/meniscus effects neglected) | Short Mode B pores | L_p/r < 20 flag |
| Tortuosity as a path-length factor τ | Mode A electrode scaling | Labelled as an estimate |
| Mode B: dead end, isothermal ideal gas, no dissolution, no gas-side drag | Trapping | Labelled as an upper bound |
| Liquid at 101.3 kPa abs; 25 °C; properties not temperature-corrected | Mode B, all | Shown as fixed settings |

## Input values

| Input | Default | Basis | Status |
|---|---|---|---|
| σ | 29.4 mN/m | Hofmann et al. 2015 (25 °C) | Verified source |
| μ | 4.4 mPa·s | Hofmann et al. 2015 (20 °C) | Verified source; 5 °C mismatch noted |
| ρ (validity checks only) | 1303 kg/m³ | Hofmann et al. 2015 | Verified source |
| θ | 30° | Between 15.2° and 46.2° measured on separators for the same electrolyte | **Assumption** — no electrode contact angle sourced |
| r | 0.5 µm | Upper end of 0.16–0.50 µm radii from graphite-anode porosimetry (Sheng et al. 2014) | **Assumption**, bounded by a source |
| τ | 1 | — | **Assumption** |
| L_p | 70 µm | ≈ one coating thickness | **Assumption** |
| In-plane wetting distance of a real cell | 1–5 cm | — | **Assumption**; the Weydanz cell dimensions were not extracted |

## Open scientific questions

1. **Contact angle on electrodes.** No measured electrolyte–electrode contact angle is cited. Find one (e.g. sessile drop on calendered graphite/NMC) or keep θ as a swept variable.
2. **Effective pore radius.** Real electrodes have a distribution; capillary pressure favours small pores, flow favours large ones. A single r is a modelling choice.
3. **Quantitative validation.** Davoodabadi et al. (2019) report imbibition curves; if accessible through UC's library they could be digitized to test the √t law and viscosity scaling. Not done.
4. **Weydanz et al. (2018) cell geometry.** Wetting distance, pore size and electrolyte for that cell are not known here, so the 50–100 min comparison is plausibility only.
5. **Dynamic contact angle.** Ca ≈ 0.02 in the first moments at baseline; a Cox–Voinov-type correction would slow early filling. Optional extension.

## Remaining tasks for the author

- [ ] Review and merge the v1 pull request; enable GitHub Pages (README → Deploying).
- [ ] Re-derive Washburn and the Mode B equilibrium by hand; photograph/scan for the site (blueprint section 13 condition).
- [ ] Obtain the Model B critique; fill the decision table (`src/content/aiLab.js`).
- [ ] Freeze the spec; run the two comparable implementations with identical prompts; run the shared tests on both; record results and bugs.
- [ ] Record the practice presentation, get the AI critique (include site link + requirements), record the final video, paste the verbatim auto-transcript.
- [ ] Write lessons learned, future questions and your own contribution statement.
- [ ] Add the instructor's reference-site URL to `DESIGN_INSPIRATION` in `src/content/references.js`.
- [ ] Optionally confirm the full author list for Wang et al. 2021 (abbreviated as "et al.").
