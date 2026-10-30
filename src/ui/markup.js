/**
 * markup.js — renders the paper/supplement markup ({{eq:…}}, {{fig:…}}, $math$,
 * [refId] …) into HTML. Charts are emitted as empty containers
 * (data-chart="id") and drawn by the page after insertion.
 */
import { EQUATIONS, FIGURES, TABLES } from '../content/paper.js';
import { SUPP_EQUATIONS } from '../content/supplement.js';
import { texBlock, md } from './math.js';
import { cite } from './cite.js';

const EQ_NO = Object.fromEntries(EQUATIONS.map((e, i) => [e.id, String(i + 1)]));
const SEQ_NO = Object.fromEntries(SUPP_EQUATIONS.map((e, i) => [e.id, `S${i + 1}`]));
const FIG_NO = Object.fromEntries(FIGURES.map((f, i) => [f.id, i + 1]));
const TAB_NO = Object.fromEntries(TABLES.map((t, i) => [t.id, i + 1]));

export const eqNumber = (id) => EQ_NO[id];
export const eqLabel = (id) => `Eq. (${EQ_NO[id]})`;

function missing(kind, id) { throw new Error(`Unknown ${kind} "${id}" in paper markup`); }

/** Replace structural tokens (recursively, captions included). Does not render math or citations. */
export function tokens(src) {
  return src.replace(/\{\{(eq|eqref|eqS|eqSref|fig|figref|tab|tabref):(\w+)\}\}/g, (_, kind, id) => {
    switch (kind) {
      case 'eq': {
        const e = EQUATIONS.find((q) => q.id === id) || missing('equation', id);
        return `<div id="eq-${id}" class="eq-numbered">${texBlock(`${e.tex} \\tag{${EQ_NO[id]}}`, `Equation ${EQ_NO[id]}`)}</div>`;
      }
      case 'eqS': {
        const e = SUPP_EQUATIONS.find((q) => q.id === id) || missing('supplementary equation', id);
        return `<div id="eq-${id}" class="eq-numbered">${texBlock(`${e.tex} \\tag{${SEQ_NO[id]}}`, `Equation ${SEQ_NO[id]}`)}</div>`;
      }
      case 'eqref': return EQ_NO[id] ? `Eq.&nbsp;(<a href="#/paper/eq-${id}">${EQ_NO[id]}</a>)` : missing('equation', id);
      case 'eqSref': return SEQ_NO[id] ? `Eq.&nbsp;(${SEQ_NO[id]})` : missing('supplementary equation', id);
      case 'figref': return FIG_NO[id] ? `Fig.&nbsp;<a href="#/paper/fig-${id}">${FIG_NO[id]}</a>` : missing('figure', id);
      case 'tabref': return TAB_NO[id] ? `Table&nbsp;<a href="#/paper/tab-${id}">${TAB_NO[id]}</a>` : missing('table', id);
      case 'fig': {
        const f = FIGURES.find((q) => q.id === id) || missing('figure', id);
        const body = f.kind === 'chart' ? `<div class="figure__well figure__well--plain"><div data-chart="${id}"></div></div>` : `<div class="figure__well">${f.html()}</div>`;
        return `<figure class="figure paper-fig" id="fig-${id}" data-reveal>${body}<figcaption><b>Fig. ${FIG_NO[id]}.</b> ${tokens(f.caption)}${f.schematic ? ' <span class="schematic-tag">schematic</span>' : ''}</figcaption></figure>`;
      }
      case 'tab': {
        const t = TABLES.find((q) => q.id === id) || missing('table', id);
        return `<div class="paper-table" id="tab-${id}"><p class="table-caption"><b>Table ${TAB_NO[id]}.</b> ${tokens(t.caption)}</p><div class="table-wrap">${tokens(t.html())}</div></div>`;
      }
      default: return missing('token', kind);
    }
  });
}

/** Full rendering: tokens → inline math → numbered citations. */
export const renderMarkup = (src) => cite(md(tokens(src)));
