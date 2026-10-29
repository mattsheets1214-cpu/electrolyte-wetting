/** Theory — nine connected lessons and a quiz. Content lives in src/content/. */
import { LESSONS } from '../content/lessons.js';
import { QUIZ } from '../content/quiz.js';
import { tex, texBlock, md } from '../ui/math.js';
import { cite } from '../ui/cite.js';
import { esc } from '../ui/dom.js';
import * as D from '../diagrams/index.js';
import { createPlot } from '../charts/plot.js';
import { solveModeA, solveModeB } from '../physics/index.js';
import { BASE } from '../physics/checks.js';

const rich = (s) => cite(md(s));

function figureHtml(l) {
  const f = l.figure;
  const tag = f.schematic ? '<span class="schematic-tag">schematic</span>' : '';
  if (f.interactive === 'drop' || f.interactive === 'pore') {
    const init = f.interactive === 'drop' ? 50 : 30;
    return `<figure class="figure" data-reveal data-fig="${f.interactive}">
      <div class="figure__well"><div data-role="svg">${f.interactive === 'drop' ? D.tensionVectors(init) : D.poreMeniscus(init)}</div>
      <label class="small" style="display:flex;gap:10px;align-items:center;margin-top:8px">Contact angle θ <input type="range" min="${f.interactive === 'drop' ? 10 : 0}" max="${f.interactive === 'drop' ? 160 : 150}" value="${init}" style="max-width:280px"><output>${init}°</output></label></div>
      <figcaption>${f.caption}</figcaption></figure>`;
  }
  if (f.interactive === 'sqrt') {
    return `<figure class="figure" data-reveal><div class="figure__well figure__well--plain"><div class="split" style="gap:16px"><div data-role="sqrt-a"></div><div data-role="sqrt-b"></div></div></div><figcaption>${cite(f.caption)}</figcaption></figure>`;
  }
  if (f.interactive === 'vacuum') {
    const amb = solveModeB({ ...BASE, pg0: 101.3e3 }).fillEq, vac = solveModeB({ ...BASE, pg0: 10e3 }).fillEq;
    return `<figure class="figure" data-reveal><div class="figure__well">${D.vacuumComparison(amb, vac, 10)}<ul class="key"><li><i class="k-liquid"></i>electrolyte</li><li><i class="k-gas"></i>compressed gas</li></ul></div><figcaption>${cite(f.caption)}</figcaption></figure>`;
  }
  return `<figure class="figure" data-reveal><div class="figure__well">${f.html()}</div><figcaption>${cite(f.caption)}${tag}</figcaption></figure>`;
}

function lessonHtml(l, i) {
  return `<article class="lesson" id="lesson-${l.id}" aria-labelledby="lh-${l.id}">
    <span class="lesson__num">Lesson ${i + 1}</span>
    <h2 id="lh-${l.id}">${esc(l.title)}</h2>
    <p class="objective"><b>Learning objective.</b> ${esc(l.objective)}</p>
    <div class="prose">${rich(l.explain)}</div>
    ${figureHtml(l)}
    <h3>Equations</h3>
    ${l.equations.map((e) => `${texBlock(e.tex, e.label)}<p class="small muted" style="margin-top:-6px">${esc(e.label)}</p>`).join('')}
    <dl class="symbols">${l.symbols.map(([s, m, u]) => `<dt>${tex(s)}</dt><dd>${esc(m)}</dd><dd class="unit">${esc(u)}</dd>`).join('')}</dl>
    ${l.derivation ? `<div class="derivation"><h3>Derivation</h3><ol class="prose" style="font-size:1.05rem">${l.derivation.map((d) => `<li>${md(d)}</li>`).join('')}</ol></div>` : ''}
    ${l.example ? `<h3>Worked numbers</h3><div class="prose" style="font-size:1.05rem">${rich(l.example())}</div>` : ''}
    <details class="check"><summary>Check yourself: ${md(esc(l.check.q))}</summary><p>${md(esc(l.check.a))}</p></details>
    <p class="next"><b>Next.</b> ${esc(l.next)}</p>
  </article>`;
}

export function render(root) {
  root.innerHTML = `
  <header class="page-head"><h1>Theory</h1>
    <p>From why a liquid wets a surface to why a whole cell takes an hour to fill. Each lesson adds one piece of physics that the lab uses, with its equation, symbols, derivation and a check of a common misconception.</p></header>
  <div class="theory">
    <nav class="toc" aria-label="Lessons"><ol>${LESSONS.map((l) => `<li><a href="#/theory/lesson-${l.id}" data-id="lesson-${l.id}">${esc(l.title)}</a></li>`).join('')}<li><a href="#/theory/quiz" data-id="quiz">Quiz</a></li></ol></nav>
    <div>
      ${LESSONS.map(lessonHtml).join('')}
      <section id="quiz" aria-labelledby="quiz-h"><h2 id="quiz-h">Quiz</h2>
        <p class="muted">Pick an answer to see whether it is right and why. Nothing is recorded.</p>
        ${QUIZ.map((q, i) => `<div class="quiz-q"><fieldset><legend>${i + 1}. ${md(esc(q.q))}</legend>
          ${q.options.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"> <span>${md(esc(o.text))}</span></label>`).join('')}
          </fieldset><div class="quiz-fb" hidden aria-live="polite"></div></div>`).join('')}
        <p data-role="score" class="muted"></p>
      </section>
    </div>
  </div>`;

  // interactive θ figures
  root.querySelectorAll('[data-fig]').forEach((fig) => {
    const input = fig.querySelector('input[type=range]');
    const outEl = fig.querySelector('output');
    const holder = fig.querySelector('[data-role=svg]');
    input.addEventListener('input', () => {
      const th = Number(input.value);
      outEl.textContent = `${th}°`;
      holder.innerHTML = fig.dataset.fig === 'drop' ? D.tensionVectors(th) : D.poreMeniscus(th);
    });
  });

  // √t plots from the solver
  const plots = [];
  const a = solveModeA({ ...BASE, X: 70e-6 });
  const N = 120, tEnd = a.tTarget;
  const ts = Array.from({ length: N + 1 }, (_, i) => (tEnd * i) / N);
  const pa = root.querySelector('[data-role=sqrt-a]');
  if (pa) {
    const p1 = createPlot(pa, { xLabel: 'time t (ms)', yLabel: 'L (µm)', height: 240 });
    p1.update({ series: [{ name: 'L(t)', x: ts.map((t) => t * 1e3), y: ts.map((t) => a.L(t) * 1e6), kind: 'line', color: 'var(--liquid)' }] });
    const p2 = createPlot(root.querySelector('[data-role=sqrt-b]'), { xLabel: '√t (√ms)', yLabel: 'L (µm)', height: 240 });
    p2.update({ series: [{ name: 'L against √t', x: ts.map((t) => Math.sqrt(t * 1e3)), y: ts.map((t) => a.L(t) * 1e6), kind: 'line', color: 'var(--ink)' }] });
    plots.push(p1, p2);
  }

  // quiz
  let answered = 0, correct = 0;
  root.querySelectorAll('.quiz-q').forEach((box, i) => {
    const fb = box.querySelector('.quiz-fb');
    let done = false;
    box.addEventListener('change', (e) => {
      const opt = QUIZ[i].options[Number(e.target.value)];
      fb.hidden = false;
      fb.dataset.ok = String(!!opt.correct);
      fb.innerHTML = `<b>${opt.correct ? 'Correct.' : 'Not quite.'}</b> ${md(esc(opt.why))}`;
      if (!done) { done = true; answered++; if (opt.correct) correct++; }
      root.querySelector('[data-role=score]').textContent = `First attempts: ${correct} of ${answered} correct (${QUIZ.length} questions).`;
    });
  });

  // highlight current lesson in the table of contents
  const links = [...root.querySelectorAll('.toc a')];
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) links.forEach((l) => l.classList.toggle('is-active', l.dataset.id === en.target.id));
  }, { rootMargin: '-30% 0px -60% 0px' });
  root.querySelectorAll('.lesson, #quiz').forEach((s) => io.observe(s));

  return () => { io.disconnect(); plots.forEach((p) => p.destroy()); };
}
