/**
 * pore.js — physics-linked pore animation with play / pause / scrub / step.
 *
 * The animation never invents motion: every frame asks the solver result for
 * the front position at the current PHYSICAL time. Anime.js provides the
 * playback clock (a Timer we can play, pause and seek); we map timer progress
 * linearly onto physical time, so the √t slowing-down is visible.
 *
 * If Anime.js fails to load, the scrubber still works (manual stepping only).
 */
import { formatTime, formatLength, sig } from '../physics/units.js';
import { el, prefersReducedMotion } from '../ui/dom.js';

let animeMod = null;
async function anime() {
  if (animeMod) return animeMod;
  try { animeMod = await import('animejs'); } catch { animeMod = false; }
  return animeMod;
}

const PLAY_MS = 6000; // wall-clock duration of one playback

let poreUid = 0;

export class PoreAnimation {
  /**
   * @param {HTMLElement} host
   * @param {{deadEnd:boolean}} opts
   */
  constructor(host, { deadEnd }) {
    this.deadEnd = deadEnd;
    this.id = `pore-${++poreUid}`;
    this.host = host;
    this.node = el(`
      <div>
        <div class="figure__well figure__well--plain" style="padding:8px 12px">
          <svg viewBox="0 0 600 132" role="img" aria-labelledby="${this.id}-t" style="width:100%;height:auto">
            <title id="${this.id}-t">Animated pore showing the liquid front position at the current physical time</title>
            <defs>
              <pattern id="${this.id}-gas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--gas-soft)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--gas)" stroke-width="1.4"/></pattern>
            </defs>
            <rect x="0" y="30" width="34" height="56" fill="var(--liquid)"/>
            <text x="2" y="104" font-size="11" fill="var(--ink-2)">reservoir</text>
            <rect class="gasbox" x="34" y="38" width="530" height="40" fill="${deadEnd ? `url(#${this.id}-gas)` : 'var(--surface)'}"/>
            <path class="liq" d="" fill="var(--liquid)"/>
            <rect x="34" y="28" width="${deadEnd ? 540 : 530}" height="10" fill="var(--solid)"/>
            <rect x="34" y="78" width="${deadEnd ? 540 : 530}" height="10" fill="var(--solid)"/>
            ${deadEnd ? '<rect x="564" y="28" width="10" height="60" fill="var(--solid)"/>' : '<text x="568" y="62" font-size="11" fill="var(--ink-3)">open</text>'}
            <line class="target" x1="0" x2="0" y1="20" y2="96" stroke="var(--ink)" stroke-dasharray="3 3" ${deadEnd ? '' : ''}/>
            <text class="target-lab" x="0" y="16" font-size="11" fill="var(--ink-2)" text-anchor="middle"></text>
            <text class="gas-lab" x="566" y="104" font-size="12" fill="var(--gas)" text-anchor="end"></text>
            <text class="front-lab" x="0" y="122" font-size="11" fill="var(--liquid-ink)" text-anchor="middle"></text>
          </svg>
        </div>
        <div class="player">
          <button class="btn" data-act="play" type="button">Play</button>
          <button class="btn" data-act="back" type="button" aria-label="Step back">‹ Step</button>
          <button class="btn" data-act="fwd" type="button" aria-label="Step forward">Step ›</button>
          <input type="range" min="0" max="1000" value="1000" aria-label="Scrub physical time" />
          <output aria-live="off"></output>
        </div>
        <p class="small muted" data-role="scale"></p>
      </div>`);
    host.replaceChildren(this.node);
    this.svg = this.node.querySelector('svg');
    this.scrub = this.node.querySelector('input[type=range]');
    this.out = this.node.querySelector('output');
    this.playBtn = this.node.querySelector('[data-act=play]');
    this.scaleNote = this.node.querySelector('[data-role=scale]');
    this.progress = 1;
    this.timer = null;

    this.scrub.addEventListener('input', () => { this.stop(); this.render(Number(this.scrub.value) / 1000); });
    this.playBtn.addEventListener('click', () => (this.timer && !this.timer.paused ? this.stop() : this.play()));
    this.node.querySelector('[data-act=back]').addEventListener('click', () => { this.stop(); this.render(Math.max(0, this.progress - 0.05)); });
    this.node.querySelector('[data-act=fwd]').addEventListener('click', () => { this.stop(); this.render(Math.min(1, this.progress + 0.05)); });
  }

  /**
   * @param {object} m
   * @param {number} m.tEnd             physical time shown at the end of playback (s)
   * @param {(t:number)=>number} m.frac  fraction of the drawn pore length filled at time t (0–1)
   * @param {number} m.lengthDrawn       physical length represented by the drawn pore (m)
   * @param {(t:number)=>number} [m.pg]  gas pressure at time t (Pa), dead-end only
   * @param {number} [m.thetaDeg]        contact angle (shapes the meniscus)
   * @param {number} [m.targetFrac]      fraction at which to draw a target marker
   * @param {string} [m.targetLabel]
   */
  load(m) {
    this.m = m;
    this.stop();
    const span = formatTime(m.tEnd);
    this.scaleNote.textContent = `Schematic, not to scale in width. Playback is linear in physical time: ${PLAY_MS / 1000} s on screen = ${span.text} of filling. The drawn pore represents ${formatLength(m.lengthDrawn).text}.`;
    const startAt = prefersReducedMotion() ? 1 : this.progress;
    this.render(Number.isFinite(startAt) ? startAt : 1);
  }

  render(p) {
    if (!this.m) return;
    this.progress = p;
    this.scrub.value = String(Math.round(p * 1000));
    const t = p * this.m.tEnd;
    const fr = Math.max(0, Math.min(1, this.m.frac(t)));
    const x0 = 34, len = 530, xf = x0 + fr * len;
    // meniscus bulge: depth ~ (1 − sin θ) of the half-gap, sign from cos θ
    const th = ((this.m.thetaDeg ?? 30) * Math.PI) / 180;
    const depth = Math.cos(th) >= 0 ? -20 * (1 - Math.sin(th)) : 20 * (1 - Math.sin(th));
    const d = fr <= 0 ? '' : `M${x0},38 H${xf.toFixed(1)} Q${(xf + depth * 2).toFixed(1)},58 ${xf.toFixed(1)},78 H${x0} Z`;
    this.svg.querySelector('.liq').setAttribute('d', d);

    const tgt = this.svg.querySelector('.target');
    const tgtLab = this.svg.querySelector('.target-lab');
    if (this.m.targetFrac != null) {
      const xt = x0 + this.m.targetFrac * len;
      tgt.setAttribute('x1', xt); tgt.setAttribute('x2', xt); tgt.style.display = '';
      tgtLab.setAttribute('x', xt); tgtLab.textContent = this.m.targetLabel || '';
    } else { tgt.style.display = 'none'; tgtLab.textContent = ''; }

    const gasLab = this.svg.querySelector('.gas-lab');
    if (this.deadEnd && this.m.pg) {
      gasLab.textContent = `trapped gas: p_g = ${sig(this.m.pg(t) / 1e3, 3)} kPa abs`;
    } else gasLab.textContent = '';
    const fl = this.svg.querySelector('.front-lab');
    fl.setAttribute('x', Math.max(60, Math.min(540, xf)));
    fl.textContent = `L = ${formatLength(fr * this.m.lengthDrawn).text}`;
    this.out.textContent = `t = ${formatTime(t).text}`;
  }

  async play() {
    if (!this.m) return;
    const a = await anime();
    const from = this.progress >= 0.999 ? 0 : this.progress;
    this.playBtn.textContent = 'Pause';
    if (!a || prefersReducedMotion()) {
      // No animation engine (or reduced motion): jump in large steps instead of animating.
      this.render(1);
      this.playBtn.textContent = 'Play';
      return;
    }
    this.timer = a.createTimer({
      duration: PLAY_MS * (1 - from),
      onUpdate: (self) => this.render(from + (1 - from) * Math.min(1, self.progress)),
      onComplete: () => { this.playBtn.textContent = 'Replay'; this.timer = null; },
    });
  }

  stop() {
    if (this.timer) { this.timer.pause(); this.timer = null; }
    this.playBtn.textContent = this.progress >= 0.999 ? 'Replay' : 'Play';
  }

  destroy() { this.stop(); }
}

/** Linear interpolation of y at x on a monotone sampled series. */
export function interp(xs, ys, x) {
  if (!xs.length) return 0;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
  const f = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + f * (ys[hi] - ys[lo]);
}
