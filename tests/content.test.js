// Content integrity for the journal-style paper: structure, numbering, citations,
// writing-style guards, and AI-documentation placeholders that cannot silently
// be filled with invented material.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { REFERENCES, byId } from '../src/content/references.js';
import { VIDEO } from '../src/content/video.js';
import { AI_DOCS } from '../src/content/aiDocs.js';
import {
  META, ABSTRACT, NOMENCLATURE, SECTIONS, EQUATIONS, FIGURES, TABLES, paperText,
} from '../src/content/paper.js';
import { SUPP_SECTIONS, SUPP_EQUATIONS, supplementText } from '../src/content/supplement.js';
import { PAPER_REFS, SUPPLEMENT_REFS, CITE_NUMBER } from '../src/content/citations.js';
import { tokens, renderMarkup } from '../src/ui/markup.js';

const flat = (secs) => secs.flatMap((s) => [s, ...flat(s.subsections || [])]);
const ALL = flat(SECTIONS);
const bodies = ALL.map((s) => s.body()).join('\n');
// Prose only (no captions or tables): what the author writes in the paper's own voice.
const prose = [ABSTRACT(), bodies].join('\n');

describe('paper structure', () => {
  it('has the journal sections in order', () => {
    expect(SECTIONS.map((s) => `${s.num} ${s.title}`)).toEqual([
      '1 Introduction', '2 Governing theory', '3 Methodology', '4 Results', '5 Discussion', '6 Conclusions',
    ]);
  });
  it('Governing theory has subsections 2.1–2.6 on the required topics', () => {
    const t = SECTIONS.find((s) => s.id === 'theory').subsections.map((s) => s.num + ' ' + s.title);
    expect(t).toEqual([
      '2.1 Interfacial tension and contact angle', '2.2 Capillary pressure', '2.3 Viscous resistance',
      '2.4 Lucas–Washburn equation', '2.5 Electrode geometry and tortuosity', '2.6 Trapped gas and vacuum-assisted filling',
    ]);
  });
  it('has a title, author, abstract of reasonable length and keywords', () => {
    expect(META.title.length).toBeGreaterThan(30);
    expect(META.author).toBe('Matthew Sheets');
    const words = ABSTRACT().split(/\s+/).length;
    expect(words).toBeGreaterThan(120);
    expect(words).toBeLessThan(300);
    expect(META.keywords.length).toBeGreaterThanOrEqual(4);
  });
  it('conclusions are four or five numbered findings', () => {
    const n = (SECTIONS.find((s) => s.id === 'conclusions').body().match(/<li>/g) || []).length;
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(5);
  });
  it('every nomenclature entry has a symbol, definition and SI unit', () => {
    for (const row of NOMENCLATURE) { expect(row).toHaveLength(3); for (const c of row) expect(c.length).toBeGreaterThan(0); }
  });
});

describe('numbering', () => {
  const order = (re) => [...bodies.matchAll(re)].map((m) => m[1]);
  it('every equation is displayed exactly once, in numbered order', () => {
    expect(order(/\{\{eq:(\w+)\}\}/g)).toEqual(EQUATIONS.map((e) => e.id));
  });
  it('every figure is placed exactly once, in numbered order, with a caption', () => {
    expect(order(/\{\{fig:(\w+)\}\}/g)).toEqual(FIGURES.map((f) => f.id));
    for (const f of FIGURES) expect(f.caption.length).toBeGreaterThan(60);
  });
  it('every table is placed exactly once, in numbered order', () => {
    expect(order(/\{\{tab:(\w+)\}\}/g)).toEqual(TABLES.map((t) => t.id));
  });
  it('every equation, figure and table is referred to in the text', () => {
    const text = paperText();
    for (const e of EQUATIONS) expect(text, e.id).toMatch(new RegExp(`\\{\\{eqref:${e.id}\\}\\}`));
    for (const f of FIGURES) expect(text, f.id).toMatch(new RegExp(`\\{\\{figref:${f.id}\\}\\}`));
    for (const t of TABLES) expect(text, t.id).toMatch(new RegExp(`\\{\\{tabref:${t.id}\\}\\}`));
  });
  it('all markup tokens resolve (paper and supplement)', () => {
    for (const s of ALL) expect(() => renderMarkup(s.body()), s.id).not.toThrow();
    for (const s of SUPP_SECTIONS) expect(() => renderMarkup(s.body()), s.id).not.toThrow();
    expect(tokens(paperText())).not.toMatch(/\{\{/);
    expect(tokens(supplementText())).not.toMatch(/\{\{/);
    expect([...supplementText().matchAll(/\{\{eqS:(\w+)\}\}/g)].map((m) => m[1])).toEqual(SUPP_EQUATIONS.map((e) => e.id));
  });
});

describe('citations', () => {
  const idsIn = (t) => [...t.matchAll(/\[([a-z]+[0-9]{4}[a-z]?(?:,\s*[a-z]+[0-9]{4}[a-z]?)*)\]/g)].flatMap((m) => m[1].split(/,\s*/));
  it('every [refId] marker in the paper and supplement points at a reference', () => {
    const ids = [...idsIn(paperText()), ...idsIn(supplementText())];
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(byId[id], id).toBeTruthy();
  });
  it('references are numbered by first appearance, paper first', () => {
    expect(PAPER_REFS[0]).toBe('weydanz2018');
    expect([...PAPER_REFS, ...SUPPLEMENT_REFS].map((id) => CITE_NUMBER[id])).toEqual([...PAPER_REFS, ...SUPPLEMENT_REFS].map((_, i) => i + 1));
  });
  it('rendered citations are numeric', () => {
    expect(renderMarkup('see [hofmann2015, weydanz2018]')).toMatch(/\[<a[^>]*>1<\/a>, <a[^>]*>\d+<\/a>\]/);
  });
  it('every reference has a link and a stated use', () => {
    for (const r of REFERENCES) {
      expect(r.url, r.id).toMatch(/^https:\/\//);
      expect(r.supports.length, r.id).toBeGreaterThan(30);
      expect(['checked', 'bibliographic']).toContain(r.status);
    }
  });
  it('textbooks are cited without invented page numbers', () => {
    for (const id of ['degennes2004', 'bear1972']) expect(byId[id].cite).toMatch(/to be confirmed/);
  });
});

describe('journal writing style (main paper prose)', () => {
  it('uses no second person', () => expect(prose).not.toMatch(/\b(you|your|yours)\b/i));
  it('asks no rhetorical questions', () => expect(prose.replace(/https?:\/\/\S+/g, '')).not.toMatch(/\?/));
  it('contains no quiz, misconception or challenge material', () => {
    const src = ['src/content/paper.js', 'src/sections/paper.js', 'src/sections/lab.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    expect(src).not.toMatch(/quiz|misconception|guided (engineering )?challenge/i);
  });
});

describe('AI project documentation record stays honest (presented in the slides, not on the site)', () => {
  // When you add real material, update the matching expectation deliberately.
  it('video and verbatim transcript stay empty until they exist', () => {
    expect(VIDEO.youtubeId).toBeNull();
    expect(VIDEO.autoTranscript).toBeNull();
  });
  it('independent critique, second implementation, comparison and reflection stay empty until supplied', () => {
    expect(AI_DOCS.independentCritique).toBeNull();
    expect(AI_DOCS.implementations.modelB).toBeNull();
    expect(AI_DOCS.implementations.comparison).toBeNull();
    expect(AI_DOCS.contribution.reflection).toBeNull();
  });
  it('a same-model critique is never labelled independent', () => {
    for (const c of AI_DOCS.critiques) if (c.by.startsWith('Claude')) expect(c.independent).toBe(false);
  });
  it('every linked evidence file exists in the repository', () => {
    for (const f of [AI_DOCS.planning.file, ...AI_DOCS.prompts.map((p) => p.file)]) expect(fs.existsSync(f), f).toBe(true);
  });
  it('every decision has a recognised outcome and recorded reasoning', () => {
    for (const d of AI_DOCS.decisions) {
      expect(['accepted', 'rejected', 'modified', 'pending']).toContain(d.decision);
      expect(d.reasoning.length).toBeGreaterThan(10);
    }
  });
});

describe('final technical review guards', () => {
  it('the capillary number is evaluated at a stated finite length (L = 10r), not at L = 0', async () => {
    const { VALUES } = await import('../src/content/paper.js');
    expect(VALUES.LEarly).toBeCloseTo(5e-6, 12);
    expect(VALUES.CaEarly).toBeCloseTo(0.02165, 4);
    expect(VALUES.CaEarly / VALUES.CaCoat).toBeCloseTo(70e-6 / VALUES.LEarly, 6); // Ca ∝ 1/L
    expect(prose).toMatch(/evaluated here at \$L = 10r\$/);
  });
  it('the dead-end fill fraction is qualified as an idealized sealed-pore result wherever it is quoted in the prose', () => {
    expect(ABSTRACT()).toMatch(/idealized, sealed dead-end pore/);
    expect(prose).toMatch(/not predictions of the electrolyte saturation of a whole electrode/);
    expect(SECTIONS.find((s) => s.id === 'conclusions').body()).toMatch(/not whole-electrode saturation/);
  });
  it('the 30° contact angle is labelled an assumption, not a measured electrode property', () => {
    expect(ABSTRACT()).toMatch(/illustrative \(not measured\) contact angle of 30°/);
    expect(prose).toMatch(/not a measured contact angle on a graphite anode or cathode coating/);
  });
  it('the τ² scaling is attributed to the single-pore model', () => {
    expect(prose).toMatch(/not a general relationship between tortuosity and filling time for porous electrodes/);
  });
});

describe('navigation', () => {
  it('has exactly the three pages, in order', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const nav = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
    expect([...nav.matchAll(/href="#\/([\w-]+)"/g)].map((m) => m[1])).toEqual(['paper', 'lab', 'supplement']);
  });
});
