/**
 * controls.js — a paired slider + number field for one lab parameter.
 *
 * - The slider is for intuition; the number field is for precision. They stay in sync.
 * - Log-scaled parameters use a logarithmic slider.
 * - Typing a value outside the slider's range is ALLOWED (the physics decides
 *   whether it is valid). The slider then sits at its end and a note says the
 *   value is outside the slider range — nothing is silently clamped.
 */
import { el, esc } from './dom.js';

const SLIDER_STEPS = 1000;

export function createParamControl(key, def, value, onChange) {
  const id = `p-${key}`;
  const node = el(`
    <div class="param" data-key="${key}">
      <div class="param__top">
        <label class="param__label" for="${id}-num">${esc(def.label)}<span class="sym">${def.symbol}</span></label>
        <span class="param__entry">
          <input id="${id}-num" type="number" inputmode="decimal" step="any" aria-describedby="${id}-err ${id}-note" />
          <span class="unit">${esc(def.unit)}</span>
        </span>
      </div>
      <input class="param__slider" id="${id}-slider" type="range" min="0" max="${SLIDER_STEPS}" step="1"
             aria-label="${esc(def.label)} slider${def.scale === 'log' ? ' (logarithmic)' : ''}" />
      <div class="param__range-note" hidden></div>
      <div class="param__error" id="${id}-err" role="alert"></div>
      <div class="param__meta">
        <span class="badge badge--${def.basis}">${def.basis}</span>
        <details id="${id}-note"><summary>Source</summary>${esc(def.note)}</details>
      </div>
    </div>`);

  const num = node.querySelector('input[type=number]');
  const slider = node.querySelector('input[type=range]');
  const rangeNote = node.querySelector('.param__range-note');
  const isLog = def.scale === 'log';

  const toSlider = (v) => {
    const f = isLog ? (Math.log10(v) - Math.log10(def.min)) / (Math.log10(def.max) - Math.log10(def.min)) : (v - def.min) / (def.max - def.min);
    return Math.round(Math.min(1, Math.max(0, f)) * SLIDER_STEPS);
  };
  const fromSlider = (s) => {
    const f = s / SLIDER_STEPS;
    const v = isLog ? 10 ** (Math.log10(def.min) + f * (Math.log10(def.max) - Math.log10(def.min))) : def.min + f * (def.max - def.min);
    // round to 3 significant figures for log sliders, to the step for linear ones
    return isLog ? Number(v.toPrecision(3)) : Math.round(v / def.step) * def.step;
  };
  const fmt = (v) => (Number.isFinite(v) ? String(Number(v.toPrecision(6))) : '');

  function set(v, { emit = false } = {}) {
    num.value = fmt(v);
    const out = Number.isFinite(v) && (v < def.min || v > def.max);
    slider.value = Number.isFinite(v) && (!isLog || v > 0) ? toSlider(v) : 0;
    rangeNote.hidden = !out;
    rangeNote.textContent = out ? `Outside the slider range (${def.min}–${def.max} ${def.unit}); using the typed value.` : '';
    if (emit) onChange(key, v);
  }

  slider.addEventListener('input', () => set(fromSlider(Number(slider.value)), { emit: true }));
  num.addEventListener('input', () => {
    const v = num.value.trim() === '' ? NaN : Number(num.value);
    const out = Number.isFinite(v) && (v < def.min || v > def.max);
    if (Number.isFinite(v) && (!isLog || v > 0)) slider.value = toSlider(v);
    rangeNote.hidden = !out;
    rangeNote.textContent = out ? `Outside the slider range (${def.min}–${def.max} ${def.unit}); using the typed value.` : '';
    onChange(key, v);
  });

  set(value);
  return {
    node,
    set,
    setError(msg) {
      node.classList.toggle('is-invalid', !!msg);
      node.querySelector('.param__error').textContent = msg || '';
    },
  };
}
