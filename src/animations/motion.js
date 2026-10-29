/**
 * motion.js — interface motion using Motion (motion.dev).
 *
 * Kept deliberately small: one page-change transition and a one-time reveal
 * for figures as they scroll into view. Everything is skipped when the
 * visitor prefers reduced motion, and the page works if Motion fails to load
 * (content is visible by default; motion only ever animates FROM a state).
 */
import { prefersReducedMotion } from '../ui/dom.js';

let motionMod;
async function motion() {
  if (motionMod !== undefined) return motionMod;
  try { motionMod = await import('motion'); } catch { motionMod = null; }
  return motionMod;
}

/** Fade the newly rendered page in (short, so it never delays reading). */
export async function pageEnter(node) {
  if (prefersReducedMotion()) return;
  const m = await motion();
  if (!m) return;
  m.animate(node, { opacity: [0, 1], transform: ['translateY(6px)', 'none'] }, { duration: 0.22, ease: 'easeOut' });
}

/** Reveal figures once as they enter the viewport. */
export async function revealFigures(root) {
  if (prefersReducedMotion()) return () => {};
  const m = await motion();
  if (!m) return () => {};
  const targets = root.querySelectorAll('[data-reveal]');
  if (!targets.length) return () => {};
  return m.inView(targets, (element) => {
    m.animate(element, { opacity: [0.001, 1], transform: ['translateY(10px)', 'none'] }, { duration: 0.35, ease: 'easeOut' });
  }, { amount: 0.25 });
}

/** Brief highlight on a value that just changed (feedback for a control). */
export async function pulse(node) {
  if (prefersReducedMotion() || !node) return;
  const m = await motion();
  if (!m) return;
  m.animate(node, { backgroundColor: ['color-mix(in srgb, var(--liquid) 18%, transparent)', 'rgba(0,0,0,0)'] }, { duration: 0.5 });
}
