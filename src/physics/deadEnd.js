/**
 * deadEnd.js — Mode B: dead-end capillary with trapped, isothermally compressed gas.
 *
 * Geometry: a cylindrical pore of radius r and length L_p, open to the liquid
 * at x = 0 and closed at x = L_p. Gas initially fills the pore at absolute
 * pressure p_g0. Liquid at absolute pressure p_L enters and compresses the gas.
 *
 * Governing equations (all pressures ABSOLUTE except p_c, which is a jump):
 *   p_g(L)  = p_g0 · L_p / (L_p − L)                    (Boyle's law, isothermal)
 *   dL/dt   = r² [p_L + p_c − p_g(L)] / (8 μ L)           (Hagen–Poiseuille behind the front)
 *
 * The right-hand side is singular at L = 0, so we integrate s = L²:
 *   ds/dt   = r² [p_L + p_c − p_g(√s)] / (4 μ)            (finite at s = 0)
 *
 * Non-dimensionalisation used by the solver (makes tolerances meaningful):
 *   P = p_L + p_c,  β = p_g0 / P,  λ = L / L_p,  y = λ²,  T = 4 μ L_p² / (r² P),  t̂ = t / T
 *   dy/dt̂ = 1 − β / (1 − √y)
 *
 * Exact results used for verification (derived in docs/VERIFICATION.md):
 *   equilibrium  λ_eq = 1 − β = 1 − p_g0 / (p_L + p_c)
 *   trajectory   t̂(λ) = λ² − 2βλ + 2β(1 − β) · ln[(1 − β) / (1 − β − λ)]
 * The trajectory follows because the ODE is separable: dt̂ = 2λ(1 − λ) / (1 − β − λ) dλ.
 */
import { validateInputs } from './validation.js';
import { capillaryPressure } from './capillary.js';
import { integrateDP45, firstCrossing } from './ode.js';

/** Exact dimensionless time to reach fill fraction λ (0 ≤ λ < 1 − β). */
export function exactTimeHat(lambda, beta) {
  if (beta === 0) return lambda * lambda;
  const a = 1 - beta;
  if (lambda >= a) return Infinity;
  return lambda * lambda - 2 * beta * lambda + 2 * beta * a * Math.log(a / (a - lambda));
}

/**
 * Solve Mode B.
 * @param {object} p  SI inputs: r, sigma, thetaDeg, mu, pL, pg0, Lp
 * @param {object} [opts] rtol, atol for the integrator; stopDrive = relative drive at which to stop
 */
export function solveModeB(p, opts = {}) {
  const v = validateInputs(p, 'B');
  if (!v.ok) return { ok: false, errors: v.errors };

  const pc = capillaryPressure(p.sigma, p.thetaDeg, p.r);
  const P = p.pL + pc; // total "push" on the liquid side, Pa
  const drive0 = P - p.pg0; // net driving pressure at the moment liquid enters, Pa

  if (!(drive0 > 0)) {
    return {
      ok: true, errors: [], fills: false, pc, P, drive0, fillEq: 0, fillNum: 0,
      reason: 'At the pore entrance the trapped-gas pressure already equals or exceeds the liquid pressure plus the capillary pressure (p_g0 ≥ p_L + p_c), so no liquid enters.',
    };
  }

  // #region mode-b-setup
  const beta = p.pg0 / P; // 0 ≤ β < 1 here
  const fillEq = 1 - beta; // exact equilibrium fill fraction L_eq / L_p
  const T = (4 * p.mu * p.Lp * p.Lp) / (p.r * p.r * P); // time scale, s

  // Dimensionless right-hand side dy/dt̂ = 1 − β / (1 − √y), with y = (L/L_p)².
  // Values of y outside [0, 1) are unphysical (front past the dead end), so return NaN
  // and let the integrator reject that trial step.
  const rhs = (_t, y) => {
    if (y < 0 || y >= 1) return NaN;
    return 1 - beta / (1 - Math.sqrt(y));
  };
  // #endregion

  // #region mode-b-solve
  // Stopping rule: near equilibrium the front creeps exponentially, so we stop
  // when a Newton estimate of the REMAINING change in y, |f / f'|, is below
  // `stopTol` × y. This uses only the ODE itself, not the exact equilibrium,
  // so the numerical end state remains an independent check of 1 − β.
  // For β = 0 (perfect vacuum) there is no equilibrium inside the pore: stop
  // when the front is within 1e-9 L_p of the dead end.
  // The stop threshold follows the solver tolerance: asking for less than the
  // integrator can resolve would never be satisfied.
  const stopTol = opts.stopTol ?? Math.max(1e-9, 10 * (opts.rtol ?? 1e-10));
  const dfdy = (y) => { const l = Math.sqrt(y); return -beta / ((1 - l) * (1 - l) * 2 * l); };
  const stop = (_t, y, dydt) => {
    if (beta === 0) return Math.sqrt(y) >= 1 - 1e-9;
    if (y <= 0) return false;
    return Math.abs(dydt / dfdy(y)) <= stopTol * y;
  };
  const sol = integrateDP45(rhs, 0, 0, opts.tHatMax ?? 1e7, {
    rtol: opts.rtol ?? 1e-10,
    atol: opts.atol ?? 1e-14,
    h0: 1e-8,
    hMax: opts.hMax,
    maxSteps: opts.maxSteps ?? 200000,
    stop,
  });
  // #endregion

  const converged = sol.status === 'stopped';
  const lamEnd = Math.sqrt(sol.y[sol.y.length - 1]);
  const fillNum = lamEnd;

  // Time to 95 % of equilibrium. Numerical value uses the NUMERICAL end state, so it
  // is independent of the exact formula; the exact value is computed separately.
  let t95Num = null;
  if (converged && lamEnd > 0) {
    const tHat95 = firstCrossing(sol, (0.95 * lamEnd) ** 2);
    t95Num = tHat95 === null ? null : tHat95 * T;
  }
  const t95Exact = exactTimeHat(0.95 * fillEq, beta) * T;

  const t = sol.t.map((th) => th * T);
  const frac = sol.y.map((y) => Math.sqrt(Math.max(y, 0)));
  const L = frac.map((f) => f * p.Lp);
  const pg = frac.map((f) => p.pg0 / (1 - f));

  return {
    ok: true, errors: [], fills: true, converged, status: sol.status,
    steps: sol.steps, rejected: sol.rejected,
    pc, P, drive0, beta, T,
    fillEq, fillNum,
    fillRelError: Math.abs(fillNum - fillEq) / fillEq,
    t95Exact, t95Num,
    series: { t, L, frac, pg },
    /** exact time (s) to reach fill fraction λ */
    exactTime: (lambda) => exactTimeHat(lambda, beta) * T,
    /** gas pressure (Pa abs) at fill fraction λ */
    gasPressure: (lambda) => p.pg0 / (1 - lambda),
  };
}

/**
 * Exact trajectory sampled for plotting: returns arrays of t (s) and L (m),
 * sampled densely near the start and near equilibrium.
 */
export function exactTrajectoryB(res, Lp, n = 160) {
  if (!res || !res.fills) return { t: [], L: [] };
  const lamMax = res.beta === 0 ? 1 : res.fillEq;
  const t = [], L = [];
  for (let i = 0; i <= n; i++) {
    // Cosine spacing clusters points at both ends.
    const s = 0.5 * (1 - Math.cos((Math.PI * i) / n));
    const lam = lamMax * s * (1 - 1e-6);
    t.push(res.exactTime(lam));
    L.push(lam * Lp);
  }
  return { t, L };
}
