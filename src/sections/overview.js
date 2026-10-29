/**
 * Overview — the hook. The hero is a "slide rule": two aligned logarithmic
 * scales, wetting distance on top and filling time underneath. Because
 * t = X²/D, the time scale is the distance scale squared, so equal steps in
 * distance become doubled steps in time. Everything is computed from the
 * Mode A solver at baseline values.
 */
import { solveModeA, solveModeB } from '../physics/index.js';
import { BASE } from '../physics/checks.js';
import { formatTime, formatLength, sig, sci } from '../physics/units.js';
import { vacuumComparison, prismaticCell } from '../diagrams/index.js';
import { PRESENTATION } from '../content/presentation.js';
import { cite } from '../ui/cite.js';
import { prefersReducedMotion } from '../ui/dom.js';

const XMIN = 10e-6, XMAX = 0.1; // m
const W = 1000, PADL = 30, PADR = 30;
const CELL_HALF = 0.05; // m — illustrative stack 16 cm × 10 cm, so the centre line is 5 cm from the nearest edge

export function render(root) {
  const base = solveModeA(BASE);
  const D = base.Dstraight;
  const tOf = (X) => (X * X) / D;
  const xPos = (X) => PADL + ((Math.log10(X) - Math.log10(XMIN)) / (Math.log10(XMAX) - Math.log10(XMIN))) * (W - PADL - PADR);
  const xFromPos = (px) => 10 ** (Math.log10(XMIN) + ((px - PADL) / (W - PADL - PADR)) * (Math.log10(XMAX) - Math.log10(XMIN)));

  // distance ticks (every decade, minor at 2 and 5)
  const dTicks = [];
  for (let e = -5; e <= -1; e++) for (const m of [1, 2, 5]) { const v = m * 10 ** e; if (v >= XMIN * 0.999 && v <= XMAX * 1.001) dTicks.push({ v, major: m === 1 }); }
  const dLabel = (v) => formatLength(v).text.replace(/\.0+ /, ' ');
  // time ticks at human units
  const tUnits = [[1e-6, '1 µs'], [1e-3, '1 ms'], [1, '1 s'], [60, '1 min'], [3600, '1 h'], [86400, '1 day']];
  const tTicksAll = [];
  for (let e = -8; e <= 6; e++) tTicksAll.push(10 ** e);
  const Xof = (t) => Math.sqrt(D * t);

  const scaleSvg = `
  <svg viewBox="0 0 ${W} 200" role="img" aria-labelledby="sr-title sr-desc">
    <title id="sr-title">Slide rule relating wetting distance to idealized filling time</title>
    <desc id="sr-desc">Top scale: straight-line wetting distance from 10 micrometres to 10 centimetres, logarithmic. Bottom scale: idealized filling time for the baseline electrolyte and pore. Because time grows with distance squared, the time scale covers twice as many decades.</desc>
    <rect x="${PADL - 10}" y="40" width="${W - PADL - PADR + 20}" height="120" fill="var(--paper-2)" stroke="var(--rule)"/>
    <line x1="${PADL - 10}" y1="100" x2="${W - PADR + 10}" y2="100" stroke="var(--ink-3)"/>
    <text class="sr-title" x="${PADL}" y="16" font-size="13" fill="var(--ink-2)">wetting distance X</text>
    <text class="sr-title" x="${PADL}" y="190" font-size="13" fill="var(--ink-2)">idealized time t = X² / D<tspan dy="3" font-size="10">W</tspan></text>
    ${dTicks.map(({ v, major }) => `<line x1="${xPos(v)}" x2="${xPos(v)}" y1="100" y2="${major ? 70 : 84}" stroke="var(--ink)" stroke-width="${major ? 1.4 : 1}"/>${major || v === 5e-2 ? `<text class="sr-lab${major ? '' : ' sr-minor'}" x="${xPos(v)}" y="62" font-size="13" text-anchor="middle" fill="var(--ink)">${dLabel(v)}</text>` : ''}`).join('')}
    ${tTicksAll.filter((t) => Xof(t) >= XMIN && Xof(t) <= XMAX).map((t) => `<line x1="${xPos(Xof(t))}" x2="${xPos(Xof(t))}" y1="100" y2="114" stroke="var(--liquid-ink)"/>`).join('')}
    ${tUnits.filter(([t]) => Xof(t) >= XMIN && Xof(t) <= XMAX).map(([t, lab]) => `<line x1="${xPos(Xof(t))}" x2="${xPos(Xof(t))}" y1="100" y2="130" stroke="var(--liquid-ink)" stroke-width="1.6"/><text class="sr-lab" x="${xPos(Xof(t))}" y="146" font-size="13" text-anchor="middle" fill="var(--liquid-ink)">${lab}</text>`).join('')}
    <g class="sr-marks" fill="var(--ink-3)" font-size="11">
      <path d="M${xPos(70e-6) - 4},30 h8 l-4,7 z"/><text x="${xPos(70e-6) + 7}" y="35">coating thickness</text>
      <path d="M${xPos(0.05) - 4},30 h8 l-4,7 z"/><text x="${xPos(0.05) - 7}" y="35" text-anchor="end">edge to centre of a cell</text>
    </g>
    <g class="cursor" tabindex="0" role="slider" aria-label="Wetting distance" aria-valuemin="${XMIN}" aria-valuemax="${XMAX}" style="cursor:ew-resize">
      <rect class="cursor-glass" x="-14" y="36" width="28" height="128" fill="var(--liquid)" fill-opacity="0.08" stroke="var(--liquid)" stroke-opacity="0.5" rx="2"/>
      <line x1="0" x2="0" y1="34" y2="166" stroke="var(--liquid)" stroke-width="2"/>
    </g>
    <rect class="hit" x="${PADL - 10}" y="30" width="${W - PADL - PADR + 20}" height="140" fill="transparent" style="cursor:ew-resize"/>
  </svg>`;

  const amb = solveModeB({ ...BASE, pg0: 101.3e3 });
  const vac = solveModeB({ ...BASE, pg0: 10e3 });

  root.innerHTML = `
  <section class="hero" aria-labelledby="hero-h">
    <h1 id="hero-h">Why do lithium-ion battery cells take so long to fill with electrolyte?</h1>
    <p class="lead">A single pore fills across an electrode coating in milliseconds. A whole cell takes tens of minutes. Drag the cursor to see how fluid mechanics connects the two.</p>
    <div class="rule-instrument">
      ${scaleSvg}
      <div class="rule-readout">
        <div><span class="r-val" data-out="x"></span><span class="r-lab">straight-line distance</span></div>
        <div><span class="r-val" data-out="t" style="color:var(--liquid-ink)"></span><span class="r-lab">idealized filling time</span></div>
        <p class="r-say" data-out="say"></p>
      </div>
      <div class="rule-stops btn-row">
        <button class="btn" data-x="70e-6" type="button">Across a coating (70 µm)</button>
        <button class="btn" data-x="0.01" type="button">1 cm in-plane</button>
        <button class="btn" data-x="0.05" type="button">Edge to centre (5 cm)</button>
        <button class="btn btn--primary" data-act="play" type="button">Play filling from the edge</button>
      </div>
    </div>
    <p class="small muted">Baseline: r = 0.5 µm, σ = 29.4 mN/m, θ = 30°, μ = 4.4 mPa·s, straight pores (τ = 1), D<sub>W</sub> = ${sci(D, 4)} m²/s. Idealized single-pore estimates, not measured times for any particular cell.</p>
  </section>

  <section class="split" style="margin-top:var(--space-7)">
    <figure class="figure" data-reveal>
      <div class="figure__well" style="padding:8px"><div data-role="cell"></div></div>
      <figcaption><b>A prismatic cell wetting from its edges, linked to the cursor.</b> Illustrative 16 cm × 10 cm stack; the blue band is the region already reached by the liquid at the time shown above. Schematic: the band follows the √t law, the geometry is idealized. Neutron imaging shows this edge-inward pattern in real cells ${cite('[weydanz2018]')}.</figcaption>
    </figure>
    <div>
      <h2 style="margin-top:0">The engineering question</h2>
      <div class="prose">
        <p>How long does electrolyte take to wet an electrode from its edges — and how do vacuum, pore size, contact angle and viscosity change that time and the fraction of pore space that ends up filled?</p>
        <p>Wetting is a slow, costly step in cell manufacturing. Faster filling means shorter production time; incomplete filling means gas pockets in the electrodes. This project explains both with the fluid mechanics of a single idealized pore, and is honest about where one pore stops describing a whole cell.</p>
      </div>
    </div>
  </section>

  <section class="facts" aria-label="What the lab does">
    <div><h3>What the lab predicts</h3><p>Capillary pressure, the Washburn coefficient, the idealized time to reach any distance, and — for a dead-end pore — how much trapped gas limits filling and how long equilibrium takes.</p></div>
    <div><h3>What it assumes</h3><p>One straight or tortuous cylindrical pore, laminar Newtonian flow, a static contact angle, isothermal gas, no gravity. Every assumption is checked live and flagged when it is stretched.</p></div>
    <div><h3>Why it matters</h3><p>Filling time sets throughput on a cell production line, and trapped gas leaves pores dry. Manufacturers evacuate cells before filling for exactly the reason Mode B shows.</p></div>
  </section>

  <section aria-labelledby="gas-h">
    <h2 id="gas-h">Trapped gas, and what a vacuum buys you</h2>
    <p class="lead">If the far end of a pore is closed, the gas inside is squeezed until its pressure balances the liquid. Removing most of the gas first changes the answer completely.</p>
    <figure class="figure" data-reveal>
      <div class="figure__well">${vacuumComparison(amb.fillEq, vac.fillEq, 10)}<ul class="key"><li><i class="k-liquid"></i>electrolyte</li><li><i class="k-gas"></i>compressed gas</li><li><i class="k-solid"></i>pore wall</li></ul></div>
      <figcaption><b>Idealized dead-end pores at equilibrium</b>, computed from L<sub>eq</sub>/L<sub>p</sub> = 1 − p<sub>g0</sub>/(p<sub>L</sub> + p<sub>c</sub>). Real electrodes trap far less gas because their pores connect — in experiments, filling at normal pressure took about twice as long and absorbed about 10 % less electrolyte ${cite('[weydanz2018, tum2018]')}.</figcaption>
    </figure>
  </section>

  <section aria-labelledby="preview-h">
    <h2 id="preview-h">Inside the lab</h2>
    <div class="split">
      <figure class="figure" style="margin:0"><div class="figure__well figure__well--plain">${prismaticCell()}</div><figcaption>Fronts reached at t₁, 4t₁ and 9t₁ are equally spaced: distance grows only as √t.</figcaption></figure>
      <div class="prose">
        <p>The interactive lab has two models. <strong>Mode A</strong> is an open capillary with an exact solution. <strong>Mode B</strong> is a dead-end pore with trapped gas, solved numerically and checked against its exact equilibrium and trajectory.</p>
        <p>Change pore size, contact angle, viscosity, applied pressure, distance, tortuosity or vacuum level and watch the numbers, plots, animated pore and validity checks respond. A guided challenge asks you to size the pores for a production target.</p>
        <p><a class="btn btn--primary" href="#/lab">Open the interactive lab</a> <a class="btn" href="#/theory">Read the theory first</a></p>
      </div>
    </div>
  </section>

  <section aria-labelledby="video-h">
    <h2 id="video-h">Video presentation</h2>
    ${PRESENTATION.youtubeId
      ? `<div class="video-slot"><iframe src="https://www.youtube-nocookie.com/embed/${PRESENTATION.youtubeId}" title="${PRESENTATION.title || 'Project presentation'}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
      : `<div class="video-slot"><div><strong style="color:var(--warn)">Video not yet recorded.</strong><br>The final YouTube presentation will appear here. Add its id in <code>src/content/presentation.js</code>.</div></div>`}
  </section>`;

  // --------------------------------------------------------- interactivity
  const svg = root.querySelector('.rule-instrument svg');
  const cursor = svg.querySelector('.cursor');
  const outX = root.querySelector('[data-out=x]');
  const outT = root.querySelector('[data-out=t]');
  const outSay = root.querySelector('[data-out=say]');
  const cellHost = root.querySelector('[data-role=cell]');
  let X = 0.01;

  const cellSvg = () => {
    const w = 400, h = 258, x0 = 10, y0 = 10, cw = 380, ch = 238; // 16 cm × 10 cm
    const scale = ch / 2 / CELL_HALF; // px per metre (half-height = 5 cm)
    const band = Math.min(ch / 2, X * scale);
    const done = X >= CELL_HALF;
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Cell top view: wetted band ${formatLength(Math.min(X, CELL_HALF)).text} from each edge${done ? ', fully wetted' : ''}">
      <rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="var(--liquid)" fill-opacity="0.85"/>
      ${done ? '' : `<rect x="${x0 + band}" y="${y0 + band}" width="${Math.max(0, cw - 2 * band)}" height="${Math.max(0, ch - 2 * band)}" fill="var(--paper-2)"/>`}
      <rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="${x0 + cw / 2}" y="${y0 + ch / 2 + 5}" text-anchor="middle" font-size="14" fill="${done ? '#fff' : 'var(--ink-2)'}">${done ? 'fully wetted' : 'dry'}</text>
    </svg>`;
  };

  function update(newX, announce = true) {
    X = Math.min(XMAX, Math.max(XMIN, newX));
    const px = xPos(X);
    cursor.setAttribute('transform', `translate(${px} 0)`);
    const t = tOf(X);
    const xs = formatLength(X), ts = formatTime(t);
    outX.textContent = xs.text;
    outT.textContent = ts.text;
    cursor.setAttribute('aria-valuenow', String(X));
    cursor.setAttribute('aria-valuetext', `${xs.text}, about ${ts.text}`);
    const tCoat = tOf(70e-6);
    outSay.textContent = X <= 80e-6
      ? 'Through-thickness: the liquid crosses a whole electrode coating faster than you can blink.'
      : `That is ${sig(X / 70e-6, 2)} times the coating thickness but ${sig(t / tCoat, 2)} times the time — the square law at work.`;
    cellHost.innerHTML = cellSvg();
  }

  const toLocal = (e) => {
    const r = svg.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  };
  let dragging = false;
  const onDown = (e) => { dragging = true; svg.setPointerCapture?.(e.pointerId); stopPlay(); update(xFromPos(toLocal(e))); };
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', (e) => { if (dragging) update(xFromPos(toLocal(e))); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  cursor.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (e.key === 'Home') { update(XMIN); e.preventDefault(); return; }
    if (e.key === 'End') { update(XMAX); e.preventDefault(); return; }
    if (!k) return;
    e.preventDefault();
    stopPlay();
    update(X * 10 ** (k * 0.025));
  });
  root.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => { stopPlay(); update(Number(b.dataset.x)); }));

  // "Play filling": run PHYSICAL time linearly from 0 to the time the front reaches the
  // centre, and move the cursor to X(t) = √(D t). The cursor visibly slows down.
  let timer = null;
  const playBtn = root.querySelector('[data-act=play]');
  function stopPlay() { if (timer) { timer.pause(); timer = null; playBtn.textContent = 'Play filling from the edge'; } }
  playBtn.addEventListener('click', async () => {
    if (timer) { stopPlay(); return; }
    const tEnd = tOf(CELL_HALF);
    if (prefersReducedMotion()) { update(CELL_HALF); return; }
    let anime;
    try { anime = await import('animejs'); } catch { update(CELL_HALF); return; }
    playBtn.textContent = 'Pause';
    timer = anime.createTimer({
      duration: 8000,
      onUpdate: (self) => update(Math.max(XMIN, Math.sqrt(D * self.progress * tEnd))),
      onComplete: () => { timer = null; playBtn.textContent = 'Play filling from the edge'; },
    });
  });

  update(X);
  return () => stopPlay();
}
