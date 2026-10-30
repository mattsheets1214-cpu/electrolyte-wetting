/**
 * AI project documentation — the course's AI-workflow deliverables, kept
 * separate from the scientific paper. Data: src/content/aiDocs.js and
 * src/content/video.js. Empty slots are shown as "Not yet supplied".
 */
import { AI_DOCS, REPO_BLOB } from '../content/aiDocs.js';
import { VIDEO } from '../content/video.js';
import { DESIGN_INSPIRATION } from '../content/references.js';
import { esc } from '../ui/dom.js';

const pending = (what, where) => `<div class="placeholder"><strong>Not yet supplied:</strong> ${what}${where ? ` <span class="small">(add it in <code>${where}</code>)</span>` : ''}</div>`;
const fileLink = (file) => `<a href="${REPO_BLOB}${file}"><code>${esc(file)}</code></a>`;
const DECISION = { accepted: 'verified', rejected: 'pending', modified: 'assumption', pending: 'geometry' };

export function render(root) {
  const d = AI_DOCS;
  root.innerHTML = `
  <header class="page-head"><h1>AI project documentation</h1>
    <p>Documentation required by the course's AI-project assignment: models used, planning, prompts, critique, implementations, decisions, the author's contribution, and the video presentation. Only material that exists is shown; open items are marked.</p></header>

  <h2 id="models">1. AI models used</h2>
  <div class="table-wrap"><table><thead><tr><th>Role</th><th>Model</th><th>Provider</th><th>Version</th><th>Date</th></tr></thead><tbody>
    ${d.models.map((m) => `<tr><td>${esc(m.role)}</td><td>${esc(m.name)}</td><td>${esc(m.provider)}</td><td><code>${esc(m.version)}</code></td><td>${esc(m.date)}</td></tr>`).join('')}
  </tbody></table></div>
  ${d.models.some((m) => m.provider !== 'Anthropic') ? '' : pending('a second AI model (from a different provider or family) for the independent critique and the second implementation.', 'src/content/aiDocs.js → models')}

  <h2 id="planning">2. Initial project planning</h2>
  <div class="prose"><p>${esc(d.planning.summary)}</p><p>Blueprint: ${fileLink(d.planning.file)}.</p>
  <p>Sources named in the blueprint that were not verified and are not used:</p>
  <ul>${d.planning.unverifiedSources.map((u) => `<li>${esc(u.cite)} — ${esc(u.why)}</li>`).join('')}</ul></div>

  <h2 id="prompts">3. Prompts</h2>
  <div class="prose"><p>The prompts are recorded verbatim, including spelling as typed.</p>
  <ul>${d.prompts.map((p) => `<li>${esc(p.date)}: ${esc(p.title)} — ${fileLink(p.file)}</li>`).join('')}</ul></div>

  <h2 id="critique">4. AI critique</h2>
  ${d.critiques.map((c) => `<div class="note"><p><b>${esc(c.title)}</b> — ${esc(c.by)}, ${esc(c.date)}. ${c.independent ? '' : '<span class="badge badge--pending">not independent</span>'}</p><p>${esc(c.summary)}</p><p class="small muted">${esc(c.note)}</p></div>`).join('')}
  ${d.independentCritique ? `<div class="prose"><p>${esc(d.independentCritique)}</p></div>` : pending('a critique of the project by a different AI model.', 'src/content/aiDocs.js → independentCritique')}

  <h2 id="implementations">5. Implementation by two AI models and comparison</h2>
  <div class="prose"><p><b>Model A:</b> ${esc(d.implementations.modelA.name)} — ${esc(d.implementations.modelA.what)}</p></div>
  ${d.implementations.modelB ? `<div class="prose"><p><b>Model B:</b> ${esc(d.implementations.modelB.name)} — ${esc(d.implementations.modelB.what)}${d.implementations.modelB.link ? ` <a href="${d.implementations.modelB.link}">link</a>` : ''}</p></div>` : pending('a second implementation, built by a different model from the same frozen specification.', 'src/content/aiDocs.js → implementations.modelB')}
  ${d.implementations.sharedTestResults.length ? `<div class="table-wrap"><table><thead><tr><th>Shared test</th><th>Model A</th><th>Model B</th><th>Notes</th></tr></thead><tbody>${d.implementations.sharedTestResults.map((r) => `<tr><td>${esc(r.test)}</td><td>${esc(r.modelA)}</td><td>${esc(r.modelB)}</td><td>${esc(r.notes || '')}</td></tr>`).join('')}</tbody></table></div>` : pending('results of the same shared test suite run on both implementations.', 'src/content/aiDocs.js → implementations.sharedTestResults')}
  ${d.implementations.comparison ? `<div class="prose"><p>${esc(d.implementations.comparison)}</p></div>` : pending('your comparison of the two models\' performance, in your own words.', 'src/content/aiDocs.js → implementations.comparison')}

  <h2 id="decisions">6. Accepted and rejected suggestions</h2>
  <div class="table-wrap"><table><thead><tr><th>Date</th><th>Suggestion</th><th>Proposed by</th><th>Decision</th><th>Reasoning</th></tr></thead><tbody>
    ${d.decisions.map((r) => `<tr><td>${esc(r.date)}</td><td>${esc(r.suggestion)}</td><td>${esc(r.source)}</td><td><span class="badge badge--${DECISION[r.decision]}">${esc(r.decision)}</span></td><td>${esc(r.reasoning)}</td></tr>`).join('')}
  </tbody></table></div>
  <details class="check"><summary>Implementation decisions made by the AI while building version 1 (29 Oct 2026)</summary>
    <ul class="prose" style="font-size:1rem">${d.buildDecisions.map((b) => `<li><b>${esc(b.decision)}</b> ${esc(b.why)}</li>`).join('')}</ul></details>

  <h2 id="contribution">7. Personal contribution and reflection</h2>
  <div class="prose"><p>${esc(d.contribution.facts)}</p></div>
  ${d.contribution.reflection ? `<div class="prose"><p>${esc(d.contribution.reflection)}</p></div>` : pending('your reflection, in your own words: what you learned, what you would do differently, and where the AI helped or misled.', 'src/content/aiDocs.js → contribution.reflection')}
  ${d.contribution.ownWork.length ? `<ul class="prose">${d.contribution.ownWork.map((w) => `<li>${fileLink(w.file)} — ${esc(w.title)}</li>`).join('')}</ul>` : pending('your own hand derivations or notes (for example scans of the paper\'s equations derived by hand).', 'src/content/aiDocs.js → contribution.ownWork')}

  <h2 id="video">8. Video presentation</h2>
  ${VIDEO.youtubeId
    ? `<div class="video-slot"><iframe src="https://www.youtube-nocookie.com/embed/${VIDEO.youtubeId}" title="${esc(VIDEO.title || 'Project presentation')}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p><a href="https://www.youtube.com/watch?v=${VIDEO.youtubeId}">Open on YouTube</a>${VIDEO.recordedOn ? ` · recorded ${esc(VIDEO.recordedOn)}` : ''}</p>`
    : pending('the YouTube link of the video presentation.', 'src/content/video.js → youtubeId')}
  <h3 id="transcript">Auto-generated YouTube transcript (verbatim)</h3>
  ${VIDEO.autoTranscript ? `<pre class="console transcript">${esc(VIDEO.autoTranscript)}</pre>` : pending('YouTube\'s auto-generated transcript, pasted exactly as shown.', 'src/content/video.js → autoTranscript')}

  <h2 id="attribution">9. Design references</h2>
  <ul class="refs">${DESIGN_INSPIRATION.map((x) => `<li>${x.url ? `<a href="${x.url}">${esc(x.name)}</a>` : esc(x.name)} — ${esc(x.note)}</li>`).join('')}</ul>`;
}
