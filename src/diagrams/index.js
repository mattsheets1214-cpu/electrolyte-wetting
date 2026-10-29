/**
 * diagrams/index.js — hand-built scientific diagrams as SVG strings.
 *
 * Colour meaning is fixed across the site: liquid = --liquid, gas = amber hatch
 * (--gas), solid = --solid. Diagrams that take arguments (θ, fill fraction)
 * are drawn from the geometry, not from pictures, so they stay correct when
 * the inputs change. Every diagram has a <title> for screen readers.
 */

let uid = 0;
const nextId = (p) => `${p}-${++uid}`;
const f = (v) => Number(v.toFixed(2));

/** A hatch pattern used for gas everywhere. Returns [defs, fill]. */
function gasPattern() {
  const id = nextId('gas');
  return [
    `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--gas-soft)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--gas)" stroke-width="1.4"/></pattern>`,
    `url(#${id})`,
  ];
}

function arrowDef(color = 'var(--ink)') {
  const id = nextId('arr');
  return [`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>`, `url(#${id})`];
}

/**
 * Meniscus in a cylindrical pore (longitudinal section).
 * Geometry: walls at y = cy ± H. Contact line at x0. The meniscus is a circular
 * arc of signed radius ρ = H / cos θ centred at xc = x0 + H tan θ on the axis.
 */
export function poreMeniscus(thetaDeg = 30, { title = `Liquid meniscus in a cylindrical pore with contact angle ${thetaDeg}°` } = {}) {
  const W = 520, Hh = 200, cy = 100, H = 60, x0 = 300, xL = 30, xR = 490;
  const th = (thetaDeg * Math.PI) / 180;
  const c = Math.cos(th);
  const [gDefs, gFill] = gasPattern();
  const [aDefs, aUrl] = arrowDef('var(--liquid-ink)');

  // meniscus points from top wall (y = cy − H) to bottom wall (y = cy + H)
  const pts = [];
  if (Math.abs(c) < 1e-6) {
    pts.push([x0, cy - H], [x0, cy + H]);
  } else {
    const rho = H / c, xc = x0 + H * Math.tan(th), phiM = Math.asin(Math.max(-1, Math.min(1, c)));
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const phi = -phiM + (2 * phiM * i) / n; // y = ρ sin φ runs from −H to +H
      pts.push([xc - rho * Math.cos(phi), cy - rho * Math.sin(phi)]);
    }
    pts.sort((a, b) => a[1] - b[1]);
  }
  const arc = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join('');
  const liquid = `M${xL},${cy - H} ${arc.replace(/^M/, 'L')} L${xL},${cy + H} Z`;
  const gas = `M${xR},${cy - H} ${arc.replace(/^M/, 'L')} L${xR},${cy + H} Z`;

  // contact-angle arc at the top contact point: from the wall direction (into the
  // liquid, −x) rotating toward the interface tangent (−cos θ, +sin θ in screen coords).
  const R = 26, px = x0, py = cy - H;
  const a1 = [px - R, py];
  const a2 = [px - R * Math.cos(th), py + R * Math.sin(th)];
  const large = thetaDeg > 180 ? 1 : 0;
  const lab = [px - (R + 14) * Math.cos(th / 2), py + (R + 14) * Math.sin(th / 2) + 4];
  const tangentEnd = [px - 60 * Math.cos(th), py + 60 * Math.sin(th)];

  return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-labelledby="t-${uid}"><title id="t-${uid}">${title}</title>
  <defs>${gDefs}${aDefs}</defs>
  <path d="${gas}" fill="${gFill}"/>
  <path d="${liquid}" fill="var(--liquid)" fill-opacity="0.85"/>
  <rect x="${xL - 10}" y="${cy - H - 14}" width="${xR - xL + 20}" height="14" fill="var(--solid)"/>
  <rect x="${xL - 10}" y="${cy + H}" width="${xR - xL + 20}" height="14" fill="var(--solid)"/>
  <path d="${arc}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>
  <line x1="${px}" y1="${py}" x2="${f(tangentEnd[0])}" y2="${f(tangentEnd[1])}" stroke="var(--ink)" stroke-dasharray="3 3"/>
  <path d="M${f(a1[0])},${f(a1[1])} A${R},${R} 0 ${large} 0 ${f(a2[0])},${f(a2[1])}" fill="none" stroke="var(--gas)" stroke-width="2"/>
  <text x="${f(lab[0])}" y="${f(lab[1])}" font-size="15" font-style="italic" fill="var(--ink)" text-anchor="middle">θ</text>
  <text x="${xL + 12}" y="${cy + 5}" font-size="13" fill="#fff">liquid (electrolyte)</text>
  <text x="${xR - 12}" y="${cy + 5}" font-size="13" fill="var(--ink)" text-anchor="end">gas</text>
  <line x1="${xR + 2}" y1="${cy - H}" x2="${xR + 2}" y2="${cy + H}" stroke="var(--ink-3)"/>
  <text x="${xR + 6}" y="${cy - 2}" font-size="12" fill="var(--ink-2)">2r</text>
  <text x="${xL}" y="${cy - H - 20}" font-size="11" fill="var(--ink-2)">pore wall (solid)</text>
  <text x="${W / 2}" y="${Hh - 6}" font-size="11" fill="var(--ink-3)" text-anchor="middle">${thetaDeg < 90 ? 'θ < 90°: liquid wets the wall, meniscus concave, capillary pressure pulls liquid in' : thetaDeg > 90 ? 'θ > 90°: meniscus convex, capillary pressure pushes liquid out' : 'θ = 90°: flat meniscus, no capillary pressure'}</text>
</svg>`;
}

/** Sessile drop with the three interfacial tensions at the contact line (Young's equation). */
export function tensionVectors(thetaDeg = 50) {
  const W = 520, Hh = 230, Y0 = 170, a = 120, cx = 220;
  const th = (thetaDeg * Math.PI) / 180;
  const R = a / Math.sin(th);
  const cyC = Y0 + R * Math.cos(th); // circle centre (below surface for θ < 90°)
  const sweep = 1, large = thetaDeg > 90 ? 1 : 0;
  const drop = `M${cx - a},${Y0} A${f(R)},${f(R)} 0 ${large} ${sweep} ${cx + a},${Y0} Z`;
  const [aDefs, aUrl] = arrowDef('var(--ink)');
  const [lDefs, lUrl] = arrowDef('var(--liquid-ink)');
  const px = cx + a, py = Y0, L = 80;
  // tangent to the drop at the right contact point, pointing up and away from the solid
  const tx = px - L * Math.cos(th), ty = py - L * Math.sin(th);
  return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-labelledby="tv-${uid}"><title id="tv-${uid}">Liquid drop on a solid with the three interfacial tensions of Young's equation; contact angle ${thetaDeg}°</title>
  <defs>${aDefs}${lDefs}</defs>
  <rect x="20" y="${Y0}" width="${W - 40}" height="24" fill="var(--solid)"/>
  <path d="${drop}" fill="var(--liquid)" fill-opacity="0.85" stroke="var(--liquid-ink)"/>
  <line x1="${px}" y1="${py}" x2="${px + L}" y2="${py}" stroke="var(--ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="${px + L + 6}" y="${py - 6}" font-size="13" fill="var(--ink)">σ<tspan font-size="10" dy="3">sg</tspan></text>
  <line x1="${px}" y1="${py + 1}" x2="${px - L}" y2="${py + 1}" stroke="var(--ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="${px - L - 4}" y="${py + 16}" font-size="13" fill="#fff" text-anchor="end">σ<tspan font-size="10" dy="3">sl</tspan></text>
  <line x1="${px}" y1="${py}" x2="${f(tx)}" y2="${f(ty)}" stroke="var(--liquid-ink)" stroke-width="2" marker-end="${lUrl}"/>
  <text x="${f(tx) - 6}" y="${f(ty) - 6}" font-size="13" fill="var(--liquid-ink)" text-anchor="end">σ (liquid–gas)</text>
  <path d="M${px - 30},${py} A30,30 0 0 1 ${f(px - 30 * Math.cos(th))},${f(py - 30 * Math.sin(th))}" fill="none" stroke="var(--gas)" stroke-width="2"/>
  <text x="${f(px - 44 * Math.cos(th / 2))}" y="${f(py - 44 * Math.sin(th / 2)) + 4}" font-size="14" font-style="italic" text-anchor="middle" fill="var(--ink)">θ</text>
  <text x="30" y="${Y0 + 16}" font-size="11" fill="#fff">solid</text>
  <text x="30" y="30" font-size="11" fill="var(--ink-2)">gas</text>
  <text x="${W - 20}" y="${Hh - 10}" font-size="11" fill="var(--ink-3)" text-anchor="end">horizontal balance at the contact line: σ_sg = σ_sl + σ cos θ</text>
</svg>`;
}

/** Pressure balance on the liquid column in a pore. */
export function pressureBalance() {
  const [gDefs, gFill] = gasPattern();
  const [aDefs, aUrl] = arrowDef('var(--ink)');
  return `<svg viewBox="0 0 560 210" role="img" aria-labelledby="pb-${uid}"><title id="pb-${uid}">Pressure balance: liquid pressure and capillary pressure push the liquid column into the pore against the gas pressure; viscous friction resists motion</title>
  <defs>${gDefs}${aDefs}</defs>
  <rect x="40" y="60" width="480" height="14" fill="var(--solid)"/><rect x="40" y="146" width="480" height="14" fill="var(--solid)"/>
  <path d="M40,74 H330 Q300,110 330,146 H40 Z" fill="var(--liquid)" fill-opacity="0.85"/>
  <path d="M330,74 H520 V146 H330 Q300,110 330,74 Z" fill="${gFill}"/>
  <line x1="6" y1="110" x2="60" y2="110" stroke="var(--ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="6" y="100" font-size="13">p<tspan font-size="10" dy="3">L</tspan></text>
  <line x1="270" y1="110" x2="312" y2="110" stroke="var(--ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="234" y="100" font-size="13">p<tspan font-size="10" dy="3">c</tspan><tspan dy="-3"> = 2σcosθ/r</tspan></text>
  <line x1="420" y1="110" x2="350" y2="110" stroke="var(--ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="430" y="114" font-size="13">p<tspan font-size="10" dy="3">g</tspan></text>
  <path d="M80,92 h120" stroke="var(--surface)" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="82" y="134" font-size="12" fill="#fff">viscous drag ∝ μ L v / r²</text>
  <text x="280" y="40" font-size="13" text-anchor="middle">net drive  Δp = p_L + p_c − p_g</text>
  <text x="280" y="190" font-size="12" fill="var(--ink-3)" text-anchor="middle">liquid column of length L moves right while Δp &gt; 0</text>
</svg>`;
}

/** Parabolic velocity profile behind a moving meniscus. */
export function velocityProfile() {
  const [aDefs, aUrl] = arrowDef('var(--surface)');
  const arrows = [];
  for (let i = -5; i <= 5; i++) {
    const y = 110 + i * 9.2;
    const u = 1 - (i / 5.6) ** 2; // u/u_max = 1 − (y/r)²
    arrows.push(`<line x1="150" y1="${f(y)}" x2="${f(150 + 150 * u)}" y2="${f(y)}" stroke="var(--surface)" stroke-width="1.4" marker-end="${aUrl}"/>`);
  }
  const prof = Array.from({ length: 41 }, (_, k) => { const s = -1 + k / 20; return `${k ? 'L' : 'M'}${f(150 + 150 * (1 - s * s))},${f(110 + s * 51.5)}`; }).join('');
  return `<svg viewBox="0 0 560 220" role="img" aria-labelledby="vp-${uid}"><title id="vp-${uid}">Laminar parabolic velocity profile in the liquid behind the meniscus; zero velocity at the walls</title>
  <defs>${aDefs}</defs>
  <rect x="30" y="44" width="500" height="14" fill="var(--solid)"/><rect x="30" y="162" width="500" height="14" fill="var(--solid)"/>
  <path d="M30,58 H420 Q390,110 420,162 H30 Z" fill="var(--liquid)" fill-opacity="0.85"/>
  ${arrows.join('')}
  <path d="${prof}" fill="none" stroke="var(--surface)" stroke-width="1.5" stroke-dasharray="3 2"/>
  <text x="40" y="34" font-size="12" fill="var(--ink-2)">no slip: u = 0 at the wall</text>
  <text x="438" y="114" font-size="13">meniscus</text>
  <text x="280" y="204" font-size="12" text-anchor="middle" fill="var(--ink-3)">u(ρ) = u_max (1 − ρ²/r²),  mean velocity  v = dL/dt = r² Δp / (8 μ L)</text>
</svg>`;
}

/** Electrode stack cross-section: through-thickness vs in-plane wetting. */
export function electrodeCrossSection() {
  const parts = [];
  // deterministic pseudo-random particles
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const layer = (y0, y1, color, rmin, rmax) => {
    for (let x = 34; x < 520; x += rmax * 1.55) {
      for (let y = y0 + rmax; y < y1; y += rmax * 1.6) {
        parts.push(`<circle cx="${f(x + rnd() * 6)}" cy="${f(y + rnd() * 5)}" r="${f(rmin + rnd() * (rmax - rmin))}" fill="${color}"/>`);
      }
    }
  };
  layer(40, 104, 'var(--solid)', 7, 10);
  layer(126, 190, 'var(--solid-soft)', 6, 9);
  const [aDefs, aUrl] = arrowDef('var(--liquid-ink)');
  return `<svg viewBox="-50 0 690 250" role="img" aria-labelledby="ec-${uid}"><title id="ec-${uid}">Cross-section of an electrode stack: anode particles on copper foil, separator, cathode particles on aluminium foil, with electrolyte entering the pores from the edge</title>
  <defs>${aDefs}</defs>
  <rect x="30" y="30" width="500" height="170" fill="var(--liquid-soft)"/>
  <rect x="30" y="22" width="500" height="10" fill="var(--copper)"/>
  ${parts.join('')}
  <rect x="30" y="106" width="500" height="18" fill="var(--surface)" stroke="var(--rule)"/>
  <rect x="30" y="198" width="500" height="10" fill="var(--solid-soft)" stroke="var(--rule)"/>
  <text x="540" y="31" font-size="11" fill="var(--ink-2)">copper foil</text>
  <text x="540" y="75" font-size="11" fill="var(--ink-2)">anode (graphite)</text>
  <text x="540" y="119" font-size="11" fill="var(--ink-2)">separator</text>
  <text x="540" y="160" font-size="11" fill="var(--ink-2)">cathode</text>
  <text x="540" y="207" font-size="11" fill="var(--ink-2)">aluminium foil</text>
  <line x1="20" y1="40" x2="20" y2="102" stroke="var(--liquid-ink)" stroke-width="2" marker-start="${aUrl}" marker-end="${aUrl}"/>
  <text x="14" y="76" font-size="11" fill="var(--liquid-ink)" text-anchor="end">~70 µm</text>
  <line x1="40" y1="234" x2="520" y2="234" stroke="var(--liquid-ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="280" y="228" font-size="12" fill="var(--liquid-ink)" text-anchor="middle">in-plane wetting from the cell edge: centimetres</text>
</svg>`;
}

/**
 * Prismatic cell seen from above. `fronts` is a list of {d, label} with d the
 * wetted distance as a fraction of the half-width (0–1). Static version.
 */
export function prismaticCell(fronts = [{ d: 0.25, label: 't₁' }, { d: 0.5, label: '4 t₁' }, { d: 0.75, label: '9 t₁' }]) {
  const W = 420, H = 260, x = 40, y = 30, w = 340, h = 200;
  const half = Math.min(w, h) / 2;
  const rings = fronts.map((fr) => {
    const dd = fr.d * half;
    return `<rect x="${f(x + dd)}" y="${f(y + dd)}" width="${f(w - 2 * dd)}" height="${f(h - 2 * dd)}" fill="none" stroke="var(--liquid-ink)" stroke-dasharray="4 3"/><text x="${f(x + dd + 4)}" y="${f(y + dd + 13)}" font-size="11" fill="var(--liquid-ink)">${fr.label}</text>`;
  }).join('');
  const [aDefs, aUrl] = arrowDef('var(--liquid-ink)');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pc-${uid}"><title id="pc-${uid}">Top view of a prismatic cell: electrolyte wets the electrode stack from all four edges inward; dashed lines are wetting fronts at successive times</title>
  <defs>${aDefs}</defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.5"/>
  ${rings}
  <line x1="${x + w / 2}" y1="${y - 22}" x2="${x + w / 2}" y2="${y - 2}" stroke="var(--liquid-ink)" stroke-width="2" marker-end="${aUrl}"/>
  <line x1="${x + w / 2}" y1="${y + h + 22}" x2="${x + w / 2}" y2="${y + h + 2}" stroke="var(--liquid-ink)" stroke-width="2" marker-end="${aUrl}"/>
  <line x1="${x - 30}" y1="${y + h / 2}" x2="${x - 2}" y2="${y + h / 2}" stroke="var(--liquid-ink)" stroke-width="2" marker-end="${aUrl}"/>
  <line x1="${x + w + 30}" y1="${y + h / 2}" x2="${x + w + 2}" y2="${y + h / 2}" stroke="var(--liquid-ink)" stroke-width="2" marker-end="${aUrl}"/>
  <text x="${x + w / 2}" y="${y + h / 2 + 4}" font-size="12" text-anchor="middle" fill="var(--ink-2)">last region to wet</text>
</svg>`;
}

/** Dead-end pore with liquid occupying `frac` of its length and compressed gas beyond. */
export function deadEndPore(frac = 0.5, { label = '', pgText = '', width = 520 } = {}) {
  const [gDefs, gFill] = gasPattern();
  const x0 = 20, x1 = width - 30, y = 30, h = 46;
  const xf = x0 + (x1 - x0) * frac;
  return `<svg viewBox="0 0 ${width} 120" role="img" aria-labelledby="de-${uid}"><title id="de-${uid}">Dead-end pore ${Math.round(frac * 100)} percent filled with liquid; the rest holds compressed gas${pgText ? ` at ${pgText}` : ''}</title>
  <defs>${gDefs}</defs>
  <rect x="${f(xf)}" y="${y}" width="${f(x1 - xf)}" height="${h}" fill="${gFill}"/>
  <rect x="${x0}" y="${y}" width="${f(xf - x0)}" height="${h}" fill="var(--liquid)"/>
  <rect x="${x0}" y="${y - 10}" width="${x1 - x0 + 10}" height="10" fill="var(--solid)"/>
  <rect x="${x0}" y="${y + h}" width="${x1 - x0 + 10}" height="10" fill="var(--solid)"/>
  <rect x="${x1}" y="${y - 10}" width="10" height="${h + 20}" fill="var(--solid)"/>
  ${pgText ? `<text x="${f(Math.min(x1 - 6, (xf + x1) / 2))}" y="${y + h / 2 + 4}" font-size="12" text-anchor="middle" fill="var(--ink)">${pgText}</text>` : ''}
  <text x="${x0}" y="${y + h + 30}" font-size="12" fill="var(--ink-2)">${label}</text>
</svg>`;
}

/** Side-by-side comparison of an ambient and an evacuated dead-end pore at equilibrium. */
export function vacuumComparison(ambientFill, vacuumFill, vacuumKPa) {
  return `<div class="split">
    <div>${deadEndPore(ambientFill, { label: `filled at 101.3 kPa abs → ${(ambientFill * 100).toFixed(1)} % full`, pgText: 'p_g = p_L + p_c', width: 420 })}</div>
    <div>${deadEndPore(vacuumFill, { label: `evacuated to ${vacuumKPa} kPa abs first → ${(vacuumFill * 100).toFixed(1)} % full`, pgText: '', width: 420 })}</div>
  </div>`;
}
