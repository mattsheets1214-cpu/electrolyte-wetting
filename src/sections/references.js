/** References & credits. Data: src/content/references.js */
import { REFERENCES, SOFTWARE, DESIGN_INSPIRATION, UNVERIFIED, AI_MODELS } from '../content/references.js';
import { PARAMETERS } from '../data/parameters.js';
import { esc } from '../ui/dom.js';

const STATUS = { checked: ['verified', 'details and claim checked'], bibliographic: ['geometry', 'citation confirmed; full text not re-read'] };

export function render(root) {
  const groups = [...new Set(REFERENCES.map((r) => r.group))];
  root.innerHTML = `
  <header class="page-head"><h1>References and credits</h1>
    <p>Every number on this site either traces to a source below or is labelled as an assumption. Each entry says what it is used to support.</p></header>

  ${groups.map((g) => `<h2>${esc(g)}</h2><ol class="refs">${REFERENCES.filter((r) => r.group === g).map((r) => `
    <li id="ref-${r.id}">${esc(r.cite)} ${r.doi ? `<a href="${r.url}">doi:${esc(r.doi)}</a>` : `<a href="${r.url}">link</a>`}
      <span class="badge badge--${STATUS[r.status][0]}" title="${STATUS[r.status][1]}">${STATUS[r.status][1]}</span>
      <span class="supports"><b>Used for:</b> ${esc(r.supports)}</span></li>`).join('')}</ol>`).join('')}

  <h2>Where each input value comes from</h2>
  <div class="table-wrap"><table><thead><tr><th>Input</th><th class="num">Default</th><th>Basis</th><th>Note</th></tr></thead><tbody>
    ${Object.values(PARAMETERS).map((p) => `<tr><td>${esc(p.label)} (${p.symbol})</td><td class="num">${p.default} ${esc(p.unit)}</td><td><span class="badge badge--${p.basis}">${p.basis}</span></td><td>${esc(p.note)}</td></tr>`).join('')}
  </tbody></table></div>

  <h2>Blueprint sources not used</h2>
  <ul class="prose" style="font-size:1rem">${UNVERIFIED.map((u) => `<li>${esc(u.cite)} — ${esc(u.why)}</li>`).join('')}</ul>

  <h2>Software</h2>
  <ul class="refs">${SOFTWARE.map((s) => `<li><a href="${s.url}">${esc(s.name)}</a> — ${esc(s.role)}</li>`).join('')}</ul>

  <h2>AI models</h2>
  <ul class="refs">${AI_MODELS.map((m) => `<li>${esc(m.role)}: ${esc(m.name)} (${esc(m.provider)}, <code>${esc(m.version)}</code>), ${esc(m.date)}</li>`).join('')}</ul>

  <h2>Design inspiration</h2>
  <ul class="refs">${DESIGN_INSPIRATION.map((d) => `<li>${d.url ? `<a href="${d.url}">${esc(d.name)}</a>` : esc(d.name)} — ${esc(d.note)}</li>`).join('')}</ul>

  <h2>Contribution statement</h2>
  <div class="prose">
    <p>This is an individual project by Matthew Sheets (University of Cincinnati, introductory fluid mechanics, 2026). He chose and reframed the topic, directed the AI tools, set the requirements, and is responsible for reviewing and approving every change before publication.</p>
    <p>AI assistance: the engineering blueprint and the first version of this website's code, tests and text were produced by Claude Opus 5.5 (Anthropic) on 22 and 29 October 2026 under his direction.</p>
    <div class="placeholder"><strong>To complete:</strong> replace or extend this statement in your own words once your hand derivations and video are done (edit <code>src/sections/references.js</code>).</div>
  </div>`;
}
