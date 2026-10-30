/**
 * main.js — application entry: styles, fonts, hash router, header controls.
 *
 * Each page lives in src/sections/<name>.js and exports render(container)
 * which may return a cleanup function. Routes use the URL hash (#/paper), which
 * works on GitHub Pages without any server configuration.
 */
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/600.css';
import '@fontsource/newsreader/400-italic.css';
import 'katex/dist/katex.min.css';
import './styles/tokens.css';
import './styles/site.css';
import { pageEnter, revealFigures } from './animations/motion.js';

const ROUTES = {
  paper: { title: 'Paper', load: () => import('./sections/paper.js') },
  lab: { title: 'Interactive demonstration', load: () => import('./sections/lab.js') },
  supplement: { title: 'Supplementary material', load: () => import('./sections/supplement.js') },
  'ai-documentation': { title: 'AI project documentation', load: () => import('./sections/aiDocumentation.js') },
};

/** Old routes (v1 site) kept working: route → [new route, default anchor]. */
const ALIASES = {
  overview: ['paper', null],
  theory: ['paper', 'theory'],
  references: ['paper', 'references'],
  verification: ['supplement', 's4'],
};

const app = document.getElementById('app');
const nav = document.getElementById('primary-nav');
let cleanup = null;
let currentRoute = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [first, ...rest] = raw.split('/');
  const anchor = rest.join('/') || null;
  if (ROUTES[first]) return { route: first, anchor };
  if (ALIASES[first]) return { route: ALIASES[first][0], anchor: anchor || ALIASES[first][1] };
  return { route: 'paper', anchor: null };
}

async function navigate() {
  const { route, anchor } = parseHash();
  for (const a of nav.querySelectorAll('a')) {
    if (a.getAttribute('href') === `#/${route}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  nav.classList.remove('is-open');
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');

  if (route !== currentRoute) {
    if (typeof cleanup === 'function') { try { cleanup(); } catch { /* ignore */ } }
    cleanup = null;
    currentRoute = route;
    document.title = `${ROUTES[route].title} — Electrolyte Wetting`;
    try {
      const mod = await ROUTES[route].load();
      app.innerHTML = '';
      cleanup = await mod.render(app);
      pageEnter(app);
      revealFigures(app);
      window.scrollTo(0, 0);
      if (!anchor) document.getElementById('main').focus({ preventScroll: true });
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="status-msg"><b>This page failed to load.</b> ${String(err.message || err)}. Try reloading; if it persists, open an issue in the repository.</div>`;
      return;
    }
  }
  if (anchor) {
    const target = document.getElementById(anchor);
    if (target) target.scrollIntoView({ block: 'start' });
  }
}

window.addEventListener('hashchange', navigate);
navigate();

// Header controls
document.querySelector('.menu-toggle').addEventListener('click', (e) => {
  const open = nav.classList.toggle('is-open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('ew-theme', root.dataset.theme); } catch { /* storage unavailable */ }
});
