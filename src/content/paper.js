/**
 * paper.js — the main scientific paper (journal style). Edit the words here;
 * src/sections/paper.js renders them.
 *
 * Markup used in the text (resolved by the renderer, checked by tests/content.test.js):
 *   $...$             inline math (KaTeX)
 *   {{eq:id}}         display equation `id` from EQUATIONS, numbered automatically
 *   {{eqref:id}}      "Eq. (n)"
 *   {{fig:id}}        figure `id` from FIGURES, numbered in order of appearance
 *   {{figref:id}}     "Fig. n"
 *   {{tab:id}}        table `id` from TABLES
 *   {{tabref:id}}     "Table n"
 *   [refId, refId2]   numbered citation(s) into src/content/references.js
 *
 * Every number quoted in the text is computed by the physics code at page
 * load, so the paper cannot drift from the interactive demonstration.
 * Writing style: impersonal ("it is shown that…"), SI units, no rhetorical
 * questions. Every equation in the main text can be derived with introductory
 * fluid mechanics; anything beyond that belongs in the supplement.
 */
import * as D from '../diagrams/index.js';
import {
  solveModeA, solveModeB, capillaryPressure, cosDeg, RHO_ELECTROLYTE, G, P_LIQUID_ABS,
} from '../physics/index.js';
import { BASE } from '../physics/checks.js';
import { formatTime, sig, sci } from '../physics/units.js';

const R = String.raw;

// ------------------------------------------------------------------ computed values
const pc0 = capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r);
const A0 = solveModeA(BASE);
const DW = A0.D;
const tX = (X, tau = 1, extra = {}) => solveModeA({ ...BASE, ...extra, X, tau }).tTarget;
const T = (s, d = 3) => formatTime(s, d).text;
const fill = (pg0) => solveModeB({ ...BASE, pg0 }).fillEq;
const pct = (f, d = 3) => `${sig(f * 100, d)} %`;
const v1cm = DW / (2 * 0.01);
const Re1cm = (RHO_ELECTROLYTE * v1cm * 2 * BASE.r) / BASE.mu;
// Lucas–Washburn gives v = D_W/(2L), which is unbounded as L → 0, so an "early"
// capillary number must be evaluated at a stated finite length. L = 10 r is used
// (the same point as the validity checks in src/physics/validity.js).
const LEarly = 10 * BASE.r;
const vEarly = DW / (2 * LEarly);
const CaEarly = (BASE.mu * vEarly) / BASE.sigma;
const CaCoat = (BASE.mu * DW / (2 * 70e-6)) / BASE.sigma;
const hJurin = pc0 / (RHO_ELECTROLYTE * G);
const ratioX = 0.05 / 70e-6;
const thetaRatio = cosDeg(15.2) / cosDeg(46.2);
const spaced = (n) => sig(n, 2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const VALUES = { pc0, DW, Re1cm, LEarly, vEarly, CaEarly, CaCoat, hJurin, ratioX };

// ------------------------------------------------------------------ front matter
export const META = {
  title: 'Capillary Penetration of Electrolyte into Porous Lithium-Ion Battery Electrodes: A Lucas–Washburn Analysis of Filling Time and Gas Entrapment',
  author: 'Matthew Sheets',
  affiliation: 'Chemical Engineering, College of Engineering and Applied Science, University of Cincinnati, Cincinnati, OH, USA',
  note: 'Undergraduate fluid mechanics course project, 2026. Version of 30 October 2026.',
  keywords: ['lithium-ion battery manufacturing', 'electrolyte filling', 'capillary flow', 'Lucas–Washburn equation', 'contact angle', 'vacuum filling'],
};

export const ABSTRACT = () => R`Electrolyte filling is a slow step in lithium-ion cell manufacturing; neutron imaging of hard-case prismatic cells has shown complete wetting times of approximately 50–100 min [weydanz2018, tum2018]. In this work, the factors that control the time required for liquid electrolyte to penetrate a porous electrode are analysed using introductory fluid mechanics. The capillary driving pressure is obtained from a contact-line force balance, the viscous resistance from Hagen–Poiseuille flow, and their combination yields the Lucas–Washburn equation, in which the square of the penetration distance increases linearly with time. A tortuosity factor is used as a simplified path-length correction, and Boyle's law is applied to gas sealed in a dead-end pore. For a representative electrolyte ($\sigma$ = 29.4 mN/m, $\mu$ = 4.4 mPa·s) and an assumed pore radius of 0.5 µm with an illustrative (not measured) contact angle of 30°, it is shown that a 70 µm coating is crossed in ${T(tX(70e-6), 2)}, whereas 5 cm of in-plane penetration requires ${T(tX(0.05), 2)}. Because the time scales with the square of the distance, in-plane transport controls the filling time. It is further shown that gas sealed at atmospheric pressure limits an idealized, sealed dead-end pore to approximately ${pct(fill(101.3e3), 2)} filling, and that evacuation to 1 kPa raises this theoretical limit to ${pct(fill(1e3), 3)}. The calculations are verified against exact solutions and an independently coded implementation; they are not validated against cell-level measurements, and the comparison with published experiments is limited to order of magnitude.`;

// ------------------------------------------------------------------ nomenclature
export const NOMENCLATURE = [
  ['D_W', 'Washburn coefficient, $L^2 = D_W t$', 'm²/s'],
  ['k', 'permeability of a porous medium (Section 5 only)', 'm²'],
  ['L', 'penetration length along the pore', 'm'],
  ['L_{eq}', 'equilibrium penetration length in a dead-end pore', 'm'],
  ['L_p', 'length of a dead-end pore', 'm'],
  ['p_c', 'capillary pressure, $p_g - p_\\ell$ across the meniscus', 'Pa'],
  ['p_g', 'absolute pressure of the gas ahead of the liquid', 'Pa'],
  ['p_{g0}', 'initial absolute pressure of non-condensable gas in a dead-end pore', 'Pa'],
  ['p_L', 'absolute liquid pressure at the pore entrance', 'Pa'],
  ['p_\\ell', 'liquid pressure immediately behind the meniscus', 'Pa'],
  ['Q', 'volumetric flow rate', 'm³/s'],
  ['r', 'pore radius', 'm'],
  ["r'", 'radial coordinate inside the pore', 'm'],
  ['\\text{Re}', 'Reynolds number, $\\rho v(2r)/\\mu$', '–'],
  ['t', 'time since the liquid reached the pore entrance', 's'],
  ['u', 'axial liquid velocity (Hagen–Poiseuille profile); superficial velocity (Darcy)', 'm/s'],
  ['v', 'velocity of the liquid front, $dL/dt$', 'm/s'],
  ['X', 'straight-line penetration distance', 'm'],
  ['\\Delta p', 'net pressure difference driving the liquid column', 'Pa'],
  ['\\Delta p_a', 'externally applied pressure difference, liquid side minus gas side', 'Pa'],
  ['\\varepsilon', 'porosity (Section 5 only)', '–'],
  ['\\theta', 'contact angle, measured through the liquid', '°'],
  ['\\mu', 'dynamic viscosity of the liquid', 'Pa·s'],
  ['\\rho', 'liquid density', 'kg/m³'],
  ['\\sigma', 'liquid–gas surface tension (also written $\\gamma_{LG}$)', 'N/m'],
  ['\\sigma_{sg},\\ \\sigma_{sl}', 'solid–gas and solid–liquid interfacial tensions', 'N/m'],
  ['\\tau', 'tortuosity, path length divided by straight-line distance', '–'],
];

// ------------------------------------------------------------------ equations (numbered in this order)
export const EQUATIONS = [
  { id: 'young', tex: R`\sigma_{sg} = \sigma_{sl} + \sigma\cos\theta` },
  { id: 'pc', tex: R`p_c \equiv p_g - p_\ell = \frac{2\sigma\cos\theta}{r}` },
  { id: 'hp', tex: R`Q = \frac{\pi r^4\,\Delta p}{8\mu L}` },
  { id: 'front', tex: R`\frac{dL}{dt} = \frac{Q}{\pi r^2} = \frac{r^2\,\Delta p}{8\mu L}` },
  { id: 'lwGeneral', tex: R`L^2 = \frac{r^2\,(p_c + \Delta p_a)}{4\mu}\,t \equiv D_W\,t` },
  { id: 'lw', tex: R`L^2 = \frac{r\,\sigma\cos\theta}{2\mu}\,t` },
  { id: 'time', tex: R`t = \frac{2\mu L^2}{r\,\sigma\cos\theta}` },
  { id: 'tau', tex: R`X^2 = \frac{r\,\sigma\cos\theta}{2\mu\,\tau^2}\,t` },
  { id: 'boyle', tex: R`p_g(L) = p_{g0}\,\frac{L_p}{L_p - L}` },
  { id: 'deadFront', tex: R`\frac{dL}{dt} = \frac{r^2\,\left[\,p_L + p_c - p_g(L)\,\right]}{8\mu L}` },
  { id: 'eqFill', tex: R`\frac{L_{eq}}{L_p} = 1 - \frac{p_{g0}}{p_L + p_c}` },
  { id: 'darcy', tex: R`u = -\frac{k}{\mu}\,\frac{dp}{dx}` },
];

// ------------------------------------------------------------------ figures (numbered in order of first {{fig:}} use)
const triple = () => `<div class="fig-row">${[30, 90, 120].map((t) => `<div>${D.poreMeniscus(t, { title: `Meniscus in a cylindrical pore, θ = ${t}°` })}<p class="fig-sub">(${{ 30: 'a', 90: 'b', 120: 'c' }[t]}) θ = ${t}°</p></div>`).join('')}</div>`;

export const FIGURES = [
  { id: 'cell', kind: 'svg', html: () => D.electrodeCrossSection(), schematic: true,
    caption: R`Schematic cross-section of a lithium-ion electrode stack (not to scale): porous anode coating on copper foil, porous separator and porous cathode coating on aluminium foil. Electrolyte penetrates the coating thickness (tens of micrometres) and travels in-plane from the cell edges (centimetres).` },
  { id: 'young', kind: 'svg', html: () => D.tensionVectors(50), schematic: true,
    caption: R`Force balance at the contact line of a liquid drop on a solid, used to derive Young's equation, {{eqref:young}}. The three interfacial tensions act along their respective interfaces; the contact angle $\theta$ is measured through the liquid (drawn for $\theta$ = 50°).` },
  { id: 'menisci', kind: 'svg', html: triple, schematic: true,
    caption: R`Meniscus shape in a cylindrical pore for (a) $\theta$ = 30°, (b) $\theta$ = 90° and (c) $\theta$ = 120°. The meniscus is drawn as a circular arc meeting the wall at $\theta$. In (a) $p_c > 0$ and liquid is drawn into the pore; in (b) $p_c = 0$; in (c) $p_c < 0$ and liquid is expelled unless an applied pressure exceeds $|p_c|$.` },
  { id: 'profile', kind: 'svg', html: () => D.velocityProfile(), schematic: true,
    caption: R`Fully developed laminar (Hagen–Poiseuille) velocity profile behind the meniscus. The velocity is zero at the wall (no-slip condition) and maximum on the axis; the front advances at the mean velocity, {{eqref:front}}.` },
  { id: 'deadend', kind: 'svg', html: () => D.deadEndPore(0.5, { label: 'liquid at p_L enters; sealed gas compressed from p_g0 to p_g', pgText: 'p_g' }), schematic: true,
    caption: R`Dead-end pore of length $L_p$. Gas sealed in the pore at initial absolute pressure $p_{g0}$ is compressed isothermally as the liquid advances, {{eqref:boyle}}, until its pressure balances $p_L + p_c$, {{eqref:eqFill}}.` },
  { id: 'xt', kind: 'chart',
    caption: R`Straight-line penetration distance $X$ versus time from {{eqref:tau}} ($\tau$ = 1) for $r$ = 0.5 µm, $\sigma$ = 29.4 mN/m and $\mu$ = 4.4 mPa·s, at three contact angles: 15.2° and 46.2° (measured for this electrolyte on coated and uncoated polyethylene separators [hofmann2015]) and 30° (baseline assumption). Lines: analytical solution. The distance grows as $\sqrt{t}$, so the front decelerates continuously.` },
  { id: 'pctheta', kind: 'chart',
    caption: R`Capillary pressure versus contact angle from {{eqref:pc}} for $\sigma$ = 29.4 mN/m and three pore radii. The sign changes at $\theta$ = 90°; halving the radius doubles $|p_c|$.` },
  { id: 'tr', kind: 'chart',
    caption: R`Time required to penetrate $X$ = 1 cm versus pore radius ($\theta$ = 30°, $\tau$ = 1), log–log axes. Solid: pure capillary drive, {{eqref:time}}, slope −1. Dashed: an externally imposed driving pressure held constant at the baseline value of $p_c$ (${sig(pc0 / 1e3, 4)} kPa), {{eqref:lwGeneral}}, slope −2. Slopes in the legend are least-squares fits to the plotted points.` },
  { id: 'fill', kind: 'chart',
    caption: R`Equilibrium fill fraction of an idealized dead-end pore versus the initial absolute pressure of the sealed non-condensable gas, {{eqref:eqFill}}, with $p_L$ = 101.3 kPa and $p_c$ = ${sig(pc0 / 1e3, 4)} kPa. Line: analytical equilibrium. Squares: end states of the numerical solution of {{eqref:deadFront}}, which uses no knowledge of the analytical result.` },
];

// ------------------------------------------------------------------ tables
const paramRow = (sym, val, basis, src) => `<tr><td>${sym}</td><td class="num">${val}</td><td><span class="badge badge--${basis}">${basis}</span></td><td>${src}</td></tr>`;
export const TABLES = [
  { id: 'params', caption: 'Parameter values used in this work. "Measured" values are taken from the cited experiments; "assumption" values are illustrative choices bounded by the cited data where possible.',
    html: () => `<table><thead><tr><th>Quantity</th><th class="num">Value</th><th>Basis</th><th>Source and comment</th></tr></thead><tbody>
${paramRow('Surface tension, $\\sigma$', '29.4 mN/m', 'measured', 'EC/DMC 50:50 (wt) + LiPF₆ 0.787 mol/kg, 25 °C [hofmann2015]')}
${paramRow('Dynamic viscosity, $\\mu$', '4.4 mPa·s', 'measured', 'Same electrolyte, 20 °C [hofmann2015]; the 5 °C difference from the surface-tension temperature is not corrected')}
${paramRow('Density, $\\rho$', `${RHO_ELECTROLYTE} kg/m³`, 'measured', 'Same electrolyte, 25 °C [hofmann2015]; used only for the Reynolds number')}
${paramRow('Contact angle, $\\theta$', '30°', 'assumption', 'Between 15.2° and 46.2° measured for the same electrolyte on separators [hofmann2015]; no electrode value was available')}
${paramRow('Pore radius, $r$', '0.5 µm', 'assumption', 'Upper end of the radii 0.16–0.50 µm implied by mercury porosimetry of calendered graphite anodes [sheng2014]')}
${paramRow('Tortuosity, $\\tau$', '1 (2 for sensitivity)', 'assumption', 'Illustrative; not measured')}
${paramRow('Penetration distance, $X$', '70 µm; 1 cm; 5 cm', 'geometry', 'One coating thickness; in-plane distances from a cell edge (assumed)')}
${paramRow('Liquid pressure, $p_L$', '101.3 kPa (absolute)', 'assumption', 'Reservoir vented to atmosphere')}
${paramRow('Initial gas pressure, $p_{g0}$', '0.1–101.3 kPa (absolute)', 'assumption', 'Varied; 101.3 kPa corresponds to filling without evacuation')}
${paramRow('Dead-end pore length, $L_p$', '70 µm', 'assumption', 'One coating thickness; does not affect {{eqref:eqFill}}')}
</tbody></table>` },
  { id: 'baseline', caption: 'Baseline results ($r$ = 0.5 µm, $\\theta$ = 30°, $\\sigma$ = 29.4 mN/m, $\\mu$ = 4.4 mPa·s, $\\Delta p_a$ = 0). All values computed from the equations indicated.',
    html: () => `<table><thead><tr><th>Quantity</th><th>Equation</th><th class="num">Value</th></tr></thead><tbody>
<tr><td>Capillary pressure, $p_c$</td><td>{{eqref:pc}}</td><td class="num">${sig(pc0 / 1e3, 4)} kPa</td></tr>
<tr><td>Washburn coefficient, $D_W$</td><td>{{eqref:lwGeneral}}</td><td class="num">${sci(DW, 4)} m²/s</td></tr>
<tr><td>Time to cross a 70 µm coating ($\\tau$ = 1)</td><td>{{eqref:time}}</td><td class="num">${T(tX(70e-6))}</td></tr>
<tr><td>Time to penetrate 1 cm ($\\tau$ = 1)</td><td>{{eqref:time}}</td><td class="num">${T(tX(0.01))}</td></tr>
<tr><td>Time to penetrate 5 cm ($\\tau$ = 1)</td><td>{{eqref:time}}</td><td class="num">${T(tX(0.05))}</td></tr>
<tr><td>Time to penetrate 5 cm ($\\tau$ = 2)</td><td>{{eqref:tau}}</td><td class="num">${T(tX(0.05, 2))}</td></tr>
<tr><td>Equilibrium fill, $p_{g0}$ = 101.3 kPa</td><td>{{eqref:eqFill}}</td><td class="num">${pct(fill(101.3e3), 4)}</td></tr>
<tr><td>Equilibrium fill, $p_{g0}$ = 10 kPa</td><td>{{eqref:eqFill}}</td><td class="num">${pct(fill(10e3), 4)}</td></tr>
<tr><td>Equilibrium fill, $p_{g0}$ = 1 kPa</td><td>{{eqref:eqFill}}</td><td class="num">${pct(fill(1e3), 4)}</td></tr>
</tbody></table>` },
  { id: 'compare', caption: 'Published observations of electrolyte wetting compared with the idealized model. None of the experiments used the model geometry, and no experimental data were digitized or fitted; the comparison tests plausibility only.',
    html: () => `<table><thead><tr><th>Observation</th><th>Model result</th><th>Assessment</th></tr></thead><tbody>
<tr><td>Hard-case prismatic cell fully wetted in approximately 100 min at normal pressure and just over 50 min under vacuum [tum2018]</td><td>5 cm in-plane: ${T(tX(0.05))} ($\\tau$ = 1), ${T(tX(0.05, 2))} ($\\tau$ = 2), {{eqref:tau}}</td><td>Same order of magnitude. The cell's pore size, contact angle, tortuosity and wetting distance are not known, so agreement is not validation.</td></tr>
<tr><td>Wetting proceeds from the edges toward the centre, fast at first and progressively slower [weydanz2018]</td><td>$X \\propto \\sqrt{t}$, {{eqref:tau}}</td><td>Qualitatively consistent.</td></tr>
<tr><td>Graphite-anode wetting rates reported in mm/s<sup>0.5</sup> [sheng2014]</td><td>$X \\propto \\sqrt{t}$</td><td>Consistent with the functional form of {{eqref:lw}}.</td></tr>
<tr><td>Approximately 10 % less electrolyte absorbed at normal pressure, attributed to gas hindering wetting [tum2018]</td><td>Dead-end pore filled from 101.3 kPa: ${pct(1 - fill(101.3e3), 3)} remains gas-filled, {{eqref:eqFill}}</td><td>Correct direction; the magnitude is strongly overestimated because real pores are connected and gas can escape.</td></tr>
<tr><td>Higher salt concentration slows imbibition into electrodes [davoodabadi2019]</td><td>$t \\propto \\mu$, {{eqref:time}}</td><td>Consistent if the dominant effect of salt concentration is increased viscosity; $\\sigma$ and $\\theta$ may also change.</td></tr>
</tbody></table>` },
];

// ------------------------------------------------------------------ sections
export const SECTIONS = [
  {
    id: 'introduction', num: '1', title: 'Introduction',
    body: () => R`
<p>A lithium-ion cell consists of a porous anode coating on copper foil, a porous polymer separator and a porous cathode coating on aluminium foil ({{figref:cell}}). Before the cell can operate, liquid electrolyte must penetrate the pore space of all three layers. In industrial production, electrolyte is dosed into the assembled cell and a wetting period follows. Neutron imaging of hard-case prismatic cells has shown that wetting proceeds from the edges of the electrode stack toward its centre, that it is rapid at first and progressively slower, and that filling under vacuum is approximately twice as fast as filling at normal pressure [weydanz2018]. For those cells, complete wetting required approximately 100 min at normal pressure and just over 50 min under vacuum, and approximately 10 % less electrolyte was absorbed at normal pressure [tum2018]. The authors noted that faster filling could save considerable time and cost in large-scale production [weydanz2018].</p>
{{fig:cell}}
<p>The transport of electrolyte into an electrode is a fluid mechanics problem. The liquid is drawn into the pores by surface tension and resisted by viscous friction; the balance between the two was described for a single capillary by Lucas [lucas1918] and Washburn [washburn1921]. Wetting rates of graphite anodes have accordingly been reported in units of mm/s<sup>0.5</sup>, consistent with penetration proportional to the square root of time [sheng2014]. Gas present in the pores opposes filling when it cannot escape.</p>
<p>The objective of this study is to determine how pore size, contact angle, electrolyte properties, penetration distance and initial gas pressure control the time required for electrolyte to penetrate a porous electrode and the degree of filling that can be achieved. The analysis is deliberately restricted to models that can be derived with introductory fluid mechanics: a single idealized cylindrical pore, a tortuosity correction for electrode geometry, and an isothermal dead-end pore for trapped gas. Pore-size distributions, pore networks, electrochemistry and computational fluid dynamics are outside the scope. Section 2 develops the governing equations, Section 3 states the parameter values and calculation methods, Section 4 presents the results, and Section 5 discusses their physical meaning, limitations and relation to published experiments.</p>`,
  },
  {
    id: 'theory', num: '2', title: 'Governing theory',
    body: () => R`<p>All pressures are in pascals and all lengths in metres unless stated otherwise. The symbols are defined in the Nomenclature.</p>`,
    subsections: [
      {
        id: 'theory-interfacial', num: '2.1', title: 'Interfacial tension and contact angle',
        body: () => R`
<p>Molecules at the surface of a liquid have fewer neighbouring molecules than those in the bulk, so work is required to create additional surface. The surface tension $\sigma$ is this free energy per unit area (J/m²) or, equivalently, a tension per unit length acting in the surface (N/m). Surface tension is the liquid–gas case of the more general interfacial tension: every interface between two phases has its own interfacial tension. When a liquid rests on a solid, three interfaces meet along the contact line — solid–gas, solid–liquid and liquid–gas — with tensions $\sigma_{sg}$, $\sigma_{sl}$ and $\sigma$. These are three different physical quantities and are not interchangeable. (Many texts write $\gamma_{SG}$, $\gamma_{SL}$ and $\gamma_{LG}$ for the same quantities; $\sigma \equiv \gamma_{LG}$ [degennes2004].)</p>
<p>The contact angle $\theta$ is the angle between the solid surface and the liquid–gas interface, measured through the liquid ({{figref:young}}). For a contact line of length $\ell$ at rest, each tension exerts a force equal to the tension multiplied by $\ell$. Along the solid surface, $\sigma_{sg}\ell$ acts away from the liquid, while $\sigma_{sl}\ell$ and the tangential component $\sigma\ell\cos\theta$ act toward it. Equating the tangential components and dividing by $\ell$ gives Young's equation:</p>
{{eq:young}}
<p>The normal component $\sigma\ell\sin\theta$ is balanced by the solid. {{eqref:young}} holds for an ideal surface — smooth, chemically homogeneous, rigid and clean — with the contact line at equilibrium [degennes2004]. Written as $\cos\theta = (\sigma_{sg} - \sigma_{sl})/\sigma$, it shows that the liquid wets the solid ($\theta$ &lt; 90°) when the solid–liquid interface has a lower tension than the solid–gas interface, and does not wet it ($\theta$ &gt; 90°) otherwise. Because $\sigma_{sg}$ and $\sigma_{sl}$ are difficult to measure directly, $\theta$ is treated as an input parameter in this work; {{eqref:young}} defines its physical meaning but is not used to compute it.</p>
{{fig:young}}
<p>Measured contact angles depend on more than the ideal balance. The angle of an advancing contact line exceeds that of a receding one (contact-angle hysteresis), and surface roughness, chemical heterogeneity, contamination and the time of measurement all affect the value [degennes2004]. For the electrolyte considered here, contact angles of 15.2° on a ceramic-coated and 46.2° on an uncoated polyethylene separator were measured 10 min after deposition [hofmann2015], and 65.4° has been reported for a similar electrolyte on a different separator [wang2021]. Contact angles on electrode coatings were not measured in these studies.</p>`,
      },
      {
        id: 'theory-capillary', num: '2.2', title: 'Capillary pressure',
        body: () => R`
<p>Consider a cylindrical pore of radius $r$ containing liquid whose meniscus meets the wall at the contact angle $\theta$ ({{figref:menisci}}). The contact line has length $2\pi r$, and the component of the surface tension along the pore axis is $\sigma\cos\theta$ per unit length, so the axial force exerted by the meniscus on the liquid is $2\pi r\,\sigma\cos\theta$. Dividing this force by the pore cross-sectional area $\pi r^2$ gives the pressure difference across the meniscus, the capillary pressure:</p>
{{eq:pc}}
<p>In this work $p_c$ is defined as the gas-side pressure minus the liquid-side pressure at the meniscus. The same result follows from the Young–Laplace equation for a spherical-cap meniscus of radius $r/\cos\theta$ (Supplementary Section S1). {{eqref:pc}} assumes a static contact angle and a meniscus whose shape is not distorted by gravity, which is satisfied in micrometre pores (Supplementary Section S3).</p>
<p>The sign of $p_c$ is set by the contact angle. For $\theta$ &lt; 90°, $p_c > 0$: the liquid immediately behind the meniscus is at a lower pressure than the gas, and liquid is drawn into the pore. For $\theta$ = 90° the meniscus is flat and $p_c = 0$. For $\theta$ &gt; 90°, $p_c < 0$: the meniscus resists entry, and liquid penetrates only if an externally applied pressure difference $\Delta p_a$ exceeds $|p_c|$. The capillary pressure is a property of the interface and the pore; $\Delta p_a$ is imposed by the process (for example by pressurizing the liquid or evacuating the gas), and the two add to give the net driving pressure.</p>
<p>Because the contact-line force is proportional to $r$ and the area to $r^2$, $p_c$ is inversely proportional to the pore radius. For the baseline values of Section 3 ($\sigma$ = 29.4 mN/m, $\theta$ = 30°, $r$ = 0.5 µm), {{eqref:pc}} gives $p_c$ = ${sig(pc0 / 1e3, 4)} kPa, approximately one atmosphere.</p>
{{fig:menisci}}`,
      },
      {
        id: 'theory-viscous', num: '2.3', title: 'Viscous resistance',
        body: () => R`
<p>Behind the meniscus, a liquid column of length $L$ must be driven through the pore. The liquid is assumed to be incompressible and Newtonian with constant viscosity $\mu$; the flow is assumed to be steady, laminar and fully developed, with no slip at the wall; inertia, gravity (horizontal pore) and entrance effects are neglected. Under these assumptions a momentum balance on a cylindrical shell of liquid gives the parabolic velocity profile $u(r') = \Delta p\,(r^2 - r'^2)/(4\mu L)$ ({{figref:profile}}), and integration over the cross-section gives the Hagen–Poiseuille equation:</p>
{{eq:hp}}
<p>In {{eqref:hp}}, $\Delta p$ is the pressure difference across the column (Pa) and $Q$ the volumetric flow rate (m³/s). The meniscus advances at the mean velocity of the liquid:</p>
{{eq:front}}
<p>{{eqref:front}} shows that the hydraulic resistance of the column is proportional to $\mu L/r^4$: it increases with viscosity and with the length already filled, and decreases strongly with pore radius. For a constant driving pressure, the front therefore decelerates as it advances. The laminar assumption is satisfied by a wide margin: at the baseline conditions the front velocity at $L$ = 1 cm is ${sig(v1cm * 1e6, 3)} µm/s, and the Reynolds number $\text{Re} = \rho v(2r)/\mu$ is ${sci(Re1cm, 2)}, far below the transition value of approximately 2300.</p>
{{fig:profile}}`,
      },
      {
        id: 'theory-washburn', num: '2.4', title: 'Lucas–Washburn equation',
        body: () => R`
<p>If the gas ahead of the meniscus escapes freely at constant pressure, the net driving pressure is the constant $\Delta p = p_c + \Delta p_a$. Substituting it into {{eqref:front}}, separating variables ($L\,dL = r^2\Delta p\,dt/8\mu$) and integrating from $L = 0$ at $t = 0$ gives</p>
{{eq:lwGeneral}}
<p>where $D_W$ (m²/s) is the Washburn coefficient. For spontaneous penetration ($\Delta p_a$ = 0), substitution of {{eqref:pc}} gives the Lucas–Washburn equation [lucas1918, washburn1921]:</p>
{{eq:lw}}
<p>and the time required to reach a penetration length $L$:</p>
{{eq:time}}
<p>{{eqref:lw}} is the central result of this work. The penetration length grows as $\sqrt{t}$, so the time required grows with the square of the distance: doubling the distance quadruples the time, and for two distances $t_2/t_1 = (L_2/L_1)^2$. Physically, the driving pressure remains constant while the viscous resistance of the column grows in proportion to its length, so each additional increment of length is filled more slowly than the last. {{eqref:time}} also shows that the time is proportional to $\mu$ and inversely proportional to $\sigma\cos\theta$. Under pure capillary drive it is inversely proportional to $r$: a smaller pore exerts a larger capillary pressure ($\propto 1/r$) but has a much larger resistance ($\propto 1/r^2$ per unit length), so it fills a given distance more slowly. If instead the driving pressure is fixed independently of $r$, {{eqref:lwGeneral}} gives $t \propto 1/r^2$.</p>
<p>As $\theta \to$ 90°, $\cos\theta \to 0$ and the time in {{eqref:time}} diverges; for $\theta \ge$ 90° with $\Delta p_a$ = 0 the driving pressure is zero or negative and {{eqref:lwGeneral}} has no solution with $L > 0$, so spontaneous penetration does not occur. {{eqref:front}} predicts an infinite velocity at $L = 0$; this is a consequence of neglecting inertia, which limits the velocity during a very brief initial stage before the viscous regime described here is established [fries2008b]. For the same reason, quantities that depend on the front velocity, such as the Reynolds and capillary numbers, are evaluated in this work at a stated finite length rather than at $L = 0$.</p>`,
      },
      {
        id: 'theory-tortuosity', num: '2.5', title: 'Electrode geometry and tortuosity',
        body: () => R`
<p>A battery electrode is not a single straight cylindrical pore. It is a packed layer of active-material particles, conductive carbon and binder, whose pore space is interconnected, has a distribution of sizes and follows winding paths. In the simplest correction, the electrode is represented by a single pore whose path length $L$ exceeds the straight-line distance $X$ by a tortuosity factor $\tau \ge 1$, so that $L = \tau X$. Substitution into {{eqref:lw}} gives</p>
{{eq:tau}}
<p>Within this single-pore approximation, the time required to reach a given straight-line distance is multiplied by $\tau^2$: one factor of $\tau$ because the path is longer, and a second because the longer liquid column has a proportionally larger viscous resistance. The $\tau^2$ scaling is a property of this geometric model, with $\tau$ defined as path length divided by straight-line distance; it is not a general relationship between tortuosity and filling time for porous electrodes, in which pore connectivity and the distribution of pore sizes also affect the flow. Other definitions of tortuosity are in use, including the square of this ratio and definitions based on diffusion or electrical conductivity, so values from different sources cannot be compared directly. In this work $\tau$ is an illustrative effective parameter, not a measured property. A single representative radius also cannot represent the competition between small pores, which exert a large capillary pressure, and large pores, which offer a low resistance. These limitations are discussed in Section 5.3.</p>`,
      },
      {
        id: 'theory-gas', num: '2.6', title: 'Trapped gas and vacuum-assisted filling',
        body: () => R`
<p>If a pore is closed at its far end, the gas ahead of the liquid cannot escape. Such dead-end pores arise, for example, where a pore through the coating terminates at the current-collector foil, or where a region of pores is enclosed by the advancing liquid. The following idealized sequence is considered ({{figref:deadend}}): (i) the dry cell is evacuated, leaving non-condensable gas at the absolute pressure $p_{g0}$ in a pore of length $L_p$; (ii) liquid covers the pore entrance and seals the gas; (iii) the liquid reservoir is vented, so that the liquid at the pore entrance is at $p_L$ = 101.3 kPa (absolute).</p>
<p>The sealed gas is treated as an ideal gas compressed isothermally. When the liquid has penetrated a length $L$, the gas occupies the length $L_p - L$ of a pore of constant cross-section, and Boyle's law ($p_g V$ = constant) gives</p>
{{eq:boyle}}
<p>Absolute pressures are required in {{eqref:boyle}}. The net pressure driving the liquid column is now $p_L + p_c - p_g(L)$, and {{eqref:front}} becomes</p>
{{eq:deadFront}}
<p>As the liquid advances, the gas pressure rises and the driving pressure falls. Filling stops when $p_g(L_{eq}) = p_L + p_c$; substituting {{eqref:boyle}} and solving for $L_{eq}$ gives the equilibrium fill fraction</p>
{{eq:eqFill}}
<p>{{eqref:eqFill}} shows that the attainable degree of filling is controlled by the ratio of the initial gas pressure to the total pressure pushing the liquid. It is independent of $L_p$ and $\mu$, which affect only the time required to approach equilibrium. Reducing $p_{g0}$ by evacuating the cell before filling increases the equilibrium fill fraction, which approaches unity as $p_{g0} \to 0$. The result rests on the following assumptions: isothermal ideal-gas behaviour of the non-condensable gas; no escape of gas from the pore; no dissolution of gas into the electrolyte; and negligible solvent vapour, which condenses when compressed rather than following Boyle's law (the vapour pressure of dimethyl carbonate is approximately 2.4 kPa at 21 °C [sigmadmc2026]). The stage of dosing under vacuum, before the reservoir is vented, is not modelled.</p>
{{fig:deadend}}`,
      },
    ],
  },
  {
    id: 'methodology', num: '3', title: 'Methodology',
    body: () => R``,
    subsections: [
      {
        id: 'methods-parameters', num: '3.1', title: 'Parameter values',
        body: () => R`
<p>The parameter values are listed in {{tabref:params}}. The electrolyte properties were measured for one electrolyte, ethylene carbonate/dimethyl carbonate (50:50 by mass) with 0.787 mol/kg LiPF₆ [hofmann2015]. The pore radius, contact angle, tortuosity and geometric quantities are assumptions; where possible their ranges are bounded by published measurements. In particular, the baseline contact angle of 30° is an illustrative value chosen between the angles measured for the same electrolyte on separators [hofmann2015]; it is not a measured contact angle on a graphite anode or cathode coating, for which no value was available. Properties are not corrected for temperature.</p>
{{tab:params}}`,
      },
      {
        id: 'methods-calc', num: '3.2', title: 'Calculations',
        body: () => R`
<p>{{eqref:pc}}, {{eqref:lwGeneral}}–{{eqref:tau}} and {{eqref:eqFill}} are evaluated analytically. {{eqref:deadFront}} has no simple explicit solution for $L(t)$ and is integrated numerically. Because the right-hand side of {{eqref:deadFront}} is singular at $L = 0$, the equation is rewritten for $s = L^2$, for which $ds/dt = r^2[p_L + p_c - p_g]/(4\mu)$ is finite, and is integrated in dimensionless form with an adaptive fifth-order Runge–Kutta method (Dormand–Prince 5(4) [dormand1980]) at a relative tolerance of 10⁻¹⁰. All calculations are performed in the reader's web browser by the same code that drives the interactive demonstration; the implementation is given in Supplementary Section S4.</p>`,
      },
      {
        id: 'methods-verification', num: '3.3', title: 'Verification',
        body: () => R`
<p>The implementation was verified in four ways: (i) hand calculation of $p_c$, $D_W$ and the penetration times in {{tabref:baseline}}; (ii) comparison of the numerical solution of {{eqref:deadFront}} with the analytical equilibrium, {{eqref:eqFill}}, and with an exact implicit solution derived in Supplementary Section S1; (iii) comparison with a separately coded Python implementation that uses a different integration method, and with a library solver (SciPy, Radau method); and (iv) limiting cases, including $\theta$ = 90° (no penetration) and $p_{g0} \to 0$ (recovery of {{eqref:lwGeneral}}). Checks (i)–(iii) are numerically independent but share the same governing equations; two further checks reach the same results by physically different derivations (Young–Laplace curvature and Darcy flow; Supplementary Sections S1–S2). All checks are run automatically before publication and live in the browser (Supplementary Section S4). Verification establishes that the equations are solved correctly; it does not establish that they describe real electrodes (Section 5.6).</p>`,
      },
    ],
  },
  {
    id: 'results', num: '4', title: 'Results',
    body: () => R``,
    subsections: [
      {
        id: 'results-xt', num: '4.1', title: 'Penetration distance and time',
        body: () => R`
<p>{{figref:xt}} shows the straight-line penetration distance as a function of time for three contact angles, and {{tabref:baseline}} lists the baseline results. At the baseline conditions, a 70 µm coating is crossed in ${T(tX(70e-6))}, whereas 1 cm requires ${T(tX(0.01))} and 5 cm requires ${T(tX(0.05))}. The distance increases by a factor of ${Math.round(ratioX)} between the first and last cases, and the time by a factor of approximately ${spaced(ratioX ** 2)} = ${Math.round(ratioX)}², as required by the $X^2$ dependence of {{eqref:tau}}. This square-distance relationship holds under the stated model assumptions (constant driving pressure, uniform pore radius and free escape of gas) and is the reason the two distances relevant to a cell differ so greatly in filling time. A tortuosity of 2 increases the 5 cm time to ${T(tX(0.05, 2))}. Changing the contact angle from 15.2° to 46.2° reduces $\cos\theta$, and therefore the capillary driving pressure, by ${Math.round((1 - 1 / thetaRatio) * 100)} %, and increases the penetration time by the factor ${sig(thetaRatio, 3)}.</p>
{{fig:xt}}
{{tab:baseline}}`,
      },
      {
        id: 'results-pc', num: '4.2', title: 'Contact angle and capillary pressure',
        body: () => R`
<p>{{figref:pctheta}} shows the capillary pressure as a function of contact angle for three pore radii. The capillary pressure is largest for complete wetting ($\theta$ = 0°), falls to zero at $\theta$ = 90° and becomes negative for non-wetting liquids. For $r$ = 0.5 µm the capillary pressure at $\theta$ = 30° is ${sig(pc0 / 1e3, 4)} kPa; at $\theta$ = 120° it is ${sig(capillaryPressure(BASE.sigma, 120, BASE.r) / 1e3, 3)} kPa, so an applied pressure difference exceeding ${sig(-capillaryPressure(BASE.sigma, 120, BASE.r) / 1e3, 3)} kPa would be required for penetration.</p>
{{fig:pctheta}}`,
      },
      {
        id: 'results-radius', num: '4.3', title: 'Pore radius and filling time',
        body: () => R`
<p>{{figref:tr}} shows the time required to penetrate 1 cm as a function of pore radius. Under pure capillary drive the time is inversely proportional to the radius (fitted log–log slope −1): over the range 0.05–5 µm the time falls from ${T(tX(0.01, 1, { r: 0.05e-6 }))} to ${T(tX(0.01, 1, { r: 5e-6 }))}. When the driving pressure is held fixed independently of the radius, the time is inversely proportional to the square of the radius (slope −2). Smaller pores therefore fill a given distance more slowly even though their capillary pressure is larger.</p>
{{fig:tr}}`,
      },
      {
        id: 'results-vacuum', num: '4.4', title: 'Initial gas pressure and equilibrium filling',
        body: () => R`
<p>{{figref:fill}} shows the equilibrium fill fraction of an idealized, sealed dead-end pore as a function of the initial absolute pressure of the sealed gas. With gas sealed at atmospheric pressure (101.3 kPa), this pore fills to only ${pct(fill(101.3e3), 3)} of its length, because the gas pressure must approximately double before it balances $p_L + p_c$ = ${sig((P_LIQUID_ABS + pc0) / 1e3, 4)} kPa. Evacuation to 10 kPa and 1 kPa raises the equilibrium fill fraction to ${pct(fill(10e3), 4)} and ${pct(fill(1e3), 4)}, respectively. The numerical solutions of {{eqref:deadFront}} reach the analytical equilibrium to within a relative difference of 10⁻⁶ at every pressure shown. These fill fractions apply to a single pore from which no gas can escape; they are not predictions of the electrolyte saturation of a whole electrode (Section 5.4).</p>
{{fig:fill}}`,
      },
    ],
  },
  {
    id: 'discussion', num: '5', title: 'Discussion',
    body: () => R``,
    subsections: [
      {
        id: 'discussion-physics', num: '5.1', title: 'Physical interpretation',
        body: () => R`
<p>The results identify penetration distance as the dominant variable. Because the viscous resistance of the liquid column grows with its length while the capillary pressure at the front remains constant, the time scales with the square of the distance. A coating tens of micrometres thick and an in-plane path of several centimetres differ in length by a factor of the order of 10³ (${Math.round(ratioX)} for 70 µm and 5 cm), and therefore, under the model assumptions, in filling time by the square of that factor (approximately ${spaced(ratioX ** 2)}): ${T(tX(70e-6), 2)} compared with ${T(tX(0.05), 2)} at the baseline conditions. Crossing the thickness of a coating is therefore rapid, and the slow step in cell filling is the in-plane transport of electrolyte over centimetres from the edges of the electrode stack, consistent with the edge-inward wetting observed by neutron imaging [weydanz2018]. Pore radius, viscosity, surface tension and contact angle enter the time only linearly, through $\mu/(r\sigma\cos\theta)$ in {{eqref:time}}. The contact angle is the most sensitive of these near 90°, where small changes in $\theta$, or in the surface chemistry that controls it, produce large changes in the penetration time.</p>`,
      },
      {
        id: 'discussion-limits', num: '5.2', title: 'Limitations of the idealized capillary model',
        body: () => R`
<p>The model represents the electrode by one cylindrical pore of uniform radius. Real electrodes contain a distribution of pore sizes, and liquid advances preferentially through some pores while bypassing others. The contact angle is treated as static, although the advancing (dynamic) contact angle of a moving contact line exceeds the static value when the capillary number $\text{Ca} = \mu v/\sigma$ is large; because the Lucas–Washburn front velocity $v = D_W/(2L)$ is unbounded at $L = 0$, $\text{Ca}$ has no finite initial value in this model and is evaluated here at $L = 10r$ (${sig(LEarly * 1e6, 2)} µm). This evaluation point is a convention, the same one used by the validity checks of the interactive demonstration, chosen because the column must be several radii long before the fully developed flow of Section 2.3 can apply; the result should be read together with its $1/L$ dependence. At the baseline conditions this gives $v$ ≈ ${sig(vEarly, 2)} m/s and $\text{Ca}$ ≈ ${sig(CaEarly, 2)}. Since $\text{Ca} \propto 1/L$, it falls to ${sci(CaCoat, 2)} at 70 µm and continues to decrease, so the static-angle assumption is least accurate during the earliest micrometres of penetration, where the model is likely to overestimate the filling rate. Inertia is significant only during a very brief initial stage [fries2008b]. Gravity is negligible: the height to which capillarity could lift the liquid in a vertical pore, $2\sigma\cos\theta/(\rho g r)$, is approximately ${sig(hJurin, 2)} m at the baseline conditions, compared with penetration distances of centimetres. The electrolyte properties are taken at 25 °C (20 °C for $\mu$) without temperature correction, and swelling of the binder, reaction and electrochemical processes are not considered. Further limitations are listed in Supplementary Section S3.</p>`,
      },
      {
        id: 'discussion-porous', num: '5.3', title: 'Tortuosity and porous-electrode flow',
        body: () => R`
<p>The tortuosity correction of Section 2.5 retains the single-pore picture and adds one adjustable factor. At the scale of a whole electrode, flow through a porous medium is usually described by Darcy's law [bear1972],</p>
{{eq:darcy}}
<p>In {{eqref:darcy}}, $u$ is the superficial velocity (the volumetric flow rate divided by the total cross-sectional area, including solid), $k$ is the permeability of the medium and $dp/dx$ is the pressure gradient. The front itself advances at the interstitial velocity $u/\varepsilon$, where $\varepsilon$ is the porosity. For a medium idealized as a bundle of identical tortuous capillaries, the permeability is $k = \varepsilon r^2/(8\tau^2)$, and Darcy's law then reproduces {{eqref:tau}} exactly, with the porosity cancelling. For other microstructures, including the Kozeny–Carman model of a packed bed, the predicted times differ (Supplementary Section S2). A continuum treatment of this kind also assumes a sharp, fully saturated front, whereas real fronts are diffuse and can leave gas behind; pore-scale simulations of cathode filling have predicted final saturations between 63 % and 97 %, depending on wettability and microstructure [lautenschlaeger2022]. A quantitative prediction for a specific electrode would therefore require its measured permeability, pore-size distribution and contact angle.</p>`,
      },
      {
        id: 'discussion-gas', num: '5.4', title: 'Trapped gas and vacuum filling',
        body: () => R`
<p>The idealized, sealed dead-end pore represents the most unfavourable case for gas entrapment: the gas has no escape path. Its equilibrium fill fraction is therefore a bound for a single closed pore, not an estimate of whole-electrode saturation. {{eqref:eqFill}} predicts that ${pct(1 - fill(101.3e3), 3)} of such a pore remains gas-filled when filling starts from atmospheric pressure, whereas the measured reduction in electrolyte uptake at normal pressure was approximately 10 % [tum2018]. The difference is attributed to the connectivity of real pore networks, through which gas ahead of the front can escape. The model nevertheless reproduces the direction of the effect: a lower initial gas pressure leaves less gas to be compressed and allows more complete filling, which is consistent with the improved wetting observed under vacuum [weydanz2018, tum2018]. The model does not predict the observed reduction in wetting time, because that depends on gas transport through the network. Dissolution of gas into the electrolyte, which allows trapped bubbles to shrink over time, and solvent vapour are neglected. A more complete treatment of filling of closed capillaries with gas compression is given by Ramakrishnan et al. [ramakrishnan2019].</p>`,
      },
      {
        id: 'discussion-experiment', num: '5.5', title: 'Comparison with published experiments',
        body: () => R`
<p>{{tabref:compare}} compares the model with published observations. The predicted in-plane penetration times are of the same order of magnitude as the measured wetting times of a prismatic cell, and the predicted $\sqrt{t}$ behaviour is consistent with the observed deceleration of the wetting front and with the reporting of wetting rates in mm/s<sup>0.5</sup>. The cell geometry, pore size, contact angle and tortuosity of the experiments are not known, so this agreement is a plausibility check rather than a validation. No experimental data were digitized or fitted in this work.</p>
{{tab:compare}}`,
      },
      {
        id: 'discussion-validation', num: '5.6', title: 'Verification and validation',
        body: () => R`
<p>Verification (Section 3.3) establishes that the equations of Section 2 are solved correctly. Validation, which would establish that these equations predict the wetting of a real electrode, requires measurements on a single, fully characterized system: its pore-size distribution and permeability, the advancing contact angle of the electrolyte on the electrode material, and the measured wetting front position as a function of time. Such a comparison has not been made here. The results should therefore be interpreted as idealized estimates that identify controlling variables and trends, not as predictions of the filling time of a particular cell.</p>`,
      },
    ],
  },
  {
    id: 'conclusions', num: '6', title: 'Conclusions',
    body: () => R`
<ol class="findings">
<li>Capillary penetration of electrolyte into a pore follows the Lucas–Washburn equation, {{eqref:lw}}: the penetration distance grows as $\sqrt{t}$, so the required time grows with the square of the distance. For the baseline conditions, a 70 µm coating is crossed in ${T(tX(70e-6))}, whereas 5 cm of in-plane penetration requires ${T(tX(0.05))}; under the model assumptions, the long in-plane path controls the filling time.</li>
<li>The capillary driving pressure, $p_c = 2\sigma\cos\theta/r$, is ${sig(pc0 / 1e3, 4)} kPa for the baseline conditions. Its sign is set by the contact angle; for $\theta \ge$ 90° spontaneous penetration does not occur and an applied pressure difference larger than $|p_c|$ is required.</li>
<li>Under capillary drive the penetration time is proportional to $\mu/(r\sigma\cos\theta)$. Smaller pores fill a given distance more slowly despite their larger capillary pressure, because the viscous resistance increases faster than the driving pressure as the radius decreases.</li>
<li>Within the single-pore approximation, tortuosity multiplies the penetration time by $\tau^2$; this scaling is specific to that geometric model. Quantitative prediction for a real electrode requires its measured permeability, pore-size distribution and contact angle.</li>
<li>Gas sealed in an idealized dead-end pore limits its equilibrium fill fraction to $1 - p_{g0}/(p_L + p_c)$: approximately ${pct(fill(101.3e3), 2)} for gas at atmospheric pressure and ${pct(fill(1e3), 3)} after evacuation to 1 kPa. These values describe a single sealed pore, not whole-electrode saturation; real, connected electrodes trap far less gas, but the trend accounts for the benefit of evacuating cells before filling.</li>
</ol>`,
  },
];

/** Back matter shown after the conclusions. */
export const BACK_MATTER = {
  aiDeclaration: R`During the preparation of this work the author used Claude Opus 5.5 (Anthropic) to plan the project, write the website code, automated tests and draft text, and audit the scientific content. The author selected the topic, set the requirements, directed the tools and reviewed every change before publication, and takes responsibility for the content. Details, including the prompts used, are given on the AI project documentation page.`,
  dataAvailability: R`All equations, parameter values, calculations and tests are contained in the public repository <a href="https://github.com/mattsheets1214-cpu/electrolyte-wetting">github.com/mattsheets1214-cpu/electrolyte-wetting</a>. Every number and figure in this paper is computed in the reader's browser at page load by the code in <code>src/physics/</code>.`,
};

/** Concatenated text of the paper, in reading order (used for citation numbering and tests). */
export function paperText() {
  const parts = [ABSTRACT()];
  const walk = (secs) => secs.forEach((s) => { parts.push(s.body()); for (const tok of s.body().matchAll(/\{\{(fig|tab):(\w+)\}\}/g)) parts.push(tok[1] === 'fig' ? FIGURES.find((f) => f.id === tok[2]).caption : TABLES.find((t) => t.id === tok[2]).html() + TABLES.find((t) => t.id === tok[2]).caption); if (s.subsections) walk(s.subsections); });
  walk(SECTIONS);
  return parts.join('\n');
}
