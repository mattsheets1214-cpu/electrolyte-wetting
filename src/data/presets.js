/**
 * presets.js — one-click scenarios for the lab. Values are in DISPLAY units
 * (see src/data/parameters.js). Anything not listed falls back to the default.
 * Add a scenario by appending an object; the lab picks it up automatically.
 */
export const PRESETS = [
  {
    id: 'baseline',
    name: 'Baseline (1 cm in-plane)',
    mode: 'A',
    summary: 'The illustrative parameter set: measured electrolyte σ and μ, assumed r = 0.5 µm and θ = 30°.',
    values: {},
  },
  {
    id: 'through-thickness',
    name: 'Across one electrode (70 µm)',
    mode: 'A',
    summary: 'The "fast" side of the paradox: crossing a coating thickness takes milliseconds.',
    values: { X: 70 },
  },
  {
    id: 'in-plane-5cm',
    name: 'Edge to centre of a cell (5 cm)',
    mode: 'A',
    summary: 'The "slow" side of the paradox: tens of minutes, purely because time grows with distance squared.',
    values: { X: 50000 },
  },
  {
    id: 'tortuous',
    name: '5 cm with tortuosity τ = 2',
    mode: 'A',
    summary: 'A doubled path length quadruples the time.',
    values: { X: 50000, tau: 2 },
  },
  {
    id: 'near-90',
    name: 'Poorly wetting surface (θ = 85°)',
    mode: 'A',
    summary: 'cos θ is tiny, so capillarity barely pulls — and small errors in θ swing the answer wildly.',
    values: { thetaDeg: 85 },
  },
  {
    id: 'nonwetting-pushed',
    name: 'Non-wetting, pushed in (θ = 100°, +50 kPa)',
    mode: 'A',
    summary: 'Capillarity resists filling; an applied pressure larger than |p_c| is required.',
    values: { thetaDeg: 100, dpApplied: 50 },
  },
  {
    id: 'ambient-fill',
    name: 'Dead-end pore, filled at 1 atm',
    mode: 'B',
    summary: 'Gas trapped at atmospheric pressure is squeezed until it balances p_L + p_c: about half the pore stays empty.',
    values: { pg0: 101.3 },
  },
  {
    id: 'vacuum-10',
    name: 'Dead-end pore, evacuated to 10 kPa',
    mode: 'B',
    summary: 'Evacuating first leaves far less gas to compress.',
    values: { pg0: 10 },
  },
  {
    id: 'vacuum-1',
    name: 'Dead-end pore, evacuated to 1 kPa',
    mode: 'B',
    summary: 'A deep vacuum leaves the idealized pore about 99.5 % full.',
    values: { pg0: 1 },
  },
];
