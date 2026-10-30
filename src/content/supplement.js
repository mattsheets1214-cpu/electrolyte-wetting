/**
 * supplement.js — Supplementary material (Sections S1–S3). Section S4
 * (numerical methods and verification) is rendered by src/sections/verification.js.
 *
 * Same markup as src/content/paper.js: $math$, {{eqS:id}} / {{eqSref:id}}
 * (numbered S1, S2, …), {{eqref:id}} for main-paper equations, [refId] citations.
 * This material supports the paper but is not needed to follow its argument.
 */
import {
  capillaryPressure, solveModeA, darcyFrontTime, bundlePermeability, kozenyCarman, capillaryPressureHydraulic,
  RHO_ELECTROLYTE, G,
} from '../physics/index.js';
import { BASE } from '../physics/checks.js';
import { formatTime, sig, sci } from '../physics/units.js';

const R = String.raw;

const pc0 = capillaryPressure(BASE.sigma, BASE.thetaDeg, BASE.r);
const DARCY = (() => {
  const eps = 0.35, tau = 1.6, X = 0.01, d = 10e-6;
  const kB = bundlePermeability({ eps, r: BASE.r, tau });
  const tBundle = darcyFrontTime({ X, k: kB, eps, mu: BASE.mu, P: pc0 });
  const tModeA = solveModeA({ ...BASE, X, tau }).tTarget;
  const kc = kozenyCarman({ eps, d });
  const pcKC = capillaryPressureHydraulic(BASE.sigma, BASE.thetaDeg, kc.rh);
  const tKC = darcyFrontTime({ X, k: kc.k, eps, mu: BASE.mu, P: pcKC });
  return { eps, tau, d, kB, tBundle, tModeA, kc, pcKC, tKC, t1cm: solveModeA({ ...BASE, X }).tTarget };
})();
const Bo = (RHO_ELECTROLYTE * G * BASE.r ** 2) / BASE.sigma;
const tv = (RHO_ELECTROLYTE * BASE.r ** 2) / BASE.mu;

export const SUPP_EQUATIONS = [
  { id: 'yl', tex: R`\Delta p = \sigma\left(\frac{1}{R_1} + \frac{1}{R_2}\right)` },
  { id: 'slit', tex: R`p_c^{\text{slit}} = \frac{\sigma\cos\theta}{h}` },
  { id: 'dimless', tex: R`\frac{dy}{d\hat t} = 1 - \frac{\beta}{1 - \sqrt{y}},\qquad y = \left(\frac{L}{L_p}\right)^2,\quad \hat t = \frac{t}{T},\quad \beta = \frac{p_{g0}}{p_L + p_c},\quad T = \frac{4\mu L_p^2}{r^2(p_L + p_c)}` },
  { id: 'exact', tex: R`\hat t(\lambda) = \lambda^2 - 2\beta\lambda + 2\beta(1-\beta)\,\ln\frac{1-\beta}{1-\beta-\lambda},\qquad \lambda = \frac{L}{L_p}` },
  { id: 'darcyFront', tex: R`\frac{dX}{dt} = \frac{u}{\varepsilon} = \frac{k\,p_c}{\varepsilon\mu X}\quad\Rightarrow\quad X^2 = \frac{2k\,p_c}{\varepsilon\mu}\,t` },
  { id: 'bundle', tex: R`k = \frac{\varepsilon r^2}{8\tau^2}` },
  { id: 'kc', tex: R`k = \frac{\varepsilon^3 d^2}{180\,(1-\varepsilon)^2},\qquad r_h = \frac{\varepsilon d}{6\,(1-\varepsilon)},\qquad p_c = \frac{\sigma\cos\theta}{r_h}` },
];

export const SUPP_SECTIONS = [
  {
    id: 's1', num: 'S1', title: 'Additional derivations',
    body: () => R`
<h3>S1.1 Capillary pressure from the Young–Laplace equation</h3>
<p>A curved liquid–gas interface sustains a pressure difference, higher on its concave side, given by the Young–Laplace equation [degennes2004]:</p>
{{eqS:yl}}
<p>where $R_1$ and $R_2$ are the principal radii of curvature of the interface. In a pore of micrometre size gravity cannot distort the meniscus (Section S3), so the meniscus in a cylindrical pore is a spherical cap meeting the wall at the contact angle $\theta$. A sphere of radius $R$ that intersects a cylinder of radius $r$ at the angle $\theta$ has $R = r/\cos\theta$ (a hemisphere only for $\theta$ = 0°). With $R_1 = R_2 = r/\cos\theta$, {{eqSref:yl}} gives $p_c = 2\sigma\cos\theta/r$, identical to {{eqref:pc}} of the paper. For $\theta$ &gt; 90° the radius changes sign, and so does $p_c$.</p>
<h3>S1.2 Slit-shaped pores</h3>
<p>Between two parallel plates separated by $2h$, the meniscus is curved in one direction only: $R_1 = h/\cos\theta$ and $R_2 \to \infty$. Equivalently, the contact-line force per unit plate width is $2\sigma\cos\theta$ and acts on an area $2h$ per unit width. Either route gives</p>
{{eqS:slit}}
<p>which is half the cylindrical value at $h = r$. The factor 2 in {{eqref:pc}} is therefore a geometric factor of the cylinder.</p>
<h3>S1.3 Exact solution for the dead-end pore</h3>
<p>With the dimensionless variables below, {{eqref:deadFront}} of the paper becomes</p>
{{eqS:dimless}}
<p>which is the form integrated numerically. Writing $y = \lambda^2$ gives $d\hat t = 2\lambda(1-\lambda)/(1-\beta-\lambda)\,d\lambda$, which is separable. With $a = 1 - \beta$ and $w = a - \lambda$, the integrand becomes $2[a(1-a)/w + (2a-1) - w]$, and integration from $\lambda = 0$ gives the exact implicit trajectory</p>
{{eqS:exact}}
<p>As $\beta \to 0$, $\hat t \to \lambda^2$, which is {{eqref:lwGeneral}} with $\Delta p_a = p_L$; as $\lambda \to 1 - \beta$, $\hat t \to \infty$, so equilibrium, {{eqref:eqFill}}, is approached but not reached in finite time. {{eqSref:exact}} is used only to verify the numerical solution (Section S4).</p>`,
  },
  {
    id: 's2', num: 'S2', title: 'Porous-media (Darcy) description',
    body: () => R`
<p>At the scale of a whole electrode, flow through the porous coating is described by Darcy's law, {{eqref:darcy}} of the paper [bear1972]. For steady flow through a slab of constant permeability $k$, cross-sectional area $A$ and thickness $L$, it gives $Q = kA\Delta p/(\mu L)$. The superficial velocity $u = Q/A$ is based on the total cross-section, including solid; the liquid flows only through the pore fraction $\varepsilon$, so its mean velocity in the pores (the interstitial velocity) is $u/\varepsilon$.</p>
<p><b>Sharp-front imbibition.</b> If the wetted zone $0 < x < X$ is fully saturated, the liquid is incompressible, the gas ahead escapes at constant pressure and the capillary pressure acts at the front, the pressure falls linearly across the wetted zone, $u = k\,p_c/(\mu X)$, and the front advances at the interstitial velocity:</p>
{{eqS:darcyFront}}
<p><b>Capillary-bundle permeability.</b> For a bundle of identical tortuous tubes of radius $r$ occupying the area fraction $\varepsilon$, the velocity along each tube is $r^2\Delta p/(8\mu\tau X)$ (path length $\tau X$), and only the fraction $1/\tau$ of it is directed along $x$, so $u = \varepsilon r^2\Delta p/(8\mu\tau^2 X)$, i.e.</p>
{{eqS:bundle}}
<p>Substitution of {{eqSref:bundle}} and {{eqref:pc}} into {{eqSref:darcyFront}} gives $X^2 = r\sigma\cos\theta\,t/(2\mu\tau^2)$, which is {{eqref:tau}} of the paper; the porosity cancels. For $\varepsilon$ = ${DARCY.eps}, $\tau$ = ${DARCY.tau} and $r$ = 0.5 µm, $k$ = ${sci(DARCY.kB, 3)} m² and the front reaches 1 cm in ${formatTime(DARCY.tBundle).text}, identical to {{eqref:tau}} (${formatTime(DARCY.tModeA).text}).</p>
<p><b>Kozeny–Carman permeability.</b> For a packed bed of spheres of diameter $d$, with the capillary pressure based on the hydraulic radius $r_h$ (pore volume divided by wetted surface) [bear1972]:</p>
{{eqS:kc}}
<p>For $d$ = ${sig(DARCY.d * 1e6, 2)} µm and $\varepsilon$ = ${DARCY.eps}: $k$ = ${sci(DARCY.kc.k, 2)} m², $r_h$ = ${sig(DARCY.kc.rh * 1e6, 2)} µm, $p_c$ = ${sig(DARCY.pcKC / 1e3, 3)} kPa, and 1 cm is reached in approximately ${formatTime(DARCY.tKC, 2).text}, compared with ${formatTime(DARCY.t1cm, 2).text} for the baseline single pore with $\tau$ = 1. Both descriptions give $X \propto \sqrt{t}$, but the time depends on the permeability model. The values of $\varepsilon$, $\tau$ and $d$ here are illustrative, not measured (porosities of 37–48 % have been measured for graphite anodes [sheng2014]).</p>`,
  },
  {
    id: 's3', num: 'S3', title: 'Additional limitations',
    body: () => R`
<ul>
<li><b>Dynamic contact angle.</b> The capillary number $\text{Ca} = \mu v/\sigma$ compares viscous and surface-tension forces at the moving contact line. As an order-of-magnitude guide rather than a sharp limit, the advancing angle differs noticeably from the static angle once Ca exceeds approximately 10⁻⁴–10⁻³. Because $v$ is largest just after entry, the static-angle model overestimates the earliest rate of filling.</li>
<li><b>Contact-angle hysteresis and roughness.</b> Imbibition is governed by the advancing angle, which exceeds the receding angle; roughness amplifies the intrinsic wetting tendency of a surface [degennes2004]. Separator measurements [hofmann2015, wang2021] may not represent electrode coatings containing binder and carbon.</li>
<li><b>Meniscus shape (Bond number).</b> $\text{Bo} = \rho g r^2/\sigma$ = ${sci(Bo, 2)} at the baseline, so gravity cannot distort the meniscus and the spherical-cap shape of Section S1.1 holds.</li>
<li><b>Gravity on a vertical front.</b> The hydrostatic pressure of a vertical column of height $X$, $\rho g X$, must be small compared with the driving pressure. Capillary rise would stop at $2\sigma\cos\theta/(\rho g r)$ ≈ ${sig(pc0 / (RHO_ELECTROLYTE * G), 2)} m for the baseline pore, so gravity is negligible over centimetres.</li>
<li><b>Inertia.</b> The viscous diffusion time across the pore, $\rho r^2/\mu$ ≈ ${formatTime(tv).text}, is very short compared with filling times; capillary rise passes through brief inertial and visco-inertial stages before the viscous regime [fries2008b].</li>
<li><b>Continuum assumption.</b> For pores below approximately 10–50 nm, adsorbed layers and slip may become significant; the pores considered here are much larger.</li>
<li><b>Short pores.</b> Hagen–Poiseuille flow assumes fully developed flow; entrance and meniscus effects are not negligible for pores shorter than approximately 20 radii.</li>
<li><b>Gas dissolution and solvent vapour.</b> Gas dissolves slowly into the electrolyte, so trapped bubbles can shrink over time. Solvent vapour (dimethyl carbonate ≈ 2.4 kPa at 21 °C [sigmadmc2026]) condenses on compression rather than following Boyle's law. Both are neglected in the dead-end model.</li>
<li><b>Gas-side flow and closed capillaries.</b> The dead-end model neglects gas-side drag, inertia and meniscus effects; a fuller treatment of open and closed capillaries is given by Ramakrishnan et al. [ramakrishnan2019].</li>
<li><b>Temperature.</b> Surface tension was measured at 25 °C and viscosity at 20 °C [hofmann2015]; neither is corrected for temperature.</li>
</ul>`,
  },
];

export function supplementText() {
  return SUPP_SECTIONS.map((s) => s.body()).join('\n');
}
