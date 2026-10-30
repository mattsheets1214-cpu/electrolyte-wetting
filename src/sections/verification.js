/**
 * Supplementary Section S4 — numerical methods and verification. Rendered
 * inside the Supplementary material page (src/sections/supplement.js).
 * Shows the real solver code and runs the real checks.
 *
 * Code snippets are cut from the actual source files at build time (Vite
 * `?raw` imports + `// #region` markers), so they cannot drift from the code
 * that runs. The checks table is produced by running src/physics/checks.js
 * in the visitor's browser — the same file `npm test` runs.
 */
import capillarySrc from '../physics/capillary.js?raw';
import deadEndSrc from '../physics/deadEnd.js?raw';
import odeSrc from '../physics/ode.js?raw';
import pythonSrc from '../../python/wetting/model.py?raw';
import { runAllChecks, BASE } from '../physics/checks.js';
import { solveModeB, solveModeA, sig, sci, formatTime } from '../physics/index.js';
import { texBlock, tex } from '../ui/math.js';
import { esc } from '../ui/dom.js';
import { createPlot } from '../charts/plot.js';
import { cite } from '../ui/cite.js';
import { eqNumber } from '../ui/markup.js';
import { SUPP_EQUATIONS } from '../content/supplement.js';

const sEq = (id) => `S${SUPP_EQUATIONS.findIndex((e) => e.id === id) + 1}`;

const PYODIDE_VERSION = '314.0.7';
const PYODIDE_URL = `https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION}/`;

function region(src, name) {
  const m = src.match(new RegExp(`// #region ${name}\\n([\\s\\S]*?)\\n\\s*// #endregion`));
  return m ? m[1].replace(/^\n+/, '') : `/* region "${name}" not found — update verification.js */`;
}
const codeBlock = (code, file) => `<pre class="code"><code>${esc(code)}</code></pre><p class="code-src">Excerpt from <code>${file}</code> — the code that runs on this site.</p>`;

export function render(root) {
  const t0 = performance.now();
  const results = runAllChecks();
  const ms = performance.now() - t0;
  const passed = results.filter((r) => r.pass).length;
  const byCat = results.reduce((acc, r) => ((acc[r.category] ||= []).push(r), acc), {});

  root.innerHTML = `
  <h2 id="s4"><span class="sec-num">S4</span> Numerical methods and verification</h2>
  <p class="prose">How the solver works, and the evidence that it solves its equations correctly. The table below was computed in the reader's browser by the same checks that must pass before the site can be deployed.</p>

  <div class="note note--liquid prose" style="font-size:1.05rem">
    <p><b>Verification</b> asks whether the code solves the stated equations correctly. <b>Validation</b> asks whether those equations describe real battery electrodes. This page establishes verification. It cannot establish validation: a verified capillary model is not a validated cell-filling model (paper, <a href="#/paper/discussion-validation">Section 5.6</a>).</p>
  </div>

  <h3 id="live-checks">Verification checks, run live</h3>
  <p><span class="${passed === results.length ? 'pass' : 'fail'}">${passed} of ${results.length} checks passed</span> <span class="muted">in ${sig(ms, 3)} ms on this device.</span></p>
  ${Object.entries(byCat).map(([cat, rs]) => `
    <h4>${esc(cat)}</h4>
    <div class="table-wrap"><table class="checks"><thead><tr><th>Result</th><th>Check</th><th>Measured</th><th>Expected</th></tr></thead><tbody>
    ${rs.map((r) => `<tr><td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓ pass' : '✗ fail'}</td><td>${esc(r.title)}${r.detail ? `<br><span class="small muted">${esc(r.detail)}</span>` : ''}</td><td>${esc(r.measured)}</td><td>${esc(r.expected)}</td></tr>`).join('')}
    </tbody></table></div>`).join('')}

  <h3 id="error-plot">Analytical versus numerical, point by point</h3>
  <figure class="figure"><div class="figure__well figure__well--plain"><div data-role="errplot"></div></div>
    <figcaption>Relative difference between the time at which the numerical Mode B solution reaches each position and the exact implicit solution, for three initial gas pressures. Everything below about 10⁻⁸ is at the level of the solver tolerance.</figcaption></figure>

  <h3 id="convergence">Convergence with solver tolerance</h3>
  <div class="table-wrap"><table><thead><tr><th class="num">Relative tolerance</th><th class="num">Accepted steps</th><th class="num">t₉₅ numerical</th><th class="num">Relative error vs exact t₉₅</th><th class="num">Fill-fraction error</th></tr></thead><tbody data-role="conv"></tbody></table></div>
  <p class="small muted">Mode B, baseline, p<sub>g0</sub> = 101.3 kPa. Exact t₉₅ = <span data-role="t95exact"></span>.</p>

  <h3 id="walkthrough">Solver walkthrough</h3>
  <div class="prose">
    <p><b>1. Capillary pressure.</b> Young–Laplace for a cylinder, with an optional slit geometry. θ = 90° returns exactly zero, so "no drive" is detected reliably.</p>
  </div>
  ${codeBlock(region(capillarySrc, 'capillary-pressure'), 'src/physics/capillary.js')}
  <div class="prose"><p><b>2. Mode A (paper Eqs. (${eqNumber('lwGeneral')})–(${eqNumber('tau')})).</b> Constant drive, so the answer is closed-form: ${tex('L^2 = D_W t')}, ${tex('D_W = r^2\\Delta p/(4\\mu)')}. A non-positive drive returns "does not fill" — never a negative time.</p></div>
  ${codeBlock(region(capillarySrc, 'washburn-coefficient') + '\n\n' + region(capillarySrc, 'mode-a'), 'src/physics/capillary.js')}
  <div class="prose">
    <p><b>3. Mode B (paper Eq. (${eqNumber('deadFront')})) in solver variables.</b> The front equation is singular at ${tex('L = 0')}, so the solver integrates ${tex('y = (L/L_p)^2')} in dimensionless time ${tex('\\hat t = t/T')} (Eq. (${sEq('dimless')})):</p>
    ${texBlock('\\frac{dy}{d\\hat t} = 1 - \\frac{\\beta}{1 - \\sqrt{y}},\\qquad \\beta = \\frac{p_{g0}}{p_L + p_c},\\qquad T = \\frac{4\\mu L_p^2}{r^2(p_L + p_c)}')}
    <p>Dimensionless variables make one tolerance meaningful for nanometre pores and centimetre pores alike. A state with ${tex('y \\ge 1')} (front past the dead end) is unphysical, so the right-hand side returns NaN and the integrator rejects that trial step.</p>
  </div>
  ${codeBlock(region(deadEndSrc, 'mode-b-setup'), 'src/physics/deadEnd.js')}
  <div class="prose"><p><b>4. Integration and stopping.</b> Near equilibrium the front creeps exponentially. Integration stops when a Newton estimate of the remaining change, ${tex("|f/f'|")}, is below 10⁻⁹ of the current value. This uses only the ODE, not the exact answer, so comparing the end state with ${tex('1-\\beta')} is a genuine test.</p></div>
  ${codeBlock(region(deadEndSrc, 'mode-b-solve'), 'src/physics/deadEnd.js')}
  <div class="prose"><p><b>5. The integrator.</b> Adaptive Dormand–Prince 5(4) ${cite('[dormand1980]')}: each step evaluates seven stages, advances with the 5th-order solution and estimates the error from the difference with the embedded 4th-order one. Steps are accepted when the error is below ${tex('\\text{atol} + \\text{rtol}\\,|y|')} and resized by ${tex('0.9\\,\\epsilon^{-1/5}')}.</p></div>
  ${codeBlock(region(odeSrc, 'dormand-prince-tableau') + '\n\n' + region(odeSrc, 'dp45-step'), 'src/physics/ode.js')}

  <h3 id="hand-calc">Hand calculation</h3>
  <div class="prose" style="font-size:1.05rem">
    <ol>
      <li>${tex('p_c = \\frac{2(0.0294)\\cos 30^\\circ}{0.5\\times10^{-6}} = 1.018\\times10^5\\ \\text{Pa} \\approx 101.8\\ \\text{kPa}')}</li>
      <li>${tex('D_W = \\frac{(0.5\\times10^{-6})(0.0294)(0.8660)}{2(0.0044)} = 1.447\\times10^{-6}\\ \\text{m}^2/\\text{s}')}</li>
      <li>${tex('t_{70\\,\\mu m} = (70\\times10^{-6})^2 / D_W = 3.39\\ \\text{ms}')}; ${tex('t_{1\\,cm} = 69.1\\ \\text{s}')}; ${tex('t_{5\\,cm} = 1728\\ \\text{s} = 28.8\\ \\text{min}')}; with ${tex('\\tau = 2')}: ${tex('\\times 4 = 115.2\\ \\text{min}')}.</li>
      <li>Mode B with ${tex('p_L + p_c = 203.1\\ \\text{kPa}')}: ${tex('1 - 101.3/203.1 = 0.501')}; ${tex('1 - 10/203.1 = 0.951')}; ${tex('1 - 1/203.1 = 0.995')}.</li>
    </ol>
    <p>These match the project blueprint to the stated precision and are the targets of the "Hand calculation" checks above. A second, separately coded copy lives in <code>python/make_reference_cases.py</code>, which writes closed-form reference values used by both the JavaScript and Python tests. These copies are <em>numerically</em> independent of the solver but start from the same equations, so they cannot catch a wrong equation; the "Independent physical route" checks above (Young–Laplace curvature, Darcy flow) reach the same results by different physics.</p>
  </div>

  <h3 id="dimensions">Dimensional analysis</h3>
  <div class="table-wrap"><table><thead><tr><th>Quantity</th><th>Expression</th><th>Units</th></tr></thead><tbody>
    <tr><td>Capillary pressure</td><td>${tex('2\\sigma\\cos\\theta/r')}</td><td>(N/m)/m = N/m² = Pa ✓</td></tr>
    <tr><td>Front velocity</td><td>${tex('r^2\\Delta p/(8\\mu L)')}</td><td>m²·Pa/(Pa·s·m) = m/s ✓</td></tr>
    <tr><td>Washburn coefficient</td><td>${tex('r\\sigma\\cos\\theta/(2\\mu)')}</td><td>m·(N/m)/(Pa·s) = m²/s ✓</td></tr>
    <tr><td>Gas pressure</td><td>${tex('p_{g0}L_p/(L_p - L)')}</td><td>Pa·m/m = Pa ✓</td></tr>
    <tr><td>Time scale</td><td>${tex('4\\mu L_p^2/(r^2 P)')}</td><td>Pa·s·m²/(m²·Pa) = s ✓</td></tr>
    <tr><td>Darcy velocity</td><td>${tex('(k/\\mu)\\,\\Delta p/L')}</td><td>m²·Pa/(Pa·s·m) = m/s ✓</td></tr>
    <tr><td>Bundle permeability</td><td>${tex('\\varepsilon r^2/(8\\tau^2)')}</td><td>m² ✓</td></tr>
    <tr><td>β, λ, cos θ, τ, ε, Re, Ca, Bo, ρgL/Δp</td><td>ratios</td><td>dimensionless ✓</td></tr>
  </tbody></table></div>

  <h3 id="python">Run the numerically independent Python model in your browser</h3>
  <div class="prose" style="font-size:1.05rem">
    <p>The site's calculations run in JavaScript for speed. A separate Python implementation (<code>python/wetting/model.py</code>) solves the same equations with a <em>different</em> integrator — classical Runge–Kutta 4 with step doubling. It runs here through <a href="https://pyodide.org/">Pyodide</a>, Python compiled to WebAssembly, so nothing is sent to a server. The first run downloads about 10 MB.</p>
  </div>
  <div class="btn-row"><button class="btn btn--primary" type="button" data-act="py">Run the Python model</button><span class="small muted" data-role="py-status"></span></div>
  <pre class="console" data-role="py-out" aria-live="polite">Press the button to start Python in your browser.</pre>
  <details class="check"><summary>Show python/wetting/model.py</summary><pre class="code"><code>${esc(pythonSrc)}</code></pre></details>

  <h3 id="tests">Automated tests and how to run them</h3>
  <div class="table-wrap"><table><thead><tr><th>Suite</th><th>What it checks</th><th>Command</th></tr></thead><tbody>
    <tr><td>tests/verification.test.js</td><td>Every check in the table above</td><td><code>npm test</code></td></tr>
    <tr><td>tests/physics.test.js</td><td>Shared closed-form reference cases, sign conventions, exact trajectory, validity flags, Darcy relations, sweeps, data files</td><td><code>npm test</code></td></tr>
    <tr><td>tests/pyodide.test.js</td><td>Runs model.py inside Pyodide and compares with the JS solver</td><td><code>npm test</code></td></tr>
    <tr><td>tests/content.test.js</td><td>Paper structure, equation/figure/table numbering, every citation resolves, AI-documentation placeholders stay labelled</td><td><code>npm test</code></td></tr>
    <tr><td>python/tests/test_model.py</td><td>Reference cases, exact trajectory, SciPy Radau cross-check, scalings, invalid inputs</td><td><code>python -m pytest python/tests</code></td></tr>
  </tbody></table></div>
  <p class="small muted">The GitHub Actions workflow runs all of these on every pull request and before every deployment; a failure blocks publishing.</p>`;

  // error plot
  const series = [101.3e3, 10e3, 1e3].map((pg0, k) => {
    const b = solveModeB({ ...BASE, pg0 });
    const xs = [], ys = [];
    b.series.frac.forEach((lam, i) => {
      if (i === 0 || lam > 0.999 * b.fillEq) return;
      const err = Math.abs(b.series.t[i] - b.exactTime(lam)) / b.exactTime(lam);
      xs.push(lam / b.fillEq); ys.push(Math.max(err, 1e-16));
    });
    return { name: `p_g0 = ${pg0 / 1e3} kPa`, x: xs, y: ys, kind: 'points', marker: k === 1 ? 'square' : 'circle', color: ['var(--liquid)', 'var(--gas)', 'var(--ink)'][k] };
  });
  const errPlot = createPlot(root.querySelector('[data-role=errplot]'), { xLabel: 'L / L_eq', yLabel: 'relative error in t', yScale: 'log', height: 280, tipY: (v) => sci(v, 2) });
  errPlot.update({ series, yDomain: [1e-16, 1e-4], hlines: [{ value: 1e-6, label: 'acceptance 10⁻⁶' }] });

  // convergence table
  const conv = root.querySelector('[data-role=conv]');
  const exact = solveModeB(BASE).t95Exact;
  root.querySelector('[data-role=t95exact]').textContent = formatTime(exact, 8).text;
  conv.innerHTML = [1e-4, 1e-6, 1e-8, 1e-10, 1e-12].map((rtol) => {
    const b = solveModeB(BASE, { rtol, atol: rtol * 1e-4 });
    return `<tr><td class="num">${sci(rtol, 1)}</td><td class="num">${b.steps}</td><td class="num">${b.t95Num != null ? formatTime(b.t95Num, 8).text : 'not reached'}</td><td class="num">${b.t95Num != null ? sci(Math.abs(b.t95Num - exact) / exact, 2) : '—'}</td><td class="num">${sci(b.fillRelError, 2)}</td></tr>`;
  }).join('');

  // Pyodide
  const pyBtn = root.querySelector('[data-act=py]');
  const pyOut = root.querySelector('[data-role=py-out]');
  const pyStatus = root.querySelector('[data-role=py-status]');
  pyBtn.addEventListener('click', async () => {
    pyBtn.disabled = true;
    pyStatus.textContent = 'Downloading and starting Python (WebAssembly)…';
    pyOut.textContent = '';
    try {
      const mod = await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`);
      const py = await mod.loadPyodide({ indexURL: PYODIDE_URL });
      py.FS.writeFile('/home/pyodide/wetting_model.py', pythonSrc);
      const report = py.runPython('import sys; sys.path.insert(0, "/home/pyodide"); import wetting_model as wm; wm.baseline_report()');
      const pyVals = py.runPython('r = wm.mode_b(0.5e-6, 29.4e-3, 30.0, 4.4e-3, 101300.0, 101300.0, 70e-6); (r["fill_num"], r["t95_num"])').toJs();
      const js = solveModeB(BASE);
      const ver = py.runPython('import sys; sys.version.split()[0]');
      pyOut.textContent = `Python ${ver} running in your browser via Pyodide ${PYODIDE_VERSION}\n\n${report}\n\nCross-check, Mode B at 101.3 kPa:\n  Python (RK4 + step doubling): fill = ${pyVals[0].toPrecision(10)}, t95 = ${(pyVals[1] * 1e3).toPrecision(10)} ms\n  JavaScript (Dormand–Prince):  fill = ${js.fillNum.toPrecision(10)}, t95 = ${(js.t95Num * 1e3).toPrecision(10)} ms\n  relative difference in t95: ${(Math.abs(pyVals[1] - js.t95Num) / js.t95Num).toExponential(2)}`;
      pyStatus.textContent = 'Done.';
    } catch (err) {
      pyOut.textContent = `Python could not start: ${err.message || err}\n\nThis needs WebAssembly and access to cdn.jsdelivr.net. Everything else on the site works without it; the same Python code is also run by the automated tests.`;
      pyStatus.textContent = 'Failed.';
    } finally {
      pyBtn.disabled = false;
    }
  });

  return () => errPlot.destroy();
}
