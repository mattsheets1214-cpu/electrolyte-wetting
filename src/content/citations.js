/**
 * citations.js — numbered citation order (journal style, numbered by first
 * appearance). Main-paper references are numbered first, in reading order;
 * references cited only in the supplementary material follow.
 */
import { REFERENCES } from './references.js';
import { paperText } from './paper.js';
import { supplementText } from './supplement.js';

const idsIn = (text) => [...text.matchAll(/\[([a-z]+[0-9]{4}[a-z]?(?:,\s*[a-z]+[0-9]{4}[a-z]?)*)\]/g)].flatMap((m) => m[1].split(/,\s*/));
const known = new Set(REFERENCES.map((r) => r.id));
const uniq = (arr) => [...new Set(arr.filter((id) => known.has(id)))];

/** Reference ids cited in the paper, in order of first appearance. */
export const PAPER_REFS = uniq(idsIn(paperText()));
/** Reference ids cited only in the supplementary material, in order of first appearance. */
export const SUPPLEMENT_REFS = uniq(idsIn(supplementText())).filter((id) => !PAPER_REFS.includes(id));
/** id → citation number */
export const CITE_NUMBER = Object.fromEntries([...PAPER_REFS, ...SUPPLEMENT_REFS].map((id, i) => [id, i + 1]));
