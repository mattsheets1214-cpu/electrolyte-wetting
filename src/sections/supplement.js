/**
 * Supplementary material — advanced derivations, porous-media modelling,
 * additional limitations (S1–S3, text in src/content/supplement.js) and
 * numerical methods and verification (S4, src/sections/verification.js).
 */
import { SUPP_SECTIONS } from '../content/supplement.js';
import { SUPPLEMENT_REFS } from '../content/citations.js';
import { byId } from '../content/references.js';
import { META } from '../content/paper.js';
import { renderMarkup } from '../ui/markup.js';
import { esc } from '../ui/dom.js';
import { refEntry } from './paper.js';
import { render as renderVerification } from './verification.js';

export function render(root) {
  root.innerHTML = `
  <article class="paper">
    <header class="paper-head">
      <p class="paper-kind">Supplementary material</p>
      <h1>Supplementary material</h1>
      <p class="paper-note">to: ${esc(META.title)} (<a href="#/paper">paper</a>). Equations of the main paper are cited as Eq. (n); supplementary equations as Eq. (Sn). Reference numbers are shared with the paper.</p>
      <nav class="small" aria-label="Supplementary sections">${SUPP_SECTIONS.map((s) => `<a href="#/supplement/${s.id}">${s.num} ${esc(s.title)}</a>`).join(' · ')} · <a href="#/supplement/s4">S4 Numerical methods and verification</a></nav>
    </header>
    ${SUPP_SECTIONS.map((s) => `
    <section class="paper-section" id="${s.id}" aria-labelledby="${s.id}-h">
      <h2 id="${s.id}-h"><span class="sec-num">${s.num}</span> ${esc(s.title)}</h2>
      <div class="prose paper-prose">${renderMarkup(s.body())}</div>
    </section>`).join('')}
    <section class="paper-section" data-role="s4"></section>
    ${SUPPLEMENT_REFS.length ? `<section class="paper-section" id="supplement-references"><h2>References cited only in the supplementary material</h2>
      <ol class="refs refs--numbered">${SUPPLEMENT_REFS.map((id) => refEntry(byId[id])).join('')}</ol></section>` : ''}
  </article>`;
  return renderVerification(root.querySelector('[data-role=s4]'));
}
