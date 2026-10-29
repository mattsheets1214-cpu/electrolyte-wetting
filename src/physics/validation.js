/**
 * validation.js — input checks that REJECT physically meaningless inputs.
 *
 * Philosophy (from the project brief): never silently clamp an input. If a value
 * cannot be used, say so and explain why. Values that are allowed but push the
 * model outside its comfortable range are NOT handled here — they produce
 * warnings in validity.js instead.
 *
 * All inputs are SI: r [m], sigma [N/m], thetaDeg [deg], mu [Pa·s],
 * dpApplied [Pa], X [m], tau [-], pL [Pa abs], pg0 [Pa abs], Lp [m].
 */

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * @param {object} p   parameter object (SI)
 * @param {'A'|'B'} mode
 * @returns {{ok:boolean, errors:{field:string, message:string}[]}}
 */
export function validateInputs(p, mode) {
  const errors = [];
  const err = (field, message) => errors.push({ field, message });

  if (!isNum(p.r)) err('r', 'Pore radius must be a number.');
  else if (p.r <= 0) err('r', 'Pore radius must be greater than zero.');

  if (!isNum(p.sigma)) err('sigma', 'Surface tension must be a number.');
  else if (p.sigma <= 0) err('sigma', 'Surface tension must be greater than zero; a liquid–gas interface always has positive tension.');

  if (!isNum(p.thetaDeg)) err('thetaDeg', 'Contact angle must be a number.');
  else if (p.thetaDeg < 0 || p.thetaDeg > 180) err('thetaDeg', 'Contact angle must lie between 0° and 180° (measured through the liquid).');

  if (!isNum(p.mu)) err('mu', 'Viscosity must be a number.');
  else if (p.mu <= 0) err('mu', 'Dynamic viscosity must be greater than zero.');

  if (mode === 'A') {
    if (!isNum(p.dpApplied)) err('dpApplied', 'Applied pressure difference must be a number (it may be negative).');
    if (!isNum(p.X)) err('X', 'Target distance must be a number.');
    else if (p.X <= 0) err('X', 'Target distance must be greater than zero.');
    if (!isNum(p.tau)) err('tau', 'Tortuosity must be a number.');
    else if (p.tau < 1) err('tau', 'Tortuosity is a path-length ratio (actual path ÷ straight-line distance), so it cannot be less than 1.');
  }

  if (mode === 'B') {
    if (!isNum(p.pL)) err('pL', 'Liquid-side pressure must be a number.');
    else if (p.pL <= 0) err('pL', 'Liquid-side pressure is an ABSOLUTE pressure and must be greater than zero.');
    if (!isNum(p.pg0)) err('pg0', 'Initial gas pressure must be a number.');
    else if (p.pg0 < 0) err('pg0', 'Initial gas pressure is an ABSOLUTE pressure and cannot be negative (0 kPa is a perfect vacuum).');
    if (!isNum(p.Lp)) err('Lp', 'Pore length must be a number.');
    else if (p.Lp <= 0) err('Lp', 'Pore length must be greater than zero.');
    else if (isNum(p.r) && p.r > 0 && p.Lp <= p.r) err('Lp', 'Pore length must be longer than the pore radius; otherwise the object is not a capillary and Hagen–Poiseuille flow does not apply.');
  }

  return { ok: errors.length === 0, errors };
}
