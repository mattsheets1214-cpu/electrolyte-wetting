/**
 * aiLab.js — evidence for the course's AI-workflow requirement.
 *
 * HOW TO ADD YOUR EVIDENCE: replace each `null` / empty array below with the
 * real material. Anything still `null` is shown on the site as
 * "Not yet collected", so nothing can be published as if it were real.
 * Put files (PDFs, transcripts) in public/evidence/ and link them by filename.
 */
export const AI_LAB = {
  models: [
    { role: 'Model A — engineering blueprint', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-22', evidence: 'evidence/model-a-blueprint-2026-10-22.pdf' },
    { role: 'Website implementation (this site, v1)', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-29', evidence: 'evidence/site-build-prompt-2026-10-29.md' },
    { role: 'Model B — independent critique', name: null, provider: null, version: null, date: null, evidence: null },
  ],

  modelA: {
    summary: 'The blueprint reframed the project around the "milliseconds vs tens of minutes" paradox, kept five equations (Young, Young–Laplace, Hagen–Poiseuille, Washburn, Boyle) plus a tortuosity estimate, moved Darcy and Kozeny–Carman to optional extensions, specified two model modes (open capillary; dead-end pore with trapped gas), and downgraded validation to an order-of-magnitude plausibility check.',
    file: 'evidence/model-a-blueprint-2026-10-22.pdf',
  },

  // Paste Model B's critique (or a link to the saved file) here.
  modelBCritique: null,

  // One row per suggestion. decision: 'accept' | 'reject' | 'modify'.
  // Example row (delete when you add real ones):
  // { issue: 'Drop Kozeny–Carman from v1', modelA: 'Optional only', modelB: '...', evidence: 'Parameter-consistency argument', decision: 'accept', reason: '...', test: 'n/a' },
  decisions: [],

  // Exact prompts used for the two comparable implementations (identical wording for both models).
  implementationPrompts: [],

  // Results of the SAME shared test suite run on both implementations.
  // { test: 'Analytical benchmark', modelA: 'pass', modelB: 'fail (rel. error 3e-4)', notes: '' }
  testResults: [],

  // Bugs you found and fixed by hand.
  // { found: 'date', where: 'file/function', symptom: '', cause: '', fix: '', learned: '' }
  bugs: [],

  // Your own engineering decisions and reasoning, in your words.
  myDecisions: null,
};

/**
 * Decisions made while building v1 of the site (Oct 29, 2026). These are
 * facts about this implementation, recorded so you can review, accept or
 * overrule them. They are NOT your Model B comparison.
 */
export const BUILD_DECISIONS = [
  { decision: 'Run the lab solver in JavaScript; run an independent Python version in the browser via Pyodide on demand.', why: 'Instant response on phones and no 10+ MB download before the lab works, while still offering Python-in-WebAssembly. The two solvers use different methods and are tested against each other.' },
  { decision: 'Write the integrators by hand (Dormand–Prince 5(4) in JS; RK4 with step doubling in Python) instead of using SciPy in the browser.', why: 'One scalar ODE does not need SciPy; hand-written code is short enough to show and defend. SciPy (Radau) is still used as a third check in the desktop tests.' },
  { decision: 'Derive and use the exact Mode B trajectory t(λ).', why: 'Not in the blueprint. The ODE is separable, so the numerical solution can be checked at every point, not only at equilibrium.' },
  { decision: 'Added dead-end pore length L_p as a Mode B input (default 70 µm).', why: 'Mode B needs a pore length; the fill fraction does not depend on it but the time does.' },
  { decision: 'Added a capillary-number (dynamic contact angle) check.', why: 'At the baseline, Ca ≈ 0.02 in the first moments of filling — large enough that a static contact angle is questionable early on. This is a real limitation worth showing.' },
  { decision: 'Corrected the electrolyte-property citation.', why: 'The blueprint attributed σ and μ to "Int. J. Mol. Sci. 2015" without full details. The source is Hofmann et al. 2015, IJMS 16, 20258 (DOI 10.3390/ijms160920258). σ was measured at 25 °C and μ at 20 °C (the blueprint said 20 °C for both).' },
  { decision: 'Attributed the 50 vs 100 min and ~10 % uptake numbers to the TUM press release.', why: 'The journal abstract states "about a factor of two"; the specific numbers appear in the press release.' },
];
