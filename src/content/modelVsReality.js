/**
 * modelVsReality.js — content for the "Model versus reality" panel (Lab page).
 * Keep this honest: it is the main defence against over-claiming.
 */
export const MODEL_VS_REALITY = [
  { head: 'Analytical (exact formulas)', body: 'Capillary pressure, the Washburn coefficient, Mode A times, Mode B equilibrium fill fraction, and the exact Mode B trajectory t(L).' },
  { head: 'Numerical (computed by the ODE solver)', body: 'The Mode B front position L(t), gas pressure p_g(t), end state and t₉₅. Each is checked against the exact results on the Code & Verification page.' },
  { head: 'Measured inputs', body: 'Surface tension 29.4 mN/m and viscosity 4.4 mPa·s for one EC/DMC + LiPF₆ electrolyte (Hofmann et al. 2015). Note they were measured at 25 °C and 20 °C respectively.' },
  { head: 'Assumed inputs', body: 'Pore radius 0.5 µm (within the range implied by porosimetry of graphite anodes), contact angle 30° (between two measured separator values), tortuosity, pore length, liquid pressure 101.3 kPa, isothermal gas.' },
  { head: 'Experimental observations available', body: 'Edge-inward wetting of a prismatic cell, about twice as fast under vacuum (Weydanz et al. 2018); ~50 vs ~100 min and ~10 % lower uptake at normal pressure (TUM press release). Qualitative trends in electrode imbibition (Davoodabadi et al. 2019). None of these match the model geometry, so they test plausibility, not accuracy.' },
  { head: 'What the model cannot predict', body: 'The filling time of a specific commercial cell; effects of pore-size distribution and connectivity; dynamic contact angle; gas dissolution; electrolyte uptake by binder; anything electrochemical.' },
  { head: 'Why real electrodes trap less gas', body: 'Pores are interconnected. Gas ahead of a front can escape sideways into pores that are not yet filled and out of the stack, instead of being squeezed in a sealed dead end. The dead-end model is therefore a worst case.' },
];
