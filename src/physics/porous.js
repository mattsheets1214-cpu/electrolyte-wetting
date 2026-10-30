/**
 * porous.js — closed-form Darcy relations used ONLY by Supplementary Section S2 and
 * the verification checks (paper Section 5.3 summarizes them).
 *
 * This is not a new solver and the lab does not call it: Mode A is unchanged.
 * These functions exist so that the numbers quoted in Supplementary Section S2 are computed,
 * tested and can never drift from the text.
 *
 * Model: one-dimensional imbibition with a SHARP front. Behind the front the
 * pores are fully saturated with liquid; ahead of it the gas escapes freely at
 * constant pressure. The liquid is incompressible and Newtonian.
 *
 *   Darcy (superficial velocity):      u = −(k/μ) dp/dx
 *   Constant k and area A:             Q = k A Δp / (μ L)
 *   Front (interstitial) speed:        dX/dt = u / ε          (ε = porosity)
 *   Constant drive P across 0 < x < X: u = k P / (μ X)  ⇒  X² = 2 k P t / (ε μ)
 *
 * All inputs and outputs SI.
 */
import { cosDeg } from './capillary.js';

// #region darcy-front
/** Time for a sharp, fully saturated Darcy front to reach X (m) under constant drive P (Pa). */
export function darcyFrontTime({ X, k, eps, mu, P }) {
  if (!(X > 0 && k > 0 && eps > 0 && eps <= 1 && mu > 0)) return NaN;
  if (!(P > 0)) return Infinity; // no positive drive: the front does not advance
  return (eps * mu * X * X) / (2 * k * P);
}
// #endregion

/** Steady volumetric flow through a slab: Q = k A Δp / (μ L), m³/s. */
export function darcyFlowRate({ k, A, dp, mu, L }) {
  return (k * A * dp) / (mu * L);
}

// #region bundle-permeability
/**
 * Permeability of a bundle of identical tortuous capillaries of radius r,
 * porosity ε and tortuosity τ = (path length)/(straight-line length):
 *   k = ε r² / (8 τ²)
 * One τ comes from the longer path, the other from the reduced axial component
 * of the velocity. (Texts that define tortuosity as τ² write k = ε r² / (8 τ).)
 */
export function bundlePermeability({ eps, r, tau }) {
  return (eps * r * r) / (8 * tau * tau);
}
// #endregion

/**
 * Kozeny–Carman permeability of a packing of spheres of diameter d:
 *   k = ε³ d² / (180 (1 − ε)²)
 * and the matching hydraulic radius r_h = ε d / (6 (1 − ε)) (pore volume ÷ wetted area).
 */
export function kozenyCarman({ eps, d }) {
  return {
    k: (eps ** 3 * d * d) / (180 * (1 - eps) ** 2),
    rh: (eps * d) / (6 * (1 - eps)),
  };
}

/**
 * Capillary pressure expressed with the hydraulic radius: p_c = σ cos θ / r_h.
 * For a cylinder r_h = r/2, so this equals 2σ cos θ / r.
 */
export function capillaryPressureHydraulic(sigma, thetaDeg, rh) {
  return (sigma * cosDeg(thetaDeg)) / rh;
}
