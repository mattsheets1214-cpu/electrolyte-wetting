/** Presentation and learning reflection. Data: src/content/presentation.js */
import { PRESENTATION as P } from '../content/presentation.js';
import { esc } from '../ui/dom.js';

const pending = (what, how) => `<div class="placeholder"><strong>Not yet provided:</strong> ${what}. ${how}</div>`;

export function render(root) {
  root.innerHTML = `
  <header class="page-head"><h1>Presentation and reflection</h1>
    <p>The recorded presentation, its verbatim transcript, the practice run and its critique, and what was learned.</p></header>

  <h2>Final presentation</h2>
  ${P.youtubeId
    ? `<div class="video-slot"><iframe src="https://www.youtube-nocookie.com/embed/${esc(P.youtubeId)}" title="${esc(P.title || 'Project presentation')}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p><a href="https://www.youtube.com/watch?v=${esc(P.youtubeId)}">Watch on YouTube</a>${P.recordedOn ? ` · recorded ${esc(P.recordedOn)}` : ''}</p>`
    : `<div class="video-slot"><div><strong style="color:var(--warn)">Video not yet recorded.</strong><br>Set <code>youtubeId</code> in <code>src/content/presentation.js</code>. Make the video public or unlisted, and check it plays while logged out.</div></div>`}

  <h2>Verbatim auto-generated transcript</h2>
  ${P.autoTranscript ? `<pre class="code" style="white-space:pre-wrap">${esc(P.autoTranscript)}</pre><p class="small muted">Pasted unedited from YouTube's auto-generated transcript.</p>`
    : pending('YouTube\'s auto-generated transcript', 'After uploading, wait for captions to process, open the transcript panel, copy it exactly — no cleanup — into <code>autoTranscript</code>.')}

  <h2>Practice presentation</h2>
  ${P.practiceTranscript ? `<pre class="code" style="white-space:pre-wrap">${esc(P.practiceTranscript)}</pre>` : pending('the practice-run transcript', 'Add it to <code>practiceTranscript</code> (and post it as a YouTube comment if the assignment requires).')}

  <h3>AI critique of the practice presentation</h3>
  ${P.practiceCritique ? `<p class="small muted">Critique by ${esc(P.practiceCritiqueModel || 'unspecified model')}.</p><pre class="code" style="white-space:pre-wrap">${esc(P.practiceCritique)}</pre>`
    : pending('the AI critique of the practice run', 'Include the site link and the assignment requirements in the critique prompt; record the model name.')}

  <h2>Lessons learned</h2>
  ${P.lessonsLearned.length ? `<ul class="prose">${P.lessonsLearned.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : pending('your lessons learned', 'At least three concrete technical items, in your own words.')}

  <h2>Future research questions</h2>
  ${P.futureQuestions.length ? `<ul class="prose">${P.futureQuestions.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : `${pending('your future questions', 'Write your own. Possible directions the model points to, if useful:')}
      <ul class="prose small" style="font-size:1rem"><li>How much does a dynamic (advancing) contact angle slow the earliest filling?</li><li>What does a two-pore or network model predict for gas escape, compared with the dead-end bound?</li><li>Can published imbibition curves (for example Davoodabadi et al. 2019) be digitized to test the √t law and the viscosity scaling quantitatively?</li><li>How does temperature, through viscosity and surface tension, change the filling time?</li></ul>`}`;
}
