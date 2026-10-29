/**
 * lessons.js — the nine theory lessons. Edit the words here; the Theory page
 * renders them. Every lesson MUST have: objective, explain, figure, equations,
 * symbols, check (misconception), next. tests/content.test.js enforces this.
 *
 * Writing math: $inline$ and $$display$$ (LaTeX, rendered by KaTeX).
 * Numbers in examples are computed by the physics code at page load, so they
 * can never drift from the lab.
 */
import * as D from '../diagrams/index.js';
import { solveModeA, solveModeB, capillaryPressure } from '../physics/index.js';
import { BASE } from '../physics/checks.js';
import { formatTime, sig, sci } from '../physics/units.js';

const pc0 = capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r);
const tA = (X, tau = 1) => formatTime(solveModeA({ ...BASE, X, tau }).tTarget).text;
const DW = solveModeA(BASE).D;
const fillAt = (pg0) => solveModeB({ ...BASE, pg0 }).fillEq;

export const LESSONS = [
  {
    id: 'paradox',
    title: 'The paradox: milliseconds versus tens of minutes',
    objective: 'Explain why filling a lithium-ion cell with electrolyte is a slow manufacturing step even though a single pore fills almost instantly.',
    explain: `
<p>A lithium-ion cell is a stack of thin porous layers: an anode coating on copper foil, a porous separator, and a cathode coating on aluminium foil. Before the cell can work, liquid electrolyte has to fill the pores of all three. The coatings are only tens of micrometres thick, and capillary forces in micrometre pores are strong, so you might expect wetting to be instantaneous.</p>
<p>It is not. In the cell, the liquid mostly cannot come in through the faces of the electrodes — the stack is pressed tightly together — so it has to travel in from the <em>edges</em>, across centimetres. Neutron imaging of hard-case prismatic cells showed exactly this: the wetted region grows inward from the edges, fast at first and then more and more slowly, and full wetting took on the order of an hour at normal pressure [weydanz2018, tum2018].</p>
<p>This whole site answers one question with fluid mechanics: <strong>why does the distance matter so much, and what does pulling a vacuum before filling buy you?</strong> The short answer, which lessons 2–8 build up, is that filling time grows with the <em>square</em> of distance, and gas trapped in the pores fights back.</p>`,
    figure: { html: () => D.electrodeCrossSection(), caption: '<b>Two distances in one cell.</b> Through the thickness of a coating the liquid travels tens of micrometres; in-plane from the cell edge it travels centimetres. Schematic, not to scale.', schematic: true },
    equations: [{ tex: 't \\approx \\frac{X^2}{D_W}', label: 'filling time scales with distance squared (derived in lesson 6)' }],
    symbols: [['t', 'time to wet a distance X', 's'], ['X', 'straight-line wetting distance', 'm'], ['D_W', 'Washburn coefficient, set by pore size, liquid and surface', 'm²/s']],
    example: () => `<p>With the illustrative baseline ($D_W$ = ${sci(DW, 4)} m²/s): crossing a 70 µm coating takes <strong>${tA(70e-6)}</strong>, but travelling 5 cm in-plane takes <strong>${tA(0.05)}</strong>. Same liquid, same pores — only the distance changed, by a factor of about 700, so the time changed by about 700² ≈ 500 000.</p>`,
    check: { q: 'If a pore fills 70 µm in a few milliseconds, shouldn\'t a 5 cm electrode fill in a few seconds (about 700 times longer)?', a: 'No. Time is not proportional to distance here — it is proportional to distance squared, because the longer the wetted column gets, the more viscous friction it has to overcome while the capillary pull at the front stays the same. 700 times farther means about 490 000 times longer.' },
    next: 'To see why, start with the force that pulls liquid into a pore at all: surface tension.',
  },
  {
    id: 'surface-tension',
    title: 'Surface tension and interfacial tension',
    objective: 'Describe surface tension as an energy per area (or a force per length) and write the force balance at a contact line.',
    explain: `
<p>Molecules at the surface of a liquid have fewer neighbours than molecules inside, so creating surface costs energy. That energy per unit area is the <strong>surface tension</strong> $\\sigma$, in J/m², which is the same unit as N/m: a surface behaves as if it is pulled tight by a force per unit length along any line drawn on it.</p>
<p>Every pair of phases has its own interfacial tension. Where a liquid drop sits on a solid there are three: solid–gas $\\sigma_{sg}$, solid–liquid $\\sigma_{sl}$, and liquid–gas $\\sigma$. All three meet along the <strong>contact line</strong>. Balancing their pulls along the solid surface gives Young's equation.</p>
<p>The electrolyte used as the baseline here — EC/DMC with LiPF₆ — has a measured surface tension of 29.4 mN/m, well below water's 72 mN/m [hofmann2015].</p>`,
    figure: { interactive: 'drop', caption: '<b>Young\'s force balance.</b> Drag the slider to change the contact angle; the drop shape and the direction of the liquid–gas tension are redrawn from the geometry.' },
    equations: [{ tex: '\\sigma_{sg} = \\sigma_{sl} + \\sigma\\cos\\theta', label: "Young's equation" }],
    symbols: [['\\sigma', 'liquid–gas surface tension', 'N/m'], ['\\sigma_{sg}', 'solid–gas interfacial tension', 'N/m'], ['\\sigma_{sl}', 'solid–liquid interfacial tension', 'N/m'], ['\\theta', 'contact angle, measured through the liquid', '°']],
    derivation: [
      'Take a short length $\\ell$ of contact line. Three forces act on it, each tension times $\\ell$.',
      '$\\sigma_{sg}\\ell$ pulls along the solid away from the drop; $\\sigma_{sl}\\ell$ pulls along the solid toward the drop.',
      '$\\sigma\\ell$ pulls along the liquid surface, at angle $\\theta$ to the solid; its component along the solid is $\\sigma\\ell\\cos\\theta$, toward the drop.',
      'At equilibrium the components along the solid cancel: $\\sigma_{sg} = \\sigma_{sl} + \\sigma\\cos\\theta$. (The vertical component is balanced by the solid itself.)',
    ],
    check: { q: 'Does this website calculate the contact angle from Young\'s equation?', a: 'No. $\\sigma_{sg}$ and $\\sigma_{sl}$ are very hard to measure directly, so in practice θ is measured (for example by watching a drop) and used as an input. Young\'s equation explains what θ means; it is not used to compute it here.' },
    next: 'The contact angle that comes out of this balance decides whether a liquid wants to enter a pore.',
  },
  {
    id: 'contact-angle',
    title: 'Contact angle and wetting',
    objective: 'Predict from the contact angle whether capillarity will pull a liquid into a pore or push it out.',
    explain: `
<p>Rearranging Young's equation, $\\cos\\theta = (\\sigma_{sg} - \\sigma_{sl})/\\sigma$. If the solid would rather be covered by liquid than by gas ($\\sigma_{sl} < \\sigma_{sg}$), cos θ is positive and θ is below 90°: the liquid <strong>wets</strong> the surface. If not, θ is above 90° and the liquid beads up.</p>
<p>Inside a pore the same angle sets the shape of the meniscus. Below 90° the meniscus is concave and the liquid is pulled in; at exactly 90° it is flat and there is no pull; above 90° it is convex and the liquid is pushed out.</p>
<p>Measured angles for battery electrolytes vary a lot. For the baseline electrolyte, Hofmann et al. measured 46.2° on an uncoated polyethylene separator and 15.2° on a ceramic-coated one [hofmann2015]; another study reports 65.4° for a similar electrolyte on its separator [wang2021]. Electrode contact angles were not measured in these studies, which is why θ = 30° on this site is labelled an assumption.</p>`,
    figure: { interactive: 'pore', caption: '<b>Meniscus in a pore.</b> The meniscus is drawn as a circular arc meeting the wall at θ. Try 0°, 90° and 120°.' },
    equations: [{ tex: '\\cos\\theta = \\frac{\\sigma_{sg} - \\sigma_{sl}}{\\sigma}', label: 'contact angle from the tension balance' }],
    symbols: [['\\theta', 'contact angle through the liquid; 0° = perfect wetting', '°'], ['\\cos\\theta', 'wetting factor: +1 perfect wetting, 0 neutral, negative non-wetting', '–']],
    example: () => `<p>Capillary pull is proportional to cos θ. Going from the coated separator (15.2°, cos θ = ${sig(Math.cos((15.2 * Math.PI) / 180), 3)}) to the uncoated one (46.2°, cos θ = ${sig(Math.cos((46.2 * Math.PI) / 180), 3)}) cuts the capillary drive by about ${Math.round((1 - Math.cos((46.2 * Math.PI) / 180) / Math.cos((15.2 * Math.PI) / 180)) * 100)} %, everything else equal.</p>`,
    check: { q: 'A liquid with θ = 110° can never get into a pore. True or false?', a: 'False. Capillarity resists it, but an applied pressure larger than the capillary pressure can force it in. Try θ = 100° with Δpₐ = +50 kPa in the lab (the "Non-wetting, pushed in" preset).' },
    next: 'Next: turning that pull at the contact line into a pressure the fluid can feel.',
  },
  {
    id: 'capillary-pressure',
    title: 'Capillary pressure',
    objective: 'Derive and evaluate the Young–Laplace capillary pressure for a cylindrical pore.',
    explain: `
<p>The surface tension acting around the rim of the meniscus pulls the liquid column along the pore. Spread that force over the cross-section of the pore and you get a pressure jump across the meniscus: the <strong>capillary pressure</strong>. It is what drives spontaneous wetting.</p>
<p>Because the force grows with the perimeter (∝ r) but the area grows with r², the pressure grows as 1/r: smaller pores pull harder. For a 0.5 µm pore and this electrolyte, the capillary pressure is about one atmosphere.</p>`,
    figure: { html: () => D.pressureBalance(), caption: '<b>Pressure balance on the liquid column.</b> The capillary pressure acts at the meniscus as if it were an extra push from the liquid side.' },
    equations: [{ tex: 'p_c = \\frac{2\\sigma\\cos\\theta}{r}', label: 'Young–Laplace, cylindrical pore' }, { tex: 'p_c^{\\text{slit}} = \\frac{\\sigma\\cos\\theta}{h}', label: 'slit pore of half-width h' }],
    symbols: [['p_c', 'capillary pressure (liquid-side push at the meniscus)', 'Pa'], ['\\sigma', 'surface tension', 'N/m'], ['\\theta', 'contact angle', '°'], ['r', 'pore radius', 'm'], ['h', 'half-width of a slit pore', 'm']],
    derivation: [
      'The contact line runs around the wall, length $2\\pi r$. The component of surface tension along the pore axis is $\\sigma\\cos\\theta$ per unit length, so the axial force is $F = 2\\pi r\\,\\sigma\\cos\\theta$.',
      'That force acts on a cross-section of area $\\pi r^2$. The equivalent pressure is $p_c = F/(\\pi r^2) = 2\\sigma\\cos\\theta/r$.',
      'For a slit (two parallel plates of width $w$, gap $2h$): the contact line is two lines of length $w$, force $2w\\sigma\\cos\\theta$, area $2hw$, so $p_c = \\sigma\\cos\\theta/h$ — half the cylinder value at $h = r$. The "2" is a geometry factor.',
    ],
    example: () => `<p>$p_c = 2(0.0294\\,\\text{N/m})\\cos 30^\\circ / (0.5\\times10^{-6}\\,\\text{m}) =$ <strong>${sig(pc0 / 1e3, 4)} kPa</strong> — about one atmosphere. Units: (N/m)/m = N/m² = Pa.</p>`,
    check: { q: 'Smaller pores have higher capillary pressure, so smaller pores must fill faster. Right?', a: 'Not necessarily. Smaller pores also have much more viscous resistance (∝ 1/r²). Lesson 6 shows the net effect under pure capillary drive is t ∝ 1/r: smaller pores fill SLOWER over the same distance. The lab\'s Plot 2 shows this directly.' },
    next: 'Capillary pressure is the push. Now for what resists it: viscous friction.',
  },
  {
    id: 'viscous',
    title: 'Viscous resistance inside a pore',
    objective: 'Apply Hagen–Poiseuille flow to the liquid column behind a moving meniscus and state its assumptions.',
    explain: `
<p>Behind the meniscus, the liquid fills a length $L$ of the pore and must be dragged along through it. In a tiny pore the flow is slow, steady and laminar, so it is the Hagen–Poiseuille flow from class: a parabolic velocity profile, zero at the wall, fastest on the axis.</p>
<p>The important feature for wetting is that the resistance is proportional to the <em>length</em> of the liquid column. The farther the liquid has gone, the harder it is to push the whole column forward, so the front slows down.</p>
<p><strong>Assumptions</strong> (each is checked live in the lab): Newtonian liquid, no slip at the wall, fully developed laminar flow, quasi-steady (inertia neglected), gravity neglected, meniscus and entrance effects neglected, static contact angle.</p>`,
    figure: { html: () => D.velocityProfile(), caption: '<b>Laminar flow behind the meniscus.</b> Velocity is zero at the wall (no slip) and parabolic across the pore.' },
    equations: [{ tex: 'Q = \\frac{\\pi r^4\\,\\Delta p}{8\\mu L}', label: 'Hagen–Poiseuille flow rate' }, { tex: '\\frac{dL}{dt} = \\frac{Q}{\\pi r^2} = \\frac{r^2\\,\\Delta p}{8\\mu L}', label: 'speed of the front' }],
    symbols: [['Q', 'volumetric flow rate', 'm³/s'], ['\\Delta p', 'net pressure difference driving the column', 'Pa'], ['\\mu', 'dynamic viscosity', 'Pa·s'], ['L', 'length of the liquid column (penetration distance)', 'm'], ['dL/dt', 'front velocity = mean velocity of the liquid', 'm/s']],
    derivation: [
      'Force balance on a cylindrical shell of liquid, steady and fully developed: $\\frac{1}{\\rho}\\frac{d}{d\\rho}\\left(\\rho\\,\\frac{du}{d\\rho}\\right) = -\\frac{\\Delta p}{\\mu L}$, where $\\rho$ is the radial coordinate.',
      'Integrate twice with $u$ finite on the axis and $u(r) = 0$ (no slip): $u(\\rho) = \\frac{\\Delta p}{4\\mu L}(r^2 - \\rho^2)$.',
      'Integrate over the cross-section: $Q = \\int_0^r u\\,2\\pi\\rho\\,d\\rho = \\frac{\\pi r^4\\Delta p}{8\\mu L}$.',
      'The meniscus moves with the mean velocity: $dL/dt = Q/(\\pi r^2) = r^2\\Delta p/(8\\mu L)$.',
    ],
    example: () => {
      const vAt = DW / (2 * 0.01);
      return `<p>At the baseline, once the front is 1 cm in it moves at $v = D_W/(2L) \\approx$ ${sig(vAt * 1e6, 3)} µm/s. The Reynolds number $\\rho v (2r)/\\mu$ is then about ${sig((1303 * vAt * 1e-6) / 4.4e-3, 2)} — creeping flow, far below the laminar limit of ~2300.</p>`;
    },
    check: { q: 'Why can\'t we just solve dL/dt = r²Δp/(8μL) starting from L = 0 on a computer?', a: 'At L = 0 the equation says the speed is infinite (division by zero). Physically, inertia caps the speed in the first instant; mathematically, we avoid the problem by solving for s = L² instead, where ds/dt = r²Δp/(4μ) is finite. The solver in the lab does exactly this.' },
    next: 'Put the push (capillary pressure) and the drag (Hagen–Poiseuille) together and integrate.',
  },
  {
    id: 'washburn',
    title: 'The Lucas–Washburn equation',
    objective: 'Derive L ∝ √t and the time needed to reach a target distance.',
    explain: `
<p>If the driving pressure is constant — capillary pressure plus any applied pressure — the front equation can be integrated by hand. The result, found independently by Lucas (1918) and Washburn (1921), is that the penetration distance grows with the <strong>square root of time</strong> [lucas1918, washburn1921].</p>
<p>That square root is the paradox in one line: to go twice as far takes four times as long. On a plot of L against √t the data fall on a straight line, which is a standard experimental test — Sheng et al. report electrode wetting rates in mm/s<sup>0.5</sup> for exactly this reason [sheng2014].</p>`,
    figure: { interactive: 'sqrt', caption: '<b>The √t law.</b> Left: penetration distance against time bends over. Right: against √t it is a straight line. Computed by the same solver as the lab, baseline values.' },
    equations: [{ tex: 'L^2 = \\frac{r^2\\,(p_c + \\Delta p_a)}{4\\mu}\\,t \\equiv D_W\\,t', label: 'constant drive' }, { tex: 'L^2 = \\frac{r\\,\\sigma\\cos\\theta}{2\\mu}\\,t', label: 'Lucas–Washburn (Δpₐ = 0)' }, { tex: 't = \\frac{4\\mu L^2}{r^2(p_c + \\Delta p_a)}', label: 'time to reach L' }],
    symbols: [['D_W', 'Washburn coefficient', 'm²/s'], ['\\Delta p_a', 'applied pressure difference, liquid side minus gas side', 'Pa'], ['t', 'time since the liquid touched the pore', 's']],
    derivation: [
      'Start from $\\frac{dL}{dt} = \\frac{r^2\\Delta p}{8\\mu L}$ with constant $\\Delta p = p_c + \\Delta p_a$.',
      'Separate variables: $L\\,dL = \\frac{r^2\\Delta p}{8\\mu}\\,dt$.',
      'Integrate from $L = 0$ at $t = 0$: $\\frac{L^2}{2} = \\frac{r^2\\Delta p}{8\\mu}t$, so $L^2 = \\frac{r^2\\Delta p}{4\\mu}t$.',
      'With $\\Delta p_a = 0$, substitute $p_c = 2\\sigma\\cos\\theta/r$: $L^2 = \\frac{r\\sigma\\cos\\theta}{2\\mu}t$.',
      'Units check: $\\frac{\\text{m}\\cdot\\text{N/m}}{\\text{Pa·s}} = \\frac{\\text{N}}{\\text{N s/m}^2} = \\text{m}^2/\\text{s}$ ✓',
    ],
    example: () => `<p>Baseline: $D_W = \\frac{(0.5\\times10^{-6})(0.0294)\\cos30^\\circ}{2(0.0044)} =$ <strong>${sci(DW, 4)} m²/s</strong>. Across 70 µm: $t = (70\\times10^{-6})^2/D_W =$ <strong>${tA(70e-6)}</strong>.</p>`,
    check: { q: 'The front reaches 1 mm after 0.7 s. Where is it after 2.8 s?', a: '2 mm, not 4 mm. Time went up by 4, so distance goes up by √4 = 2.' },
    next: 'Now apply this to a real electrode, where the pores are neither straight nor all the same size.',
  },
  {
    id: 'pore-to-electrode',
    title: 'From one pore to a battery electrode',
    objective: 'Scale the single-pore result to an electrode with tortuosity, and explain what that scaling cannot capture.',
    explain: `
<p>Pores in a real electrode wind around particles, so the liquid travels farther than the straight-line distance $X$ between the edge and a point inside. The simplest correction is a <strong>tortuosity</strong> $\\tau \\ge 1$: the path length is $L = \\tau X$. Since time grows with path length squared, tortuosity multiplies the time by $\\tau^2$.</p>
<p>Two honest caveats. First, τ is a convenient fitting factor, not a material constant, and is not measured here. Second, a real electrode has a <em>distribution</em> of pore sizes that are connected to each other. Small pores pull harder; large pores flow more easily. A single "representative" radius cannot capture that competition, so the times below are idealized estimates.</p>
<p><strong>How pore size matters depends on what is held constant.</strong> Under pure capillary drive, $t \\propto 1/r$ (bigger pores fill faster, because the lower resistance wins over the weaker pull). If instead an independent pressure difference drives the flow, $t \\propto 1/r^2$.</p>`,
    figure: { html: () => D.prismaticCell(), caption: '<b>Edge-inward wetting in a prismatic cell (top view).</b> Fronts advance from all four edges; because of the √t law, the gap between successive fronts shrinks. Schematic; the qualitative pattern matches neutron imaging [weydanz2018].', schematic: true },
    equations: [{ tex: 'X^2 = \\frac{r\\,\\sigma\\cos\\theta}{2\\mu\\,\\tau^2}\\,t', label: 'straight-line distance with tortuosity' }],
    symbols: [['X', 'straight-line (in-plane) distance from the edge', 'm'], ['\\tau', 'tortuosity = path length ÷ straight-line distance', '–']],
    example: () => `<table><thead><tr><th>Distance X</th><th>τ</th><th class="num">Idealized time</th></tr></thead><tbody>
<tr><td>70 µm (through a coating)</td><td>1</td><td class="num">${tA(70e-6)}</td></tr>
<tr><td>1 cm</td><td>1</td><td class="num">${tA(0.01)}</td></tr>
<tr><td>5 cm</td><td>1</td><td class="num">${tA(0.05)}</td></tr>
<tr><td>5 cm</td><td>2</td><td class="num">${tA(0.05, 2)}</td></tr></tbody></table>
<p class="small muted">Model outputs for the illustrative baseline — not measured times for a particular cell. The 5 cm values are the same order of magnitude as the roughly 50–100 min wetting times reported for one prismatic cell [tum2018], which is a plausibility check, not validation: that cell's pore size, contact angle and wetting distance are not known here.</p>`,
    check: { q: 'If tortuosity doubles, the filling time doubles. True?', a: 'False — it quadruples. Tortuosity lengthens the path, and time scales with path length squared.' },
    next: 'So far the gas ahead of the liquid escaped freely. What if it cannot?',
  },
  {
    id: 'trapped-gas',
    title: 'Trapped gas and vacuum-assisted filling',
    objective: 'Model a dead-end pore with compressed gas, find its exact equilibrium, and explain why manufacturers evacuate cells before filling.',
    explain: `
<p>If a pore is closed at the far end, the gas in it has nowhere to go. As liquid enters, the gas is squeezed into a shorter space and its pressure rises (Boyle's law, assuming constant temperature). Filling stops when the gas pressure has risen enough to balance the liquid pressure plus the capillary pressure.</p>
<p>The fix is to remove most of the gas first. If the pore starts at a low absolute pressure $p_{g0}$, there is little gas to compress and the pore fills almost completely. This is why cells are evacuated before filling: neutron imaging found wetting roughly twice as fast under vacuum [weydanz2018], and the accompanying press release reports just over 50 min versus about 100 min, with about 10 % less electrolyte taken up at normal pressure because gas hindered wetting [tum2018].</p>
<p><strong>Absolute versus gauge pressure.</strong> Boyle's law needs absolute pressure. "Evacuated to 10 kPa" here means 10 kPa absolute — about 91 kPa below atmospheric in gauge terms.</p>
<p><strong>Where the model is too pessimistic.</strong> At atmospheric pressure the dead-end pore ends up only about ${Math.round(fillAt(101.3e3) * 100)} % full, far worse than the ~10 % lower uptake observed. Real pores are connected: gas can escape through neighbouring pores that are not yet filled. Treat Mode B as an upper bound on gas trapping.</p>`,
    figure: { interactive: 'vacuum', caption: '<b>Dead-end pores at equilibrium.</b> Fill fractions computed from the exact equilibrium formula with baseline values.' },
    equations: [
      { tex: 'p_g(L) = p_{g0}\\,\\frac{L_p}{L_p - L}', label: "Boyle's law for the trapped gas" },
      { tex: '\\frac{dL}{dt} = \\frac{r^2\\,[\\,p_L + p_c - p_g(L)\\,]}{8\\mu L}', label: 'front equation, absolute pressures' },
      { tex: '\\frac{L_{eq}}{L_p} = 1 - \\frac{p_{g0}}{p_L + p_c}', label: 'exact equilibrium fill fraction' },
      { tex: '\\frac{t}{T} = \\lambda^2 - 2\\beta\\lambda + 2\\beta(1-\\beta)\\ln\\frac{1-\\beta}{1-\\beta-\\lambda}', label: 'exact trajectory, λ = L/L_p, β = p_g0/(p_L + p_c), T = 4μL_p²/(r²(p_L + p_c))' },
    ],
    symbols: [['p_{g0}', 'initial gas pressure in the pore (absolute)', 'Pa'], ['p_g', 'gas pressure as it is compressed (absolute)', 'Pa'], ['p_L', 'liquid pressure at the pore mouth (absolute), fixed at 101.3 kPa', 'Pa'], ['L_p', 'length of the dead-end pore', 'm'], ['L_{eq}', 'final (equilibrium) penetration', 'm']],
    derivation: [
      'Gas initially occupies the whole pore, volume $\\pi r^2 L_p$. When the liquid has entered a distance $L$, the gas occupies $\\pi r^2(L_p - L)$. Isothermal: $p_g(L_p - L) = p_{g0}L_p$.',
      'The net drive is now $p_L + p_c - p_g(L)$, which falls as $L$ grows. Insert it into the Hagen–Poiseuille front equation.',
      'Solve for $s = L^2$ to remove the singularity at $L = 0$: $\\frac{ds}{dt} = \\frac{r^2[p_L + p_c - p_g(\\sqrt{s})]}{4\\mu}$.',
      'Equilibrium is where the drive vanishes: $p_{g0}L_p/(L_p - L_{eq}) = p_L + p_c$, giving $L_{eq}/L_p = 1 - p_{g0}/(p_L + p_c)$.',
      'Bonus — exact solution: with $\\lambda = L/L_p$ the equation separates as $dt/T = \\frac{2\\lambda(1-\\lambda)}{1-\\beta-\\lambda}d\\lambda$, which integrates to the trajectory above. The lab compares the numerical solution with it point by point.',
    ],
    example: () => `<table><thead><tr><th>Initial gas pressure (abs)</th><th class="num">Equilibrium fill</th></tr></thead><tbody>
${[101.3e3, 10e3, 1e3].map((p) => `<tr><td>${p / 1e3} kPa</td><td class="num">${sig(fillAt(p) * 100, 4)} %</td></tr>`).join('')}</tbody></table>
<p class="small muted">With p_L = 101.3 kPa and p_c = ${sig(pc0 / 1e3, 4)} kPa. Idealized single dead-end pore.</p>`,
    check: { q: 'Doubling the pore length L_p in Mode B changes the final fill fraction. True?', a: 'False. L_p cancels in L_eq/L_p = 1 − p_g0/(p_L + p_c). It changes only how long it takes (t ∝ L_p²).' },
    next: 'Finally: how far can we trust any of this?',
  },
  {
    id: 'limits',
    title: 'Model limitations and the same physics elsewhere',
    objective: 'State what the model can and cannot predict, distinguish verification from validation, and recognize the same physics in other systems.',
    explain: `
<p><strong>Verification</strong> asks: does the code solve its equations correctly? Here it does — the Code &amp; Verification page runs analytical, limiting-case, convergence and invalid-input checks live. <strong>Validation</strong> asks: do the equations describe real battery electrodes? Only partly. A verified capillary model is not a validated cell-filling model.</p>
<p>What the idealized model leaves out:</p>
<ul>
<li><strong>Pore-size distribution and connectivity.</strong> One radius stands in for many; gas escapes through connected pores.</li>
<li><strong>Dynamic contact angle.</strong> A moving contact line has a larger angle than a static one, especially early when the front is fast (the lab's capillary-number check).</li>
<li><strong>Inertia at the very start.</strong> Before Washburn flow there is a brief inertial and visco-inertial stage [fries2008b]; at pore scale it lasts nanoseconds.</li>
<li><strong>Gas dissolution, solvent vapour and temperature.</strong> Gas can dissolve into the electrolyte; properties change with temperature.</li>
<li><strong>Swelling, chemistry and electrochemistry.</strong> Binder swelling, SEI formation and so on are outside fluid mechanics and outside this project.</li>
</ul>
<p><strong>The same physics elsewhere:</strong> ink soaking into paper and coatings, wicking in fabrics and paper-based diagnostic strips, spontaneous imbibition of water into oil-bearing rock, and capillary underfill in electronics packaging all follow the same √t law with the same caveats.</p>`,
    figure: { html: () => D.deadEndPore(0.5, { label: 'Mode B dead-end pore: an upper bound on trapping, because real pores connect', pgText: 'trapped gas' }), caption: '<b>Upper bound.</b> A connected network lets gas escape, so real electrodes trap less gas than one dead-end pore.', schematic: true },
    equations: [{ tex: '\\text{Ca} = \\frac{\\mu v}{\\sigma},\\quad \\text{Re} = \\frac{\\rho v\\,(2r)}{\\mu},\\quad \\text{Bo} = \\frac{\\rho g r^2}{\\sigma}', label: 'dimensionless groups used as validity checks' }],
    symbols: [['\\text{Ca}', 'capillary number: viscous vs surface-tension forces at the contact line', '–'], ['\\text{Re}', 'Reynolds number: inertia vs viscosity', '–'], ['\\text{Bo}', 'Bond number: gravity vs surface tension', '–'], ['\\rho', 'liquid density (1303 kg/m³ for the baseline electrolyte)', 'kg/m³'], ['g', 'gravitational acceleration', 'm/s²']],
    check: { q: 'All verification tests pass, so the model predicts how long a real cell takes to wet. True?', a: 'False. Passing verification shows the equations are solved correctly. Whether the equations describe a particular cell is validation, which would need that cell\'s measured pore structure, contact angle and wetting time.' },
    next: 'Test yourself with the quiz below, then try the guided challenge in the lab.',
  },
];
