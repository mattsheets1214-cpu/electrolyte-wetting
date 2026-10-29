/** AI lab — evidence for the two-model AI workflow. Data: src/content/aiLab.js */
import { AI_LAB, BUILD_DECISIONS } from '../content/aiLab.js';
import { esc } from '../ui/dom.js';

const pending = (what, how) => `<div class="placeholder"><strong>Not yet collected:</strong> ${what}. ${how}</div>`;
const fileLink = (f) => (f ? `<a href="./${f}">${esc(f.split('/').pop())}</a>` : '—');

export function render(root) {
  const L = AI_LAB;
  const steps = [
    ['Model A blueprint', !!L.modelA],
    ['Model B critique', !!L.modelBCritique],
    ['Decision table', L.decisions.length > 0],
    ['Frozen spec and identical prompts', L.implementationPrompts.length > 0],
    ['Shared tests run on both implementations', L.testResults.length > 0],
    ['Bugs found and fixed', L.bugs.length > 0],
    ['My own reasoning', !!L.myDecisions],
  ];
  root.innerHTML = `
  <header class="page-head"><h1>AI lab</h1>
    <p>How AI was used to plan, critique and build this project, treated like a lab experiment: same specification, same tests, every decision recorded. Items marked "not yet collected" are placeholders, not evidence.</p></header>

  <h2>Workflow status</h2>
  <div class="table-wrap"><table><thead><tr><th>Step</th><th>Status</th></tr></thead><tbody>
    ${steps.map(([s, done], i) => `<tr><td>${i + 1}. ${s}</td><td>${done ? '<span class="badge badge--verified">recorded</span>' : '<span class="badge badge--pending">not yet collected</span>'}</td></tr>`).join('')}
  </tbody></table></div>

  <h2>Models, versions and dates</h2>
  <div class="table-wrap"><table><thead><tr><th>Role</th><th>Model</th><th>Version</th><th>Date</th><th>Evidence</th></tr></thead><tbody>
    ${L.models.map((m) => `<tr><td>${esc(m.role)}</td><td>${m.name ? `${esc(m.name)} (${esc(m.provider)})` : '<span class="badge badge--pending">not yet collected</span>'}</td><td>${m.version ? `<code>${esc(m.version)}</code>` : '—'}</td><td>${m.date || '—'}</td><td>${fileLink(m.evidence)}</td></tr>`).join('')}
  </tbody></table></div>

  <h2>Model A: the engineering blueprint</h2>
  <div class="prose"><p>${esc(L.modelA.summary)}</p><p><a class="btn" href="./${L.modelA.file}">Open the Model A blueprint (PDF)</a></p></div>

  <h2>Model B: independent critique</h2>
  ${L.modelBCritique ? `<div class="prose">${L.modelBCritique}</div>` : pending('the critique of the blueprint by a second model from a different company', 'Give it the blueprint plus the assignment requirements, ask for errors, missing items and over-complications, and save the full exchange. Add it to <code>modelBCritique</code> in <code>src/content/aiLab.js</code>.')}

  <h2>Decision table</h2>
  ${L.decisions.length ? `<div class="table-wrap"><table><thead><tr><th>Issue</th><th>Model A</th><th>Model B</th><th>Independent evidence</th><th>My decision</th><th>Reason</th><th>Test outcome</th></tr></thead><tbody>
    ${L.decisions.map((d) => `<tr><td>${esc(d.issue)}</td><td>${esc(d.modelA)}</td><td>${esc(d.modelB)}</td><td>${esc(d.evidence)}</td><td><b>${esc(d.decision)}</b></td><td>${esc(d.reason)}</td><td>${esc(d.test)}</td></tr>`).join('')}</tbody></table></div>`
    : pending('accept / reject / modify decisions for each Model B suggestion', 'One row per suggestion in <code>decisions</code>, each with your reason and, where possible, a test outcome.')}

  <h2>Exact prompts for the two comparable implementations</h2>
  ${L.implementationPrompts.length ? L.implementationPrompts.map((p) => `<h3>${esc(p.model)} — ${esc(p.date)}</h3><pre class="code"><code>${esc(p.prompt)}</code></pre>`).join('')
    : pending('the identical prompt given to each model to implement the frozen spec', 'Paste it verbatim into <code>implementationPrompts</code> with the model and date.')}
  <p class="small muted">For reference, the prompt used to build this website (v1) is saved verbatim: <a href="./evidence/site-build-prompt-2026-10-29.md">site-build-prompt-2026-10-29.md</a>. It is not one of the two comparable implementation prompts.</p>

  <h2>Shared test cases and results</h2>
  <div class="prose"><p>The shared suite already exists and is model-independent: the closed-form cases in <code>tests/fixtures/reference_cases.json</code> and the checks on the <a href="#/verification">Code &amp; verification</a> page. Run it against each model's implementation and record the outcome here.</p></div>
  ${L.testResults.length ? `<div class="table-wrap"><table><thead><tr><th>Test</th><th>Model A implementation</th><th>Model B implementation</th><th>Notes</th></tr></thead><tbody>${L.testResults.map((r) => `<tr><td>${esc(r.test)}</td><td>${esc(r.modelA)}</td><td>${esc(r.modelB)}</td><td>${esc(r.notes || '')}</td></tr>`).join('')}</tbody></table></div>`
    : pending('results of the shared suite on both implementations', 'Add rows to <code>testResults</code>.')}

  <h2>Bugs found and corrections made</h2>
  ${L.bugs.length ? `<div class="table-wrap"><table><thead><tr><th>Found</th><th>Where</th><th>Symptom</th><th>Cause</th><th>Fix</th><th>What I learned</th></tr></thead><tbody>${L.bugs.map((b) => `<tr><td>${esc(b.found)}</td><td>${esc(b.where)}</td><td>${esc(b.symptom)}</td><td>${esc(b.cause)}</td><td>${esc(b.fix)}</td><td>${esc(b.learned)}</td></tr>`).join('')}</tbody></table></div>`
    : pending('your log of bugs found and fixed by hand', 'Add entries to <code>bugs</code>.')}

  <h2>My engineering decisions</h2>
  ${L.myDecisions ? `<div class="prose">${L.myDecisions}</div>` : pending('your own explanation of the decisions you made and why', 'Write this yourself in <code>myDecisions</code> — it is what the reflection rubric looks for.')}

  <h2>Implementation choices made while building v1 of this site</h2>
  <p class="muted">Recorded for your review. Accept, change or overrule them; they are not part of the Model A / Model B comparison.</p>
  <div class="table-wrap"><table><thead><tr><th>Choice</th><th>Reason</th></tr></thead><tbody>
    ${BUILD_DECISIONS.map((d) => `<tr><td>${esc(d.decision)}</td><td>${esc(d.why)}</td></tr>`).join('')}
  </tbody></table></div>`;
}
