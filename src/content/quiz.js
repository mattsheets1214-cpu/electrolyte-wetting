/**
 * quiz.js — end-of-theory quiz. Each wrong option has its own explanation, so
 * the feedback says WHY that answer is tempting and where it goes wrong.
 */
export const QUIZ = [
  {
    q: 'A pore fills 50 µm in 2 ms. Under the same conditions, roughly how long does it take to fill 500 µm?',
    options: [
      { text: '20 ms', why: 'That assumes time ∝ distance. Washburn flow gives time ∝ distance², so 10× the distance takes 100× the time.' },
      { text: '200 ms', correct: true, why: 'Right: (500/50)² = 100, and 100 × 2 ms = 200 ms.' },
      { text: '6.3 ms', why: 'That is 2 ms × √10 — the square root went the wrong way. Distance ∝ √t, so time ∝ distance².' },
    ],
  },
  {
    q: 'Under pure capillary drive (no applied pressure), what happens to the time to wet a fixed distance if the pore radius is doubled?',
    options: [
      { text: 'It doubles, because capillary pressure halves.', why: 'Capillary pressure does halve, but resistance falls by 4× (∝ 1/r²). The net effect is faster filling.' },
      { text: 'It halves.', correct: true, why: 'Right: t = 2μX²/(rσcosθ) ∝ 1/r.' },
      { text: 'It falls by 4×.', why: 'That is the result when an independent pressure difference is held fixed. With capillary drive, the drive itself falls as 1/r, so t ∝ 1/r.' },
    ],
  },
  {
    q: 'The contact angle is exactly 90° and no pressure is applied. What does the model predict?',
    options: [
      { text: 'Very slow filling.', why: 'Close, but at exactly 90° cos θ = 0, so there is no drive at all — the front never moves.' },
      { text: 'No filling: the capillary pressure is zero.', correct: true, why: 'Right. p_c = 2σcosθ/r = 0, so the net drive is zero and the time is infinite.' },
      { text: 'A negative filling time.', why: 'A negative time has no physical meaning. The model reports "does not fill" instead.' },
    ],
  },
  {
    q: 'A dead-end pore is filled starting from atmospheric gas pressure. With p_L = 101.3 kPa and p_c ≈ 101.8 kPa, how full does it end up?',
    options: [
      { text: 'About 50 %.', correct: true, why: 'Right: 1 − 101.3/(101.3 + 101.8) ≈ 0.50.' },
      { text: '100 %, capillarity always wins eventually.', why: 'The trapped gas pressure rises as 1/(L_p − L) and becomes infinite at the dead end, so it always stops the liquid before the end unless the gas was fully removed.' },
      { text: 'It depends on the pore length.', why: 'L_p cancels out of the equilibrium fill fraction; it only changes how long equilibrium takes.' },
    ],
  },
  {
    q: 'Why is "evacuated to 10 kPa" in Mode B an absolute pressure?',
    options: [
      { text: 'Because Boyle\'s law, p V = constant, only holds for absolute pressure.', correct: true, why: 'Right. Gauge pressure is relative to the atmosphere; using it in pV = const would give nonsense (a gauge pressure can be zero or negative).' },
      { text: 'It doesn\'t matter which kind you use.', why: 'It matters a lot: 10 kPa gauge is 111.3 kPa absolute — worse than not evacuating at all.' },
      { text: 'Because capillary pressure is absolute.', why: 'Capillary pressure is a pressure jump across the meniscus, a difference — neither absolute nor gauge.' },
    ],
  },
  {
    q: 'All verification checks on this site pass. What does that establish?',
    options: [
      { text: 'That the model predicts real cell filling times.', why: 'That would be validation, which needs measurements of a specific cell\'s pore structure, contact angle and wetting time.' },
      { text: 'That the code correctly solves the stated equations.', correct: true, why: 'Right — that is verification. Whether the equations describe reality is a separate question.' },
      { text: 'Nothing, because the tests were written by the same people as the code.', why: 'Independent checks (hand calculations, exact solutions, a separate Python solver, SciPy) make the tests meaningful, even if written by the same team.' },
    ],
  },
];
