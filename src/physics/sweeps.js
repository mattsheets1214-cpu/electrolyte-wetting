/**
 * sweeps.js — parameter sweeps that feed Plot 2 (time vs a parameter) and
 * Plot 3 (fill fraction vs initial gas pressure). Every point is computed by
 * the same solver functions the lab uses; nothing is hard-coded.
 */
import { solveModeA } from './capillary.js';
import { solveModeB } from './deadEnd.js';

/** n log-spaced values between a and b (inclusive). */
export function logspace(a, b, n) {
  const la = Math.log10(a), lb = Math.log10(b);
  return Array.from({ length: n }, (_, i) => 10 ** (la + ((lb - la) * i) / (n - 1)));
}

/** Least-squares slope of log10(y) vs log10(x), ignoring non-finite points. */
export function logLogSlope(xs, ys) {
  const pts = xs.map((x, i) => [Math.log10(x), Math.log10(ys[i])]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const n = pts.length;
  if (n < 2) return NaN;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let num = 0, den = 0;
  for (const [a, b] of pts) { num += (a - mx) * (b - my); den += (a - mx) ** 2; }
  return num / den;
}

/** Sweep definitions: key in the parameter object, SI range, and expected exponent. */
export const SWEEPS = {
  X: { key: 'X', label: 'Target distance X', range: [10e-6, 0.1], expected: 2, why: 't = 4μτ²X² / (r²Δp): doubling the distance quadruples the time.' },
  mu: { key: 'mu', label: 'Viscosity μ', range: [1e-3, 10e-3], expected: 1, why: 'Viscous resistance is proportional to μ, so time is proportional to μ.' },
  sigma: { key: 'sigma', label: 'Surface tension σ', range: [20e-3, 40e-3], expected: -1, why: 'With pure capillary drive Δp = 2σcosθ/r, so t ∝ 1/σ. (With an applied pressure the exponent is weaker.)' },
  tau: { key: 'tau', label: 'Tortuosity τ', range: [1, 5], expected: 2, why: 'The path is τ times longer, and time grows with the square of path length.' },
  r: { key: 'r', label: 'Pore radius r', range: [0.05e-6, 5e-6], expected: -1, why: 'Pure capillary drive: Δp ∝ 1/r and resistance ∝ 1/r², so t ∝ 1/r. Fixed independent Δp: t ∝ 1/r².' },
};

/**
 * Time-to-target sweep for Plot 2 (Mode A).
 * For r, two series are returned: 'capillary' (Δp_a = 0, drive = p_c(r)) and
 * 'fixed' (Δp_total held at the current base value regardless of r).
 */
export function timeSweep(base, which, n = 40) {
  const def = SWEEPS[which];
  const xs = logspace(def.range[0], def.range[1], n);
  const series = [];
  const tOf = (p) => { const a = solveModeA(p); return a.ok && a.fills ? a.tTarget : NaN; };

  if (which === 'r') {
    const capY = xs.map((r) => tOf({ ...base, r, dpApplied: 0 }));
    const baseA = solveModeA(base);
    const dpFixed = baseA.ok && baseA.fills ? baseA.dpTotal : NaN;
    const fixY = xs.map((r) => (Number.isFinite(dpFixed) ? (4 * base.mu * (base.tau * base.X) ** 2) / (r * r * dpFixed) : NaN));
    series.push({ id: 'capillary', name: 'Pure capillary drive (Δpₐ = 0)', x: xs, y: capY, slope: logLogSlope(xs, capY) });
    series.push({ id: 'fixed', name: `Fixed Δp = current total drive`, x: xs, y: fixY, slope: logLogSlope(xs, fixY) });
  } else {
    const ys = xs.map((x) => tOf({ ...base, [def.key]: x }));
    series.push({ id: which, name: 'Current settings', x: xs, y: ys, slope: logLogSlope(xs, ys) });
  }
  return { def, series, current: base[def.key] };
}

/**
 * Plot 3: equilibrium fill fraction vs initial absolute gas pressure.
 * Exact curve plus numerical ODE end states at a handful of pressures.
 */
export function vacuumSweep(base, nExact = 120, numericalPressures = [0.1e3, 0.3e3, 1e3, 3e3, 10e3, 20e3, 40e3, 60e3, 80e3, 101.3e3]) {
  const pgs = logspace(0.1e3, 101.3e3, nExact);
  const exact = pgs.map((pg0) => { const b = solveModeB({ ...base, pg0 }, { maxSteps: 1 }); return b.ok ? (b.fills ? b.fillEq : 0) : NaN; });
  const numerical = numericalPressures.map((pg0) => {
    const b = solveModeB({ ...base, pg0 }, { rtol: 1e-9 });
    return { pg0, fill: b.ok ? (b.fills ? b.fillNum : 0) : NaN, converged: b.ok && (b.converged || !b.fills) };
  });
  return { exact: { x: pgs, y: exact }, numerical };
}
