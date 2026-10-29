// Content integrity: every lesson is complete, every citation marker resolves
// to a real reference, and evidence placeholders cannot silently disappear.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { REFERENCES, byId } from '../src/content/references.js';
import { QUIZ } from '../src/content/quiz.js';
import { VIDEO } from '../src/content/video.js';

// lessons.js imports diagram code only (no DOM needed at import time)
const { LESSONS } = await import('../src/content/lessons.js');

describe('lessons', () => {
  it('has the nine required lessons in order', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(['paradox', 'surface-tension', 'contact-angle', 'capillary-pressure', 'viscous', 'washburn', 'pore-to-electrode', 'trapped-gas', 'limits']);
  });
  for (const l of LESSONS) {
    it(`lesson "${l.id}" has every required part`, () => {
      expect(l.objective.length).toBeGreaterThan(20);
      expect(l.explain.length).toBeGreaterThan(200);
      expect(l.figure && (l.figure.html || l.figure.interactive)).toBeTruthy();
      expect(l.figure.caption.length).toBeGreaterThan(20);
      expect(l.equations.length).toBeGreaterThan(0);
      expect(l.symbols.length).toBeGreaterThan(0);
      for (const s of l.symbols) expect(s).toHaveLength(3);
      expect(l.check.q.length).toBeGreaterThan(10);
      expect(l.check.a.length).toBeGreaterThan(10);
      expect(l.next.length).toBeGreaterThan(10);
    });
  }
});

describe('citations', () => {
  const sources = ['src/content/lessons.js', 'src/sections/overview.js', 'src/sections/verification.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  it('every [refId] marker points at a reference', () => {
    const ids = [...sources.matchAll(/\[([a-z]+[0-9]{4}[a-z]?(?:,\s*[a-z]+[0-9]{4}[a-z]?)*)\]/g)].flatMap((m) => m[1].split(/,\s*/));
    expect(ids.length).toBeGreaterThan(5);
    for (const id of ids) expect(byId[id], id).toBeTruthy();
  });
  it('every reference has a link and a stated use', () => {
    for (const r of REFERENCES) {
      expect(r.url, r.id).toMatch(/^https:\/\//);
      expect(r.supports.length, r.id).toBeGreaterThan(30);
      expect(['checked', 'bibliographic']).toContain(r.status);
    }
  });
});

describe('quiz', () => {
  it('each question has exactly one correct answer and an explanation for every option', () => {
    for (const q of QUIZ) {
      expect(q.options.filter((o) => o.correct)).toHaveLength(1);
      for (const o of q.options) expect(o.why.length).toBeGreaterThan(15);
    }
  });
});

describe('video slot', () => {
  it('has no video id until the real video exists (the Overview shows an empty slot)', () => {
    // When you add your YouTube video, update this test deliberately.
    expect(VIDEO.youtubeId).toBeNull();
  });
});

describe('removed pages stay removed', () => {
  it('navigation has no AI lab or Presentation link', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html).not.toMatch(/#\/ai-lab|#\/presentation/);
  });
});
