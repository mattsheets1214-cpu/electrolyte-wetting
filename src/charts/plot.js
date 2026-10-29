/**
 * plot.js — a small, dependency-free SVG plotting module for scientific plots.
 *
 * Features: linear or log axes, line / dashed / point series, reference lines,
 * legend with line-style samples (meaning is never carried by colour alone),
 * hover and keyboard tooltips, and automatic resizing.
 *
 * Usage:
 *   const p = createPlot(container, { xLabel: 't (s)', yLabel: 'L (µm)', xScale: 'log' });
 *   p.update({ series: [{ id, name, x: [...], y: [...], kind: 'line', color: 'var(--liquid)' }] });
 */
import { esc } from '../ui/dom.js';

const NS = 'http://www.w3.org/2000/svg';
const M = { top: 14, right: 18, bottom: 46, left: 64 };

function niceStep(span, target) {
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

function linearTicks(lo, hi, target = 6) {
  if (lo === hi) return [lo];
  const step = niceStep(hi - lo, target);
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

function logTicks(lo, hi) {
  const a = Math.floor(Math.log10(lo)), b = Math.ceil(Math.log10(hi));
  const majors = [], minors = [];
  for (let e = a; e <= b; e++) {
    for (let m = 1; m < 10; m++) {
      const v = m * 10 ** e;
      if (v < lo * (1 - 1e-9) || v > hi * (1 + 1e-9)) continue;
      (m === 1 ? majors : minors).push(v);
    }
  }
  // If only one decade is visible, label 2 and 5 as well.
  const labelled = majors.length >= 2 ? majors : [...majors, ...minors.filter((v) => [2, 5].includes(Math.round(v / 10 ** Math.floor(Math.log10(v)))))].sort((x, y) => x - y);
  return { labelled, minors };
}

const defaultFmt = (v) => {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e4 || a < 1e-3) {
    const e = Math.floor(Math.log10(a));
    const m = v / 10 ** e;
    const sup = String(e).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
    return `${Math.abs(m - 1) < 1e-9 ? '' : `${Number(m.toPrecision(2))}×`}10${sup}`;
  }
  return String(Number(v.toPrecision(3)));
};

function mk(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

export function createPlot(container, cfg) {
  const opts = { height: 320, xScale: 'linear', yScale: 'linear', xFormat: defaultFmt, yFormat: defaultFmt, ...cfg };
  container.classList.add('chart');
  container.innerHTML = '';
  const svg = mk('svg', { role: 'img', tabindex: '0', 'aria-label': opts.ariaLabel || `${opts.yLabel} versus ${opts.xLabel}` });
  container.appendChild(svg);
  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.hidden = true;
  container.appendChild(tip);
  const legend = document.createElement('ul');
  legend.className = 'key';
  container.appendChild(legend);
  const desc = document.createElement('p');
  desc.className = 'visually-hidden';
  container.appendChild(desc);

  let data = { series: [] };
  let scales = null;
  let cursorIdx = -1;

  function domain(axis) {
    const forced = data[`${axis}Domain`];
    if (forced) return forced;
    const isLog = opts[`${axis}Scale`] === 'log';
    let lo = Infinity, hi = -Infinity;
    for (const s of data.series) for (const v of s[axis]) {
      if (!Number.isFinite(v) || (isLog && v <= 0)) continue;
      lo = Math.min(lo, v); hi = Math.max(hi, v);
    }
    for (const r of data[axis === 'x' ? 'vlines' : 'hlines'] || []) if (Number.isFinite(r.value) && (!isLog || r.value > 0)) { lo = Math.min(lo, r.value); hi = Math.max(hi, r.value); }
    if (!Number.isFinite(lo)) return isLog ? [1, 10] : [0, 1];
    if (isLog) {
      if (lo === hi) { lo /= 2; hi *= 2; }
      return [10 ** Math.floor(Math.log10(lo) + 1e-9), 10 ** Math.ceil(Math.log10(hi) - 1e-9)];
    }
    const zero = axis === 'y' && opts.yZero !== false ? Math.min(0, lo) : lo;
    if (zero === hi) return [zero - 1, hi + 1];
    const step = niceStep(hi - zero, 6);
    return [Math.floor(zero / step) * step, Math.ceil(hi / step) * step];
  }

  function render() {
    const width = Math.max(280, container.clientWidth || 600);
    const height = opts.height;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';
    const iw = width - M.left - M.right, ih = height - M.top - M.bottom;
    const [x0, x1] = domain('x'), [y0, y1] = domain('y');
    const xl = opts.xScale === 'log', yl = opts.yScale === 'log';
    const sx = (v) => M.left + (xl ? (Math.log10(v) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) : (v - x0) / (x1 - x0)) * iw;
    const sy = (v) => M.top + ih - (yl ? (Math.log10(v) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0)) : (v - y0) / (y1 - y0)) * ih;
    scales = { sx, sy, iw, ih };

    const grid = mk('g', {}, svg);
    const axes = mk('g', { class: 'axis' }, svg);
    const xt = xl ? logTicks(x0, x1) : { labelled: linearTicks(x0, x1, Math.max(3, Math.floor(iw / 90))), minors: [] };
    const yt = yl ? logTicks(y0, y1) : { labelled: linearTicks(y0, y1, 6), minors: [] };
    for (const v of xt.minors) mk('line', { class: 'gridline', x1: sx(v), x2: sx(v), y1: M.top, y2: M.top + ih, 'stroke-opacity': 0.5 }, grid);
    for (const v of yt.minors) mk('line', { class: 'gridline', y1: sy(v), y2: sy(v), x1: M.left, x2: M.left + iw, 'stroke-opacity': 0.5 }, grid);
    for (const v of xt.labelled) {
      mk('line', { class: 'gridline', x1: sx(v), x2: sx(v), y1: M.top, y2: M.top + ih }, grid);
      const g = mk('g', { class: 'tick' }, axes);
      mk('line', { x1: sx(v), x2: sx(v), y1: M.top + ih, y2: M.top + ih + 5 }, g);
      const t = mk('text', { x: sx(v), y: M.top + ih + 18, 'text-anchor': 'middle' }, g);
      t.textContent = opts.xFormat(v);
    }
    for (const v of yt.labelled) {
      mk('line', { class: 'gridline', y1: sy(v), y2: sy(v), x1: M.left, x2: M.left + iw }, grid);
      const g = mk('g', { class: 'tick' }, axes);
      mk('line', { y1: sy(v), y2: sy(v), x1: M.left - 5, x2: M.left }, g);
      const t = mk('text', { x: M.left - 8, y: sy(v) + 4, 'text-anchor': 'end' }, g);
      t.textContent = opts.yFormat(v);
    }
    mk('path', { d: `M${M.left},${M.top}V${M.top + ih}H${M.left + iw}`, fill: 'none' }, axes);
    const xtitle = mk('text', { class: 'axis-title', x: M.left + iw / 2, y: height - 6, 'text-anchor': 'middle' }, svg);
    xtitle.textContent = opts.xLabel;
    const ytitle = mk('text', { class: 'axis-title', transform: `translate(14 ${M.top + ih / 2}) rotate(-90)`, 'text-anchor': 'middle' }, svg);
    ytitle.textContent = opts.yLabel;

    const clipId = `clip-${Math.random().toString(36).slice(2)}`;
    const cp = mk('clipPath', { id: clipId }, mk('defs', {}, svg));
    mk('rect', { x: M.left, y: M.top - 2, width: iw, height: ih + 4 }, cp);
    const plotArea = mk('g', { 'clip-path': `url(#${clipId})` }, svg);

    const inX = (v) => Number.isFinite(v) && (!xl || v > 0);
    const inY = (v) => Number.isFinite(v) && (!yl || v > 0);

    for (const r of data.vlines || []) {
      if (!inX(r.value)) continue;
      mk('line', { x1: sx(r.value), x2: sx(r.value), y1: M.top, y2: M.top + ih, stroke: r.color || 'var(--ink-3)', 'stroke-dasharray': '3 3', 'stroke-width': 1 }, plotArea);
      if (r.label) { const t = mk('text', { x: sx(r.value) + 4, y: M.top + 12, fill: r.color || 'var(--ink-2)', 'font-size': 11 }, plotArea); t.textContent = r.label; }
    }
    for (const r of data.hlines || []) {
      if (!inY(r.value)) continue;
      mk('line', { y1: sy(r.value), y2: sy(r.value), x1: M.left, x2: M.left + iw, stroke: r.color || 'var(--ink-3)', 'stroke-dasharray': '3 3', 'stroke-width': 1 }, plotArea);
      if (r.label) { const t = mk('text', { x: M.left + iw - 4, y: sy(r.value) - 5, fill: r.color || 'var(--ink-2)', 'font-size': 11, 'text-anchor': 'end' }, plotArea); t.textContent = r.label; }
    }

    for (const s of data.series) {
      const color = s.color || 'var(--ink)';
      if (s.kind === 'points') {
        s.x.forEach((xv, i) => {
          if (!inX(xv) || !inY(s.y[i])) return;
          if (s.marker === 'square') mk('rect', { x: sx(xv) - 3.5, y: sy(s.y[i]) - 3.5, width: 7, height: 7, fill: 'var(--surface)', stroke: color, 'stroke-width': 1.6 }, plotArea);
          else mk('circle', { cx: sx(xv), cy: sy(s.y[i]), r: 3.4, fill: 'var(--surface)', stroke: color, 'stroke-width': 1.6 }, plotArea);
        });
      } else {
        let d = '', pen = false;
        s.x.forEach((xv, i) => {
          if (!inX(xv) || !inY(s.y[i])) { pen = false; return; }
          d += `${pen ? 'L' : 'M'}${sx(xv).toFixed(2)},${sy(s.y[i]).toFixed(2)}`;
          pen = true;
        });
        mk('path', { d, fill: 'none', stroke: color, 'stroke-width': s.width || 2, 'stroke-dasharray': s.kind === 'dashed' ? '6 4' : s.kind === 'dotted' ? '2 3' : '', 'stroke-linejoin': 'round' }, plotArea);
      }
    }
    if (data.marker && inX(data.marker.x) && inY(data.marker.y)) {
      mk('circle', { cx: sx(data.marker.x), cy: sy(data.marker.y), r: 5, fill: data.marker.color || 'var(--liquid)', stroke: 'var(--surface)', 'stroke-width': 2 }, plotArea);
    }
    renderLegend();
  }

  function renderLegend() {
    legend.innerHTML = data.series.filter((s) => s.name).map((s) => {
      const c = s.color || 'var(--ink)';
      const sample = s.kind === 'points'
        ? (s.marker === 'square' ? `<rect x="7" y="1.5" width="7" height="7" fill="none" stroke="${c}" stroke-width="1.6"/>` : `<circle cx="11" cy="5" r="3.4" fill="none" stroke="${c}" stroke-width="1.6"/>`)
        : `<line x1="0" y1="5" x2="22" y2="5" stroke="${c}" stroke-width="2" stroke-dasharray="${s.kind === 'dashed' ? '6 4' : s.kind === 'dotted' ? '2 3' : ''}"/>`;
      return `<li><svg width="22" height="10" aria-hidden="true">${sample}</svg>${esc(s.name)}</li>`;
    }).join('');
    desc.textContent = data.description || '';
  }

  function showTip(px, py, html) {
    tip.innerHTML = html;
    tip.style.left = `${(px / svg.viewBox.baseVal.width) * container.clientWidth}px`;
    tip.style.top = `${(py / svg.viewBox.baseVal.height) * svg.clientHeight}px`;
    tip.hidden = false;
  }

  function nearest(px, py) {
    let best = null;
    for (const s of data.series) {
      s.x.forEach((xv, i) => {
        const yv = s.y[i];
        if (!Number.isFinite(xv) || !Number.isFinite(yv) || (opts.xScale === 'log' && xv <= 0) || (opts.yScale === 'log' && yv <= 0)) return;
        const d = Math.hypot(scales.sx(xv) - px, scales.sy(yv) - py);
        if (!best || d < best.d) best = { d, s, i, xv, yv };
      });
    }
    return best;
  }

  const tipHtml = (b) => `${b.s.name ? `<b>${esc(b.s.name)}</b><br>` : ''}${esc(opts.xLabel)}: ${esc((opts.tipX || opts.xFormat)(b.xv))}<br>${esc(opts.yLabel)}: ${esc((opts.tipY || opts.yFormat)(b.yv))}`;

  svg.addEventListener('pointermove', (e) => {
    if (!scales) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * svg.viewBox.baseVal.width;
    const py = ((e.clientY - rect.top) / rect.height) * svg.viewBox.baseVal.height;
    const b = nearest(px, py);
    if (b && b.d < 40) showTip(scales.sx(b.xv), scales.sy(b.yv), tipHtml(b)); else tip.hidden = true;
  });
  svg.addEventListener('pointerleave', () => { tip.hidden = true; });
  svg.addEventListener('blur', () => { tip.hidden = true; });
  svg.addEventListener('keydown', (e) => {
    const s = data.series.find((q) => q.x.length);
    if (!s || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    cursorIdx = Math.max(0, Math.min(s.x.length - 1, cursorIdx + (e.key === 'ArrowRight' ? 1 : -1)));
    const b = { s, i: cursorIdx, xv: s.x[cursorIdx], yv: s.y[cursorIdx] };
    if (Number.isFinite(b.xv) && Number.isFinite(b.yv)) showTip(scales.sx(b.xv), scales.sy(b.yv), tipHtml(b));
  });

  const ro = new ResizeObserver(() => render());
  ro.observe(container);

  return {
    update(next) { data = next; cursorIdx = -1; render(); },
    setOptions(o) { Object.assign(opts, o); svg.setAttribute('aria-label', opts.ariaLabel || `${opts.yLabel} versus ${opts.xLabel}`); render(); },
    destroy() { ro.disconnect(); },
  };
}
