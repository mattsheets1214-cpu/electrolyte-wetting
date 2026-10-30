/**
 * Paper — the main page: a concise engineering paper in journal style.
 * Text lives in src/content/paper.js; markup is rendered by src/ui/markup.js.
 * Figures 6–9 are computed live by the same solver as the interactive demonstration.
 */
import { META, ABSTRACT, NOMENCLATURE, SECTIONS, BACK_MATTER } from '../content/paper.js';
import { SOFTWARE, byId } from '../content/references.js';
import { PAPER_REFS, CITE_NUMBER } from '../content/citations.js';
import { VIDEO } from '../content/video.js';
import { renderMarkup, eqLabel } from '../ui/markup.js';
import { tex, md } from '../ui/math.js';
import { esc } from '../ui/dom.js';
import { createPlot } from '../charts/plot.js';
import {
  solveModeA, capillaryPressure, timeSweep, vacuumSweep, sig, formatTime,
} from '../physics/index.js';
import { BASE } from '../physics/checks.js';

const sectionHtml = (s, level = 2) => `
  <section class="paper-section" id="${s.id}" aria-labelledby="${s.id}-h">
    <h${level} id="${s.id}-h"><span class="sec-num">${s.num}</span> ${esc(s.title)}</h${level}>
    <div class="prose paper-prose">${renderMarkup(s.body())}</div>
    ${(s.subsections || []).map((sub) => sectionHtml(sub, level + 1)).join('')}
  </section>`;

export function refEntry(r) {
  const link = r.doi ? `<a href="${r.url}">https://doi.org/${esc(r.doi)}</a>` : `<a href="${r.url}">${esc(r.url.replace(/^https:\/\//, ''))}</a>`;
  return `<li id="ref-${r.id}" value="${CITE_NUMBER[r.id]}">${esc(r.cite)} ${link}</li>`;
}

export function render(root) {
  root.innerHTML = `
  <article class="paper">
    <header class="paper-head">
      <p class="paper-kind">Research paper</p>
      <h1>${esc(META.title)}</h1>
      <p class="paper-author">${esc(META.author)}</p>
      <p class="paper-affil">${esc(META.affiliation)}</p>
      <p class="paper-note">${esc(META.note)}</p>
      <p class="paper-links small">Supplements: <a href="#/lab">Interactive demonstration</a> · <a href="#/supplement">Supplementary material</a> · <a href="#/ai-documentation">AI project documentation</a> · Video presentation: ${VIDEO.youtubeId ? `<a href="https://www.youtube.com/watch?v=${VIDEO.youtubeId}">${esc(VIDEO.title || 'YouTube')}</a>` : '<span class="muted">to be added</span>'}</p>
    </header>

    <section class="abstract" aria-labelledby="abstract-h">
      <h2 id="abstract-h">Abstract</h2>
      <p>${renderMarkup(ABSTRACT())}</p>
      <p class="keywords"><b>Keywords:</b> ${META.keywords.map(esc).join('; ')}</p>
    </section>

    <section class="paper-section" id="nomenclature" aria-labelledby="nomenclature-h">
      <h2 id="nomenclature-h">Nomenclature</h2>
      <div class="table-wrap"><table class="nomenclature"><thead><tr><th>Symbol</th><th>Definition</th><th>SI unit</th></tr></thead><tbody>
        ${NOMENCLATURE.map(([s, d, u]) => `<tr><td>${tex(s)}</td><td>${md(d)}</td><td>${esc(u)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>

    ${SECTIONS.map((s) => sectionHtml(s)).join('')}

    <section class="paper-section back-matter" id="declarations" aria-labelledby="declarations-h">
      <h2 id="declarations-h">Declaration of generative AI use</h2>
      <div class="prose paper-prose"><p>${BACK_MATTER.aiDeclaration.replace('AI project documentation page', '<a href="#/ai-documentation">AI project documentation</a> page')}</p></div>
      <h2 id="availability">Data and code availability</h2>
      <div class="prose paper-prose"><p>${BACK_MATTER.dataAvailability}</p>
        <p>Software: ${SOFTWARE.map((s) => `<a href="${s.url}">${esc(s.name)}</a> (${esc(s.role)})`).join('; ')}.</p></div>
    </section>

    <section class="paper-section" id="references" aria-labelledby="references-h">
      <h2 id="references-h">References</h2>
      <ol class="refs refs--numbered">${PAPER_REFS.map((id) => refEntry(byId[id])).join('')}</ol>
      <p class="small muted">Further sources cited only in the <a href="#/supplement">supplementary material</a> are listed there.</p>
    </section>
  </article>`;

  const plots = [];
  const chart = (id, cfg, data) => {
    const host = root.querySelector(`[data-chart="${id}"]`);
    if (!host) return;
    const p = createPlot(host, cfg);
    p.update(data);
    plots.push(p);
  };

  // Fig. 6 — X(t) at three contact angles
  const tMax = 30 * 60;
  const ts = Array.from({ length: 241 }, (_, i) => (tMax * i) / 240);
  const thetas = [[15.2, 'line', 'var(--liquid)'], [30, 'dashed', 'var(--ink)'], [46.2, 'line', 'var(--gas)']];
  chart('xt', { xLabel: 'time t (min)', yLabel: 'penetration distance X (cm)', height: 300, tipX: (v) => `${sig(v, 3)} min`, tipY: (v) => `${sig(v, 3)} cm` }, {
    series: thetas.map(([th, kind, color]) => {
      const a = solveModeA({ ...BASE, thetaDeg: th });
      return { id: `t${th}`, name: `θ = ${th}°`, x: ts.map((t) => t / 60), y: ts.map((t) => a.X(t) * 100), kind, color };
    }),
    description: 'Penetration distance rises as the square root of time for all three contact angles; smaller angles penetrate farther.',
  });

  // Fig. 7 — p_c(θ) at three radii
  const th = Array.from({ length: 121 }, (_, i) => i);
  chart('pctheta', { xLabel: 'contact angle θ (°)', yLabel: 'capillary pressure p_c (kPa)', height: 300, yZero: false, tipX: (v) => `${sig(v, 3)}°`, tipY: (v) => `${sig(v, 3)} kPa` }, {
    series: [[0.25e-6, 'line', 'var(--liquid)'], [0.5e-6, 'dashed', 'var(--ink)'], [1e-6, 'line', 'var(--gas)']].map(([r, kind, color]) => ({
      id: `r${r}`, name: `r = ${r * 1e6} µm`, x: th, y: th.map((t) => capillaryPressure(BASE.sigma, t, r) / 1e3), kind, color,
    })),
    hlines: [{ value: 0, label: 'p_c = 0' }],
    vlines: [{ value: 90, label: 'θ = 90°' }],
    description: 'Capillary pressure falls with contact angle, crosses zero at 90 degrees and is larger in smaller pores.',
  });

  // Fig. 8 — t(1 cm) vs r
  const sw = timeSweep(BASE, 'r');
  chart('tr', { xLabel: 'pore radius r (µm)', yLabel: 'time to penetrate 1 cm (s)', xScale: 'log', yScale: 'log', height: 300, tipX: (v) => `${sig(v, 3)} µm`, tipY: (v) => formatTime(v).text }, {
    series: sw.series.map((s, i) => ({ ...s, x: s.x.map((v) => v * 1e6), kind: i === 0 ? 'line' : 'dashed', color: i === 0 ? 'var(--liquid)' : 'var(--ink)', name: `${i === 0 ? `Capillary drive, ${eqLabel('time')}` : `Fixed driving pressure, ${eqLabel('lwGeneral')}`} — slope ${sig(s.slope, 3)}` })),
    description: 'Filling time falls with pore radius: slope minus one under capillary drive, minus two at fixed driving pressure.',
  });

  // Fig. 9 — equilibrium fill vs p_g0
  const v = vacuumSweep(BASE);
  chart('fill', { xLabel: 'initial gas pressure p_g0 (kPa, absolute)', yLabel: 'equilibrium fill L_eq/L_p (%)', xScale: 'log', height: 300, xFormat: (x) => String(Number(x.toPrecision(3))), tipX: (x) => `${sig(x, 3)} kPa`, tipY: (y) => `${sig(y, 4)} %` }, {
    series: [
      { id: 'exact', name: `Analytical equilibrium, ${eqLabel('eqFill')}`, x: v.exact.x.map((x) => x / 1e3), y: v.exact.y.map((y) => y * 100), kind: 'line', color: 'var(--liquid)' },
      { id: 'num', name: `Numerical solution of ${eqLabel('deadFront')}`, x: v.numerical.map((n) => n.pg0 / 1e3), y: v.numerical.map((n) => n.fill * 100), kind: 'points', marker: 'square', color: 'var(--ink)' },
    ],
    yDomain: [0, 100], xDomain: [0.1, 101.3],
    description: 'Equilibrium fill fraction decreases as the initial gas pressure increases.',
  });

  return () => plots.forEach((p) => p.destroy());
}
