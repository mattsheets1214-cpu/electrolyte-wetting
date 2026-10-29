// Unit tests that go beyond the shared verification suite: shared reference
// cases (also used by the Python tests), units, formatting and edge cases.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  solveModeA, solveModeB, capillaryPressure, cosDeg, validityChecks, requiredRadius,
  requiredGasPressure, formatTime, timeSweep, vacuumSweep, exactTimeHat,
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

describe('challenge', () => {
  it('4 cm in 30 min at baseline needs r ≥ 0.307 µm; μ = 8 mPa·s needs ≥ 0.559 µm', () => {
    const a = requiredRadius({ X: 0.04, tMax: 1800, sigma: 29.4e-3, thetaDeg: 30, mu: 4.4e-3 });
    const b = requiredRadius({ X: 0.04, tMax: 1800, sigma: 29.4e-3, thetaDeg: 30, mu: 8e-3 });
    expect(a.r * 1e6).toBeCloseTo(0.3072, 3);
    expect(b.r * 1e6).toBeCloseTo(0.5586, 3);
  });
  it('is infeasible without applied pressure when θ ≥ 90°', () => {
    expect(requiredRadius({ X: 0.04, tMax: 1800, sigma: 0.03, thetaDeg: 95, mu: 4e-3 }).feasible).toBe(false);
  });
  it('gas limit for ≥ 95 % fill at r = 0.307 µm is ≈ 13.4 kPa abs', () => {
    const g = requiredGasPressure({ fillTarget: 0.95, pL: 101300, sigma: 29.4e-3, thetaDeg: 30, r: 0.30718e-6 });
    expect(g.pg0Max / 1e3).toBeCloseTo(13.35, 1);
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
