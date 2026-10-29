# electrolyte-wetting
Interactive fluid mechanics learning website exploring electrolyte wetting, capillary flow, and trapped-gas effects in lithium-ion battery cells.

**Electrolyte Wetting: Why do lithium-ion battery cells take so long to fill?** — a University of Cincinnati introductory fluid mechanics project by Matthew Sheets (2026).

The site combines a teaching text with a virtual lab:

| Section | What it does |
|---|---|
| Overview | The "milliseconds vs. tens of minutes" paradox, as a draggable slide rule of distance vs. filling time, plus a slot for the video explanation |
| Interactive lab | Mode A (open capillary, exact solution) and Mode B (dead-end pore with trapped gas, numerical ODE), three plots, an animated pore, validity checks, model-vs-reality panel, guided challenge |
| Theory | Nine lessons from surface tension to trapped gas, plus a quiz |
| Code & verification | The real solver code, 28 verification checks run live in the browser, convergence data, and an independent Python model run through Pyodide (WebAssembly) |
| References | Verified bibliography, input-value sources, software, AI models, contribution statement |

All calculations run in the visitor's browser. There is no server, account or API key.

---

## Quick start

Requirements: **Node.js 22** (see `.nvmrc`) and, for the Python tests only, **Python 3.11+**.

```bash
npm ci                 # install exact dependency versions from package-lock.json
npm run dev            # local site with live reload at http://localhost:5173
npm test               # all JavaScript tests (must pass before deploying)
npm run build          # production build into dist/
npm run preview        # serve the production build at http://localhost:4173
```

Python reference model and its tests (optional locally, always run in CI):

```bash
python -m pip install -r python/requirements-dev.txt
python -m pytest python/tests -q
python python/wetting/model.py          # prints the baseline hand-check numbers
```

## Testing

| Suite | Checks |
|---|---|
| `tests/verification.test.js` | The 28 checks in `src/physics/checks.js` — the same ones shown live on the Code & verification page |
| `tests/physics.test.js` | Closed-form reference cases (`tests/fixtures/reference_cases.json`), sign conventions, exact Mode B trajectory, validity flags, challenge, sweeps, data files |
| `tests/pyodide.test.js` | Runs `python/wetting/model.py` inside Pyodide and compares with the JavaScript solver |
| `tests/content.test.js` | Every lesson has all required parts; every citation resolves; evidence placeholders are not silently filled |
| `python/tests/test_model.py` | Reference cases, exact trajectory, SciPy Radau cross-check, scalings, invalid inputs |

The reference cases are generated from closed-form formulas by `python/make_reference_cases.py`.

## Deploying to GitHub Pages

The workflow in `.github/workflows/site.yml` runs every test and builds the site on each pull request, and deploys to GitHub Pages **only** after a push or merge to `main` with all tests passing.

One-time setup (repository owner):

1. Push the `feature/v1-site` branch and open a pull request into `main` (see "Working on changes" below). Review it, then merge it.
2. In the repository on GitHub go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab. If the run triggered by the merge started before step 3, open the workflow **Test, build and deploy** and click **Run workflow** on `main`.
5. When the run is green, the site is at **https://mattsheets1214-cpu.github.io/electrolyte-wetting/** (the URL is also shown in the deploy job and in Settings → Pages).
6. Check it in a private/incognito window on a phone and a laptop, without being logged in.

Recommended: **Settings → Branches → Add branch ruleset** for `main` requiring a pull request and the "Test, build and deploy / test-and-build" status check. Then nothing reaches the public site without your approval and passing tests.

## Working on changes (keeps you in control)

```bash
git switch main && git pull
git switch -c my-change            # one branch per change
# …edit, then:
npm test && npm run build
git commit -am "Describe the change"
git push -u origin my-change       # then open a pull request on GitHub
```

The pull request runs the tests automatically. Merge it only when you are happy; merging publishes.

## Where things live

```
index.html                 page shell (header, nav, footer)
src/main.js                router + styles + fonts
src/physics/               equations, solvers, validation, validity checks, verification checks (SI units only)
src/data/                  lab input definitions (ranges, defaults, sources) and preset scenarios
src/content/               lessons, quiz, references, video id, model-vs-reality text
src/sections/              one file per page
src/charts/plot.js         dependency-free SVG plotting
src/diagrams/              hand-built scientific diagrams
src/animations/            physics-linked pore animation (Anime.js) and interface motion (Motion)
python/                    independent Python reference model, tests, reference-case generator
tests/                     Vitest suites + shared fixtures
docs/                      assumptions, verification, source audit, deployment notes
docs/evidence/             Model A blueprint and the site-build prompt (kept in the repo, not published)
```

## Editing with an AI coding assistant

Read **[AI_CONTEXT.md](AI_CONTEXT.md)** first — it is written for AI assistants and humans alike and contains the architecture, scientific conventions and rules.

- **Claude Code**: run `claude` in the repository folder (it reads `CLAUDE.md`, which points to `AI_CONTEXT.md`), or connect the repository to Claude on the web and ask for changes on a new branch.
- **GitHub Copilot**: Copilot Chat and the coding agent read `.github/copilot-instructions.md`, which points to `AI_CONTEXT.md`. You can assign an issue to Copilot to get a pull request.
- **Cursor** (or any editor-based assistant): open the folder and tell it to read `AI_CONTEXT.md` before editing.

Whichever tool you use: ask for changes on a branch, require `npm test` to pass, and review the pull request before merging.

Examples of requests that fit the structure: "Rewrite lesson 3 for a beginner" (`src/content/lessons.js`), "Add a validated electrolyte parameter set as a preset" (`src/data/presets.js` + a reference), "Improve the trapped-gas animation" (`src/animations/pore.js`), "Fix this numerical error" (`src/physics/` + a new test).

## Adding your video

When your video explanation is on YouTube, put its id (the part after `watch?v=`) and a title in `src/content/video.js`, and update the test in `tests/content.test.js` that checks the id is still empty. The Overview page then embeds it.

## Licence and credits

Code: add a licence of your choice before publishing if you want others to reuse it. Fonts are under the SIL Open Font License. See the References page for scientific sources and software.
