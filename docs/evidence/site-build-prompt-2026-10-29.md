# Site build prompt — 29 October 2026

Model: Claude Opus 5.5 (claude-opus-5-5), Anthropic, in the Claude app.
This file records, verbatim, the instructions given for building v1 of this website.
Part 1 is the chat message; Part 2 is the attached master build prompt.

## Part 1 — chat message

You are building my University of Cincinnati introductory fluid mechanics project, Electrolyte Wetting.
The GitHub repository I own is `electrolyte-wetting`. Treat this repository as the permanent source of truth for the project.
Before implementing the website:

1. Inspect the existing repository and explain what files are already present.
2. Create a clear implementation plan based on my full project specification.
3. Preserve all existing files unless a change is justified.
4. Use a maintainable, modular architecture with readable source code, documented equations, and automated tests for the numerical model.
5. Build the website as a publicly deployable static site compatible with GitHub Pages. If using Python-based simulation logic, determine whether Pyodide/WebAssembly is appropriate so calculations can run in the browser without requiring a Python server.
6. Create a GitHub Actions workflow that builds and deploys the website automatically whenever changes are merged or pushed to the `main` branch.
7. Include a README.md, AI_CONTEXT.md, CHANGELOG.md, and clear instructions for installing, testing, modifying, and deploying the project.
8. Validate the physics, numerical results, assumptions, and units. Do not invent experimental results, references, validation evidence, or presentation transcripts. Clearly label anything that still needs to be supplied or verified.
9. Run the available tests and build checks. Report any failures honestly.
10. Work on a separate branch and create a pull request for review rather than publishing unreviewed changes directly to `main`, if the environment supports this workflow.

Do not merely create a visual mockup. Build a functional educational product with working calculations, interactive controls, useful plots, and explanations appropriate for introductory fluid mechanics students.
Before finishing, provide:

* A summary of the files created or changed.
* The test and build results.
* The exact steps to enable GitHub Pages.
* Any remaining scientific, deployment, or content limitations.

I want to retain control of the source code and approve changes before they become the published version.

## Part 2 — attached master build prompt

# MASTER BUILD PROMPT — ELECTROLYTE WETTING INTERACTIVE ENGINEERING WEBSITE

## 1. Your role and mission

Act as a senior full-stack developer, chemical engineer specializing in transport phenomena, scientific-computing engineer, interactive technical educator, UI/UX designer, and software test engineer.

Your assignment is to **build a complete, publicly deployable, interactive engineering education website** for my University of Cincinnati introductory fluid mechanics project, titled:

**Electrolyte Wetting: Why Do Lithium-Ion Battery Cells Take So Long to Fill?**

Do not merely create a mockup, landing page, design concept, static article, or implementation plan. Build the actual functioning website, its numerical model, interactive visualizations, educational content, tests, documentation, and publishing workflow.

The final product should feel like a professional interactive engineering publication combined with a virtual laboratory. It must be technically defensible to a chemical engineering professor and intuitive enough for a student learning introductory fluid mechanics.

I want to continue improving this project with AI after the first version is finished. Design the entire project for maintainability, transparent code, repeatable deployment, and future AI-assisted development.

**Priority order:**
1. Correct physics and numerical calculations.
2. Clear, exceptional engineering education.
3. Working interactive simulations and visualizations.
4. Verification, honest validation, and scientific references.
5. Outstanding design, motion, and usability.
6. Simple ongoing editing, testing, and publishing.

Do not sacrifice scientific correctness for visual effects.

---

## 2. Required design references

Inspect and learn from all three references before implementing the design. Use them for inspiration, not as sources of scientific content.

### Reference A — Anime.js
https://animejs.com/

Use Anime.js where appropriate for:
- Animated liquid fronts moving through a pore.
- Meniscus movement and contact-angle demonstrations.
- Trapped gas compression.
- Filling progress and subtle scientific illustrations.
- Carefully timed transitions between physical states.

Animations must represent the underlying physics rather than merely decorate the page.

### Reference B — Motion
https://motion.dev/

Use Motion where appropriate for:
- Smooth transitions between pages or sections.
- Responsive interactive controls.
- Reveal-on-scroll educational diagrams.
- Chart and panel transitions.
- Accessible interface feedback and state changes.

Avoid excessive movement, unnecessary delays, and animation that interferes with reading.

### Reference C — Bklit
https://bklit.com/

Inspect the current website and identify specific visual techniques that would help create a distinctive, contemporary technical publication.

Consider its typography, visual hierarchy, spacing, layout, contrast, graphic composition, and overall art direction. Adapt only what is useful for an engineering education product.

Do not copy its branding, text, or identity.

### Design direction

Create a cohesive visual language that feels like a combination of:
- An editorial science publication.
- A modern engineering laboratory.
- A precise technical instrument.
- An interactive scientific explainer.

Use restrained color, excellent typography, purposeful whitespace, fine technical lines, subtle grids, and clear mathematical notation.

Use a sophisticated palette that works in both light and dark environments. A restrained graphite/navy foundation with warm off-white surfaces and a carefully chosen electric-blue or amber accent is a starting point, not a rigid requirement.

Avoid generic AI-generated website aesthetics: excessive gradients, giant meaningless headings, glassmorphism everywhere, random floating particles, oversized rounded cards, decorative animations, and repetitive dashboard components.

The website must look designed specifically for electrolyte wetting, not like a generic SaaS template.

---

## 3. Scientific foundation and scope

The central engineering question is:

**How long does electrolyte take to wet an electrode from its edges, and how do vacuum, pore radius, contact angle, viscosity, and wetting distance affect filling time and the fraction of pore space that becomes filled?**

The central educational paradox is that an idealized pore can fill across an electrode's thickness in milliseconds, while real lithium-ion battery cells can require tens of minutes to wet.

The website must explain why these are different physical scales and why a single idealized pore does not predict an entire battery cell perfectly.

Use the attached document, “v1 original plan (Model A evidence).pdf,” as the initial project specification. Review it in full before implementation.

Preserve its useful structure and assumptions, but independently audit the equations, units, numerical results, implementation details, and claims. Do not assume the document is infallible.

The first version must focus on:
- Surface tension and interfacial tension.
- Contact angle and wetting.
- Young–Laplace capillary pressure.
- Hagen–Poiseuille viscous resistance.
- The Lucas–Washburn equation.
- Scaling from pore-scale distance to electrode-scale distance.
- Tortuosity as a simplified path-length correction.
- Trapped-gas compression.
- Vacuum-assisted filling.
- Numerical verification and model limitations.

Keep electrochemistry, SEI formation, full computational fluid dynamics, and complete pore-network simulations outside the core version.

Do not add Darcy's law or Kozeny–Carman to the core model unless you can explain a specific educational benefit and consistently justify all additional parameters. They may be optional future extensions.

---

## 4. Website architecture

Build a responsive, multi-section website with seven primary navigation destinations.

### Section 1 — Overview

Introduce the physical problem with an immediately engaging visual demonstration.

The opening experience should show:
- An idealized electrode pore filling rapidly.
- A much larger electrode or cell filling over a longer time.
- The difference between through-thickness and in-plane wetting distances.
- Electrolyte entering from the edges of a prismatic cell.
- The effect of trapped gas and vacuum-assisted filling.

Present the engineering question, what the computational tool can predict, the assumptions it makes, and why the problem matters in battery manufacturing.

Include a concise preview of the interactive laboratory.

Include a clearly marked location for the final YouTube presentation. Do not fabricate a video URL.

### Section 2 — Interactive Laboratory

This is the centerpiece of the website.

Build a functional computational tool with two clearly separated model modes:

**Mode A: Open capillary**

An idealized capillary with a constant driving pressure and an analytical solution.

**Mode B: Dead-end capillary with trapped gas**

An idealized capillary in which incoming liquid compresses trapped gas. Solve its governing equation numerically and compare the final equilibrium with its exact analytical result.

Provide:
- An intuitive control panel.
- Unit-labeled inputs and sensible defaults.
- Clearly visible calculated outputs.
- Interactive scientific plots.
- Animated physical diagrams.
- Preset scenarios.
- Reset controls.
- Validity warnings.
- A short guided engineering challenge.
- Explanations that update with the selected parameters.

The controls must change the actual numerical results, graphs, and physical illustrations. No fake simulations or hard-coded changing values.

### Section 3 — Theory

Teach the physics progressively, from intuitive physical observations to governing equations.

Organize the material into nine connected lessons:

1. The paradox: milliseconds versus tens of minutes.
2. Surface tension and interfacial tension.
3. Contact angle and wetting.
4. Capillary pressure.
5. Viscous resistance inside a pore.
6. The Lucas–Washburn equation.
7. From one pore to a battery electrode.
8. Trapped gas and vacuum-assisted filling.
9. Model limitations and applications to other systems.

Each lesson should include:
- A learning objective.
- A plain-English explanation.
- A labeled physical diagram.
- The relevant equation.
- A definition of every symbol and unit.
- A step-by-step derivation where appropriate.
- A numerical example where useful.
- A common misconception or conceptual check.
- A clear connection to the next lesson.

Include a short interactive quiz at the end, with explanations for incorrect answers.

### Section 4 — Code and Verification

Show students how the computational model actually works.

Include:
- A readable solver walkthrough.
- The governing equations in their implemented form.
- A description of the numerical integration method.
- Analytical-versus-numerical comparisons.
- Independent hand calculations.
- Dimensional analysis.
- Limiting-case tests.
- Numerical convergence tests.
- Invalid-input tests.
- A clear distinction between verification and physical validation.
- A transparent account of discrepancies between simplified predictions and real battery behavior.

Code snippets must match the actual implementation. Do not present illustrative pseudocode as though it were executed production code.

### Section 5 — AI Lab

Document the AI-assisted engineering workflow required for my course.

Include:
- The initial Model A engineering blueprint.
- The independent Model B critique.
- A comparison of the models' suggestions.
- A decision table documenting accepted, rejected, and modified suggestions.
- The exact prompts used for comparable implementations.
- Shared test cases and test results.
- Model names, versions, and dates.
- Bugs found and corrections made.
- An explanation of my own engineering decisions.

Create the structure and empty templates now, but clearly label any evidence that has not yet been collected.

Do not invent a Model B critique, test results, AI interactions, or personal reflections. I will supply these after completing the actual experiments.

The website must make it easy to add the real evidence later.

### Section 6 — Presentation and Learning Reflection

Provide space for:
- The final YouTube presentation.
- The verbatim YouTube auto-generated transcript.
- A practice presentation transcript.
- The AI critique of the practice presentation.
- Lessons learned.
- Future research questions.

Use clearly labeled placeholders until I provide the actual materials.

Do not write a fabricated transcript or claim that a video exists.

### Section 7 — References and Credits

Include a properly organized bibliography with links to the original scientific sources, software documentation, AI models, and design inspiration.

Provide a contribution statement.

Every scientific numerical value must either:
- Have a traceable source, or
- Be explicitly identified as an assumption, estimate, or illustrative value.

Verify that sources support the claims attributed to them. Do not fabricate papers, DOI numbers, URLs, publication details, or experimental results.

---

## 5. Governing equations and numerical model

Use SI units internally. Convert inputs and outputs for display.

### 5.1 Young's equation

Use the interfacial-tension balance:

σ_sg = σ_sl + σ cos(θ)

Define all symbols and explain that this equation provides conceptual context for the contact angle. Do not claim the website calculates θ from this equation unless additional interfacial-tension data are supplied.

### 5.2 Young–Laplace capillary pressure

For an ideal cylindrical pore:

p_c = 2σ cos(θ) / r

Where:
- p_c = capillary pressure, Pa.
- σ = liquid–gas surface tension, N/m.
- θ = contact angle measured through the liquid.
- r = pore radius, m.

Explain the cylindrical geometry assumption and the alternative geometry factor for slit-like pores.

A contact angle below 90° produces positive spontaneous capillary drive under this convention. At 90°, the capillary contribution is zero. Above 90°, the capillary contribution opposes filling.

### 5.3 Hagen–Poiseuille moving-front equation

For an idealized, liquid-filled capillary length L:

dL/dt = r² Δp / (8 μ L)

Where:
- L = liquid penetration distance, m.
- μ = dynamic viscosity, Pa·s.
- Δp = pressure difference driving the liquid, Pa.

Explain the laminar, Newtonian, no-slip, quasi-steady assumptions and why the initial expression is singular at L = 0.

### 5.4 Mode A — open capillary

Define the total pressure drive as:

Δp_total = p_c + Δp_a

Here Δp_a is the applied pressure difference, defined consistently as liquid-side pressure minus gas-side pressure.

For positive constant driving pressure, the analytical solution is:

L²(t) = r² Δp_total t / (4 μ)

Time to target distance L:

t = 4 μ L² / (r² Δp_total)

For spontaneous capillary filling with no applied pressure:

L²(t) = r σ cos(θ) t / (2 μ)

Therefore:

t = 2 μ L² / (r σ cos(θ))

The model must reject or correctly handle cases in which the net pressure drive is zero or negative. Never produce a negative filling time.

### 5.5 Tortuosity scaling

For a simplified path-length factor τ, where L = τX:

X²(t) = r σ cos(θ) t / (2 μ τ²)

Explain that τ is an idealized correction, not a universal material constant, and that a representative cylindrical pore cannot capture a real electrode's full pore-size distribution or connectivity.

### 5.6 Mode B — dead-end capillary with trapped gas

For a pore of total length L_p with initially trapped gas pressure p_g0, assume isothermal compression:

p_g(L) = p_g0 L_p / (L_p − L)

The liquid-front equation is:

dL/dt = r² [p_L + p_c − p_g(L)] / (8 μ L)

Where p_L is the absolute liquid-side pressure.

Use the initial condition L(0) = 0, but implement the numerical solver in a transformed variable such as s = L² to avoid the artificial initial singularity.

With s = L², the equation becomes:

ds/dt = r² [p_L + p_c − p_g(√s)] / (4 μ)

The physical equilibrium, when the assumptions allow a positive equilibrium below the pore length, is:

L_eq / L_p = 1 − p_g0 / (p_L + p_c)

This is the predicted equilibrium filling fraction for the idealized dead-end pore, not a universal prediction for real battery electrodes.

Implement a robust numerical method such as adaptive RK45 or a correctly implemented fixed-step RK4. Avoid integrating past the physical pore length or across singularities.

Use the exact equilibrium as an independent verification check. Report t95 only if it is well-defined and the numerical solution approaches equilibrium appropriately.

Clearly distinguish absolute pressures from gauge pressures.

### 5.7 Initial illustrative parameter set

Use these starting values, while clearly distinguishing measured values from assumptions:

| Parameter | Initial value |
|---|---:|
| Surface tension | 29.4 mN/m |
| Dynamic viscosity | 4.4 mPa·s |
| Contact angle | 30° |
| Pore radius | 0.5 μm |
| Tortuosity | 1 |
| Liquid-side absolute pressure | 101.3 kPa |
| Initial trapped-gas pressure | 101.3 kPa |
| Temperature | 25°C |

The supplied blueprint identifies the surface tension and viscosity as literature-based electrolyte values. Treat the pore radius, contact angle, tortuosity, and other unverified parameters as assumptions until their sources are independently confirmed.

Allow the user to change all appropriate parameters.

### 5.8 Required calculations to independently verify

Reproduce the calculations below independently before displaying them as accepted reference results.

For the illustrative baseline:
- Capillary pressure: approximately 101.8 kPa.
- Washburn coefficient: approximately 1.447 × 10⁻⁶ m²/s.
- Idealized penetration across 70 μm: approximately 3.4 ms.
- Idealized penetration across 1 cm: approximately 69 s.
- Idealized penetration across 5 cm: approximately 29 minutes.
- With tortuosity τ = 2, the 5 cm estimate becomes approximately 115 minutes.

These are idealized calculations, not measured filling times for a particular commercial cell.

For Mode B, check the equilibrium formula using the specified absolute pressures. The expected idealized filling fractions are approximately 50% for an atmospheric initial gas pressure, 95% for 10 kPa absolute initial gas pressure, and 99.5% for 1 kPa absolute initial gas pressure.

Label all these numbers as model outputs or illustrative estimates, not guarantees of industrial performance.

---

## 6. Interactive laboratory requirements

### Inputs

Provide a well-designed sidebar or responsive control panel for:

1. Pore radius, μm.
2. Surface tension, mN/m.
3. Contact angle, degrees.
4. Dynamic viscosity, mPa·s.
5. Applied pressure difference, kPa, for Mode A.
6. Target distance, adjustable from micrometers to centimeters.
7. Tortuosity, dimensionless.
8. Initial trapped-gas pressure, kPa absolute, for Mode B.

Keep the liquid-side pressure fixed at the documented default unless a future version explicitly adds it as an input.

Use sliders where they improve intuition, numeric entry fields where precision matters, and logarithmic controls where parameter ranges span orders of magnitude.

Display units everywhere and synchronize paired controls correctly.

### Outputs

Show the following live:
- Capillary pressure, kPa.
- Time to target distance, automatically formatted in seconds, minutes, or hours.
- Washburn coefficient, m²/s.
- Predicted front position over time.
- Mode B equilibrium fill fraction.
- Mode B time to 95% of equilibrium, when meaningful.
- Trapped-gas pressure over time.
- Physical-validity warnings.
- A concise explanation of why the selected inputs produce the displayed results.

### Plots

Implement three scientifically meaningful plots.

**Plot 1: Penetration distance versus time**
- Plot the analytical solution and numerical solution together.
- Use distinct, clearly labeled series.
- Include units, tooltips, and a legend.
- Show the √t behavior of idealized capillary filling.

**Plot 2: Time to target versus a selected parameter**
- Allow the user to choose distance, viscosity, pore radius, or another supported parameter.
- Use log–log axes when appropriate.
- Explain the theoretical scaling.
- Make clear that the radius exponent depends on which quantities are held constant: with pure capillary drive, time scales as 1/r, while at fixed independent pressure drive, time scales as 1/r².

**Plot 3: Trapped gas and vacuum**
- Show Mode B equilibrium fill fraction against initial absolute gas pressure.
- Compare the exact equilibrium curve with numerical end states.
- Include a physical animation of gas compression.
- Explain why the idealized dead-end model can overpredict gas trapping in connected real electrodes.

### Guided engineering challenge

Build an interactive challenge around this question:

“A battery manufacturer wants electrolyte to travel 4 cm in under 30 minutes. With surface tension, viscosity, and contact angle fixed at the baseline values, what pore radius would meet the target? What changes if viscosity increases to 8 mPa·s? What initial gas pressure is required to keep idealized dead-end-pore gas trapping below 5%?”

Let the student enter answers, receive meaningful feedback, and reveal a worked solution with equations and units.

Check feasibility mathematically before presenting a solution. Do not assume a requested target is achievable.

---

## 7. Visual teaching and animation

Create custom scientific diagrams rather than relying entirely on stock illustrations.

Required diagrams:
- A cylindrical pore with a labeled meniscus and contact angle.
- Interfacial-tension vectors.
- A pressure-balance diagram.
- A laminar velocity profile behind a moving meniscus.
- A square-root-of-time penetration plot.
- A battery-electrode cross-section.
- A prismatic battery cell with electrolyte entering from multiple edges.
- A dead-end pore with a compressing gas pocket.
- A vacuum-assisted filling comparison.

Where possible, allow users to pause, replay, scrub, or step through the physical process.

Animations must be linked to the model's actual state. If an animation is schematic rather than physically to scale, label it accordingly.

Use reduced-motion alternatives for users who prefer less animation. Keep all essential explanations available as text and static diagrams.

---

## 8. Software architecture and technology

Choose a maintainable architecture suitable for free static hosting.

Preferred deployment:
- GitHub repository.
- GitHub Pages.
- Automated deployment using GitHub Actions.
- Browser-based computation using WebAssembly-compatible technology.

For the computational model, prefer Python compiled to WebAssembly using Pyodide if it is stable and appropriate for the required solver. If a dependency or browser compatibility issue makes this impractical, propose a simpler alternative such as a tested JavaScript solver, explaining the trade-off.

The numerical model must run on the user's device. Do not require a paid backend, server-side Python service, or external API for ordinary calculations.

Recommended conceptual structure:

- `index.html` — application entry point.
- `src/` — application components and interaction logic.
- `src/physics/` — equations, unit conversions, and numerical solvers.
- `src/charts/` — scientific plotting.
- `src/animations/` — physics-linked animations.
- `src/content/` — lessons, references, and editable educational text.
- `src/data/` — default parameters and scenarios.
- `tests/` — verification, limiting cases, and invalid-input tests.
- `docs/` — scientific assumptions and development documentation.
- `README.md` — setup, editing, testing, and deployment.
- `AI_CONTEXT.md` — project architecture, conventions, and rules for future AI editors.
- `CHANGELOG.md` — significant changes and reasons.

You may adapt this structure to the selected framework, but keep physics, interface, content, and deployment concerns separated.

Use Anime.js and Motion only where their respective roles justify the dependencies. Check their current documentation and version compatibility before installing them. Avoid redundant animation systems.

Pin dependencies or otherwise make builds reproducible.

Provide a complete working source repository. Do not give me a single opaque HTML file if a modular application is more maintainable.

---

## 9. Make the website easy to edit with AI indefinitely

This is a core requirement.

I want to return to an AI coding assistant in the future and say things such as:
- “Add an interactive explanation of dynamic contact angle.”
- “Improve the trapped-gas animation.”
- “Add another validated electrolyte parameter set.”
- “Rewrite lesson three for a beginner.”
- “Fix this numerical error.”
- “Add a new comparison plot.”
- “Improve mobile navigation.”

The AI should be able to understand the existing project, make targeted edits, run tests, and publish a new version without rebuilding everything unnecessarily.

Implement the following:

1. Maintain a clear GitHub repository with readable source files.
2. Keep equations and numerical solvers in separate, documented modules.
3. Keep educational content and scenario presets in easy-to-edit files.
4. Include an `AI_CONTEXT.md` describing architecture, scientific conventions, testing requirements, and deployment instructions.
5. Include a clear `README.md` with exact setup and publishing steps.
6. Maintain a change log describing significant modifications.
7. Add automated tests for the core numerical model.
8. Require tests to pass before publishing changes.
9. Explain how to connect the repository to an AI coding assistant such as GitHub Copilot, Cursor, or Claude Code, depending on available access.
10. Use Git commits and branches or pull requests to preserve working versions and review changes.
11. Ensure GitHub Pages can automatically publish approved changes.
12. Avoid putting API keys, passwords, private credentials, or secrets in the public repository.

Important distinction: the public website does not need its own AI chatbot. I primarily want to use AI to edit the code and content in the repository. Do not add a live AI API integration unless I explicitly request it.

If an in-browser content editor is feasible, it may be offered as an optional enhancement, but do not pretend edits made in one visitor's browser automatically update the public site for everyone.

---

## 10. Verification and testing

Build the tests before declaring the solver complete.

### Analytical verification

For Mode A, compare the numerical solver with:

L² = r² Δp_total t / (4 μ)

Require relative error below 10⁻⁶ over an appropriate range of valid positive-drive cases, provided the implementation and numerical precision support this tolerance.

For Mode B, compare long-time numerical results with the exact equilibrium fill fraction to within 0.1% under appropriate conditions.

### Limiting cases

Test that:
- Doubling viscosity doubles filling time when other relevant quantities remain fixed.
- Doubling distance multiplies filling time by four.
- Doubling pore radius halves filling time under pure capillary drive.
- Doubling pore radius reduces filling time by a factor of four when the driving pressure is held fixed independently.
- Contact angle approaching 90° removes the spontaneous capillary drive.
- Non-wetting conditions do not produce an invalid negative filling time.
- Lower initial trapped-gas pressure increases the predicted equilibrium filling fraction.
- A vanishing trapped-gas pressure approaches the open-capillary limit under compatible conditions.
- Increasing numerical resolution or tightening solver tolerance produces convergent results.

### Input validation

Reject or clearly explain:
- Nonpositive pore radius.
- Nonpositive viscosity.
- Nonpositive surface tension.
- Invalid tortuosity.
- Impossible pore geometry.
- Invalid absolute pressures.
- Contact angles outside the permitted physical input range.
- Nonpositive target distance.
- Zero or negative total driving pressure.

Do not silently clamp inputs in ways that mislead the student.

### Physical validity indicators

Where relevant, display warnings for:
- Reynolds number and the limits of the laminar-flow approximation.
- Bond number and the neglect of gravity.
- The inertial start-up regime.
- Dynamic contact-angle effects.
- Very small pores where continuum and no-slip assumptions may become questionable.
- Idealized single-pore geometry.
- Uncertain pore-size distributions and tortuosity.

Use these warnings to teach, not to create a false impression of predictive certainty.

### Verification versus validation

The site must explain that verification tests whether the code correctly solves its stated equations, whereas validation assesses whether those equations describe the real physical system.

A verified capillary model is not automatically a validated battery-cell filling model.

---

## 11. Scientific validation and references

Use primary scientific literature and authoritative technical sources.

Start by reviewing and verifying the sources identified in the supplied engineering blueprint, including:

- Weydanz and colleagues' research on lithium-ion cell filling and neutron imaging.
- Technical University of Munich / FRM II material concerning accelerated electrolyte filling.
- Davoodabadi and colleagues' 2019 paper on electrolyte imbibition through lithium-ion battery electrodes.
- The 2015 International Journal of Molecular Sciences electrolyte-property source identified in the blueprint.
- Fries and Dreyer's work on Lucas–Washburn capillary-rise solutions.
- Ramakrishnan, Wu, Zhang, and Wasan's 2019 Journal of Fluid Mechanics paper on dynamics in closed and open capillaries.
- Relevant separator contact-angle research.

Confirm the exact title, authors, year, publication, DOI or stable URL, and the specific claim each source supports before citing it.

The blueprint reports that neutron imaging showed edge-inward wetting and approximately 50 minutes under vacuum versus approximately 100 minutes at normal pressure. Verify the original publication before displaying those numbers as literature findings.

Likewise, the reported difference in electrolyte uptake under vacuum and normal pressure must be attributed accurately to its original source.

Do not present a rough order-of-magnitude comparison as formal experimental validation.

Create a visible “Model versus Reality” panel that explains:
- Which predictions are analytical.
- Which outputs are numerical.
- Which parameter values are measured.
- Which parameters are assumed.
- What experimental observations are available.
- What the model cannot predict.
- Why real electrodes allow gas to escape through connected pores.

---

## 12. Accessibility, responsive design, and performance

The website must:
- Work on desktop, tablet, and mobile.
- Provide readable equations and charts on small screens.
- Have keyboard-accessible navigation and controls.
- Use descriptive labels and appropriate contrast.
- Avoid communicating meaning only through color.
- Support reduced-motion preferences.
- Include useful loading and error states.
- Avoid requiring account sign-in to use the published laboratory.
- Load reliably from a fresh browser session.
- Provide meaningful fallbacks if WebAssembly or a third-party animation library fails.
- Avoid unnecessary dependencies and excessive initial bundle size.

The application must not depend on data stored in my personal browser to function correctly for other visitors.

---

## 13. Required course documentation and final deliverables

My professor requires a publicly accessible website demonstration/documentation and a linked presentation with its verbatim auto-generated transcript. The assignment also requires documentation of the AI workflow, model comparison, scientific reasoning, and contributions.

Build the infrastructure for these requirements into the site from the beginning.

Deliver:

1. The complete working source code.
2. A polished, functioning interactive website.
3. A GitHub repository structure suitable for ongoing development.
4. A GitHub Pages deployment workflow.
5. The scientific model and documented equations.
6. Automated tests and their actual results.
7. A reproducible verification procedure.
8. All required interactive charts and animations.
9. A structured theory section and quiz.
10. AI-process documentation templates.
11. Presentation and transcript placeholders.
12. A verified scientific bibliography.
13. `README.md` and `AI_CONTEXT.md`.
14. A concise setup and publishing guide.
15. A list of unresolved scientific assumptions and remaining tasks.

Do not claim that the site is publicly deployed until the actual deployment has succeeded and its URL has been verified. If you cannot access my GitHub account or publish on my behalf, provide the complete repository files and exact instructions for me to deploy them.

---

## 14. Development workflow

Work in this order:

**Phase 1 — Inspect and plan**
- Read the supplied blueprint.
- Inspect all three design references.
- Audit the equations and baseline calculations.
- Identify scientific uncertainties.
- Choose the implementation architecture.
- Create a concise implementation plan.

**Phase 2 — Establish the scientific core**
- Implement the two model modes.
- Implement unit conversions and input validation.
- Write analytical, limiting-case, and numerical tests.
- Verify the reference calculations.
- Document any discrepancies before building the full interface.

**Phase 3 — Build the teaching experience**
- Implement the responsive site structure.
- Write the nine theory lessons.
- Build the interactive laboratory.
- Connect all controls to the numerical solver.
- Implement the charts and physics-linked animations.
- Add the guided challenge and quiz.

**Phase 4 — Add project evidence**
- Build the Code and Verification section.
- Create the AI Lab evidence templates.
- Add presentation and transcript placeholders.
- Build references, credits, and the contributions statement.

**Phase 5 — Test and publish**
- Run the automated tests.
- Test the application in a fresh browser session.
- Check mobile layouts, keyboard access, reduced motion, and loading failures.
- Verify every scientific citation and numerical claim.
- Configure GitHub Pages deployment.
- Confirm the deployed URL works without authentication.

Do not stop after producing a plan or a static prototype. Continue through implementation wherever the available tools and permissions permit.

If a real-world constraint prevents a step, explain the precise blocker and deliver the completed work that can be produced without it.

---

## 15. Acceptance criteria

The project is complete only when:

- The site is publicly accessible or is accompanied by a tested, deployable repository and clear publication instructions.
- Both capillary modes work with user-adjustable inputs.
- All plotted results derive from the actual solver.
- The numerical model passes its stated tests.
- The theory explains every equation and variable.
- The distinction between idealized pore filling and whole-cell wetting is clear.
- Scientific assumptions and uncertainty are disclosed.
- The AI comparison does not contain fabricated evidence.
- The video and transcript are placeholders until the actual materials exist.
- The references are traceable.
- The project can be edited, tested, and republished using a documented AI-assisted workflow.
- The website is visually cohesive, responsive, accessible, and genuinely useful for learning introductory fluid mechanics.

**Begin by inspecting the supplied engineering blueprint and the three design references. Then implement the complete website. Make sensible decisions without asking me to approve every minor detail. Ask only when an unresolved choice would materially change the scientific model or the required deliverable.**