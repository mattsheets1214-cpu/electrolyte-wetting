// Runs the Python reference model INSIDE Pyodide (the same WebAssembly
// runtime the website loads in the browser) and checks that it agrees with the
// JavaScript solver. This proves the "Run the Python model in your browser"
// feature works and that the two independent implementations agree.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import { loadPyodide } from 'pyodide';
import { solveModeA, solveModeB } from '../src/physics/index.js';
import { BASE } from '../src/physics/checks.js';

const source = fs.readFileSync(new URL('../python/wetting/model.py', import.meta.url), 'utf8');
let py;

beforeAll(async () => {
  py = await loadPyodide();
  py.FS.writeFile('/home/pyodide/wetting_model.py', source);
  py.runPython('import sys; sys.path.insert(0, "/home/pyodide"); import wetting_model as wm');
}, 120000);

describe('Python model running in Pyodide (WebAssembly) agrees with the JS solver', () => {
  it('Mode A times', () => {
    for (const X of [70e-6, 0.01, 0.05]) {
      const tPy = py.runPython(`wm.mode_a(0.5e-6, 29.4e-3, 30.0, 4.4e-3, 0.0, ${X}, 1.0)["t_target"]`);
      const tJs = solveModeA({ ...BASE, X }).tTarget;
      expect(Math.abs(tPy - tJs) / tJs).toBeLessThan(1e-12);
    }
  });
  it('Mode B fill fraction and t95 (different integrators)', () => {
    for (const pg0 of [101.3e3, 10e3, 1e3]) {
      const res = py.runPython(`r = wm.mode_b(0.5e-6, 29.4e-3, 30.0, 4.4e-3, 101300.0, ${pg0}, 70e-6); (r["fill_num"], r["t95_num"])`).toJs();
      const js = solveModeB({ ...BASE, pg0 });
      expect(Math.abs(res[0] - js.fillNum) / js.fillNum).toBeLessThan(1e-8);
      expect(Math.abs(res[1] - js.t95Num) / js.t95Num).toBeLessThan(1e-6);
    }
  });
});
