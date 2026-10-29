/** cite.js — turn [refId, refId2] markers in content into linked short citations. */
import { byId } from '../content/references.js';

const SHORT = {
  weydanz2018: 'Weydanz et al., 2018', tum2018: 'TUM press release, 2018', davoodabadi2019: 'Davoodabadi et al., 2019',
  sheng2014: 'Sheng et al., 2014', hofmann2015: 'Hofmann et al., 2015', wang2021: 'Wang et al., 2021',
  washburn1921: 'Washburn, 1921', lucas1918: 'Lucas, 1918', fries2008a: 'Fries & Dreyer, 2008a', fries2008b: 'Fries & Dreyer, 2008b',
  fries2009: 'Fries & Dreyer, 2009', ramakrishnan2019: 'Ramakrishnan et al., 2019', dormand1980: 'Dormand & Prince, 1980',
};

export const shortCite = (id) => SHORT[id] || id;

export function cite(html) {
  return html.replace(/\[([a-z0-9]+(?:,\s*[a-z0-9]+)*)\]/g, (m, ids) => {
    const list = ids.split(/,\s*/);
    if (!list.every((id) => byId[id])) return m;
    return `<span class="cite">(${list.map((id) => `<a href="#/references/ref-${id}">${shortCite(id)}</a>`).join('; ')})</span>`;
  });
}
