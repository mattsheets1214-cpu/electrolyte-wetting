/**
 * references.js — the bibliography. Edit here; the References page, parameter
 * notes and lesson citations all read from this file.
 *
 * status:
 *   'checked'    — bibliographic details and the cited claim were confirmed from
 *                  the publisher, an institutional repository or the press release
 *                  during the 29 Oct 2026 build (see docs/SOURCES_AUDIT.md).
 *   'bibliographic' — title/journal/DOI confirmed from an index; the full text was
 *                  not re-read, so only the generic claim stated is relied on.
 *   'unverified' — listed in the blueprint but NOT confirmed; not used on the site.
 */
export const REFERENCES = [
  // ------------------------------------------------------------ battery filling
  {
    id: 'weydanz2018', group: 'Battery cell filling and wetting', status: 'checked',
    cite: 'Weydanz, W. J., Reisenweber, H., Gottschalk, A., Schulz, M., Knoche, T., Reinhart, G., Masuch, M., Franke, J., & Gilles, R. (2018). Visualization of electrolyte filling process and influence of vacuum during filling for hard case prismatic lithium ion cells by neutron imaging to optimize the production process. Journal of Power Sources, 380, 126–134.',
    doi: '10.1016/j.jpowsour.2018.01.081',
    url: 'https://doi.org/10.1016/j.jpowsour.2018.01.081',
    supports: 'Neutron imaging of hard-case prismatic cells: wetting proceeds roughly isotropically from the outside toward a centre point, starts fast and slows down, and filling under vacuum is about twice as fast (abstract).',
  },
  {
    id: 'tum2018', group: 'Battery cell filling and wetting', status: 'checked',
    cite: 'Technical University of Munich (2018, 20 March). Neutrons pave the way to accelerated production of lithium-ion cells [press release].',
    url: 'https://www.tum.de/en/about-tum/news/press-releases/details/34532',
    supports: 'Reports, for the Weydanz et al. cells: electrodes fully wetted in just over 50 min under vacuum versus about 100 min at normal pressure; about 10 % less electrolyte absorbed at normal pressure, attributed to gases hindering wetting; liquid spreading evenly from all four sides. These specific numbers come from the press release, not the abstract.',
  },
  {
    id: 'davoodabadi2019', group: 'Battery cell filling and wetting', status: 'checked',
    cite: 'Davoodabadi, A., Li, J., Liang, Y., Wood, D. L., III, Singler, T. J., & Jin, C. (2019). Analysis of electrolyte imbibition through lithium-ion battery electrodes. Journal of Power Sources, 424, 193–203.',
    doi: '10.1016/j.jpowsour.2019.03.115',
    url: 'https://doi.org/10.1016/j.jpowsour.2019.03.115',
    supports: 'Measured electrolyte imbibition into electrodes with an analytical model; higher salt concentration slows wetting; switching EC-DEC to EC-EMC speeds it up; uncalendered graphite anodes imbibe much faster than uncalendered NMC532 cathodes (ORNL abstract). Used only as qualitative trend evidence; no data were digitized.',
  },
  {
    id: 'sheng2014', group: 'Battery cell filling and wetting', status: 'checked',
    cite: 'Sheng, Y., Fell, C. R., Son, Y. K., Metz, B. M., Jiang, J., & Church, B. C. (2014). Effect of calendering on electrode wettability in lithium-ion batteries. Frontiers in Energy Research, 2, 56.',
    doi: '10.3389/fenrg.2014.00056',
    url: 'https://doi.org/10.3389/fenrg.2014.00056',
    supports: 'Mercury porosimetry of graphite anodes calendered to different thicknesses: average pore diameters 0.327–0.993 µm (porosity 37–48 %); wetting rate reported in mm/s^0.5 (a √t law). Used to bound the illustrative pore radius.',
  },
  // ------------------------------------------------------------ electrolyte properties
  {
    id: 'hofmann2015', group: 'Electrolyte and separator properties', status: 'checked',
    cite: 'Hofmann, A., Kaufmann, C., Müller, M., & Hanemann, T. (2015). Interaction of high flash point electrolytes and PE-based separators for Li-ion batteries. International Journal of Molecular Sciences, 16, 20258–20276.',
    doi: '10.3390/ijms160920258',
    url: 'https://doi.org/10.3390/ijms160920258',
    supports: 'Mixture M-1 (EC/DMC 50:50 wt, LiPF₆ 0.787 mol/kg): surface tension 29.4 ± 0.2 mN/m (25 °C), viscosity 4.4 ± 0.1 mPa·s (20 °C), density 1.3030 g/cm³ (25 °C). Contact angles of M-1 after 10 min: 46.2° on uncoated PE separator, 15.2° on ceramic-coated PE. Electrolytes studied spanned 23.3–38.1 mN/m.',
  },
  {
    id: 'wang2021', group: 'Electrolyte and separator properties', status: 'checked',
    cite: 'Wang, Y., et al. (2021). Separator wettability enhanced by electrolyte additive to boost the electrochemical performance of lithium metal batteries. Nano-Micro Letters, 13, 210.',
    doi: '10.1007/s40820-021-00731-2',
    url: 'https://doi.org/10.1007/s40820-021-00731-2',
    supports: 'Contact angle of 1 M LiPF₆ in EC/DMC on the separator used in that study: 65.4°, falling to 40.5° with 1 wt % additive. Shows how widely separator contact angles vary. (Author list abbreviated; check the full list before formal submission.)',
  },
  // ------------------------------------------------------------ capillary physics
  {
    id: 'washburn1921', group: 'Capillary flow theory', status: 'bibliographic',
    cite: 'Washburn, E. W. (1921). The dynamics of capillary flow. Physical Review, 17(3), 273–283.',
    doi: '10.1103/PhysRev.17.273',
    url: 'https://doi.org/10.1103/PhysRev.17.273',
    supports: 'Origin of the L² ∝ t law for viscous capillary penetration.',
  },
  {
    id: 'lucas1918', group: 'Capillary flow theory', status: 'bibliographic',
    cite: 'Lucas, R. (1918). Ueber das Zeitgesetz des kapillaren Aufstiegs von Flüssigkeiten. Kolloid-Zeitschrift, 23, 15–22.',
    doi: '10.1007/BF01461107',
    url: 'https://doi.org/10.1007/BF01461107',
    supports: 'Independent earlier derivation of the same √t law (hence "Lucas–Washburn"). Page range from the standard citation; only the first page was confirmed.',
  },
  {
    id: 'fries2008a', group: 'Capillary flow theory', status: 'bibliographic',
    cite: 'Fries, N., & Dreyer, M. (2008). An analytic solution of capillary rise restrained by gravity. Journal of Colloid and Interface Science, 320, 259–263.',
    url: 'https://zarm.uni-bremen.de/en/research/fluid-dynamics/multiphase-flows/research-areas/isothermal-capillary-flows/capillary-rise-in-tubes/analytical-approaches.html',
    supports: 'Analytic capillary-rise solution including gravity; discussed with the range of validity of Lucas–Washburn (ZARM summary page).',
  },
  {
    id: 'fries2008b', group: 'Capillary flow theory', status: 'bibliographic',
    cite: 'Fries, N., & Dreyer, M. (2008). The transition from inertial to viscous flow in capillary rise. Journal of Colloid and Interface Science, 327, 125–128.',
    url: 'https://zarm.uni-bremen.de/en/research/fluid-dynamics/multiphase-flows/research-areas/isothermal-capillary-flows/capillary-rise-in-tubes/analytical-approaches.html',
    supports: 'Capillary rise passes from an inertial stage through a visco-inertial stage to purely viscous (Washburn) flow — the basis of the inertia warning in the lab.',
  },
  {
    id: 'fries2009', group: 'Capillary flow theory', status: 'bibliographic',
    cite: 'Fries, N., & Dreyer, M. (2009). Dimensionless scaling methods for capillary rise. Journal of Colloid and Interface Science, 338, 514–518.',
    url: 'https://homepages.rub.de/nicolas.fries/preprintfries2009.pdf',
    supports: 'Dimensionless scaling of capillary rise (author preprint linked).',
  },
  {
    id: 'ramakrishnan2019', group: 'Capillary flow theory', status: 'checked',
    cite: 'Ramakrishnan, T. S., Wu, P., Zhang, H., & Wasan, D. T. (2019). Dynamics in closed and open capillaries. Journal of Fluid Mechanics, 872, 5–38.',
    doi: '10.1017/jfm.2019.328',
    url: 'https://doi.org/10.1017/jfm.2019.328',
    supports: 'Capillary rise into closed (dead-end) capillaries with gas compressibility, compared with experiments. A far more complete treatment than this site\'s Mode B, which neglects inertia, meniscus effects and gas-side drag.',
  },
  // ------------------------------------------------------------ numerical methods
  {
    id: 'dormand1980', group: 'Numerical methods', status: 'bibliographic',
    cite: 'Dormand, J. R., & Prince, P. J. (1980). A family of embedded Runge–Kutta formulae. Journal of Computational and Applied Mathematics, 6(1), 19–26.',
    doi: '10.1016/0771-050X(80)90013-3',
    url: 'https://doi.org/10.1016/0771-050X(80)90013-3',
    supports: 'The Dormand–Prince 5(4) coefficients used in src/physics/ode.js.',
  },
];

export const SOFTWARE = [
  { name: 'Vite 8.3.5', role: 'build tool and dev server', url: 'https://vite.dev/' },
  { name: 'Vitest 5.0.5', role: 'JavaScript test runner', url: 'https://vitest.dev/' },
  { name: 'Anime.js 4.5.0', role: 'playback clock for physics-linked pore animations', url: 'https://animejs.com/' },
  { name: 'Motion 14.7.1', role: 'page transition and figure reveal', url: 'https://motion.dev/' },
  { name: 'KaTeX 0.19.1', role: 'equation typesetting', url: 'https://katex.org/' },
  { name: 'Pyodide 314.0.7', role: 'runs the Python reference model in the browser (WebAssembly)', url: 'https://pyodide.org/' },
  { name: 'pytest 9.1.1 and SciPy 1.18.1', role: 'Python test suite and independent Radau cross-check (desktop only)', url: 'https://scipy.org/' },
  { name: 'IBM Plex Sans / Mono and Newsreader', role: 'typefaces (SIL Open Font License), bundled via Fontsource', url: 'https://fontsource.org/' },
];

export const DESIGN_INSPIRATION = [
  { name: 'Anime.js website', url: 'https://animejs.com/', note: 'Animation reference. Its documentation was consulted for the Timer API (play, pause, seek).' },
  { name: 'Motion website', url: 'https://motion.dev/', note: 'Interface-motion reference. Its documentation was consulted for inView and animate.' },
  { name: 'Bklit', url: 'https://bklit.com/', note: 'Listed as a visual reference in the project brief. The site could not be opened from the build environment, so no specific technique was taken from it; nothing from its branding was used.' },
  { name: 'Course instructor\'s packed-bed reactor site', url: null, note: 'Structural reference (sidebar inputs, numbered theory, live code walkthrough, exact-solution tests), as described in the project blueprint. Add the URL here.' },
];

/** AI models used to plan and build the project (credited on the References page). */
export const AI_MODELS = [
  { role: 'Engineering blueprint', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-22' },
  { role: 'Website code, tests and text (v1)', name: 'Claude Opus 5.5', provider: 'Anthropic', version: 'claude-opus-5-5', date: '2026-10-29' },
];

/** Blueprint sources that were NOT verified and are therefore not used on the site. */
export const UNVERIFIED = [
  { cite: 'USPTO patent 9,083,034 (treated battery separator; contact angles 26.3° and 8.3° quoted in the blueprint)', why: 'Not opened during the build. Not used.' },
  { cite: 'KRÜSS application material on electrode wetting (Washburn method)', why: 'Not opened during the build. Not used.' },
];

export const byId = Object.fromEntries(REFERENCES.map((r) => [r.id, r]));
