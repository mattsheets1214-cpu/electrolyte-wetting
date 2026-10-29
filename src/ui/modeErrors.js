/**
 * modeErrors.js — which input errors the lab should show.
 *
 * The lab solves both modes on every update (Plot 2 uses Mode A, Plot 3 uses
 * Mode B). Errors are reported only for the ACTIVE mode. validateInputs(p, mode)
 * already checks the fields both modes share (r, σ, θ, μ), so a bad shared value
 * is still reported in either mode, while a Mode B-only problem (for example
 * L_p ≤ r) cannot blank the Mode A results, and vice versa.
 *
 * @param {'A'|'B'} mode   the mode the student is looking at
 * @param {{ok:boolean, errors?:{field:string,message:string}[]}} resA  solveModeA result
 * @param {{ok:boolean, errors?:{field:string,message:string}[]}} resB  solveModeB result
 * @returns {{field:string,message:string}[]} unique errors (one per field)
 */
export function errorsForMode(mode, resA, resB) {
  const res = mode === 'B' ? resB : resA;
  const errs = res && !res.ok ? res.errors : [];
  return errs.filter((e, i) => errs.findIndex((q) => q.field === e.field) === i);
}
