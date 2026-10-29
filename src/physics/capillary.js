/**
 * capillary.js — Young–Laplace capillary pressure and Mode A (open capillary).
 *
 * Sign convention (used everywhere in this project):
 *   θ is measured THROUGH THE LIQUID.
 *   θ < 90°  → cos θ > 0 → p_c > 0 → capillarity pulls liquid in.
 *   θ = 90°  → p_c = 0   → no spontaneous capillary drive.
 *   θ > 90°  → p_c < 0   → capillarity pushes liquid out; only an applied
 *                          pressure larger than |p_c| can force liquid in.
 *
 * Δp_a (applied pressure difference) = liquid-side pressure − gas-side pressure.
 */
import { validateInputs } from './validation.js';
import { integrateDP45 } from './ode.js';
import { COS_ZERO_TOL } from './constants.js';

/** cos θ for θ in degrees, with cos(90°) returned as exactly 0. */
export function cosDeg(thetaDeg) {
  const c = Math.cos((thetaDeg * Math.PI) / 180);
  return Math.abs(c) < COS_ZERO_TOL ? 0 : c;
}

// #region capillary-pressure
/**
 * Young–Laplace capillary pressure for an idealized pore.
 *   cylinder of radius r:          p_c = 2 σ cos θ / r
 *   slit (parallel plates), half-width h = r:  p_c = σ cos θ / h
 * @param {number} sigma     surface tension, N/m
 * @param {number} thetaDeg  contact angle through the liquid, degrees
 * @param {number} r         pore radius (or slit half-width), m
 * @param {'cylinder'|'slit'} [geometry='cylinder']
 * @returns {number} capillary pressure, Pa
 */
export function capillaryPressure(sigma, thetaDeg, r, geometry = 'cylinder') {
  const factor = geometry === 'slit' ? 1 : 2;
  return (factor * sigma * cosDeg(thetaDeg)) / r;
}
// #endregion

// #region washburn-coefficient
/**
 * Coefficient D in L² = D t for a capillary with constant driving pressure Δp.
 * Integrating dL/dt = r² Δp / (8 μ L) from L(0) = 0 gives L² = r² Δp t / (4 μ),
 * so D = r² Δp / (4 μ). With Δp = p_c only, D = r σ cos θ / (2 μ) (Lucas–Washburn).
 * @returns {number} D, m²/s
 */
export function washburnCoefficient(r, dp, mu) {
  return (r * r * dp) / (4 * mu);
}
// #endregion

/**
 * Mode A — open capillary with constant total driving pressure.
 *
 * Inputs (SI): r, sigma, thetaDeg, mu, dpApplied, X (straight-line target
 * distance), tau (tortuosity). The liquid travels a path L = τ X.
 *
 * @returns {object} result with ok/errors, p_c, Δp_total, D, time to target,
 *   and helper functions for the analytical trajectory.
 */
export function solveModeA(p) {
  const v = validateInputs(p, 'A');
  if (!v.ok) return { ok: false, errors: v.errors };

  // #region mode-a
  const pc = capillaryPressure(p.sigma, p.thetaDeg, p.r);
  const dpTotal = pc + p.dpApplied; // Pa, liquid side minus gas side
  const Lpath = p.tau * p.X; // m, distance travelled along the tortuous pore

  if (!(dpTotal > 0)) {
    // Zero or negative net drive: the front never advances. Never report a negative time.
    return {
      ok: true, errors: [], fills: false, pc, dpTotal, Lpath,
      D: 0, Dstraight: 0, tTarget: Infinity,
      reason: dpTotal === 0
        ? 'The net driving pressure is exactly zero, so the liquid front does not move.'
        : 'The net driving pressure is negative: capillarity (θ > 90°) pushes liquid out harder than the applied pressure pushes it in. The pore does not fill.',
    };
  }

  const D = washburnCoefficient(p.r, dpTotal, p.mu); // m²/s along the path: L² = D t
  const Dstraight = D / (p.tau * p.tau); // m²/s in straight-line distance: X² = D t / τ²
  const tTarget = (Lpath * Lpath) / D; // s  (= 4 μ τ² X² / (r² Δp_total))
  // #endregion

  return {
    ok: true, errors: [], fills: true, pc, dpTotal, Lpath, D, Dstraight, tTarget,
    /** straight-line penetration distance X (m) at time t (s) */
    X: (t) => Math.sqrt(Dstraight * Math.max(t, 0)),
    /** path length L (m) at time t (s) */
    L: (t) => Math.sqrt(D * Math.max(t, 0)),
  };
}

/**
 * Numerical solution of Mode A with the same adaptive integrator used for
 * Mode B. Because ds/dt is constant here, an accurate integrator must
 * reproduce the analytical answer to round-off. This is a plumbing check of
 * the integrator, not a demanding accuracy test (that is the Mode B check).
 *
 * Integrated variable: s = L² (m²). ds/dt = r² Δp / (4 μ).
 * @returns {{t:number[], X:number[], L:number[], status:string}}
 */
export function integrateModeA(p, tEnd, opts = {}) {
  const a = solveModeA(p);
  if (!a.ok || !a.fills) return null;
  const rhs = () => washburnCoefficient(p.r, a.dpTotal, p.mu);
  // Integrate in scaled variables (ŝ = s / Lpath², t̂ = t / tEnd) so tolerances are dimensionless.
  const sScale = a.Lpath * a.Lpath;
  const sol = integrateDP45((th) => (rhs() * tEnd) / sScale, 0, 0, 1, {
    rtol: opts.rtol ?? 1e-10, atol: opts.atol ?? 1e-14, h0: 1e-6, hMax: opts.hMax ?? 0.02,
  });
  const t = sol.t.map((th) => th * tEnd);
  const L = sol.y.map((sh) => Math.sqrt(Math.max(sh, 0) * sScale));
  return { t, L, X: L.map((l) => l / p.tau), status: sol.status, steps: sol.steps };
}
