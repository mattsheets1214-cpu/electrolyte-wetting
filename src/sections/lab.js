/**
 * Interactive lab — the centrepiece.
 *
 * Data flow (one direction only):
 *   controls (display units) → toSIParams → physics solvers → outputs, plots,
 *   animation, validity checks, explanation.
 * Nothing shown here is hard-coded; every number comes from src/physics/.
 */
import {
  solveModeA, integrateModeA, solveModeB, exactTrajectoryB, validityChecks, timeSweep, vacuumSweep,
  SWEEPS, formatTime, formatLength, sci, sig, P_LIQUID_ABS, requiredRadius, requiredGasPressure, capillaryPressure,
} from '../physics/index.js';
import { PARAMETERS, DEFAULTS, FIXED, toSIParams } from '../data/parameters.js';
import { PRESETS } from '../data/presets.js';
import { MODEL_VS_REALITY } from '../content/modelVsReality.js';
import { createParamControl } from '../ui/controls.js';
import { createPlot } from '../charts/plot.js';
import { PoreAnimation, interp } from '../animations/pore.js';
import { tex, texBlock } from '../ui/math.js';
import { esc, rafThrottle } from '../ui/dom.js';
import { pulse } from '../animations/motion.js';
import { errorsForMode } from '../ui/modeErrors.js';
import { BASE } from '../physics/checks.js';

const LEVEL_TEXT = { ok: 'OK', caution: 'Caution', warn: 'Warning', info: 'Note' };

/** Pick a display unit for a set of lengths (m). */
function lengthUnit(maxM) {
  if (maxM < 1e-3) return { f: 1e6, u: 'µm' };
  if (maxM < 1e-2) return { f: 1e3, u: 'mm' };
  return { f: 1e2, u: 'cm' };
}
function timeUnit(maxS) {
  if (maxS < 1e-3) return { f: 1e6, u: 'µs' };
  if (maxS < 1) return { f: 1e3, u: 'ms' };
  if (maxS < 120) return { f: 1, u: 's' };
  if (maxS < 7200) return { f: 1 / 60, u: 'min' };
  return { f: 1 / 3600, u: 'h' };
}
const subsample = (arr, n) => { if (arr.length <= n) return arr.map((_, i) => i); const out = []; for (let k = 0; k < n; k++) out.push(Math.round((k * (arr.length - 1)) / (n - 1))); return [...new Set(out)]; };

export function render(root) {
  const state = { mode: 'A', values: { ...DEFAULTS }, sweep: 'X', sqrtAxis: false };

  root.innerHTML = `
  <header class="page-head">
    <h1>Interactive lab</h1>
    <p>Change the pore, the liquid and the pressures; every number, plot and animation below is recomputed by the solver. Mode A is an open capillary with an exact solution. Mode B is a dead-end pore where trapped gas pushes back.</p>
  </header>
  <div class="lab">
    <aside class="controls" aria-label="Model inputs">
      <div class="mode-switch" role="group" aria-label="Model mode">
        <button type="button" data-mode="A" aria-pressed="true">Mode A<span>open capillary</span></button>
        <button type="button" data-mode="B" aria-pressed="false">Mode B<span>dead end + trapped gas</span></button>
      </div>
      <fieldset><legend>Scenarios</legend><div class="presets" data-role="presets"></div></fieldset>
      <fieldset data-group="shared"><legend>Pore and liquid (both modes)</legend></fieldset>
      <fieldset data-group="A"><legend>Open capillary (Mode A, Plot 2)</legend></fieldset>
      <fieldset data-group="B"><legend>Dead-end pore (Mode B, Plot 3)</legend>
        <p class="small muted" style="margin:6px 0 0">Liquid-side pressure fixed at ${FIXED.pL.display}. ${FIXED.temperature.display}, properties not temperature-corrected.</p>
      </fieldset>
      <div class="btn-row"><button class="btn" type="button" data-act="reset">Reset to baseline</button></div>
    </aside>

    <div class="lab-main">
      <div data-role="status" role="alert"></div>
      <div class="outputs" data-role="outputs" aria-live="polite"></div>
      <p class="explain" data-role="explain" style="margin-top:var(--space-4)"></p>

      <figure class="figure">
        <div data-role="anim"></div>
        <figcaption><b>Animated pore, driven by the solver.</b> Press Play, drag the time slider, or step through. <span data-role="anim-cap"></span></figcaption>
        <ul class="key"><li><i class="k-liquid"></i>electrolyte</li><li><i class="k-gas"></i>gas</li><li><i class="k-solid"></i>pore wall</li></ul>
      </figure>

      <h2 id="plot-1">Plot 1 · Penetration distance versus time</h2>
      <div class="chart-controls" data-role="p1-controls"></div>
      <figure class="figure"><div class="figure__well figure__well--plain"><div data-role="plot1"></div></div>
        <figcaption data-role="p1-cap"></figcaption></figure>
      <figure class="figure" data-role="plot1b-wrap" hidden><div class="figure__well figure__well--plain"><div data-role="plot1b"></div></div>
        <figcaption>Trapped-gas pressure rises as the liquid compresses it (Boyle's law) until it balances p<sub>L</sub> + p<sub>c</sub>. Absolute pressure.</figcaption></figure>

      <h2 id="plot-2">Plot 2 · Time to target versus one parameter</h2>
      <div class="chart-controls"><label for="sweep-sel">Vary</label>
        <select id="sweep-sel">${Object.entries(SWEEPS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('')}</select>
        <span class="muted">others fixed at the Mode A inputs; log–log axes</span></div>
      <figure class="figure"><div class="figure__well figure__well--plain"><div data-role="plot2"></div></div>
        <figcaption data-role="p2-cap"></figcaption></figure>

      <h2 id="plot-3">Plot 3 · Trapped gas and vacuum</h2>
      <figure class="figure"><div class="figure__well figure__well--plain"><div data-role="plot3"></div></div>
        <figcaption>Equilibrium fill fraction of one idealized dead-end pore against the initial absolute pressure of the non-condensable gas sealed in it (p<sub>g0</sub>; solvent vapour and gas dissolution are not modelled). The line is the exact formula 1 − p<sub>g0</sub>/(p<sub>L</sub> + p<sub>c</sub>); squares are where the numerical ODE solution actually stopped. Real, connected electrodes trap much less gas than this worst case, because gas can escape through neighbouring unfilled pores.</figcaption></figure>

      <h2 id="validity">Is the model valid here?</h2>
      <ul class="validity" data-role="validity"></ul>

      <h2 id="model-vs-reality">Model versus reality</h2>
      <div class="table-wrap"><table><tbody>${MODEL_VS_REALITY.map((r) => `<tr><th scope="row" style="width:28%">${esc(r.head)}</th><td>${esc(r.body)}</td></tr>`).join('')}</tbody></table></div>

      <h2 id="challenge">Guided engineering challenge</h2>
      <div data-role="challenge"></div>
    </div>
  </div>`;

  // ------------------------------------------------------------- controls
  const controls = {};
  const groups = { shared: ['r', 'sigma', 'thetaDeg', 'mu'], A: ['dpApplied', 'X', 'tau'], B: ['pg0', 'Lp'] };
  const onChange = (key, v) => { state.values[key] = v; schedule(); };
  for (const [g, keys] of Object.entries(groups)) {
    const fs = root.querySelector(`[data-group="${g}"]`);
    const legend = fs.querySelector('legend');
    const after = legend.nextSibling;
    for (const k of keys) {
      const c = createParamControl(k, PARAMETERS[k], state.values[k], onChange);
      controls[k] = c;
      fs.insertBefore(c.node, g === 'B' ? fs.querySelector('p') : null);
    }
    void after;
  }

  const presetBox = root.querySelector('[data-role=presets]');
  presetBox.innerHTML = PRESETS.map((p) => `<button type="button" class="btn" data-preset="${p.id}" title="${esc(p.summary)}">${esc(p.name)}</button>`).join('');
  presetBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]');
    if (!b) return;
    const p = PRESETS.find((q) => q.id === b.dataset.preset);
    state.values = { ...DEFAULTS, ...p.values };
    for (const [k, c] of Object.entries(controls)) c.set(state.values[k]);
    setMode(p.mode);
  });
  root.querySelector('[data-act=reset]').addEventListener('click', () => {
    state.values = { ...DEFAULTS };
    for (const [k, c] of Object.entries(controls)) c.set(state.values[k]);
    update();
  });
  const modeBtns = root.querySelectorAll('[data-mode]');
  function setMode(m) {
    state.mode = m;
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    hostA.hidden = m !== 'A'; hostB.hidden = m !== 'B';
    update();
  }
  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  // ------------------------------------------------------------- figures
  const animHost = root.querySelector('[data-role=anim]');
  const hostA = document.createElement('div'), hostB = document.createElement('div');
  animHost.append(hostA, hostB);
  const animA = new PoreAnimation(hostA, { deadEnd: false });
  const animB = new PoreAnimation(hostB, { deadEnd: true });
  hostB.hidden = true;

  const plot1 = createPlot(root.querySelector('[data-role=plot1]'), { xLabel: 't', yLabel: 'L', height: 300 });
  const plot1b = createPlot(root.querySelector('[data-role=plot1b]'), { xLabel: 't', yLabel: 'p_g (kPa abs)', height: 220, yZero: false });
  const plot2 = createPlot(root.querySelector('[data-role=plot2]'), { xLabel: '', yLabel: 'time to target (s)', xScale: 'log', yScale: 'log', height: 300 });
  const plot3 = createPlot(root.querySelector('[data-role=plot3]'), {
    xLabel: 'initial non-condensable gas pressure p_g0 (kPa abs)', yLabel: 'equilibrium fill (%)', xScale: 'log', height: 300,
    xFormat: (v) => String(Number(v.toPrecision(3))), tipX: (v) => `${sig(v, 3)} kPa`, tipY: (v) => `${sig(v, 4)} %`,
  });
  const sweepSel = root.querySelector('#sweep-sel');
  sweepSel.addEventListener('change', () => { state.sweep = sweepSel.value; update(); });

  const p1controls = root.querySelector('[data-role=p1-controls]');
  p1controls.innerHTML = '<label><input type="checkbox" data-role="sqrt"> Plot against √t (a straight line means L ∝ √t)</label>';
  p1controls.querySelector('[data-role=sqrt]').addEventListener('change', (e) => { state.sqrtAxis = e.target.checked; update(); });

  // ------------------------------------------------------------- update
  const status = root.querySelector('[data-role=status]');
  const outputs = root.querySelector('[data-role=outputs]');
  const explain = root.querySelector('[data-role=explain]');
  const validityList = root.querySelector('[data-role=validity]');
  const animCap = root.querySelector('[data-role=anim-cap]');

  function showErrors(errors) {
    for (const c of Object.values(controls)) c.setError('');
    for (const e of errors) controls[e.field]?.setError(e.message);
    status.innerHTML = errors.length ? `<div class="status-msg"><b>Some inputs can't be used.</b> Fix the highlighted values: ${errors.map((e) => esc(e.message)).join(' ')}</div>` : '';
  }

  const out = (label, value, unit, how, primary = false) =>
    `<div class="out${primary ? ' out--primary' : ''}"><span class="out__label">${label}</span><span class="out__value">${value}${unit ? `<small>${unit}</small>` : ''}</span>${how ? `<span class="out__how">${how}</span>` : ''}</div>`;

  function update() {
    const p = toSIParams(state.values);
    const resA = solveModeA(p);
    const resB = solveModeB(p);
    // Only the active mode's errors (shared fields are checked by both modes).
    const uniq = errorsForMode(state.mode, resA, resB);
    showErrors(uniq);
    if (uniq.length) { outputs.innerHTML = ''; explain.textContent = ''; return; }

    if (state.mode === 'A') renderModeA(p, resA); else renderModeB(p, resB);
    // A plot that belongs to the other mode is drawn only when that mode's inputs are valid.
    if (resA.ok) renderPlot2(p); else plot2.update({ series: [] });
    if (resB.ok) renderPlot3(p, resB); else plot3.update({ series: [] });
    pulse(outputs.querySelector('.out--primary'));
  }
  const schedule = rafThrottle(update);

  function renderModeA(p, a) {
    const pcK = a.pc / 1e3;
    outputs.innerHTML = [
      out('Time to target', a.fills ? formatTime(a.tTarget).value : '∞', a.fills ? formatTime(a.tTarget).unit : '', a.fills ? `X = ${formatLength(p.X).text}, path τX = ${formatLength(a.Lpath).text}` : 'does not fill', true),
      out('Capillary pressure', sig(pcK, 4), 'kPa', '2σ cos θ / r'),
      out('Total drive', sig(a.dpTotal / 1e3, 4), 'kPa', 'p_c + Δpₐ'),
      out('Washburn coefficient', a.fills ? sci(a.D, 4) : '0', 'm²/s', 'D = r²Δp/(4μ), L² = D t'),
    ].join('');

    if (!a.fills) {
      explain.innerHTML = `${esc(a.reason)} Try lowering the contact angle below 90° or adding an applied pressure larger than |p<sub>c</sub>| = ${sig(Math.abs(pcK), 3)} kPa.`;
      plot1.update({ series: [] });
      animCap.textContent = 'No filling for these inputs.';
      validityList.innerHTML = renderValidity(validityChecks(p, { mode: 'A' }));
      root.querySelector('[data-role=plot1b-wrap]').hidden = true;
      return;
    }
    const tt = formatTime(a.tTarget).text;
    explain.innerHTML = `The meniscus pulls with p<sub>c</sub> = ${sig(pcK, 3)} kPa${p.dpApplied ? `, and the applied pressure adds ${sig(p.dpApplied / 1e3, 3)} kPa` : ''}, for a net drive of ${sig(a.dpTotal / 1e3, 3)} kPa. Viscous drag grows with the length of the liquid column, so the front slows as √t. To travel ${formatLength(p.X).text}${p.tau > 1 ? ` (a ${formatLength(a.Lpath).text} path with τ = ${sig(p.tau, 3)})` : ''} takes <strong>${tt}</strong>. Twice as far would take four times as long (${formatTime(4 * a.tTarget).text}); twice the viscosity, twice as long.`;

    // Plot 1: analytical curve + numerical points
    const tEnd = a.tTarget * 1.25;
    const tu = timeUnit(tEnd), lu = lengthUnit(p.X * 1.12);
    const N = 160;
    const tx = Array.from({ length: N + 1 }, (_, i) => (tEnd * i) / N);
    const num = integrateModeA(p, tEnd);
    const idx = subsample(num.t, 14);
    const xAxis = (t) => (state.sqrtAxis ? Math.sqrt(t * tu.f) : t * tu.f);
    plot1.setOptions({ xLabel: state.sqrtAxis ? `√t (√${tu.u})` : `time t (${tu.u})`, yLabel: `straight-line distance X (${lu.u})`, tipY: (v) => `${sig(v, 4)} ${lu.u}`, tipX: (v) => (state.sqrtAxis ? `√t = ${sig(v, 4)}` : `${sig(v, 4)} ${tu.u}`) });
    plot1.update({
      series: [
        { id: 'exact', name: 'Analytical X = √(D t)/τ', x: tx.map(xAxis), y: tx.map((t) => a.X(t) * lu.f), kind: 'line', color: 'var(--liquid)' },
        { id: 'num', name: `Numerical (Dormand–Prince, ${num.steps} steps)`, x: idx.map((i) => xAxis(num.t[i])), y: idx.map((i) => num.X[i] * lu.f), kind: 'points', color: 'var(--ink)' },
      ],
      hlines: [{ value: p.X * lu.f, label: `target ${formatLength(p.X).text}` }],
      vlines: [{ value: xAxis(a.tTarget), label: tt }],
      description: `Distance rises as the square root of time and reaches the target at ${tt}.`,
    });
    root.querySelector('[data-role=p1-cap]').innerHTML = `The line is the exact solution; the open circles are the numerical solution of ds/dt = r²Δp/(4μ). They agree to better than 10⁻⁶ (see Code &amp; verification). ${state.sqrtAxis ? 'Against √t the line is straight.' : 'Tick the box to replot against √t.'}`;
    root.querySelector('[data-role=plot1b-wrap]').hidden = true;

    animA.load({
      tEnd: a.tTarget * 1.5625, // time for the front to reach 1.25 × the target path (t ∝ L²)
      frac: (t) => a.L(t) / (1.25 * a.Lpath),
      lengthDrawn: 1.25 * a.Lpath,
      thetaDeg: p.thetaDeg,
      targetFrac: 0.8,
      targetLabel: `target ${formatLength(p.X).text}`,
    });
    animCap.textContent = 'The open end lets gas escape freely, so the drive stays constant.';
    validityList.innerHTML = renderValidity(validityChecks(p, { mode: 'A', D: a.D, Lref: a.Lpath, tRef: a.tTarget, height: p.X }));
  }

  function renderModeB(p, b) {
    if (!b.fills) {
      outputs.innerHTML = [out('Equilibrium fill', '0', '%', 'no liquid enters', true), out('Capillary pressure', sig(b.pc / 1e3, 4), 'kPa', '2σ cos θ / r')].join('');
      explain.textContent = b.reason;
      plot1.update({ series: [] });
      root.querySelector('[data-role=plot1b-wrap]').hidden = true;
      validityList.innerHTML = renderValidity(validityChecks(p, { mode: 'B' }));
      return;
    }
    const t95 = b.t95Num != null ? formatTime(b.t95Num) : null;
    outputs.innerHTML = [
      out('Equilibrium fill L_eq/L_p', sig(b.fillNum * 100, 4), '%', `exact ${sig(b.fillEq * 100, 6)} %, numerical ${sig(b.fillNum * 100, 6)} %`, true),
      out('Time to 95 % of equilibrium', t95 ? t95.value : '—', t95 ? t95.unit : '', b.t95Num != null ? `exact ${formatTime(b.t95Exact).text}` : 'solver did not reach equilibrium'),
      out('Capillary pressure', sig(b.pc / 1e3, 4), 'kPa', '2σ cos θ / r'),
      out('Final gas pressure', sig((p.pg0 / (1 - b.fillNum)) / 1e3, 4), 'kPa abs', `p_L + p_c = ${sig(b.P / 1e3, 4)} kPa`),
    ].join('');
    explain.innerHTML = `Non-condensable gas is sealed in the pore at ${sig(p.pg0 / 1e3, 3)} kPa absolute; the reservoir is then vented to atmosphere. The liquid side pushes with p<sub>L</sub> + p<sub>c</sub> = ${sig(b.P / 1e3, 4)} kPa. As the liquid advances the gas is squeezed (Boyle's law) until its pressure matches that push, which happens when the pore is <strong>${sig(b.fillEq * 100, 4)} %</strong> full. ${p.pg0 > 20e3 ? 'Lowering the initial gas pressure — evacuating before filling — is the only way to fill it further in this model.' : 'Because so little gas was left, the liquid nearly reaches the dead end.'} The fill fraction does not depend on viscosity or pore length; the time does (t ∝ μL<sub>p</sub>²).`;

    // Plot 1: exact trajectory + numerical points
    const ex = exactTrajectoryB(b, p.Lp);
    const tEnd = Math.min(b.series.t[b.series.t.length - 1], (b.t95Num || b.t95Exact) * 3);
    const tu = timeUnit(tEnd), lu = lengthUnit(p.Lp);
    const keep = ex.t.map((t, i) => (t <= tEnd ? i : -1)).filter((i) => i >= 0);
    const nIdx = subsample(b.series.t, 40).filter((i) => b.series.t[i] <= tEnd);
    const xAxis = (t) => (state.sqrtAxis ? Math.sqrt(t * tu.f) : t * tu.f);
    plot1.setOptions({ xLabel: state.sqrtAxis ? `√t (√${tu.u})` : `time t (${tu.u})`, yLabel: `penetration L (${lu.u})`, tipY: (v) => `${sig(v, 4)} ${lu.u}`, tipX: (v) => (state.sqrtAxis ? `√t = ${sig(v, 4)}` : `${sig(v, 4)} ${tu.u}`) });
    const open = solveModeA({ ...p, dpApplied: P_LIQUID_ABS - p.pg0, X: p.Lp, tau: 1 });
    plot1.update({
      series: [
        { id: 'exact', name: 'Exact solution t(L)', x: keep.map((i) => xAxis(ex.t[i])), y: keep.map((i) => ex.L[i] * lu.f), kind: 'line', color: 'var(--liquid)' },
        { id: 'num', name: `Numerical ODE (${b.steps} steps)`, x: nIdx.map((i) => xAxis(b.series.t[i])), y: nIdx.map((i) => b.series.L[i] * lu.f), kind: 'points', color: 'var(--ink)' },
        ...(open.ok && open.fills ? [{ id: 'open', name: 'Same pore if the gas could escape', x: keep.map((i) => xAxis(ex.t[i])), y: keep.map((i) => Math.min(open.L(ex.t[i]), p.Lp) * lu.f), kind: 'dashed', color: 'var(--ink-3)' }] : []),
      ],
      hlines: [{ value: b.fillEq * p.Lp * lu.f, label: `equilibrium ${sig(b.fillEq * 100, 3)} %`, color: 'var(--gas)' }, { value: p.Lp * lu.f, label: 'dead end' }],
      description: `The front approaches ${sig(b.fillEq * 100, 3)} percent of the pore length and stops.`,
    });
    root.querySelector('[data-role=p1-cap]').innerHTML = 'The line is the exact implicit solution t/T = λ² − 2βλ + 2β(1−β) ln[(1−β)/(1−β−λ)]; circles are the adaptive Runge–Kutta solution of ds/dt = r²(p<sub>L</sub> + p<sub>c</sub> − p<sub>g</sub>)/(4μ). The dashed curve shows the same pore with the gas able to escape (Mode A with Δpₐ = p<sub>L</sub> − p<sub>g0</sub>).';

    const wrap = root.querySelector('[data-role=plot1b-wrap]');
    wrap.hidden = false;
    plot1b.setOptions({ xLabel: `time t (${tu.u})`, tipX: (v) => `${sig(v, 4)} ${tu.u}`, tipY: (v) => `${sig(v, 4)} kPa` });
    plot1b.update({
      series: [{ id: 'pg', name: 'Gas pressure p_g(t), numerical', x: nIdx.map((i) => b.series.t[i] * tu.f), y: nIdx.map((i) => b.series.pg[i] / 1e3), kind: 'line', color: 'var(--gas)' }],
      hlines: [{ value: b.P / 1e3, label: `p_L + p_c = ${sig(b.P / 1e3, 4)} kPa` }],
      yDomain: [0, Math.ceil((b.P / 1e3) * 1.1 / 10) * 10],
    });

    animB.load({
      tEnd,
      frac: (t) => interp(b.series.t, b.series.frac, t),
      pg: (t) => interp(b.series.t, b.series.pg, t),
      lengthDrawn: p.Lp,
      thetaDeg: p.thetaDeg,
      targetFrac: b.fillEq,
      targetLabel: `equilibrium ${sig(b.fillEq * 100, 3)} %`,
    });
    animCap.textContent = 'The amber gas pocket shrinks and its pressure rises until the front stops at the dashed equilibrium line.';
    validityList.innerHTML = renderValidity(validityChecks(p, { mode: 'B', D: (p.r * p.r * (b.P - p.pg0)) / (4 * p.mu), Lref: Math.max(b.fillEq * p.Lp, 10 * p.r), tRef: b.t95Num || b.t95Exact }));
  }

  function renderPlot2(p) {
    const sw = timeSweep(p, state.sweep);
    const def = sw.def;
    const unitInfo = { X: [1e6, 'µm'], mu: [1e3, 'mPa·s'], sigma: [1e3, 'mN/m'], tau: [1, '–'], r: [1e6, 'µm'] }[state.sweep];
    const colors = ['var(--liquid)', 'var(--ink)'];
    plot2.setOptions({ xLabel: `${def.label} (${unitInfo[1]})`, tipX: (v) => `${sig(v, 3)} ${unitInfo[1]}`, tipY: (v) => formatTime(v).text });
    const cur = solveModeA(p);
    plot2.update({
      series: sw.series.map((s, i) => ({ ...s, x: s.x.map((v) => v * unitInfo[0]), kind: i === 0 ? 'line' : 'dashed', color: colors[i], name: `${s.name} — slope ${sig(s.slope, 3)}` })),
      marker: cur.ok && cur.fills ? { x: p[def.key] * unitInfo[0], y: cur.tTarget, color: 'var(--gas)' } : null,
      description: `Log-log plot of time against ${def.label}.`,
    });
    const expected = state.sweep === 'r' ? 'Expected slopes: −1 under pure capillary drive (Δpₐ = 0), −2 at fixed independent Δp.' : `Expected slope ${def.expected} under pure capillary drive.`;
    root.querySelector('[data-role=p2-cap]').innerHTML = `On log–log axes a power law t ∝ x<sup>n</sup> is a straight line of slope n. ${esc(def.why)} ${expected} The amber dot marks the current input. Fitted slopes are computed from the plotted points, not typed in.${state.sweep !== 'r' && p.dpApplied !== 0 && ['sigma'].includes(state.sweep) ? ' With an applied pressure the σ-slope is shallower than −1.' : ''}`;
  }

  function renderPlot3(p, b) {
    const v = vacuumSweep(p);
    plot3.update({
      series: [
        { id: 'exact', name: 'Exact equilibrium', x: v.exact.x.map((x) => x / 1e3), y: v.exact.y.map((y) => y * 100), kind: 'line', color: 'var(--liquid)' },
        { id: 'num', name: 'Numerical end state', x: v.numerical.map((n) => n.pg0 / 1e3), y: v.numerical.map((n) => n.fill * 100), kind: 'points', marker: 'square', color: 'var(--ink)' },
      ],
      marker: b.ok && b.fills ? { x: p.pg0 / 1e3, y: b.fillNum * 100, color: 'var(--gas)' } : null,
      yDomain: [0, 100],
      xDomain: [0.1, 101.3],
      description: 'Fill fraction falls as the initial non-condensable gas pressure rises.',
    });
  }

  function renderValidity(list) {
    return list.map((c) => `<li data-level="${c.level}"><span class="lvl">${LEVEL_TEXT[c.level]}: ${esc(c.title)}</span><span class="v-val">${esc(c.value)}</span><details><summary>Why</summary>${esc(c.detail)}</details></li>`).join('');
  }

  renderChallenge(root.querySelector('[data-role=challenge]'));
  update();
  return () => { animA.destroy(); animB.destroy(); plot1.destroy(); plot1b.destroy(); plot2.destroy(); plot3.destroy(); };
}

// ------------------------------------------------------------------ challenge
function renderChallenge(host) {
  const base = { sigma: BASE.sigma, thetaDeg: BASE.thetaDeg, mu: BASE.mu }; // the illustrative baseline
  const r1 = requiredRadius({ X: 0.04, tMax: 1800, ...base });
  const r2 = requiredRadius({ X: 0.04, tMax: 1800, ...base, mu: 8e-3 });
  const g = r1.feasible ? requiredGasPressure({ fillTarget: 0.95, pL: P_LIQUID_ABS, sigma: base.sigma, thetaDeg: base.thetaDeg, r: r1.r }) : { feasible: false };
  const pcAt = r1.feasible ? capillaryPressure(base.sigma, base.thetaDeg, r1.r) : NaN;

  host.innerHTML = `
  <div class="prose">
    <p>A cell maker wants electrolyte to travel <strong>4 cm in under 30 minutes</strong> from the edge of the electrode stack. Use Mode A with σ = 29.4 mN/m, μ = 4.4 mPa·s, θ = 30°, straight pores (τ = 1) and no applied pressure.</p>
  </div>
  <form class="challenge" novalidate>
    <div class="quiz-q"><label for="ch1"><b>1.</b> What is the smallest pore radius that meets the target?</label>
      <div class="btn-row" style="margin-top:6px"><input id="ch1" type="number" step="any" inputmode="decimal"> <span>µm</span> <button class="btn" type="button" data-check="1">Check</button></div>
      <div class="quiz-fb" data-fb="1" hidden></div></div>
    <div class="quiz-q"><label for="ch2"><b>2.</b> The maker switches to a more viscous electrolyte, μ = 8 mPa·s. What is the smallest radius now?</label>
      <div class="btn-row" style="margin-top:6px"><input id="ch2" type="number" step="any" inputmode="decimal"> <span>µm</span> <button class="btn" type="button" data-check="2">Check</button></div>
      <div class="quiz-fb" data-fb="2" hidden></div></div>
    <div class="quiz-q"><label for="ch3"><b>3.</b> Using your radius from part 1, what is the highest initial non-condensable gas pressure (absolute) that keeps gas trapping in an idealized dead-end pore below 5 %? (p<sub>L</sub> = 101.3 kPa)</label>
      <div class="btn-row" style="margin-top:6px"><input id="ch3" type="number" step="any" inputmode="decimal"> <span>kPa abs</span> <button class="btn" type="button" data-check="3">Check</button></div>
      <div class="quiz-fb" data-fb="3" hidden></div></div>
    <details class="check"><summary>Show the worked solution</summary>
      <div class="prose" style="font-size:1.05rem">
      <p><b>Feasibility first.</b> θ = 30° &lt; 90°, so there is a positive capillary drive and a solution exists. Under pure capillary drive the time falls as the radius grows (t ∝ 1/r), so the target sets a <em>minimum</em> radius.</p>
      ${texBlock('t = \\frac{2\\mu X^2}{r\\,\\sigma\\cos\\theta}\\quad\\Rightarrow\\quad r_{min} = \\frac{2\\mu X^2}{t_{max}\\,\\sigma\\cos\\theta}')}
      <p><b>1.</b> ${tex(`r_{min} = \\frac{2(0.0044)(0.04)^2}{(1800)(0.0294)\\cos 30^\\circ} = ${sig(r1.r * 1e6, 4)}\\ \\mu\\text{m}`)}. Check: N·s/m² × m² ÷ (s × N/m) = m ✓.</p>
      <p><b>2.</b> Time is proportional to μ, so the radius must grow by 8/4.4: ${tex(`r_{min} = ${sig(r2.r * 1e6, 4)}\\ \\mu\\text{m}`)}. Alternatives: push with an applied pressure, raise the temperature to lower μ, improve wetting (lower θ), or accept more time. Tortuosity τ would multiply both answers by τ².</p>
      <p><b>3.</b> At r = ${sig(r1.r * 1e6, 4)} µm, ${tex(`p_c = 2\\sigma\\cos\\theta/r = ${sig(pcAt / 1e3, 4)}\\ \\text{kPa}`)}. Trapping below 5 % means ${tex('L_{eq}/L_p \\ge 0.95')}, so</p>
      ${texBlock(`p_{g0} \\le (1 - 0.95)(p_L + p_c) = 0.05\\,(101.3 + ${sig(pcAt / 1e3, 4)})\\ \\text{kPa} = ${sig(g.pg0Max / 1e3, 4)}\\ \\text{kPa abs}`)}
      <p>Smaller pores pull harder, which helps here: a larger radius would need a deeper vacuum.</p>
      <p><b>Why real cells can do better:</b> pores are connected, so gas escapes through unfilled neighbours instead of being trapped in a dead end. This answer is a conservative bound, not a production setpoint.</p>
      </div>
    </details>
  </form>`;

  const answers = { 1: r1.r * 1e6, 2: r2.r * 1e6, 3: g.pg0Max / 1e3 };
  const hints = {
    1: (v) => (v < answers[1] ? 'Too small — smaller pores fill MORE slowly under pure capillary drive (t ∝ 1/r). Check the 1/r dependence.' : 'Too large to be the minimum. Larger pores work, but the question asks for the smallest. Rearrange t = 2μX²/(rσcosθ) for r.'),
    2: (v) => (Math.abs(v - answers[1]) / answers[1] < 0.03 ? 'That is the part-1 answer. Viscosity changed: time ∝ μ, so r_min ∝ μ.' : v < answers[2] ? 'Too small. With μ = 8 mPa·s the time is 8/4.4 times longer for the same pore.' : 'Too large. r_min scales in proportion to μ.'),
    3: (v) => (v > answers[3] ? 'Too high — that leaves more than 5 % gas. Use L_eq/L_p = 1 − p_g0/(p_L + p_c) ≥ 0.95, with p_c evaluated at your part-1 radius.' : 'Lower than needed (it works, but asks for a deeper vacuum than necessary). Find the largest p_g0 that still gives 95 %.'),
  };
  host.querySelectorAll('[data-check]').forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.check;
    const v = Number(host.querySelector(`#ch${k}`).value);
    const fb = host.querySelector(`[data-fb="${k}"]`);
    fb.hidden = false;
    if (!Number.isFinite(v) || v <= 0) { fb.dataset.ok = 'false'; fb.textContent = 'Enter a positive number.'; return; }
    const ok = Math.abs(v - answers[k]) / answers[k] <= 0.03;
    fb.dataset.ok = String(ok);
    fb.textContent = ok ? `Correct (within 3 %). Model answer: ${sig(answers[k], 4)}.` : hints[k](v);
  }));
}
