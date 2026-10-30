/**
 * aiDocs.js — AI project documentation (the course's AI-workflow deliverables).
 *
 * Since 30 Oct 2026 this is NOT shown on the website: the author presents it in
 * the project slide presentation. This file stays as the repository record that
 * the slides are built from, and tests/content.test.js still guards it.
 *
 * HONESTY RULE: only real material goes here. Anything still `null` (or an
 * empty array) is shown on the site as "Not yet supplied", so nothing can be
 * published as if it existed. Never fill a slot with invented text.
 *
 * Evidence files live in docs/evidence/ in the repository (not published as
 * part of the site); they are linked through GitHub.
 */
export const REPO_BLOB = 'https://github.com/mattsheets1214-cpu/electrolyte-wetting/blob/main/';

export const AI_DOCS = {
  models: [
    { role: 'Engineering blueprint (initial planning)', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-22' },
    { role: 'Website code, tests and text (v1)', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-29' },
    { role: 'Scientific audit and corrections (Phase 1–3)', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-29' },
    { role: 'Restructuring into a journal-style paper', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-30' },
    // Add the second model used for the independent critique / second implementation here.
  ],

  planning: {
    summary: 'The Model A blueprint (22 Oct 2026) framed the project around the contrast between millisecond filling of a single pore and tens of minutes for a whole cell; it kept five equations (Young, Young–Laplace, Hagen–Poiseuille, Washburn, Boyle) plus a tortuosity estimate, moved Darcy and Kozeny–Carman to optional extensions, specified two model modes (open capillary; dead-end pore with trapped gas), and limited validation to an order-of-magnitude plausibility check.',
    file: 'docs/evidence/model-a-blueprint-2026-10-22.pdf',
    unverifiedSources: [
      { cite: 'USPTO patent 9,083,034 (treated battery separator; contact angles 26.3° and 8.3° quoted in the blueprint)', why: 'Not opened during the build; not used.' },
      { cite: 'KRÜSS application material on electrode wetting (Washburn method)', why: 'Not opened during the build; not used.' },
    ],
  },

  prompts: [
    { title: 'Site build prompt (chat message and attached master build prompt)', date: '2026-10-29', file: 'docs/evidence/site-build-prompt-2026-10-29.md' },
    { title: 'Scientific audit, Phase 3 corrections, professor-feedback planning, journal-paper restructuring and final technical review', date: '2026-10-29 to 2026-10-30', file: 'docs/evidence/prompts-2026-10-29-30.md' },
  ],

  /** AI critiques actually performed. `independent` is true only if a DIFFERENT model reviewed the work. */
  critiques: [
    {
      title: 'Scientific audit of the website (Phase 1–2)', by: 'Claude Opus 5.5', date: '2026-10-29', independent: false,
      summary: 'No critical errors; 4 major issues (missing Darcy/porosity treatment, Young–Laplace not derived from curvature, vacuum-filling boundary conditions not stated, thin contact-angle caveats) and 12 minor issues. Every displayed number matched an independently written Python reference within a relative difference of 3 × 10⁻⁶; one 5 % difference was a physical inertia effect already flagged by the site. Corrections were implemented in pull request #6.',
      note: 'Performed by the same model that built the site, so it is not an independent critique.',
    },
  ],
  /** Critique by a different AI model (paste it or link the saved file). */
  independentCritique: null,

  implementations: {
    modelA: { name: 'Claude Opus 5.5', what: 'This website (code, tests, text).' },
    /** Second implementation from the same frozen specification by a different model: { name, what, link }. */
    modelB: null,
    /** Results of the SAME shared tests run on both implementations: [{ test, modelA, modelB, notes }]. */
    sharedTestResults: [],
    /** Your comparison of the two models' performance, in your own words. */
    comparison: null,
  },

  /**
   * Suggestions and the decisions taken on them. `source` = who proposed it;
   * `decision` = accepted | rejected | modified | pending. Reasoning is as recorded at the time.
   */
  decisions: [
    { date: '2026-10-29', suggestion: 'Remove the "AI lab" and "Presentation" pages; keep a video slot on the Overview.', source: 'Author', decision: 'accepted', reasoning: 'Owner request (reason not recorded). Superseded on 30 Oct: the AI documentation was reinstated as this separate page to satisfy the assignment.' },
    { date: '2026-10-29', suggestion: 'Audit M1: add Darcy flow — as a teaching section only, or also as lab outputs.', source: 'Claude (audit)', decision: 'modified', reasoning: 'Accepted as a teaching section only, with no new solver, because a capillary-bundle permeability reproduces the existing results exactly. On 30 Oct it was moved to Supplementary Section S2, with one paragraph in the paper\'s Discussion, to keep the main paper at an introductory level.' },
    { date: '2026-10-29', suggestion: 'Audit M3: add a constant solvent-vapour pressure term to the dead-end model.', source: 'Claude (audit)', decision: 'rejected', reasoning: 'Wording only: it would change the Mode B numbers by up to about 1–2 percentage points; the scenario, the non-condensable-gas definition and a vapour note were added instead.' },
    { date: '2026-10-29', suggestion: 'Audit M4: rename σ to γ_LG (and σ_sg, σ_sl to γ) throughout.', source: 'Claude (audit)', decision: 'rejected', reasoning: 'Kept σ with a "σ ≡ γ_LG" note: fewer edits and no risk to the equations.' },
    { date: '2026-10-30', suggestion: 'Professor: write in scientific/engineering journal style.', source: 'Professor', decision: 'accepted', reasoning: 'Site restructured as a paper (abstract, theory, methodology, results, discussion, conclusions) with an interactive demonstration, supplementary material and this page.' },
    { date: '2026-10-30', suggestion: 'Remove the quiz, misconception boxes and guided challenge.', source: 'Author', decision: 'accepted', reasoning: 'Not part of a journal paper.' },
    { date: '2026-10-30', suggestion: 'Use impersonal voice ("it is shown that…").', source: 'Author', decision: 'accepted', reasoning: 'Journal style.' },
    { date: '2026-10-30', suggestion: 'Use numbered citations [1].', source: 'Claude', decision: 'accepted', reasoning: 'Numbered citations are common in engineering journals; the author knows of no University of Cincinnati requirement. Can be changed if the instructor prefers author–year.' },
    { date: '2026-10-30', suggestion: 'Limit the main paper to equations derivable with introductory fluid mechanics; move advanced material to a supplement.', source: 'Author (interpretation of the professor\'s feedback)', decision: 'accepted', reasoning: 'The author must be able to explain and defend every element of the main paper in Q&A.' },
    { date: '2026-10-30', suggestion: 'Remove the slide-rule animation from the landing page.', source: 'Claude', decision: 'pending', reasoning: 'Proposed in the restructuring pull request (decorative relative to the paper\'s figures); awaiting the author\'s review.' },
  ],

  /** Implementation decisions made by the AI while building v1 (29 Oct 2026); recorded for review. */
  buildDecisions: [
    { decision: 'Run the solver in JavaScript; run an independent Python version in the browser via Pyodide on demand.', why: 'Instant response on phones without a large download, while still offering Python in WebAssembly. The two solvers use different methods and are tested against each other.' },
    { decision: 'Write the integrators by hand (Dormand–Prince 5(4) in JavaScript; RK4 with step doubling in Python).', why: 'One scalar ODE does not need a numerical library; short code is easier to show and defend. SciPy (Radau) is used as a third check in the desktop tests.' },
    { decision: 'Derive and use the exact dead-end trajectory t(λ).', why: 'Not in the blueprint. The ODE is separable, so the numerical solution can be checked at every point, not only at equilibrium.' },
    { decision: 'Add the dead-end pore length L_p as an input (default 70 µm).', why: 'The dead-end model needs a pore length; the fill fraction does not depend on it but the time does.' },
    { decision: 'Correct the electrolyte-property citation.', why: 'The blueprint gave "Int. J. Mol. Sci. 2015" without details; the source is Hofmann et al. 2015 (doi:10.3390/ijms160920258), with σ at 25 °C and μ at 20 °C.' },
    { decision: 'Attribute the 50 vs 100 min and ~10 % uptake numbers to the TUM press release.', why: 'The journal abstract states "about a factor of two"; the specific numbers appear in the press release.' },
  ],

  contribution: {
    facts: 'Individual project by Matthew Sheets (University of Cincinnati, introductory fluid mechanics, 2026). He chose the topic, obtained the instructor\'s approval, set the requirements, directed the AI tools, and reviews and approves every change through GitHub pull requests before publication.',
    /** Your own reflection, in your own words: what you learned, what you would do differently, what AI did well and badly. */
    reflection: null,
    /** Your own derivations or notes (e.g. scans of hand derivations): [{ title, file }]. */
    ownWork: [],
  },
};
