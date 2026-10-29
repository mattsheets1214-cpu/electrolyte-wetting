# Deployment

See README → "Deploying to GitHub Pages" for the click-by-click steps.

- Workflow: `.github/workflows/site.yml` (Node from `.nvmrc`, Python 3.13).
- PRs: tests + build only. Push/merge to `main`: tests + build + deploy.
- Output: `dist/` (relative asset paths, so it works under `/electrolyte-wetting/`).
- The Pyodide runtime is fetched from `https://cdn.jsdelivr.net/npm/pyodide@314.0.7/` only when a visitor presses "Run the Python model". If the CDN is unreachable the page shows an explanation; nothing else depends on it.
- Fonts, KaTeX, Anime.js and Motion are bundled — no other third-party requests.
- No secrets are needed. Do not add any.

Rollback: revert the offending merge commit on `main` (GitHub's "Revert" button on the PR) — the workflow redeploys the previous version.
