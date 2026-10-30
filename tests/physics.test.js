// Unit tests that go beyond the shared verification suite: shared reference
// cases (also used by the Python tests), units, formatting and edge cases.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  solveModeA, solveModeB, capillaryPressure, cosDeg, validityChecks, formatTime, timeSweep, vacuumSweep, exactTimeHat,
} from '../src/physics/index.js';
import { BASE } from '../src/physics/checks.js';
import { toSIParams, DEFAULTS, PARAMETERS } from '../src/data/parameters.js';
import { PRESETS } from '../src/data/presets.js';

const ref = JSON.parse(fs.readFileSync(new URL('./fixtures/reference_cases.json', import.meta.url)));
const relErr = (a, b) => Math.abs(a - b) / Math.abs(b);

describe('shared reference cases (tests/fixtures/reference_cases.json)', () => {
  for (const c of ref.modeA) {
    it(`Mode A: ${c.name}`, () => {
      const a = solveModeA({ ...c.inputs });
      if (c.expected.fills === false) { expect(a.fills).toBe(false); expect(a.tTarget).toBe(Infinity); return; }
      expect(relErr(a.pc, c.expected.pc)).toBeLessThan(1e-9);
      expect(relErr(a.tTarget, c.expected.tTarget)).toBeLessThan(1e-9);
    });
  }
  for (const c of ref.modeB) {
    it(`Mode B: ${c.name}`, () => {
      const b = solveModeB({ ...c.inputs });
      if (c.expected.fills === false) { expect(b.fills).toBe(false); return; }
      expect(relErr(b.fillEq, c.expected.fillEq)).toBeLessThan(1e-9);
      expect(relErr(b.fillNum, c.expected.fillEq)).toBeLessThan(1e-6);
      expect(relErr(b.t95Exact, c.expected.t95)).toBeLessThan(1e-9);
      expect(relErr(b.t95Num, c.expected.t95)).toBeLessThan(1e-5);
    });
  }
});

describe('sign conventions', () => {
  it('cos(90°) is exactly zero', () => expect(cosDeg(90)).toBe(0));
  it('p_c is positive below 90°, zero at 90°, negative above', () => {
    expect(capillaryPressure(0.03, 30, 1e-6)).toBeGreaterThan(0);
    expect(capillaryPressure(0.03, 90, 1e-6)).toBe(0);
    expect(capillaryPressure(0.03, 120, 1e-6)).toBeLessThan(0);
  });
  it('slit geometry gives half the cylinder capillary pressure at equal r = h', () => {
    expect(capillaryPressure(0.03, 30, 1e-6, 'slit') / capillaryPressure(0.03, 30, 1e-6)).toBeCloseTo(0.5, 12);
  });
  it('Mode B can fill a non-wetting pore if the gas was evacuated (p_L + p_c > p_g0)', () => {
    const b = solveModeB({ ...BASE, thetaDeg: 120, pg0: 1e3 });
    expect(b.fills).toBe(true);
    expect(b.pc).toBeLessThan(0);
    expect(b.fillEq).toBeGreaterThan(0.9);
  });
});

describe('exact Mode B trajectory', () => {
  it('reduces to t̂ = λ² when β = 0', () => expect(exactTimeHat(0.7, 0)).toBeCloseTo(0.49, 14));
  it('is infinite at equilibrium', () => expect(exactTimeHat(0.5, 0.5)).toBe(Infinity));
  it('has derivative 2λ(1−λ)/(1−β−λ)', () => {
    const beta = 0.3, lam = 0.4, h = 1e-6;
    const d = (exactTimeHat(lam + h, beta) - exactTimeHat(lam - h, beta)) / (2 * h);
    expect(relErr(d, (2 * lam * (1 - lam)) / (1 - beta - lam))).toBeLessThan(1e-8);
  });
  it('perfect vacuum fills the pore to the dead end', () => {
    const b = solveModeB({ ...BASE, pg0: 0 });
    expect(b.fillEq).toBe(1);
    expect(b.fillNum).toBeGreaterThan(1 - 1e-6);
  });
});

describe('validity indicators', () => {
  it('baseline: laminar, gravity negligible, quasi-steady', () => {
    const a = solveModeA(BASE);
    const v = Object.fromEntries(validityChecks(BASE, { mode: 'A', D: a.D, Lref: a.Lpath, tRef: a.tTarget }).map((c) => [c.id, c]));
    expect(v.reynolds.level).toBe('ok');
    expect(v.bond.level).toBe('ok');
    expect(v.inertia.level).toBe('ok');
    expect(v.idealized.level).toBe('info');
  });
  it('flags θ near 90° and tiny pores', () => {
    const ids = validityChecks({ ...BASE, thetaDeg: 88, r: 5e-9 }, { mode: 'A' }).map((c) => c.id);
    expect(ids).toContain('theta');
    expect(ids).toContain('continuum');
  });
});

describe('sweeps feeding the plots', () => {
  it('Plot 2 slopes match theory', () => {
    expect(timeSweep(BASE, 'X').series[0].slope).toBeCloseTo(2, 6);
    expect(timeSweep(BASE, 'mu').series[0].slope).toBeCloseTo(1, 6);
    const r = timeSweep(BASE, 'r');
    expect(r.series[0].slope).toBeCloseTo(-1, 6);
    expect(r.series[1].slope).toBeCloseTo(-2, 6);
  });
  it('Plot 3 numerical end states sit on the exact curve', () => {
    const v = vacuumSweep(BASE, 20);
    for (const n of v.numerical) {
      const exact = 1 - n.pg0 / (101300 + capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r));
      expect(relErr(n.fill, exact)).toBeLessThan(1e-6);
    }
  });
});

describe('formatting and data files', () => {
  it('formats times in readable units', () => {
    expect(formatTime(3.39e-3).unit).toBe('ms');
    expect(formatTime(69).unit).toBe('s');
    expect(formatTime(1728).unit).toBe('min');
    expect(formatTime(Infinity).value).toBe('∞');
  });
  it('defaults convert to the baseline SI set', () => {
    const si = toSIParams(DEFAULTS);
    for (const k of ['r', 'sigma', 'thetaDeg', 'mu', 'tau', 'X', 'pg0', 'Lp']) expect(relErr(si[k], BASE[k])).toBeLessThan(1e-12);
  });
  it('every parameter has a stated basis and note', () => {
    for (const [k, p] of Object.entries(PARAMETERS)) {
      expect(['measured', 'assumption', 'geometry'], k).toContain(p.basis);
      expect(p.note.length, k).toBeGreaterThan(20);
      expect(p.default >= p.min && p.default <= p.max, k).toBe(true);
    }
  });
  it('every preset produces a valid result', () => {
    for (const pr of PRESETS) {
      const si = toSIParams({ ...DEFAULTS, ...pr.values });
      const res = pr.mode === 'A' ? solveModeA(si) : solveModeB(si);
      expect(res.ok, pr.id).toBe(true);
    }
  });
});

// ------------------------------------------------------------------ Phase 3 audit tests
import {
  darcyFrontTime, darcyFlowRate, bundlePermeability, kozenyCarman, capillaryPressureHydraulic, gravityCheck,
} from '../src/physics/index.js';
import { errorsForMode } from '../src/ui/modeErrors.js';

describe('audit M2: capillary pressure from Young–Laplace curvature', () => {
  // Δp = σ(1/R₁ + 1/R₂); cylinder: spherical cap R₁ = R₂ = r/cos θ; slit: R₁ = h/cos θ, R₂ = ∞.
  const yl = (sigma, R1, R2) => sigma * (1 / R1 + 1 / R2);
  for (const th of [0, 30, 60, 120]) {
    it(`cylinder, θ = ${th}°`, () => {
      const R = BASE.r / Math.cos((th * Math.PI) / 180);
      expect(relErr(capillaryPressure(BASE.sigma, th, BASE.r), yl(BASE.sigma, R, R))).toBeLessThan(1e-12);
    });
    it(`slit, θ = ${th}°`, () => {
      const R1 = BASE.r / Math.cos((th * Math.PI) / 180);
      expect(relErr(capillaryPressure(BASE.sigma, th, BASE.r, 'slit'), yl(BASE.sigma, R1, Infinity))).toBeLessThan(1e-12);
    });
  }
  it('hand value at the baseline: 2(0.0294)cos30°/0.5 µm = 101 845 Pa', () => {
    expect(relErr(capillaryPressure(0.0294, 30, 0.5e-6), 101845.3)).toBeLessThan(1e-5);
  });
  it('hydraulic-radius form σcosθ/r_h equals 2σcosθ/r for a cylinder (r_h = r/2)', () => {
    expect(relErr(capillaryPressureHydraulic(BASE.sigma, 30, BASE.r / 2), capillaryPressure(BASE.sigma, 30, BASE.r))).toBeLessThan(1e-12);
  });
});

describe('audit M1: Darcy flow and the capillary-bundle equivalence', () => {
  const pc = capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r);
  it('ε = 0.35, τ = 1.6, r = 0.5 µm: Darcy front reaches 1 cm in 176.96 s, equal to Mode A', () => {
    const k = bundlePermeability({ eps: 0.35, r: BASE.r, tau: 1.6 });
    const tD = darcyFrontTime({ X: 0.01, k, eps: 0.35, mu: BASE.mu, P: pc });
    const tA = solveModeA({ ...BASE, X: 0.01, tau: 1.6 }).tTarget;
    expect(Math.abs(tD - 176.96)).toBeLessThan(0.01);
    expect(relErr(tD, tA)).toBeLessThan(1e-12);
  });
  it('porosity cancels for the bundle model', () => {
    const t = (eps) => darcyFrontTime({ X: 0.01, k: bundlePermeability({ eps, r: BASE.r, tau: 1.6 }), eps, mu: BASE.mu, P: pc });
    expect(relErr(t(0.2), t(0.5))).toBeLessThan(1e-12);
  });
  it('Kozeny–Carman (d = 10 µm, ε = 0.35) gives a different time, about 48 s to 1 cm', () => {
    const kc = kozenyCarman({ eps: 0.35, d: 10e-6 });
    const t = darcyFrontTime({ X: 0.01, k: kc.k, eps: 0.35, mu: BASE.mu, P: capillaryPressureHydraulic(BASE.sigma, BASE.thetaDeg, kc.rh) });
    expect(t).toBeGreaterThan(47); expect(t).toBeLessThan(49);
    expect(relErr(t, solveModeA({ ...BASE, X: 0.01 }).tTarget)).toBeGreaterThan(0.2);
  });
  it('steady slab flow Q = kAΔp/(μL) has the right units and scaling', () => {
    const q1 = darcyFlowRate({ k: 1e-14, A: 1e-4, dp: 5e4, mu: 4.4e-3, L: 70e-6 });
    expect(relErr(q1, (1e-14 * 1e-4 * 5e4) / (4.4e-3 * 70e-6))).toBeLessThan(1e-12);
    expect(relErr(darcyFlowRate({ k: 1e-14, A: 1e-4, dp: 1e5, mu: 4.4e-3, L: 70e-6 }), 2 * q1)).toBeLessThan(1e-12);
  });
  it('no positive drive → the Darcy front never arrives (no negative time)', () => {
    expect(darcyFrontTime({ X: 0.01, k: 1e-14, eps: 0.35, mu: BASE.mu, P: -1e3 })).toBe(Infinity);
  });
});

describe('audit m3: errors are reported only for the active mode', () => {
  const bad = { ...BASE, r: 2e-6, Lp: 1e-6 }; // L_p ≤ r: invalid for Mode B only
  const resA = solveModeA(bad), resB = solveModeB(bad);
  it('L_p = 1 µm with r = 2 µm does not blank Mode A', () => {
    expect(resA.ok).toBe(true);
    expect(resB.ok).toBe(false);
    expect(errorsForMode('A', resA, resB)).toEqual([]);
  });
  it('the same inputs are still reported in Mode B, on the L_p field', () => {
    expect(errorsForMode('B', resA, resB).map((e) => e.field)).toContain('Lp');
  });
  it('a bad shared input (r = 0) is reported in both modes', () => {
    const p = { ...BASE, r: 0 };
    for (const m of ['A', 'B']) expect(errorsForMode(m, solveModeA(p), solveModeB(p)).map((e) => e.field)).toContain('r');
  });
});

describe('audit m1: gravity criterion for a vertical front', () => {
  const ctxFor = (p) => { const a = solveModeA(p); return { mode: 'A', D: a.D, Lref: a.Lpath, tRef: a.tTarget, height: p.X }; };
  it('ratio = ρgL/Δp and Jurin height = 2σcosθ/(ρgr), checked by hand at the baseline', () => {
    const g = gravityCheck(BASE, ctxFor(BASE));
    const pc = (2 * 0.0294 * Math.cos(Math.PI / 6)) / 0.5e-6;
    expect(relErr(g.ratio, (1303 * 9.81 * 0.01) / pc)).toBeLessThan(1e-9);
    expect(relErr(g.hJurin, pc / (1303 * 9.81))).toBeLessThan(1e-9);
    expect(g.hJurin).toBeGreaterThan(7); // ≈ 8 m: negligible over centimetres
  });
  it('baseline is "ok"; a 5 µm pore over 10 cm is flagged (ρgL/Δp ≈ 0.13)', () => {
    const lvl = (p) => validityChecks(p, ctxFor(p)).find((c) => c.id === 'gravity').level;
    expect(lvl(BASE)).toBe('ok');
    const big = { ...BASE, r: 5e-6, X: 0.1 };
    expect(gravityCheck(big, ctxFor(big)).ratio).toBeGreaterThan(0.1);
    expect(lvl(big)).toBe('warn');
  });
  it('the head uses the vertical rise X, not the tortuous path τX', () => {
    const p = { ...BASE, tau: 2 };
    const a = solveModeA(p);
    expect(relErr(gravityCheck(p, ctxFor(p)).head, 1303 * 9.81 * p.X)).toBeLessThan(1e-12);
    expect(a.Lpath).toBeCloseTo(2 * p.X, 12);
  });
  it('applied pressure counts in the drive, so it reduces the gravity ratio', () => {
    const p = { ...BASE, dpApplied: 100e3 };
    expect(gravityCheck(p, ctxFor(p)).ratio).toBeLessThan(gravityCheck(BASE, ctxFor(BASE)).ratio);
  });
  it('the Bond-number check is kept and now describes meniscus shape', () => {
    const bond = validityChecks(BASE, ctxFor(BASE)).find((c) => c.id === 'bond');
    expect(bond.title).toMatch(/Meniscus shape/);
    expect(bond.detail).not.toMatch(/vertical pore would fill more slowly/);
  });
});

describe('paper claims that are computed (Section 4.4, Fig. 9)', () => {
  it('numerical dead-end end states match the analytical equilibrium within 1e-6 at every plotted pressure', () => {
    const v = vacuumSweep(BASE);
    for (const n of v.numerical) {
      const exact = 1 - n.pg0 / (BASE.pL + capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r));
      expect(relErr(n.fill, exact)).toBeLessThan(1e-6);
    }
  });
});
