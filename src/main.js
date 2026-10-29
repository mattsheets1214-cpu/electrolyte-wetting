/**
 * main.js — application entry: styles, fonts, hash router, header controls.
 *
 * Each page lives in src/sections/<name>.js and exports render(container)
 * which may return a cleanup function. Routes use the URL hash (#/lab), which
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
  overview: { title: 'Overview', load: () => import('./sections/overview.js') },
  lab: { title: 'Interactive lab', load: () => import('./sections/lab.js') },
  theory: { title: 'Theory', load: () => import('./sections/theory.js') },
  verification: { title: 'Code & verification', load: () => import('./sections/verification.js') },
  'ai-lab': { title: 'AI lab', load: () => import('./sections/ailab.js') },
  presentation: { title: 'Presentation', load: () => import('./sections/presentation.js') },
  references: { title: 'References & credits', load: () => import('./sections/references.js') },
};

const app = document.getElementById('app');
const nav = document.getElementById('primary-nav');
let cleanup = null;
let currentRoute = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [route, ...rest] = raw.split('/');
  return { route: ROUTES[route] ? route : 'overview', anchor: rest.join('/') || null };
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
