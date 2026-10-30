/**
 * Interactive demonstration — supplement to the paper (src/content/paper.js).
 * Two modes only: (A) single-capillary Lucas–Washburn filling, paper Eqs. (2),
 * (5)–(8); (B) simplified vacuum-assisted filling of a dead-end pore, paper
 * Eqs. (9)–(11). Equation numbers shown on the page are computed from the paper.
 *
 * Data flow (one direction only):
 *   controls (display units) → toSIParams → physics solvers → outputs, plots,
 *   animation, validity checks, explanation.
 * Nothing shown here is hard-coded; every number comes from src/physics/.
 */
import {
  solveModeA, integrateModeA, solveModeB, validityChecks, timeSweep, vacuumSweep,
  SWEEPS, formatTime, formatLength, sci, sig, P_LIQUID_ABS,
} from '../physics/index.js';
import { PARAMETERS, DEFAULTS, FIXED, toSIParams } from '../data/parameters.js';
import { PRESETS } from '../data/presets.js';
import { eqNumber } from '../ui/markup.js';
import { createParamControl } from '../ui/controls.js';
import { createPlot } from '../charts/plot.js';
import { PoreAnimation, interp } from '../animations/pore.js';
import { esc, rafThrottle } from '../ui/dom.js';
import { pulse } from '../animations/motion.js';
import { errorsForMode } from '../ui/modeErrors.js';

const LEVEL_TEXT = { ok: 'OK', caution: 'Caution', warn: 'Warning', info: 'Note' };
/** Validity checks shown here: only those whose physics is discussed in the paper (others are in Supplementary Section S3). */
const SHOWN_CHECKS = new Set(['reynolds', 'capillary-number', 'gravity', 'theta', 'continuum', 'slender', 'idealized']);
const E = (id) => `Eq. (${eqNumber(id)})`;
const ASSUMPTIONS = {
  A: () => `<b>Mode A — single-capillary Lucas–Washburn filling</b> (paper Eqs. (${eqNumber('pc')}) and (${eqNumber('lwGeneral')})–(${eqNumber('tau')})). One straight or tortuous cylindrical pore of uniform radius; incompressible Newtonian liquid; steady, laminar, fully developed flow with no slip; inertia and gravity neglected; static contact angle; gas ahead of the front escapes at constant pressure; constant driving pressure p<sub>c</sub> + Δp<sub>a</sub>. Valid while Re ≪ 2300, the front speed is low enough for a static contact angle (Ca), and the electrode can be represented by one representative radius.`,
  B: () => `<b>Mode B — simplified vacuum-assisted filling</b> (paper Eqs. (${eqNumber('boyle')})–(${eqNumber('eqFill')})). Same pore and flow assumptions as Mode A, plus: the pore is closed at its far end; non-condensable gas sealed at p<sub>g0</sub> (absolute) is compressed isothermally as an ideal gas; no gas escape, dissolution or solvent vapour; liquid at the entrance fixed at p<sub>L</sub> = 101.3 kPa (reservoir vented after the pore mouth is sealed). This is a worst case for gas trapping: real, connected electrodes trap less gas.`,
};

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
    <h1>Interactive demonstration</h1>
    <p>A supplement to the <a href="#/paper">paper</a>. Inputs can be changed and every number, plot and animation is recomputed from the paper's equations by the same code that produces the paper's figures. Mode A: single-capillary Lucas–Washburn filling. Mode B: simplified vacuum-assisted filling of a dead-end pore.</p>
  </header>
  <div class="lab">
    <aside class="controls" aria-label="Model inputs">
      <div class="mode-switch" role="group" aria-label="Model mode">
        <button type="button" data-mode="A" aria-pressed="true">Mode A<span>Lucas–Washburn filling</span></button>
        <button type="button" data-mode="B" aria-pressed="false">Mode B<span>vacuum-assisted filling</span></button>
      </div>
      <fieldset><legend>Scenarios</legend><div class="presets" data-role="presets"></div></fieldset>
      <fieldset data-group="shared"><legend>Pore and liquid (both modes)</legend></fieldset>
      <fieldset data-group="A"><legend>Lucas–Washburn filling (Mode A, Plot 2)</legend></fieldset>
      <fieldset data-group="B"><legend>Vacuum-assisted filling (Mode B, Plot 3)</legend>
        <p class="small muted" style="margin:6px 0 0">Liquid-side pressure fixed at ${FIXED.pL.display}. ${FIXED.temperature.display}, properties not temperature-corrected.</p>
      </fieldset>
      <div class="btn-row"><button class="btn" type="button" data-act="reset">Reset to baseline</button></div>
    </aside>

    <div class="lab-main">
      <div class="note note--liquid small" data-role="assumptions"></div>
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
        <figcaption>Equilibrium fill fraction of one idealized dead-end pore against the initial absolute pressure of the non-condensable gas sealed in it (p<sub>g0</sub>; solvent vapour and gas dissolution are not modelled). The line is the analytical equilibrium, paper ${E('eqFill')}; squares are where the numerical solution of ${E('deadFront')} actually stopped. Real, connected electrodes trap much less gas than this worst case, because gas can escape through neighbouring unfilled pores.</figcaption></figure>

      <h2 id="validity">Validity limits for the current inputs</h2>
      <ul class="validity" data-role="validity"></ul>
      <p class="small muted">Additional checks (inertial start-up, meniscus shape) and further limitations are given in <a href="#/supplement/s3">Supplementary Section S3</a>. Comparison with published experiments: paper <a href="#/paper/discussion-experiment">Section 5.5</a>.</p>
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
    assumptionsBox.innerHTML = ASSUMPTIONS[m]();
    update();
  }
  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  // ------------------------------------------------------------- figures
  const assumptionsBox = root.querySelector('[data-role=assumptions]');
  assumptionsBox.innerHTML = ASSUMPTIONS.A();
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
      out('Capillary pressure', sig(pcK, 4), 'kPa', `p_c = 2σ cos θ / r, ${E('pc')}`),
      out('Total drive', sig(a.dpTotal / 1e3, 4), 'kPa', 'Δp = p_c + Δpₐ'),
      out('Washburn coefficient', a.fills ? sci(a.D, 4) : '0', 'm²/s', `D_W = r²Δp/(4μ), L² = D_W t, ${E('lwGeneral')}`),
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
    root.querySelector('[data-role=p1-cap]').innerHTML = `The line is the analytical solution, paper ${E('tau')}; the open circles are a numerical integration of ${E('front')} in s = L², shown as a check. They agree to better than 10⁻⁶ (<a href="#/supplement/s4">Supplementary Section S4</a>). ${state.sqrtAxis ? 'Against √t the line is straight.' : 'Tick the box to replot against √t.'}`;
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
      outputs.innerHTML = [out('Equilibrium fill', '0', '%', 'no liquid enters', true), out('Capillary pressure', sig(b.pc / 1e3, 4), 'kPa', `p_c = 2σ cos θ / r, ${E('pc')}`)].join('');
      explain.textContent = b.reason;
      plot1.update({ series: [] });
      root.querySelector('[data-role=plot1b-wrap]').hidden = true;
      validityList.innerHTML = renderValidity(validityChecks(p, { mode: 'B' }));
      return;
    }
    const t95 = b.t95Num != null ? formatTime(b.t95Num) : null;
    outputs.innerHTML = [
      out('Equilibrium fill L_eq/L_p', sig(b.fillNum * 100, 4), '%', `${E('eqFill')}: ${sig(b.fillEq * 100, 6)} %; numerical end state ${sig(b.fillNum * 100, 6)} %`, true),
      out('Time to 95 % of equilibrium', t95 ? t95.value : '—', t95 ? t95.unit : '', b.t95Num != null ? `numerical solution of ${E('deadFront')}` : 'solver did not reach equilibrium'),
      out('Capillary pressure', sig(b.pc / 1e3, 4), 'kPa', `p_c = 2σ cos θ / r, ${E('pc')}`),
      out('Final gas pressure', sig((p.pg0 / (1 - b.fillNum)) / 1e3, 4), 'kPa abs', `p_L + p_c = ${sig(b.P / 1e3, 4)} kPa`),
    ].join('');
    explain.innerHTML = `Non-condensable gas is sealed in the pore at ${sig(p.pg0 / 1e3, 3)} kPa absolute; the reservoir is then vented to atmosphere. The liquid side pushes with p<sub>L</sub> + p<sub>c</sub> = ${sig(b.P / 1e3, 4)} kPa. As the liquid advances the gas is squeezed (Boyle's law) until its pressure matches that push, which happens when the pore is <strong>${sig(b.fillEq * 100, 4)} %</strong> full. ${p.pg0 > 20e3 ? 'Lowering the initial gas pressure — evacuating before filling — is the only way to fill it further in this model.' : 'Because so little gas was left, the liquid nearly reaches the dead end.'} The fill fraction does not depend on viscosity or pore length; the time does (t ∝ μL<sub>p</sub>²).`;

    // Plot 1: numerical solution of the dead-end front equation (the exact implicit
    // trajectory is used only for verification, Supplementary Sections S1 and S4).
    const tEnd = Math.min(b.series.t[b.series.t.length - 1], (b.t95Num || b.t95Exact) * 3);
    const tu = timeUnit(tEnd), lu = lengthUnit(p.Lp);
    const keep = b.series.t.map((t, i) => (t <= tEnd ? i : -1)).filter((i) => i >= 0);
    const nIdx = subsample(b.series.t, 40).filter((i) => b.series.t[i] <= tEnd);
    const tOpen = Array.from({ length: 161 }, (_, i) => (tEnd * i) / 160);
    const xAxis = (t) => (state.sqrtAxis ? Math.sqrt(t * tu.f) : t * tu.f);
    plot1.setOptions({ xLabel: state.sqrtAxis ? `√t (√${tu.u})` : `time t (${tu.u})`, yLabel: `penetration L (${lu.u})`, tipY: (v) => `${sig(v, 4)} ${lu.u}`, tipX: (v) => (state.sqrtAxis ? `√t = ${sig(v, 4)}` : `${sig(v, 4)} ${tu.u}`) });
    const open = solveModeA({ ...p, dpApplied: P_LIQUID_ABS - p.pg0, X: p.Lp, tau: 1 });
    plot1.update({
      series: [
        { id: 'num', name: `Numerical solution of ${E('deadFront')} (${b.steps} steps)`, x: keep.map((i) => xAxis(b.series.t[i])), y: keep.map((i) => b.series.L[i] * lu.f), kind: 'line', color: 'var(--liquid)' },
        ...(open.ok && open.fills ? [{ id: 'open', name: `Same pore if the gas could escape, ${E('lwGeneral')}`, x: tOpen.map(xAxis), y: tOpen.map((t) => Math.min(open.L(t), p.Lp) * lu.f), kind: 'dashed', color: 'var(--ink-3)' }] : []),
      ],
      hlines: [{ value: b.fillEq * p.Lp * lu.f, label: `equilibrium ${sig(b.fillEq * 100, 3)} %`, color: 'var(--gas)' }, { value: p.Lp * lu.f, label: 'dead end' }],
      description: `The front approaches ${sig(b.fillEq * 100, 3)} percent of the pore length and stops.`,
    });
    root.querySelector('[data-role=p1-cap]').innerHTML = `The solid line is the numerical solution of paper ${E('deadFront')}, with the gas pressure from ${E('boyle')}; it levels off at the equilibrium of ${E('eqFill')}. The dashed curve shows the same pore with the gas able to escape (Mode A with Δpₐ = p<sub>L</sub> − p<sub>g0</sub>). The numerical solution is checked against an exact solution in <a href="#/supplement/s4">Supplementary Section S4</a>.`;

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
        { id: 'exact', name: `Analytical equilibrium, ${E('eqFill')}`, x: v.exact.x.map((x) => x / 1e3), y: v.exact.y.map((y) => y * 100), kind: 'line', color: 'var(--liquid)' },
        { id: 'num', name: `Numerical end state of ${E('deadFront')}`, x: v.numerical.map((n) => n.pg0 / 1e3), y: v.numerical.map((n) => n.fill * 100), kind: 'points', marker: 'square', color: 'var(--ink)' },
      ],
      marker: b.ok && b.fills ? { x: p.pg0 / 1e3, y: b.fillNum * 100, color: 'var(--gas)' } : null,
      yDomain: [0, 100],
      xDomain: [0.1, 101.3],
      description: 'Fill fraction falls as the initial non-condensable gas pressure rises.',
    });
  }

  function renderValidity(list) {
    return list.filter((c) => SHOWN_CHECKS.has(c.id)).map((c) => `<li data-level="${c.level}"><span class="lvl">${LEVEL_TEXT[c.level]}: ${esc(c.title)}</span><span class="v-val">${esc(c.value)}</span><details><summary>Why</summary>${esc(c.detail)}</details></li>`).join('');
  }

  update();
  return () => { animA.destroy(); animB.destroy(); plot1.destroy(); plot1b.destroy(); plot2.destroy(); plot3.destroy(); };
}
