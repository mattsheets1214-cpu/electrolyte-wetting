/**
 * checks.js — the verification suite.
 *
 * These checks are run in TWO places, from this single source:
 *   1. `npm test` (Vitest, tests/verification.test.js) — must pass before deploy.
 *   2. The "Code & Verification" page, which runs them live in the visitor's
 *      browser and shows the actual numbers. Nothing on that page is typed in by hand.
 *
 * Each check returns { pass, measured, expected, detail }.
 * Hand-calculation targets below were computed separately (see
 * docs/VERIFICATION.md) and agree with the project blueprint's values.
 *
 * Honesty note on "independence": the hand formulas, the closed-form fixture
 * script and the Python model are NUMERICALLY independent of the JavaScript
 * solver (separately coded, different integrators), but they start from the
 * SAME physical equations, so they cannot catch a wrong equation. The
 * "Independent physical route" checks below reach the same quantities by a
 * different derivation (Young–Laplace curvature; Darcy flow), which can.
 */
import { solveModeA, integrateModeA, capillaryPressure, washburnCoefficient } from './capillary.js';
import { solveModeB, exactTimeHat } from './deadEnd.js';
import { validateInputs } from './validation.js';
import { P_LIQUID_ABS } from './constants.js';
import { darcyFrontTime, bundlePermeability } from './porous.js';

/** Baseline illustrative parameter set in SI units. */
export const BASE = Object.freeze({
  r: 0.5e-6, sigma: 29.4e-3, thetaDeg: 30, mu: 4.4e-3,
  dpApplied: 0, X: 0.01, tau: 1,
  pL: P_LIQUID_ABS, pg0: P_LIQUID_ABS, Lp: 70e-6,
});

const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const near = (a, b, tol) => rel(a, b) <= tol;
const fmt = (v) => {
  if (typeof v !== 'number') return String(v);
  if (!Number.isFinite(v)) return String(v);
  const a = Math.abs(v);
  return a !== 0 && (a < 1e-3 || a >= 1e6) ? v.toExponential(4) : Number(v.toPrecision(6)).toString();
};

/** Separately coded hand formula for pure capillary filling: t = 2 μ τ² X² / (r σ cos θ).
 *  Numerically independent of the solver, but the same physics. */
const handTime = ({ mu, tau, X, r, sigma, thetaDeg }) =>
  (2 * mu * tau * tau * X * X) / (r * sigma * Math.cos((thetaDeg * Math.PI) / 180));

export const CHECKS = [
  // ---------------------------------------------------------------- hand calculations
  {
    id: 'hand-pc', category: 'Hand calculation',
    title: 'Capillary pressure at baseline ≈ 101.8 kPa',
    run() {
      const pc = capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r);
      return { pass: near(pc, 101844, 1e-4), measured: `${fmt(pc / 1e3)} kPa`, expected: '101.84 kPa (2·0.0294·cos30°/0.5×10⁻⁶)' };
    },
  },
  {
    id: 'hand-D', category: 'Hand calculation',
    title: 'Washburn coefficient rσcosθ/(2μ) ≈ 1.447 × 10⁻⁶ m²/s',
    run() {
      const D = washburnCoefficient(BASE.r, capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r), BASE.mu);
      const hand = (BASE.r * BASE.sigma * Math.cos(Math.PI / 6)) / (2 * BASE.mu);
      return { pass: near(D, hand, 1e-12) && near(D, 1.4466e-6, 1e-3), measured: `${fmt(D)} m²/s`, expected: `${fmt(hand)} m²/s` };
    },
  },
  ...[
    { X: 70e-6, tau: 1, expect: 3.39e-3, label: '70 µm ≈ 3.4 ms', unit: 1e-3, u: 'ms' },
    { X: 0.01, tau: 1, expect: 69.13, label: '1 cm ≈ 69 s', unit: 1, u: 's' },
    { X: 0.05, tau: 1, expect: 1728.2, label: '5 cm ≈ 29 min', unit: 60, u: 'min' },
    { X: 0.05, tau: 2, expect: 6912.9, label: '5 cm, τ = 2 ≈ 115 min', unit: 60, u: 'min' },
  ].map((c) => ({
    id: `hand-t-${c.X}-${c.tau}`, category: 'Hand calculation',
    title: `Time to ${c.label}`,
    run() {
      const p = { ...BASE, X: c.X, tau: c.tau };
      const t = solveModeA(p).tTarget;
      const hand = handTime(p);
      return { pass: near(t, hand, 1e-12) && near(t, c.expect, 2e-3), measured: `${fmt(t / c.unit)} ${c.u}`, expected: `${fmt(hand / c.unit)} ${c.u} (separately coded formula, same physics)` };
    },
  })),
  ...[
    { pg0: 101.3e3, expect: 0.5013 },
    { pg0: 10e3, expect: 0.9508 },
    { pg0: 1e3, expect: 0.99508 },
  ].map((c) => ({
    id: `hand-fill-${c.pg0}`, category: 'Hand calculation',
    title: `Equilibrium fill at p_g0 = ${c.pg0 / 1e3} kPa abs`,
    run() {
      const b = solveModeB({ ...BASE, pg0: c.pg0 });
      const hand = 1 - c.pg0 / (P_LIQUID_ABS + 101844.1);
      return { pass: near(b.fillEq, hand, 1e-5) && near(b.fillEq, c.expect, 2e-4), measured: fmt(b.fillEq), expected: `${fmt(hand)} = 1 − p_g0/(p_L + p_c)` };
    },
  })),

  // ---------------------------------------------------------------- analytical verification
  {
    id: 'analytic-modeA', category: 'Analytical vs numerical',
    title: 'Mode A: integrator reproduces L² = r²Δp t/(4μ) (rel. error < 10⁻⁶)',
    run() {
      const cases = [BASE, { ...BASE, r: 2e-6, dpApplied: 50e3 }, { ...BASE, thetaDeg: 100, dpApplied: 80e3 }, { ...BASE, mu: 9e-3, X: 70e-6 }];
      let worst = 0;
      for (const p of cases) {
        const a = solveModeA(p);
        const num = integrateModeA(p, a.tTarget);
        for (let i = 1; i < num.t.length; i++) worst = Math.max(worst, rel(num.L[i], a.L(num.t[i])));
      }
      return { pass: worst < 1e-6, measured: `max rel. error ${fmt(worst)}`, expected: '< 1e-6', detail: 'ds/dt is constant in Mode A, so this mainly checks the integrator plumbing.' };
    },
  },
  {
    id: 'analytic-modeB-trajectory', category: 'Analytical vs numerical',
    title: 'Mode B: numerical L(t) matches the exact implicit solution (rel. error < 10⁻⁶)',
    run() {
      let worst = 0;
      for (const pg0 of [101.3e3, 30e3, 10e3, 1e3]) {
        const b = solveModeB({ ...BASE, pg0 });
        b.series.frac.forEach((lam, i) => {
          if (i === 0 || lam > 0.999 * b.fillEq) return; // ln term is ill-conditioned right at equilibrium
          worst = Math.max(worst, rel(b.series.t[i], b.exactTime(lam)));
        });
      }
      return { pass: worst < 1e-6, measured: `max rel. error in t ${fmt(worst)}`, expected: '< 1e-6', detail: 'Exact: t/T = λ² − 2βλ + 2β(1−β)ln[(1−β)/(1−β−λ)].' };
    },
  },
  {
    id: 'analytic-modeB-equilibrium', category: 'Analytical vs numerical',
    title: 'Mode B: numerical end state matches exact equilibrium (within 0.1 %)',
    run() {
      let worst = 0;
      for (const pg0 of [101.3e3, 50e3, 10e3, 1e3, 100]) worst = Math.max(worst, solveModeB({ ...BASE, pg0 }).fillRelError);
      return { pass: worst < 1e-3, measured: `max rel. error ${fmt(worst)}`, expected: '< 1e-3 (spec); typically ~1e-10' };
    },
  },
  {
    id: 'analytic-modeB-t95', category: 'Analytical vs numerical',
    title: 'Mode B: numerical t₉₅ matches exact t₉₅ (rel. error < 10⁻⁵)',
    run() {
      let worst = 0;
      for (const pg0 of [101.3e3, 10e3, 1e3]) { const b = solveModeB({ ...BASE, pg0 }); worst = Math.max(worst, rel(b.t95Num, b.t95Exact)); }
      return { pass: worst < 1e-5, measured: `max rel. error ${fmt(worst)}`, expected: '< 1e-5' };
    },
  },
  {
    id: 'limit-vacuum-to-open', category: 'Limiting case',
    title: 'Mode B with p_g0 → 0 reproduces Mode A with Δpₐ = p_L',
    run() {
      const b = solveModeB({ ...BASE, pg0: 1e-6 });
      const a = solveModeA({ ...BASE, dpApplied: P_LIQUID_ABS, X: 1 });
      let worst = 0;
      b.series.t.forEach((t, i) => { if (i > 0 && b.series.frac[i] < 0.99) worst = Math.max(worst, rel(b.series.L[i], a.L(t))); });
      return { pass: worst < 1e-6, measured: `max rel. error ${fmt(worst)}`, expected: '< 1e-6 while the gas is negligible' };
    },
  },

  // ---------------------------------------------------------------- independent physical routes
  {
    id: 'route-curvature-pc', category: 'Independent physical route',
    title: 'p_c from meniscus curvature (Young–Laplace) equals the contact-line force result',
    run() {
      // Young–Laplace: Δp = σ(1/R₁ + 1/R₂). Cylinder: spherical cap, R₁ = R₂ = r/cos θ.
      // Slit of half-width h: R₁ = h/cos θ, R₂ = ∞. θ = 90°: flat meniscus, Δp = 0.
      const { sigma, r } = BASE;
      let worst = 0;
      for (const th of [0, 30, 60, 89, 120, 150]) {
        const R = r / Math.cos((th * Math.PI) / 180);
        worst = Math.max(worst, rel(capillaryPressure(sigma, th, r), sigma * (1 / R + 1 / R)));
        worst = Math.max(worst, rel(capillaryPressure(sigma, th, r, 'slit'), sigma * (1 / R + 0)));
      }
      const flat = capillaryPressure(sigma, 90, r);
      return { pass: worst < 1e-12 && flat === 0, measured: `max rel. difference ${fmt(worst)}; θ = 90° → ${flat}`, expected: '< 1e-12; 0', detail: 'A second derivation of p_c, from interface curvature instead of the force on the contact line.' };
    },
  },
  {
    id: 'route-darcy-bundle', category: 'Independent physical route',
    title: 'Darcy imbibition with a capillary-bundle permeability reproduces Mode A (ε cancels)',
    run() {
      // ε = 0.35, τ = 1.6, r = 0.5 µm: k = εr²/(8τ²); Darcy front X² = 2 k p_c t / (ε μ).
      const tau = 1.6, X = 0.01;
      const pc = capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r);
      const tModeA = solveModeA({ ...BASE, X, tau }).tTarget;
      const times = [0.2, 0.35, 0.5].map((eps) => darcyFrontTime({ X, k: bundlePermeability({ eps, r: BASE.r, tau }), eps, mu: BASE.mu, P: pc }));
      const worst = Math.max(...times.map((t) => rel(t, tModeA)));
      return { pass: worst < 1e-12 && near(times[1], 176.96, 1e-4), measured: `Darcy t(1 cm) = ${fmt(times[1])} s at ε = 0.35; spread over ε = 0.2–0.5: ${fmt(worst)}`, expected: `${fmt(tModeA)} s (Mode A, τ = 1.6), independent of ε`, detail: 'Porous-medium (Darcy) view and single-pore view agree for this permeability model only.' };
    },
  },

  // ---------------------------------------------------------------- limiting cases / scaling
  ...[
    { id: 'scale-mu', title: 'Doubling μ doubles the time', change: (p) => ({ ...p, mu: 2 * p.mu }), ratio: 2, base: BASE },
    { id: 'scale-X', title: 'Doubling distance quadruples the time', change: (p) => ({ ...p, X: 2 * p.X }), ratio: 4, base: BASE },
    { id: 'scale-r-cap', title: 'Doubling r halves the time (pure capillary drive)', change: (p) => ({ ...p, r: 2 * p.r }), ratio: 0.5, base: BASE },
    { id: 'scale-r-fixed', title: 'Doubling r quarters the time (fixed independent Δp: θ = 90°, Δpₐ = 100 kPa)', change: (p) => ({ ...p, r: 2 * p.r }), ratio: 0.25, base: { ...BASE, thetaDeg: 90, dpApplied: 100e3 } },
    { id: 'scale-tau', title: 'Doubling τ quadruples the time', change: (p) => ({ ...p, tau: 2 * p.tau }), ratio: 4, base: BASE },
  ].map((c) => ({
    id: c.id, category: 'Limiting case', title: c.title,
    run() {
      const t1 = solveModeA(c.base).tTarget, t2 = solveModeA(c.change(c.base)).tTarget;
      const ratio = t2 / t1;
      return { pass: near(ratio, c.ratio, 1e-12), measured: `t₂/t₁ = ${fmt(ratio)}`, expected: String(c.ratio) };
    },
  })),
  {
    id: 'limit-theta-90', category: 'Limiting case',
    title: 'θ → 90° removes the spontaneous capillary drive',
    run() {
      const t89 = solveModeA({ ...BASE, thetaDeg: 89 }).tTarget;
      const t899 = solveModeA({ ...BASE, thetaDeg: 89.9 }).tTarget;
      const a90 = solveModeA({ ...BASE, thetaDeg: 90 });
      const pass = t899 > 9 * t89 && a90.fills === false && a90.tTarget === Infinity && a90.pc === 0;
      return { pass, measured: `t(89°)=${fmt(t89)} s, t(89.9°)=${fmt(t899)} s, θ=90° → p_c=${a90.pc}, fills=${a90.fills}`, expected: 't grows like 1/cos θ; at 90° p_c = 0 and no filling' };
    },
  },
  {
    id: 'limit-nonwetting', category: 'Limiting case',
    title: 'Non-wetting (θ = 120°) never gives a negative time',
    run() {
      const spont = solveModeA({ ...BASE, thetaDeg: 120 });
      const weakPush = solveModeA({ ...BASE, thetaDeg: 120, dpApplied: 20e3 }); // |p_c| ≈ 58.8 kPa
      const strongPush = solveModeA({ ...BASE, thetaDeg: 120, dpApplied: 100e3 });
      const pass = !spont.fills && !weakPush.fills && spont.tTarget === Infinity && strongPush.fills && strongPush.tTarget > 0;
      return { pass, measured: `no push: fills=${spont.fills}; 20 kPa: fills=${weakPush.fills}; 100 kPa: t=${fmt(strongPush.tTarget)} s`, expected: 'no filling until Δpₐ > |p_c|; then t > 0' };
    },
  },
  {
    id: 'limit-gas-monotone', category: 'Limiting case',
    title: 'Lower initial non-condensable gas pressure → higher equilibrium fill',
    run() {
      const fills = [101.3e3, 50e3, 10e3, 1e3, 100].map((pg0) => solveModeB({ ...BASE, pg0 }).fillNum);
      const pass = fills.every((f, i) => i === 0 || f > fills[i - 1]);
      return { pass, measured: fills.map((f) => fmt(f)).join(' < '), expected: 'strictly increasing' };
    },
  },
  {
    id: 'limit-modeB-scaling', category: 'Limiting case',
    title: 'Mode B: fill fraction independent of L_p and μ; t₉₅ ∝ L_p² and ∝ μ',
    run() {
      const b0 = solveModeB(BASE), bL = solveModeB({ ...BASE, Lp: 2 * BASE.Lp }), bM = solveModeB({ ...BASE, mu: 2 * BASE.mu });
      const pass = near(bL.fillNum, b0.fillNum, 1e-9) && near(bM.fillNum, b0.fillNum, 1e-9) && near(bL.t95Num / b0.t95Num, 4, 1e-6) && near(bM.t95Num / b0.t95Num, 2, 1e-6);
      return { pass, measured: `t₉₅ ratios: L_p×2 → ${fmt(bL.t95Num / b0.t95Num)}, μ×2 → ${fmt(bM.t95Num / b0.t95Num)}`, expected: '4 and 2; fill unchanged' };
    },
  },

  // ---------------------------------------------------------------- convergence
  {
    id: 'convergence-tolerance', category: 'Numerical convergence',
    title: 'Tightening solver tolerance converges t₉₅ to the exact value',
    run() {
      const errs = [1e-4, 1e-6, 1e-8, 1e-10].map((rtol) => { const b = solveModeB({ ...BASE }, { rtol, atol: rtol * 1e-4 }); return rel(b.t95Num, b.t95Exact); });
      const pass = errs[3] < 1e-7 && errs.every((e, i) => i === 0 || e < errs[i - 1]);
      return { pass, measured: errs.map((e) => fmt(e)).join(' → '), expected: 'error falls as rtol = 1e-4 → 1e-10' };
    },
  },
  {
    id: 'convergence-steps', category: 'Numerical convergence',
    title: 'Step-size cap h → h/2 → h/4 gives the same answer (Mode B, ambient gas)',
    run() {
      const vals = [0.05, 0.025, 0.0125].map((hMax) => solveModeB(BASE, { rtol: 1e-12, atol: 1e-16, maxSteps: 500000, hMax }).t95Num);
      const spread = Math.max(...vals.map((v) => rel(v, vals[2])));
      return { pass: spread < 1e-8, measured: `spread ${fmt(spread)}`, expected: '< 1e-8' };
    },
  },

  // ---------------------------------------------------------------- invalid inputs
  {
    id: 'invalid-inputs', category: 'Invalid input',
    title: 'Physically meaningless inputs are rejected with an explanation (never clamped)',
    run() {
      const cases = [
        ['A', { r: 0 }, 'r'], ['A', { r: -1e-6 }, 'r'], ['A', { mu: 0 }, 'mu'], ['A', { sigma: 0 }, 'sigma'],
        ['A', { tau: 0.5 }, 'tau'], ['A', { thetaDeg: -5 }, 'thetaDeg'], ['A', { thetaDeg: 181 }, 'thetaDeg'],
        ['A', { X: 0 }, 'X'], ['A', { r: NaN }, 'r'], ['B', { pg0: -1 }, 'pg0'], ['B', { pL: 0 }, 'pL'],
        ['B', { Lp: 0 }, 'Lp'], ['B', { Lp: 0.4e-6 }, 'Lp'],
      ];
      const failures = cases.filter(([mode, change, field]) => {
        const v = validateInputs({ ...BASE, ...change }, mode);
        return v.ok || !v.errors.some((e) => e.field === field);
      });
      return { pass: failures.length === 0, measured: `${cases.length - failures.length}/${cases.length} rejected on the right field`, expected: `${cases.length}/${cases.length}` };
    },
  },
  {
    id: 'invalid-zero-drive', category: 'Invalid input',
    title: 'Zero or negative total drive → "does not fill", never a negative time',
    run() {
      const zero = solveModeA({ ...BASE, thetaDeg: 90, dpApplied: 0 });
      const neg = solveModeA({ ...BASE, dpApplied: -150e3 });
      const bNo = solveModeB({ ...BASE, pg0: 300e3 });
      const pass = !zero.fills && !neg.fills && zero.tTarget === Infinity && neg.tTarget === Infinity && !bNo.fills && bNo.fillEq === 0;
      return { pass, measured: `θ=90°: ${zero.fills}; Δp<0: ${neg.fills}; p_g0 > p_L+p_c: ${bNo.fills}`, expected: 'false, false, false' };
    },
  },
];

/** Run every check; never throws (a thrown error is reported as a failure). */
export function runAllChecks() {
  return CHECKS.map((c) => {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    try {
      const r = c.run();
      return { id: c.id, category: c.category, title: c.title, ...r, ms: (typeof performance !== 'undefined' ? performance : Date).now() - t0 };
    } catch (e) {
      return { id: c.id, category: c.category, title: c.title, pass: false, measured: `error: ${e.message}`, expected: '' };
    }
  });
}

export { exactTimeHat };
