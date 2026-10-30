/** cite.js — turn [refId, refId2] markers in content into numbered citations, e.g. [3, 7]. */
import { byId } from '../content/references.js';
import { CITE_NUMBER, SUPPLEMENT_REFS } from '../content/citations.js';

/** Citation number of a reference id (undefined if it is not cited in the paper or supplement). */
export const citeNumber = (id) => CITE_NUMBER[id];

export function cite(html) {
  return html.replace(/\[([a-z0-9]+(?:,\s*[a-z0-9]+)*)\]/g, (m, ids) => {
    const list = ids.split(/,\s*/);
    if (!list.every((id) => byId[id] && CITE_NUMBER[id])) return m;
    const sorted = [...list].sort((a, b) => CITE_NUMBER[a] - CITE_NUMBER[b]);
    return `<span class="cite">[${sorted.map((id) => `<a href="#/${SUPPLEMENT_REFS.includes(id) ? 'supplement' : 'paper'}/ref-${id}" title="${byId[id].cite.replace(/"/g, '&quot;')}">${CITE_NUMBER[id]}</a>`).join(', ')}]</span>`;
  });
}
