/**
 * challenge.js — inverse calculations for the guided engineering challenge.
 * Every function checks feasibility before returning a number.
 */
import { cosDeg, capillaryPressure } from './capillary.js';

// #region required-radius
/**
 * Smallest pore radius that reaches straight-line distance X within time tMax
 * under PURE capillary drive (no applied pressure).
 *   t = 2 μ τ² X² / (r σ cos θ)   →   r_min = 2 μ τ² X² / (t_max σ cos θ)
 * Larger pores fill faster here (t ∝ 1/r), so any r ≥ r_min meets the target.
 */
export function requiredRadius({ X, tMax, sigma, thetaDeg, mu, tau = 1 }) {
  const c = cosDeg(thetaDeg);
  if (!(c > 0)) return { feasible: false, reason: 'With θ ≥ 90° there is no spontaneous capillary drive, so no pore radius meets the target without applied pressure.' };
  if (!(X > 0 && tMax > 0 && sigma > 0 && mu > 0 && tau >= 1)) return { feasible: false, reason: 'Inputs must be positive (and τ ≥ 1).' };
  const r = (2 * mu * tau * tau * X * X) / (tMax * sigma * c);
  return { feasible: true, r };
}
// #endregion

// #region required-gas-pressure
/**
 * Highest initial non-condensable gas pressure (absolute) that keeps the idealized
 * dead-end pore at least `fillTarget` full:
 *   L_eq/L_p = 1 − p_g0/(p_L + p_c) ≥ f   →   p_g0 ≤ (1 − f)(p_L + p_c)
 */
export function requiredGasPressure({ fillTarget, pL, sigma, thetaDeg, r }) {
  if (!(fillTarget > 0 && fillTarget < 1)) return { feasible: false, reason: 'Target fill fraction must be between 0 and 1.' };
  const pc = capillaryPressure(sigma, thetaDeg, r);
  const P = pL + pc;
  if (!(P > 0)) return { feasible: false, reason: 'p_L + p_c ≤ 0: the liquid cannot enter the pore at all.' };
  return { feasible: true, pg0Max: (1 - fillTarget) * P, pc, P };
}
// #endregion
