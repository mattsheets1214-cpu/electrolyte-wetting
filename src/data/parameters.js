/**
 * parameters.js — every lab input, its display unit, slider range, default,
 * and WHERE THE DEFAULT COMES FROM. Edit this file to change defaults or ranges.
 *
 * basis: 'measured'   — taken from a cited measurement (see src/content/references.js)
 *        'assumption' — a modelling choice or illustrative value, labelled on the site
 *        'geometry'   — set by the scenario being studied
 *
 * `toSI` converts the displayed unit to SI; physics code only ever sees SI.
 */
import { P_LIQUID_ABS } from '../physics/constants.js';

export const PARAMETERS = {
  r: {
    label: 'Pore radius', symbol: 'r', unit: 'µm', toSI: 1e-6,
    default: 0.5, min: 0.05, max: 5, step: 0.01, scale: 'log', modes: ['A', 'B'],
    basis: 'assumption',
    note: 'Illustrative. Within the range implied by mercury porosimetry of graphite anodes (average pore diameters 0.33–0.99 µm, i.e. radii ≈ 0.16–0.50 µm; Sheng et al. 2014). Real electrodes have a distribution of sizes.',
    refs: ['sheng2014'],
  },
  sigma: {
    label: 'Surface tension', symbol: 'σ', unit: 'mN/m', toSI: 1e-3,
    default: 29.4, min: 20, max: 40, step: 0.1, scale: 'linear', modes: ['A', 'B'],
    basis: 'measured',
    note: 'Measured 29.4 ± 0.2 mN/m at 25 °C for EC/DMC 50:50 (wt) + LiPF₆ 0.787 mol/kg (Hofmann et al. 2015). Electrolytes in that study spanned 23.3–38.1 mN/m.',
    refs: ['hofmann2015'],
  },
  thetaDeg: {
    label: 'Contact angle', symbol: 'θ', unit: '°', toSI: 1,
    default: 30, min: 0, max: 120, step: 0.5, scale: 'linear', modes: ['A', 'B'],
    basis: 'assumption',
    note: 'Illustrative. For the same electrolyte, Hofmann et al. (2015) measured 46.2° on an uncoated PE separator and 15.2° on a ceramic-coated one; electrode contact angles were not measured. 30° sits between these.',
    refs: ['hofmann2015'],
  },
  mu: {
    label: 'Dynamic viscosity', symbol: 'μ', unit: 'mPa·s', toSI: 1e-3,
    default: 4.4, min: 1, max: 10, step: 0.1, scale: 'linear', modes: ['A', 'B'],
    basis: 'measured',
    note: 'Measured 4.4 ± 0.1 mPa·s at 20 °C for the same electrolyte (Hofmann et al. 2015). Note the 5 °C mismatch with the surface-tension temperature; viscosity falls as temperature rises.',
    refs: ['hofmann2015'],
  },
  dpApplied: {
    label: 'Applied pressure difference', symbol: 'Δpₐ', unit: 'kPa', toSI: 1e3,
    default: 0, min: -100, max: 200, step: 1, scale: 'linear', modes: ['A'],
    basis: 'assumption',
    note: 'Liquid-side minus gas-side pressure. 0 = spontaneous capillary filling. Negative values are allowed as long as the total drive p_c + Δpₐ stays positive.',
  },
  X: {
    label: 'Target distance', symbol: 'X', unit: 'µm', toSI: 1e-6,
    default: 10000, min: 10, max: 100000, step: 1, scale: 'log', modes: ['A'],
    basis: 'geometry',
    note: 'Straight-line wetting distance. ~70 µm ≈ through an electrode coating; 1–5 cm ≈ in-plane from the edge of a cell. Displayed in µm, mm or cm.',
  },
  tau: {
    label: 'Tortuosity', symbol: 'τ', unit: '–', toSI: 1,
    default: 1, min: 1, max: 5, step: 0.05, scale: 'linear', modes: ['A'],
    basis: 'assumption',
    note: 'Path-length ratio (actual path ÷ straight line); in this single-pore model time scales with τ² (not a general law for porous electrodes). Some texts call the square of this ratio the tortuosity, so check the definition before comparing values. An idealized correction, not a material constant. τ = 1 means a straight pore.',
  },
  pg0: {
    label: 'Initial non-condensable gas pressure', symbol: 'p_g0', unit: 'kPa abs', toSI: 1e3,
    default: 101.3, min: 0.1, max: 101.3, step: 0.1, scale: 'log', modes: ['B'],
    basis: 'assumption',
    note: 'ABSOLUTE pressure of the non-condensable gas (air, argon, nitrogen) sealed in the pore when liquid covers its mouth. 101.3 kPa = filled at atmospheric pressure; lower values represent evacuating the dry cell first. Solvent vapour (DMC ≈ 2.4 kPa at 21 °C) condenses rather than compressing, and gas dissolution is ignored.',
  },
  Lp: {
    label: 'Dead-end pore length', symbol: 'L_p', unit: 'µm', toSI: 1e-6,
    default: 70, min: 1, max: 100000, step: 1, scale: 'log', modes: ['B'],
    basis: 'assumption',
    note: 'Illustrative: 70 µm ≈ one electrode coating thickness, e.g. a pore through the coating closed by the current-collector foil. The equilibrium fill fraction does not depend on L_p; only the time does (t ∝ L_p²).',
  },
};

/** Fixed (not user-editable) settings shown on the site. */
export const FIXED = {
  pL: { label: 'Liquid-side absolute pressure (Mode B)', value: P_LIQUID_ABS, display: '101.3 kPa abs', basis: 'assumption', note: 'Liquid reservoir at atmospheric pressure, as specified in the project brief: the pore gas is sealed at p_g0, then the reservoir is vented to 101.3 kPa.' },
  temperature: { label: 'Temperature', value: 25, display: '25 °C', basis: 'assumption', note: 'Properties are not temperature-corrected.' },
};

/** Default values in DISPLAY units. */
export const DEFAULTS = Object.fromEntries(Object.entries(PARAMETERS).map(([k, v]) => [k, v.default]));

/** Convert a display-unit parameter object to SI (adds the fixed liquid pressure). */
export function toSIParams(display) {
  const out = {};
  for (const [k, def] of Object.entries(PARAMETERS)) out[k] = Number(display[k]) * def.toSI;
  out.pL = P_LIQUID_ABS;
  return out;
}
