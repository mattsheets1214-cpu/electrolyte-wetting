# Verification procedure and results

Verification = the code solves its stated equations correctly. It says nothing about whether the equations describe a real cell (validation; see `ASSUMPTIONS.md`).

## How to reproduce

```bash
npm ci && npm test                                  # 80 JS tests incl. 28 verification checks and Pyodide cross-check
python -m pip install -r python/requirements-dev.txt
python -m pytest python/tests -q                    # 28 Python tests incl. SciPy Radau cross-check
python python/wetting/model.py                      # baseline numbers
```

The same 28 checks run live on the site's Code & verification page.

## Three independent implementations of the same physics

| | Method | Where |
|---|---|---|
| JavaScript (site) | Dormand–Prince 5(4), adaptive, in y = (L/L_p)², dimensionless time | `src/physics/` |
| Python reference | Classical RK4 with step doubling + Richardson extrapolation | `python/wetting/model.py` |
| SciPy (tests only) | Radau IIA (implicit), integrating the **dimensional** equation ds/dt = r²(p_L + p_c − p_g)/(4μ) | `python/tests/test_model.py` |

Plus closed-form references from `python/make_reference_cases.py`.

## Exact Mode B trajectory (derivation)

With λ = L/L_p, β = p_g0/(p_L + p_c), T = 4μL_p²/(r²(p_L + p_c)) and t̂ = t/T, the front equation becomes

    d(λ²)/dt̂ = 1 − β/(1 − λ)   ⇒   2λ dλ/dt̂ = (1 − β − λ)/(1 − λ)

which separates: dt̂ = 2λ(1 − λ)/(a − λ) dλ with a = 1 − β. Writing w = a − λ, the integrand becomes 2[a(1−a)/w + (2a − 1) − w], so

    t̂(λ) = λ² − 2βλ + 2β(1 − β) ln[(1 − β)/(1 − β − λ)].

Checks: β → 0 gives t̂ = λ² (Mode A); dt̂/dλ reproduces the ODE (tested numerically); t̂ → ∞ as λ → 1 − β (equilibrium).

## Results recorded on 2026-10-29

- JavaScript: 4 files, **80/80 tests passed** (Vitest 5.0.5, Node 22.23).
- Python: **28/28 passed** (pytest 9.1.1, Python 3.13, SciPy 1.18.1).
- Pyodide 314.0.7 (Node) runs the Python model; Mode B t₉₅ agrees with the JS solver to < 10⁻⁶.
- Mode A numerical vs analytical: max relative error ≈ 1.6 × 10⁻¹⁵.
- Mode B trajectory vs exact: max relative error in t ≈ 8 × 10⁻⁷ (λ < 0.999 λ_eq).
- Mode B end state vs exact equilibrium: ≈ 5 × 10⁻¹⁰.
- t₉₅ vs exact: ≈ 2 × 10⁻⁸. Convergence with rtol 10⁻⁴ → 10⁻¹²: error 3.4 × 10⁻³ → 3.1 × 10⁻⁵ → 3.4 × 10⁻⁷ → 1.1 × 10⁻⁸ → 1.9 × 10⁻⁹.

Baseline hand checks (all reproduced): p_c = 101.84 kPa; D_W = 1.4467 × 10⁻⁶ m²/s; 70 µm → 3.39 ms; 1 cm → 69.1 s; 5 cm → 28.8 min; 5 cm, τ = 2 → 115.2 min; fill 0.5013 / 0.9508 / 0.9951 at 101.3 / 10 / 1 kPa abs. Challenge: r_min = 0.307 µm (μ = 4.4 mPa·s), 0.559 µm (μ = 8 mPa·s); p_g0 ≤ 13.35 kPa abs for ≥ 95 % fill at r = 0.307 µm.
