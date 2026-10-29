/**
 * math.js — KaTeX helpers. Equations are written in LaTeX in the content files
 * and rendered at runtime (no network: KaTeX and its fonts are bundled).
 */
import katex from 'katex';

/** Inline math as an HTML string. */
export const tex = (src) => katex.renderToString(src, { throwOnError: false, output: 'htmlAndMathml' });

/** Display math wrapped in a horizontally scrollable block (mobile-safe). */
export const texBlock = (src, label = '') =>
  `<div class="eq" role="group"${label ? ` aria-label="${label}"` : ''}>${katex.renderToString(src, { displayMode: true, throwOnError: false, output: 'htmlAndMathml' })}</div>`;

/** Replace $...$ (inline) and $$...$$ (display) in a content string. */
export function md(str) {
  return str
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, s) => texBlock(s))
    .replace(/\$([^$\n]+?)\$/g, (_, s) => tex(s));
}
