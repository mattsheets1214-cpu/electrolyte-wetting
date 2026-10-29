// Runs the SAME verification checks that the website shows live on the
// "Code & Verification" page (src/physics/checks.js). If any fails, CI fails
// and the site is not deployed.
import { describe, it, expect } from 'vitest';
import { CHECKS } from '../src/physics/checks.js';

describe('verification suite (src/physics/checks.js)', () => {
  for (const c of CHECKS) {
    it(`[${c.category}] ${c.title}`, () => {
      const r = c.run();
      expect(r.pass, `${c.id}: measured ${r.measured}; expected ${r.expected}`).toBe(true);
    });
  }
});
