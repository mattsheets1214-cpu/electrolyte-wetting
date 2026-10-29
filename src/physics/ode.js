/**
 * ode.js — adaptive Dormand–Prince 5(4) integrator for a single scalar ODE.
 *
 *   dy/dt = f(t, y),   y(t0) = y0
 *
 * Why a hand-written integrator?
 *   The model has one unknown, so a ~100-line integrator is easier to read,
 *   test and defend than a large numerical library. Dormand–Prince 5(4) is the
 *   same method behind SciPy's `solve_ivp(method="RK45")` and MATLAB's `ode45`.
 *
 * Safety features for this physics problem:
 *   - If f returns a non-finite value (e.g. a stage evaluation that would put
 *     the liquid front past the end of a dead-end pore), the step is rejected
 *     and retried with a smaller step instead of producing nonsense.
 *   - `stop(t, y, dydt)` lets the caller end integration when a physical
 *     condition is met (e.g. the driving pressure has essentially vanished).
 *
 * Units: whatever the caller uses. The Mode B solver calls this in
 * dimensionless variables (see deadEnd.js), which keeps tolerances meaningful.
 */

// #region dormand-prince-tableau
// Butcher tableau for Dormand–Prince 5(4) (Dormand & Prince, 1980).
const C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];
// 5th-order weights (used to advance) and 4th-order weights (used for the error estimate).
const B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
const B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
// #endregion

/**
 * Integrate a scalar ODE with adaptive step-size control.
 *
 * @param {(t:number, y:number) => number} f  right-hand side
 * @param {number} t0   start time
 * @param {number} y0   initial value
 * @param {number} tEnd final time (integration may stop earlier via `stop`)
 * @param {object} [opts]
 * @param {number} [opts.rtol=1e-10]   relative tolerance
 * @param {number} [opts.atol=1e-12]   absolute tolerance
 * @param {number} [opts.h0]           first trial step (default (tEnd-t0)*1e-6)
 * @param {number} [opts.hMax]         largest allowed step
 * @param {number} [opts.maxSteps=200000]
 * @param {(t:number, y:number, dydt:number) => boolean} [opts.stop]
 * @returns {{t:number[], y:number[], dydt:number[], status:string, steps:number, rejected:number}}
 */
export function integrateDP45(f, t0, y0, tEnd, opts = {}) {
  const rtol = opts.rtol ?? 1e-10;
  const atol = opts.atol ?? 1e-12;
  const maxSteps = opts.maxSteps ?? 200000;
  const hMax = opts.hMax ?? Math.abs(tEnd - t0);
  let h = opts.h0 ?? Math.abs(tEnd - t0) * 1e-6;

  let t = t0;
  let y = y0;
  let k1 = f(t, y);
  if (!Number.isFinite(k1)) throw new Error('ODE right-hand side is not finite at the initial condition.');

  const out = { t: [t], y: [y], dydt: [k1], status: 'running', steps: 0, rejected: 0 };
  if (opts.stop && opts.stop(t, y, k1)) { out.status = 'stopped'; return out; }

  const k = new Array(7);
  while (out.steps < maxSteps) {
    if (t >= tEnd) { out.status = 'reached-end'; return out; }
    if (t + h > tEnd) h = tEnd - t;

    // #region dp45-step
    // Evaluate the seven stages. A non-finite stage value means the trial step
    // left the physically valid region, so shrink the step and try again.
    k[0] = k1;
    let ok = true;
    for (let s = 1; s < 7 && ok; s++) {
      let yi = y;
      for (let j = 0; j < s; j++) yi += h * A[s][j] * k[j];
      k[s] = f(t + C[s] * h, yi);
      if (!Number.isFinite(k[s])) ok = false;
    }

    let errRatio = Infinity;
    let yNew = NaN;
    if (ok) {
      let y5 = y, y4 = y;
      for (let s = 0; s < 7; s++) { y5 += h * B5[s] * k[s]; y4 += h * B4[s] * k[s]; }
      const scale = atol + rtol * Math.max(Math.abs(y), Math.abs(y5));
      errRatio = Math.abs(y5 - y4) / scale;
      yNew = y5;
    }
    // #endregion

    if (ok && errRatio <= 1) {
      // Accept. Stage 7 is evaluated at (t+h, y5), so it is the next step's k1 (FSAL).
      t += h;
      y = yNew;
      k1 = k[6];
      out.t.push(t); out.y.push(y); out.dydt.push(k1);
      out.steps++;
      if (opts.stop && opts.stop(t, y, k1)) { out.status = 'stopped'; return out; }
      const factor = errRatio === 0 ? 5 : Math.min(5, 0.9 * Math.pow(errRatio, -0.2));
      h = Math.min(hMax, h * factor);
    } else {
      out.rejected++;
      h *= ok ? Math.max(0.1, 0.9 * Math.pow(errRatio, -0.25)) : 0.25;
      if (h < 1e-300 || h < Math.abs(t) * 1e-15) {
        out.status = 'step-size-underflow';
        return out;
      }
    }
  }
  out.status = 'max-steps';
  return out;
}

/**
 * Cubic Hermite interpolation between accepted steps, using the stored
 * derivatives. Used to locate events such as "front reaches 95% of
 * equilibrium" between output points without re-integrating.
 *
 * @param {{t:number[], y:number[], dydt:number[]}} sol
 * @param {number} target  value of y to locate
 * @returns {number|null}  time at which y first reaches `target` (y assumed increasing), or null
 */
export function firstCrossing(sol, target) {
  const { t, y, dydt } = sol;
  for (let i = 1; i < t.length; i++) {
    if (y[i] >= target && y[i - 1] < target) {
      const h = t[i] - t[i - 1];
      const p = (s) => {
        const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s;
        const h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
        return h00 * y[i - 1] + h10 * h * dydt[i - 1] + h01 * y[i] + h11 * h * dydt[i] - target;
      };
      // Bisection on the interpolant: robust and plenty fast for 60 iterations.
      let lo = 0, hi = 1;
      for (let it = 0; it < 60; it++) {
        const mid = 0.5 * (lo + hi);
        if (p(mid) < 0) lo = mid; else hi = mid;
      }
      return t[i - 1] + 0.5 * (lo + hi) * h;
    }
  }
  return null;
}
