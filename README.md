# AIHPC Advanced — Scientific Computing Platform

> Public preview mirror of the AIHPC Advanced scientific computing platform.
> Source-of-truth lives in the **private** [`AIHPC-Advanced`](https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced)
> repository. This repository (`DemoAIHPC`) is a synced public mirror intended
> for preview by interested parties **without an NDA** in place.

[![Public Mirror](https://img.shields.io/badge/repo-public%20mirror-success.svg)](https://github.com/testdemoqwenai2025-creator/DemoAIHPC)
[![Source of Truth](https://img.shields.io/badge/source-private%20repo-important.svg)](https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey.svg)](#license)
[![Web-only Files](https://img.shields.io/badge/public%20repo-web%20files%20only-blue.svg)](#dual-repository-workflow)

> **⚠️ Phase 42 file-type rule** (enforced from 2026-10-22 onward):
> This public mirror contains **only web files** — `.html`, `.css`, `.js`,
> `.json` (runtime data), and image formats (`.png`, `.svg`, `.gif`, `.jpg`).
> All source code (Python scripts, TypeScript, package configs, internal docs,
> worklogs, preview images) lives exclusively in the private source-of-truth
> repository. The `.gitignore` in this repo enforces the rule — see
> [Dual-repository workflow](#dual-repository-workflow) for details.

---

## Table of contents

1. [Overview](#overview)
2. [Dual-repository workflow](#dual-repository-workflow)
3. [Repository map](#repository-map)
4. [Features](#features)
5. [Tech stack](#tech-stack)
6. [Project structure](#project-structure)
7. [Getting started](#getting-started)
8. [Pages](#pages)
9. [Dark / light theme](#dark--light-theme)
10. [Compliance (GDPR &amp; HIPAA)](#compliance-gdpr--hipaa)
11. [Contact](#contact)
12. [License](#license)

---

## Overview

AIHPC Advanced is a unified scientific computing platform that bundles
bioinformatics, cheminformatics, molecular modelling and materials-science
workflows behind one polyglot microservices architecture, integrated with the
AETHEL (Advanced Experimental Theoretical Hypercomputing Emulation Layer)
hypercomputing layer.

The platform is being released as two repositories:

| Repository | Visibility | Purpose |
|------------|------------|---------|
| `AIHPC-Advanced` | **Private** | Source of truth — all code changes, worklogs, internal assets (.txt, .md, .png captured from the studio IDE) live here. Access requires an NDA. |
| `DemoAIHPC` | **Public** | Synced mirror for preview without an NDA. Functionally identical to the private repo at `HEAD`. |

---

## Dual-repository workflow

The two repositories are kept in sync: every push to the private
`AIHPC-Advanced` repository is mirrored to the public `DemoAIHPC` repository,
so the two are functionally identical at `HEAD`.

This separation keeps legal scenarios simple:

- **External reviewers** interact with the public mirror.
- **Contributors** work in the private repository; their commits propagate
  automatically to the public mirror on every push.

> All code, worklogs, and assets (`.txt`, `.md`, `.png`, ...) are committed to
> the private `AIHPC-Advanced` repository first, then mirrored to the public
> `DemoAIHPC` repository.

---

## Repository map

| What | URL |
|------|-----|
| Public preview (this repo) | <https://github.com/testdemoqwenai2025-creator/DemoAIHPC> |
| Private source-of-truth | <https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced> |
| GitHub preview endpoint (public) | <https://testdemoqwenai2025-creator.github.io/DemoAIHPC/> |
| Original reference archive | <https://github.com/testdemoqwenai2025-creator/AETH-1-Content-Archive> |

---

## Features

- **Polyglot microservices platform** — Golang, Elixir, Python, Scala, Rust, C
  each used where they are strongest.
- **AETHEL integration** — quantum circuit simulation, neural architecture
  search, automated hypothesis generation, cross-domain knowledge graph,
  predictive model ensembles, citation network analysis.
- **AETHEL Suite (every AETHEL surface, deep-linkable)** — AETHEL
  Connector, Scientific Connectors Hub, Query Executor, Knowledge Graph,
  Domain Workflows. Originally embedded as tabs in the home page, now
  each migrated to its own route under `/aethel`, `/connectors`, `/query`,
  `/knowledge-graph`, `/workflows`.
- **Science group (surpass AETHEL)** — Alpha-family-inspired modern AI for
  science: Proteins (AlphaFold 3), Genetics (AlphaMissense), Nucleotides
  (RNAfold / Nucleotide Transformer), Mathematics (AlphaProof). Each has
  its own route under `/science/*` documenting inputs, outputs, method,
  and observability. Live execution lands in later phases.
- **Top ribbon** — three grouped dropdowns (Platform / AETHEL Suite /
  Science), dark/light theme toggle, search affordance, Login, Get
  Started CTA. Rendered from `RootLayout` so it appears on every page.
- **Live, observable demos** — each demo is a first-class artifact with
  provenance: math → code → annotations → observability → downloadable
  result. The first seed demo (Ordinary Least Squares) is embedded live in
  the GitHub Pages preview at
  <https://testdemoqwenai2025-creator.github.io/DemoAIHPC/> and is also
  available in the Next.js app at `/demos/linear-regression`.
- **Scientific connectors hub** — bioinformatics, cheminformatics, molecular
  modelling, materials science.
- **Knowledge graph visualization** — interactive cross-domain graph.
- **Domain workflows** — pre-built workflow templates per scientific domain.
- **Query executor** — natural-language + structured query interface.
- **About page** — explains the platform, dual-repo workflow and compliance
  posture.
- **Dark / light theme toggle on every page** — global toggle in the top
  ribbon, persisted to `localStorage`.
- **Compliance footer on every page** — GDPR, HIPAA, contact e-mail, and a
  "Return to Home" button.
- **Global site navigation** — top ribbon (Platform / AETHEL Suite /
  Science dropdowns) + footer navigation.
- **Math→Code derivation on every science sub-page (Phase 23)** — all
  22 `/science/*` sub-pages now carry a 5-step derivation block that
  shows how the page's algorithm follows from its mathematical
  expression. The pattern was pioneered on `/science/maths/geometry`
  (tesseract 4D → 3D → 2D projection chain) and propagated to all
  other sub-pages by `scripts/gen-math-derivations.py`. Each
  derivation is domain-specific: neighbour-joining for evolutionary,
  Otsu for imaging, RK4 for systems, Verlet for computational,
  Graham scan for materials, SMILES parsing for organic, Arrhenius
  for physical, Euclid for algebra, trapezoidal for analysis,
  Miller-Rabin for number-theory, Metropolis-Hastings for
  probability, Euler-Lagrange for mechanics, Hadamard for quantum,
  STFT for sound, N-body for space, Maxwell-Boltzmann for thermo,
  FFT for waves — and the central-dogma codon table for molecular.
- **DAG provenance chain (Phase 23)** — the
  `/concepts/provenance-chain` concept card is upgraded from a linear
  7-node chain to a 10-node directed acyclic graph (DAG) with 5
  layers, joins, and forks. Layer assignment uses longest-path-from-
  source; topological traversal uses Kahn's algorithm. The JSON-LD
  receipt now uses `prov:`/`aihpc:` namespaces and emits per-node
  `inputs[]` arrays.
- **`<TemporalGraph>` reusable component (Phase 21+, ported in
  Phase 23)** — extracted from the static `dashboard.html` in Phase 21
  and now used by both `/benchmark` (phase metrics over time) and
  `/dashboard` (AETHEL knowledge-graph evolution). The Next.js
  `/dashboard` route renders the same 10 timesteps as the GitHub
  Pages `dashboard.html`, unifying the codebase around a single
  temporal-visualisation component.
- **Live subscription gating (Phase 24)** — the "Download Receipt"
  buttons on the lazy-eval popup and the nucleotide demo now read
  the `/subscribe` session (stored in `localStorage` under
  `aihpc-session`) and tier-gate the download:
  - **Free** tier → clicks show a dismissible bottom-right banner
    with a "→ Upgrade at /subscribe" link.
  - **Pro** tier → downloads a JSON receipt with
    `traceAvailable: 'team-tier'` (audit trail held back).
  - **Team** tier → downloads the full receipt with
    `trace: { steps, format, entries }` (per-step audit trail).
  The shared `docs/subscribe-gate.js` library exposes
  `AIHPC.requireTier()`, `AIHPC.getTier()`, `AIHPC.getSession()`,
  `AIHPC.mountTierBadge()`, `AIHPC.onChange()` — reusable for any
  future gated feature. Cross-tab session updates propagate via
  the `storage` event listener.
- **Weekly Science Digest (Phase 25, 26)** — every Tuesday AIHPC
  Advanced publishes a curated digest of 5–7 of the most promising
  recent articles across Nature, Science, The Lancet, arXiv,
  bioRxiv, and the domain journals. Each article ships with:
  - Real publication metadata (source, DOI, authors, date, URL)
  - 2–3 paragraph abstract
  - Open dataset card (name, format, size, download URL)
  - Full ClickForDemo: Math tab with 5-step Math→Code derivation,
    Code tab with 6-language polyglot (Python / Rust / Go / C /
    Elixir / Scala), Observe tab with Stats / Reports / Graphs /
    Summary sub-tabs.
  Issue #2 (2026-10-27) adds 2 ML-derived futuristic visions —
  extrapolations from recent ML/AI trends, clearly marked with a 🚀
  pill, NOT real publications. Issue #2 covers: ESM-3 (Science,
  k-mer tokeniser demo), AlphaMissense clinical pilot (Lancet,
  pathogenicity ensemble demo), ITER D-T first plasma (Nuclear
  Fusion, Lawson triple-product demo), NANOGrav gravitational-wave
  background (PRL, Hellings-Downs curve demo), AlphaProof IMO
  silver (Nature, neuro-symbolic search demo), plus futuristic
  visions: 2028 patient-specific drug-design pipeline, 2027 top-500
  exoplanet atmosphere catalog.
  RSS feed (RSS 2.0) at /digest.rss; JSON Feed 1.1 at /digest.json.
  Past issues auto-archived at /digest/archive/issue-NNN.html with
  `<base href>` for correct path resolution. Archive index at
  /digest/archive/index.html. The generator `scripts/gen-digest.py`
  is reproducible — future weekly issues are just an updated
  `MANIFEST` dict and a re-run.
- **Application audit script (Phase 26)** — `scripts/audit.py`
  runs 14 checks: HTML div balance, script/style balance (via
  html.parser — false-positive immune), standard ribbon presence
  on every page, subscribe-gate.js loaded on gated pages, 5-step
  Math→Code derivations on all 22 science sub-pages, particle-bg
  JS syntax (via `node --check`), .git/config token-free, internal
  link reachability (honours `<base href>`), all 5 seed demos
  present, digest has full ClickForDemo pattern, Weekly Digest in
  Insights dropdown on all 52 pages, all 4 generator scripts
  valid, DAG provenance chain, Next.js /dashboard uses
  `<TemporalGraph>`. Exit code 0/1 for CI integration.
- **N-D hypercube viewer (Phase 26)** — `/science/maths/geometry`
  upgraded from a 4D-only tesseract viewer to a full N-D viewer
  (dimensions 4–10). Slider + preset buttons (4D Tesseract, 5D
  Penteract, 6D Hexeract, 8D Octeract, 10D Decaeract). Generalised
  rotation (N-1 planes, each involving the highest axis) and a
  chain of N-2 perspective projections. Combinatorics table shows
  vertices/edges/faces/cells for N=4 through 10 (1024 vertices at
  N=10). Second 5-step Math→Code derivation block specifically for
  the N-D generalisation.
- **ETL/ELT on every digest article (Phase 27)** — each article in
  the Weekly Science Digest now has a "📁 Bring your own dataset"
  panel. Users upload their own file (PDB / VCF / GFA / Lean source
  / FASTA protein / CSV strain/spectrum/timing/catalog / Python
  source / BED / FASTA genome) and the appropriate parser runs
  client-side. Parsed stats appear in a new "ETL Report" sub-tab
  in the Observe panel. Pure client-side — no data leaves the
  browser; the AIHPC data-residency posture is preserved. The
  shared `docs/digest-parsers.js` (27 KB) registers 11 file-format
  parsers; `handleETLUpload()` is the main entry point.
- **RSS subscribe UX (Phase 27)** — the digest page now has a
  prominent subscribe panel at the top: copyable RSS URL (canonical
  `…/digest.rss`), "📋 Copy URL" button, quick-links to Feedly +
  Inoreader (with the feed URL pre-populated), and direct links to
  the JSON Feed + past-issues Archive.
- **Audit script extended to 17 checks (Phase 27)** — `scripts/audit.py`
  added 3 new checks (digest-parsers.js loaded + 11 parsers valid,
  7 ETL panels balanced, RSS subscribe panel present). Exit code
  0/1 for CI integration.
- **CI audit gate + audit dashboard + animated-derivation clips
  (Phase 28)** — three new quality + UX features:
  - **CI audit gate**: every `v*` tag push now runs `audit.py` (19
    checks) between `secret-scan` and `mirror-to-public`. The mirror
    push to DemoAIHPC is blocked if any check fails. Audit results
    are uploaded as a workflow artifact (30-day retention) + shown
    in the GitHub Actions step summary.
  - **Audit dashboard** (`/audit.html`): live status board rendering
    the 19 audit results — total/passed/failed summary cards + per-
    check rows (green ✓ / red ✗) + last-run timestamp + commit SHA.
    Linked from the Insights dropdown on every page (`📊 Audit
    Dashboard`). Auto-regenerated by `scripts/gen-audit-dashboard.py`
    with each release.
  - **Animated-derivation clips**: every page with a 5-step Math→Code
    derivation (26 pages — all 22 science sub-pages + the digest +
    3 demo pages) now has a `<canvas>`-based "video clip" of the
    derivation with Play / Pause / Replay / Record-WebM controls.
    Inspired by the Hugging Face `tissuedecision-9b` Gradio space.
    Each step fades in at a staggered interval (~2.4 s per step),
    the math equation types in with a typewriter effect, and the
    explain text word-wraps + fades in. The "Record WebM" button
    uses `canvas.captureStream()` → `MediaRecorder` → Blob →
    downloadable `.webm` — pure client-side, no external services,
    data stays in the browser. Shared `docs/animated-derivation.js`
    (12.9 KB) exposes `AIHPC_ANIM.register()`, `.init()`, `.play()`,
    `.pause()`, `.replay()`, `.record()`. Batch-applied by
    `scripts/embed-animated-derivations.py` (idempotent).

## Demo framework (Phase 2)

Every demo is defined declaratively by a `DemoManifest` (see
`src/lib/demos/manifest.ts`) covering:

1. **Meta** — id, title, domain, tags, difficulty, audience.
2. **Math** — LaTeX source + plain-language restatement.
3. **Code** — language, source, editable inputs.
4. **Annotations** — audience-specific (student / researcher / executive).
5. **Datasets** — references to web datasets or in-browser private uploads.
6. **Observability** — metric and trace specs the runtime emits.
7. **Reports** — supported output formats (CSV / summary / blog / paper).
8. **Runtime** — `browser` (default, no external services) or
   `server-sandboxed` (future, gated on external hosting).
9. **Data residency** — currently always `downloadable`. Outputs are
   offered as browser-side downloads; nothing is persisted server-side.

### Data residency

The first locked-in principle of the demo framework is: **outputs are
downloadable, never stored server-side**. When a user runs a private dataset
through a public demo:

- The dataset is loaded into the browser tab only (file upload via the
  `<input type="file">` API, or in-table editing).
- The computation runs in the browser (pure JS for now; Pyodide for Python
  in a later phase).
- The result is offered as a download (CSV / JSON Blob via
  `URL.createObjectURL`).
- Nothing transits a server. No PHI. No personal data. No storage cost. No
  retention policy to enforce.

This sidesteps HIPAA / GDPR exposure for the public preview. When external
hosting (Vercel / GCP / Azure) is added in a later phase, the
`dataResidency` field on `DemoManifest` will admit `server-persisted` and
`ephemeral` options — and only then will demos that need them be added.

For NDA-protected scenarios or datasets too large for in-browser execution,
contact <testdemoqwenai2025@gmail.com>.

### Seed demo

- **`linear-regression`** — Ordinary Least Squares (closed form). Mirrors the
  embedded demo in `docs/index.html`.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + `tw-animate-css`
- **UI primitives:** shadcn/ui (Radix UI + Tailwind)
- **Database:** Prisma ORM (SQLite at `db/custom.db` for the demo)
- **Fonts:** Geist Sans + Geist Mono (Next.js Google Fonts)
- **Theme:** Custom ThemeProvider (`src/components/site/ThemeProvider.tsx`)
  toggling the `.dark` class on `<html>` and persisting to `localStorage`.

---

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout — wraps every page with ThemeProvider + SiteNav + SiteFooter
│   │   ├── page.tsx             # Home — microservices dashboard / landing
│   │   ├── about/page.tsx       # About page
│   │   ├── demos/
│   │   │   ├── page.tsx         # Demos listing
│   │   │   └── [id]/page.tsx    # Single demo view (SSG)
│   │   ├── preview1/page.tsx    # Static sci-fi themed preview
│   │   ├── api/route.ts         # API route
│   │   └── globals.css          # Tailwind + shadcn tokens (:root and .dark)
│   ├── components/
│   │   ├── site/
│   │   │   ├── ThemeProvider.tsx # Global theme context (dark / light)
│   │   │   ├── SiteNav.tsx       # Global top navigation + theme toggle
│   │   │   └── SiteFooter.tsx    # Global footer (GDPR / HIPAA / contact / return home)
│   │   ├── demos/
│   │   │   └── DemoRunner.tsx    # 4-panel demo renderer + browser-side execution
│   │   ├── layout/
│   │   │   ├── GlobalNavbar.tsx        # In-app navigation (view mode, search)
│   │   │   └── EnhancedLandingPage.tsx # Landing view
│   │   ├── aethel/AETHELConnector.tsx
│   │   ├── connectors/ScientificConnectorsHub.tsx
│   │   ├── query/QueryExecutor.tsx
│   │   ├── visualization/KnowledgeGraph.tsx
│   │   ├── workflows/DomainWorkflows.tsx
│   │   ├── auth/AuthContext.tsx
│   │   └── ui/                  # shadcn/ui primitives
│   ├── lib/
│   │   └── demos/
│   │       ├── manifest.ts      # DemoManifest TypeScript schema
│   │       ├── registry.ts     # Demo registry (single source of truth)
│   │       └── seeds/
│   │           └── linear-regression.ts  # Seed demo #01 — OLS
│   ├── hooks/
│   └── lib/
├── prisma/schema.prisma
├── docs/                        # Static GitHub Pages content (live preview)
│   ├── index.html              # Landing page with embedded working OLS demo
│   └── .nojekyll
├── examples/websocket/          # Example WebSocket server + frontend
├── tests/                       # Build & runtime scripts
├── download/                    # Captured outputs (README.md, dump.txt)
├── tool-results/                # Read captures from the studio IDE
├── public/                      # Static assets (logo.svg, robots.txt)
├── worklog.md                   # Project worklog & strategic documentation
├── README-DEMO1.md              # Demo1 release notes
├── README.md                    # This file
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── Caddyfile                    # Reverse proxy config
```

---

## Getting started

### Prerequisites

- Node.js 18.18+ (or Bun)
- npm / bun

### Install dependencies

```bash
npm install
# or
bun install
```

### Run the database migrations (Prisma)

```bash
npm run db:generate
npm run db:push
```

### Start the dev server

```bash
npm run dev
```

The app is served at <http://localhost:3000>.

### Build for production

```bash
npm run build
npm start
```

---

## Pages

The application is a **multi-page application (MPA)** — each page is a
distinct URL. Next.js provides 27 routes; the GitHub Pages preview
serves a static mirror for the landing, dashboard, and concept cards.

| Path | Description |
|------|-------------|
| `/` | Home — landing view + microservices dashboard with AETHEL integration, knowledge graph, connectors, query executor, domain workflows. |
| `/about` | About — explains the platform, dual-repo workflow, AETHEL integration, polyglot stack, compliance and contact. |
| `/demos` | Demos listing — cards for every demo in the registry. |
| `/demos/[id]` | Single demo — 4-panel layout (math, code, annotations, observability) + Run + Download CSV. |
| `/microservices` | Microservices dashboard gateway — links into the home-page tab system. |
| `/aethel` | AETHEL Connector — hypercomputing emulation layer (migrated from home tab). |
| `/connectors` | Scientific Connectors Hub — bio / chem / molecular / materials connectors (migrated). |
| `/query` | Query Executor — natural-language + structured query (migrated). |
| `/knowledge-graph` | Knowledge Graph — interactive cross-domain 2.4M-node graph (migrated). |
| `/workflows` | Domain Workflows — pre-built scientific workflow templates (migrated). |
| `/science/biology` | **Biology Hub** — Molecular / Genetics / Proteins / Cell Imaging / Systems / Evolutionary. |
| `/science/biology/molecular` | Molecular Biology — central dogma, transcription, translation. Has animated DNA helix + polyglot code. |
| `/science/biology/imaging` | Cell Imaging — microscopy segmentation, denoising, super-resolution. |
| `/science/biology/systems` | Systems Biology — pathway modelling, ODE/SDE, FBA. |
| `/science/biology/evolutionary` | Evolutionary Biology — phylogenetics, MSA, dN/dS. |
| `/science/chemistry` | **Chemistry Hub** — Organic / Inorganic / Physical / Analytical / Materials / Computational. |
| `/science/chemistry/organic` | Organic Chemistry — reaction prediction, retrosynthesis, SMILES. |
| `/science/chemistry/inorganic` | Inorganic Chemistry — crystal-structure prediction, GNoME-style. |
| `/science/chemistry/physical` | Physical Chemistry — thermodynamics, kinetics, quantum. |
| `/science/chemistry/analytical` | Analytical Chemistry — NMR / MS / IR spectrum processing. |
| `/science/chemistry/materials` | Materials Chemistry — batteries, catalysts, polymers. |
| `/science/chemistry/computational` | Computational Chemistry — MD, DFT, FEP. |
| `/science/physics` | **Physics Hub** — Space / Waves / Sound / Mechanics / Quantum / Thermo. |
| `/science/physics/space` | Space & Astrophysics — orbital mechanics, N-body, exoplanet transits. |
| `/science/physics/waves` | Waves & Optics — EM spectrum, diffraction, FFT spectroscopy. |
| `/science/physics/sound` | Sound & Acoustics — wave equation, room acoustics, STFT. |
| `/science/physics/mechanics` | Mechanics — rigid-body dynamics, Lagrangian/Hamiltonian. |
| `/science/physics/quantum` | Quantum — Schrödinger, quantum circuits, VQE. |
| `/science/physics/thermo` | Thermodynamics — equations of state, phase equilibria, MCMC. |
| `/science/maths` | Mathematics Hub — Theorem proving / Algebra / Analysis / Geometry / Number theory / Probability. |
| `/science/maths/algebra` | Algebra — group theory, Gröbner bases. |
| `/science/maths/analysis` | Analysis — real/complex analysis, PDE solvers. |
| `/science/maths/geometry` | Geometry — AlphaGeometry-style, differential geometry. |
| `/science/maths/number-theory` | Number Theory — primality, ECC, L-functions. |
| `/science/maths/probability` | Probability & Statistics — stochastic processes, MCMC. |
| `/dashboard` | **Temporal RDF Knowledge Graph Dashboard** — replayable decision traces with play / replay / scrub, knowledge tracing. Inspired by FoundationCapital / Aktiver context graphs. |
| `/concepts` | **Concept Cards** index — deeper thoughts with the evolution of each subject, paired with hypothetical demos. |
| `/concepts/replayable-decision-traces` | Replayable Decision Traces — the foundational concept. |
| `/concepts/provenance-first` | Provenance-First Computing — reproducibility as the substrate. |
| `/concepts/lazy-evaluation` | Lazy Evaluation as a UX Primitive — the "feels alive" property. |
| `/concepts/cross-domain-graph` | Cross-Domain Knowledge Graph — composability across scientific fields. |
| `/concepts/audience-annotations` | Audience-Specific Annotations — student / researcher / executive. |
| `/login` | Login — placeholder for auth (deferred per the "no external services" constraint). |
| `/preview1` | Static sci-fi themed preview page (Hero, Features, Domains, Architecture, Pricing, CTA). |
| `/api` | API route. |

In addition, the **GitHub Pages preview endpoint** at
<https://testdemoqwenai2025-creator.github.io/DemoAIHPC/> serves a static
multi-page site from `/docs`:

- `/docs/index.html` — landing page with ribbon + embedded working OLS demo.
- `/docs/dashboard.html` — the temporal RDF knowledge graph dashboard with play / replay / scrub / knowledge tracing / decision traces.
- `/docs/concepts.html` — Concept Cards index.
- `/docs/concepts/replayable-decision-traces.html` — the foundational concept + hypothetical demo (replay the OLS trace as a growing graph).
- `/docs/concepts/provenance-first.html` — provenance receipt sketch.
- `/docs/concepts/lazy-evaluation.html` — streaming "thinking…" tokens demo.
- `/docs/concepts/cross-domain-graph.html` — 2-hop neighbourhood per demo card.
- `/docs/concepts/audience-annotations.html` — k-means audience toggle demo.

All static pages share the same ribbon (Platform / AETHEL Suite / Science
/ Insights dropdowns + dark/light toggle + Login + Get Started) and
the same `aihpc-theme` localStorage key as the Next.js app.

---

## Dark / light theme

A global theme toggle is rendered in the top navigation bar on **every page**
via `src/components/site/SiteNav.tsx`. The chosen theme is persisted to
`localStorage` under the `aihpc-theme` key and applied by toggling the `.dark`
class on the `<html>` element. The shadcn/ui design tokens defined in
`src/app/globals.css` (`:root` for light, `.dark` for dark) drive all
theme-aware components.

The in-page dark mode toggle inside the home page (`src/app/page.tsx` →
`GlobalNavbar`) is wired to the same `ThemeProvider` context, so the global
toggle and the in-app toggle stay in sync.

---

## Compliance (GDPR & HIPAA)

The global footer (`src/components/site/SiteFooter.tsx`) renders on every page
and surfaces the compliance posture:

- **GDPR** — The public preview does not collect personal data. A Data
  Processing Agreement (DPA) is available for enterprise deployments.
- **HIPAA** — No PHI is processed by the public preview. A Business Associate
  Agreement (BAA) is available for regulated workloads.
- **Contact** — `testdemoqwenai2025@gmail.com`
- **Return to Home** — A "Return to Home" button is always available in the
  footer.

---

## Contact

- E-mail: <testdemoqwenai2025@gmail.com>
- Public mirror: <https://github.com/testdemoqwenai2025-creator/DemoAIHPC>
- Private source-of-truth: <https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced>
- GitHub Pages preview endpoint: <https://testdemoqwenai2025-creator.github.io/DemoAIHPC/>

---

## License

Proprietary. The code in this repository is made available for preview purposes
only. All rights reserved by the AIHPC Advanced authors. See the
`worklog.md` for the strategic context and roadmap.
