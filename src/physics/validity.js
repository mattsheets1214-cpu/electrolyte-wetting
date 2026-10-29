/**
 * validity.js — dimensionless checks that tell the student when the model's
 * assumptions are being stretched. These never change a result; they explain it.
 *
 * Levels: 'ok' (assumption comfortably satisfied), 'caution' (worth discussing),
 * 'warn' (the idealized model is likely misleading here), 'info' (always-true caveat).
 */
import { G, RHO_ELECTROLYTE } from './constants.js';
import { sci, sig, formatTime } from './units.js';

/**
 * @param {object} p   SI inputs (r, sigma, thetaDeg, mu; plus Lp for mode B)
 * @param {object} ctx { mode:'A'|'B', D?: m²/s along path, Lref?: m, tRef?: s }
 *   For Mode A pass D and Lref = target path length; for Mode B pass D at the
 *   initial drive and Lref = L_p.
 * @returns {{id:string, level:string, title:string, value:string, detail:string}[]}
 */
export function validityChecks(p, ctx) {
  const rho = RHO_ELECTROLYTE;
  const out = [];
  const { D, Lref, tRef } = ctx;

  // 1. Inertia: viscous diffusion time across the pore, t_v = ρ r² / μ.
  const tv = (rho * p.r * p.r) / p.mu;
  if (Number.isFinite(tRef) && tRef > 0) {
    const ratio = tRef / tv;
    out.push({
      id: 'inertia', level: ratio > 1e3 ? 'ok' : ratio > 10 ? 'caution' : 'warn',
      title: 'Inertial start-up',
      value: `t_v = ρr²/μ = ${formatTime(tv).text}`,
      detail: `Inertia matters only for roughly the first few t_v. The filling time is ${sci(ratio, 2)} × t_v, so ${ratio > 1e3 ? 'the quasi-steady (inertia-free) Washburn assumption is excellent' : 'the early inertial regime is a noticeable part of the process and the model is less accurate'}.`,
    });
  }

  // 2. Reynolds number of the moving front at the reference distance. v = D / (2 L).
  if (Number.isFinite(D) && D > 0 && Lref > 0) {
    const vRef = D / (2 * Lref);
    const vEarly = D / (2 * 10 * p.r); // front speed once it has moved 10 radii in
    const ReRef = (rho * vRef * 2 * p.r) / p.mu;
    const ReEarly = (rho * vEarly * 2 * p.r) / p.mu;
    out.push({
      id: 'reynolds', level: ReEarly < 1 ? 'ok' : ReEarly < 100 ? 'caution' : 'warn',
      title: 'Reynolds number',
      value: `Re ≈ ${sci(ReEarly, 2)} (early) → ${sci(ReRef, 2)} (at target)`,
      detail: `Re = ρ v (2r) / μ. The front is fastest at the start (v = D/2L), so Re is evaluated after the front has moved 10 pore radii. ${ReEarly < 1 ? 'Re ≪ 2300 everywhere: flow is deeply laminar (creeping flow).' : 'Re is not small early on; laminar Hagen–Poiseuille flow still holds below ~2300, but entrance and inertial effects grow.'}`,
    });

    // 3. Capillary number → dynamic contact angle.
    const CaEarly = (p.mu * vEarly) / p.sigma;
    const CaRef = (p.mu * vRef) / p.sigma;
    out.push({
      id: 'capillary-number', level: CaRef < 1e-4 ? (CaEarly < 1e-3 ? 'ok' : 'caution') : 'warn',
      title: 'Dynamic contact angle (capillary number)',
      value: `Ca ≈ ${sci(CaEarly, 2)} (early) → ${sci(CaRef, 2)} (at target)`,
      detail: `Ca = μv/σ compares viscous to surface-tension forces at the moving contact line. When Ca is above roughly 10⁻⁴–10⁻³ the advancing (dynamic) contact angle is larger than the static angle used here, which slows the earliest filling. ${CaEarly >= 1e-3 ? 'That is the case at the very start of filling.' : ''}`,
    });
  }

  // 4. Bond number: gravity vs surface tension at the pore scale.
  const Bo = (rho * G * p.r * p.r) / p.sigma;
  out.push({
    id: 'bond', level: Bo < 1e-3 ? 'ok' : Bo < 0.1 ? 'caution' : 'warn',
    title: 'Gravity (Bond number)',
    value: `Bo = ρgr²/σ = ${sci(Bo, 2)}`,
    detail: Bo < 1e-3 ? 'Gravity is negligible compared with surface tension at this pore size, so neglecting it is justified.' : 'Gravity is no longer negligible at this pore size; a vertical pore would fill more slowly than predicted.',
  });

  // 5. Contact angle near 90°.
  if (p.thetaDeg > 80) {
    out.push({
      id: 'theta', level: p.thetaDeg >= 90 ? 'warn' : 'caution',
      title: 'Contact angle near or above 90°',
      value: `θ = ${sig(p.thetaDeg, 3)}°`,
      detail: 'cos θ is small or negative, so the capillary drive is weak or reversed. Small errors in θ (and contact-angle hysteresis) now change the answer enormously.',
    });
  }

  // 6. Continuum / no-slip for tiny pores.
  if (p.r < 10e-9) {
    out.push({ id: 'continuum', level: 'warn', title: 'Very small pore', value: `r = ${sig(p.r * 1e9, 3)} nm`,
      detail: 'Below about 10 nm the pore is only a few solvent molecules across; continuum fluid mechanics, a sharp meniscus and the no-slip condition become questionable.' });
  } else if (p.r < 50e-9) {
    out.push({ id: 'continuum', level: 'caution', title: 'Small pore', value: `r = ${sig(p.r * 1e9, 3)} nm`,
      detail: 'Continuum assumptions still hold, but surface effects (adsorbed layers, slip) can start to matter at this scale.' });
  }

  // 7. Slenderness (Mode B pore must be long compared with its radius).
  if (ctx.mode === 'B' && p.Lp < 20 * p.r) {
    out.push({ id: 'slender', level: 'caution', title: 'Short pore', value: `L_p / r = ${sig(p.Lp / p.r, 3)}`,
      detail: 'Hagen–Poiseuille assumes fully developed flow far from the ends. For pores shorter than ~20 radii, entrance and meniscus effects are not negligible.' });
  }

  // 8. Always-on reminder that this is one idealized pore.
  out.push({
    id: 'idealized', level: 'info', title: 'One idealized pore',
    value: 'single cylinder, uniform r',
    detail: ctx.mode === 'B'
      ? 'Real electrodes are connected networks: gas can escape through neighbouring unfilled pores, so the dead-end result is a worst case (upper bound) for gas trapping.'
      : 'Real electrodes have a distribution of pore sizes and an uncertain tortuosity. Treat the time as an idealized estimate, not a prediction for a specific cell.',
  });

  return out;
}
