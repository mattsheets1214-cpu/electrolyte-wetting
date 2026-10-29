/**
 * constants.js — fixed physical constants and fixed model settings (SI units).
 *
 * Anything a student can change in the lab lives in src/data/parameters.js,
 * not here. Values here are either universal constants or deliberately fixed
 * modelling choices that are documented on the site.
 */

/** Gravitational acceleration, m/s². Used only for the Bond-number validity check. */
export const G = 9.81;

/**
 * Liquid-side absolute pressure used in Mode B, Pa.
 * Fixed at 101.3 kPa (≈ 1 atm) as specified in the project brief.
 * Standard atmosphere is 101.325 kPa; the 0.025 kPa difference is irrelevant here.
 */
export const P_LIQUID_ABS = 101300;

/**
 * Electrolyte density, kg/m³. Hofmann et al. (2015) report 1.3030 g/cm³ at 25 °C
 * for EC/DMC 50:50 (wt) + LiPF6 (0.787 mol/kg). Used only for the inertia,
 * Reynolds-number and Bond-number validity checks — never in the filling time.
 */
export const RHO_ELECTROLYTE = 1303;

/** Temperature assumed throughout (°C). Only informational: no property is temperature-corrected. */
export const TEMPERATURE_C = 25;

/** Numerical tolerance used to decide that cos θ is "zero" (θ = 90°). */
export const COS_ZERO_TOL = 1e-12;
