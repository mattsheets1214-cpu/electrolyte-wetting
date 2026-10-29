/**
 * units.js — unit conversions and human-friendly formatting.
 *
 * Rule for the whole project: physics functions take and return SI units only.
 * Conversions happen at the edges (the lab controls and the displayed outputs).
 */

export const toSI = {
  um: (v) => v * 1e-6, // micrometres → m
  mm: (v) => v * 1e-3,
  cm: (v) => v * 1e-2,
  mNm: (v) => v * 1e-3, // mN/m → N/m
  mPas: (v) => v * 1e-3, // mPa·s → Pa·s
  kPa: (v) => v * 1e3, // kPa → Pa
  deg: (v) => (v * Math.PI) / 180, // degrees → radians
};

export const fromSI = {
  um: (v) => v * 1e6,
  mm: (v) => v * 1e3,
  cm: (v) => v * 1e2,
  mNm: (v) => v * 1e3,
  mPas: (v) => v * 1e3,
  kPa: (v) => v * 1e-3,
  deg: (v) => (v * 180) / Math.PI,
};

/** Significant-figure formatting that never prints "-0" or a trailing ".". */
export function sig(v, digits = 3) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const s = Number(v.toPrecision(digits));
  return Object.is(s, -0) ? '0' : String(s);
}

/** Scientific notation with a proper × and superscript exponent, e.g. 1.45 × 10⁻⁶. */
export function sci(v, digits = 3) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(v)));
  if (exp >= -2 && exp <= 3) return sig(v, digits);
  const mant = v / 10 ** exp;
  const sup = String(exp).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  return `${sig(mant, digits)} × 10${sup}`;
}

/**
 * Format a duration (s) in the most readable unit.
 * @returns {{value:string, unit:string, text:string}}
 */
export function formatTime(seconds, digits = 3) {
  if (!Number.isFinite(seconds)) return { value: '∞', unit: '', text: 'never (no net driving pressure)' };
  const abs = Math.abs(seconds);
  let value, unit;
  if (abs < 1e-6) { value = seconds * 1e9; unit = 'ns'; }
  else if (abs < 1e-3) { value = seconds * 1e6; unit = 'µs'; }
  else if (abs < 1) { value = seconds * 1e3; unit = 'ms'; }
  else if (abs < 120) { value = seconds; unit = 's'; }
  else if (abs < 7200) { value = seconds / 60; unit = 'min'; }
  else if (abs < 3 * 86400) { value = seconds / 3600; unit = 'h'; }
  else { value = seconds / 86400; unit = 'days'; }
  const v = sig(value, digits);
  return { value: v, unit, text: `${v} ${unit}` };
}

/** Format a length (m) in µm, mm or cm. */
export function formatLength(m, digits = 3) {
  const abs = Math.abs(m);
  let value, unit;
  if (abs < 1e-6) { value = m * 1e9; unit = 'nm'; }
  else if (abs < 1e-3) { value = m * 1e6; unit = 'µm'; }
  else if (abs < 1e-2) { value = m * 1e3; unit = 'mm'; }
  else { value = m * 1e2; unit = 'cm'; }
  const v = sig(value, digits);
  return { value: v, unit, text: `${v} ${unit}` };
}
