# AISciMS Hub Advanced — Scientific Computing Platform

> **Live preview:** 🚀 **<https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/>**
>
> Available **24 hours a day, 7 days a week, 365 days a year** — no NDA required, no
> login, no signup, no tracking. Pure client-side: every computation runs in your
> browser, no data leaves your device.

[![Live Preview](https://img.shields.io/badge/preview-live%2024%2F7%2F365-success.svg?style=for-the-badge)](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/)
[![No NDA Required](https://img.shields.io/badge/access-no%20NDA-blue.svg?style=for-the-badge)](#access)
[![Pure Client-Side](https://img.shields.io/badge/architecture-pure%20client--side-9cf.svg?style=for-the-badge)](#architecture)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](#license)
[![GDPR Compliant](https://img.shields.io/badge/GDPR-compliant-blue.svg)](#compliance)
[![HIPAA Ready](https://img.shields.io/badge/HIPAA-ready-blue.svg)](#compliance)
[![SOC 2 Aligned](https://img.shields.io/badge/SOC%202-aligned-green.svg)](#compliance)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG%202.2%20AA-compliant-purple.svg)](#accessibility)

---

## 🌐 Live preview

| What | Where |
|------|-------|
| **Main landing page** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/> |
| **Demos hub** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/demos.html> |
| **Knowledge graph dashboard** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/dashboard.html> |
| **Audit dashboard** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/audit.html> |
| **Concept cards (v2)** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/concepts-v2/index.html> |
| **Weekly Science Digest** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/digest.html> |
| **Live journal feeds** | <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/feeds.html> |

The preview is hosted on GitHub Pages. It rebuilds automatically on every release. **No
downtime for maintenance** — every page is a static HTML file served from a CDN.

---

## 🎯 What this is

A **scientific computing platform** that lets researchers, students, clinicians, and
curious technologists explore:

- **18 interactive canvas components** — Bloch sphere, molecule 3D viewer, quantum
  teleportation, surface code lattice, VQC animator, segmentation pipeline, biomolecular
  dynamics, attention heatmap, Fock state viewer, coupled oscillator, and more
- **40+ concept cards** — visual-first explainers for ML loss functions, activations,
  optimisers, normalisations, attention, regularisations, and NN architectures (MLP,
  CNN, RNN, LSTM, GRU, Transformer, Autoencoder, VAE, GAN, ResNet, Diffusion)
- **8 research-paper concept cards** — BOLERO, scGPT, Geneformer, AlphaFold 3, Claude
  toxin binder, EditJumps, GeoWorld, Lab in the Loop, AMKD (multimodal knowledge
  distillation for cancer survival prediction)
- **Live journal RSS feeds** — 12 scientific journals (Nature, arXiv, PLOS, ScienceDaily)
  fetched every 6 hours and rendered as a unified timeline
- **Weekly Science Digest** — curated issue every Tuesday with 5 real recent papers +
  2 ML-derived futuristic visions, each with full ClickForDemo (Math → Code → Observe)
- **Cross-domain knowledge graph** — visualises connections between demos, papers,
  concepts, and phases
- **In-browser Python lab** (Pyodide) — runnable code with no install

---

## 🎨 Design principles

1. **Visual-first** — every concept is introduced with an animated canvas visualisation
   before any text or code. The user sees the concept in motion, then reads the math,
   then reads the code derived from the math.
2. **Math → Code** — every code block opens with a comment header mapping each math
   symbol to its code variable. `# y_i → y_true[i]  ŷ_i → y_pred[i]  n → len(y_true)`
3. **Deep thoughts** — every card ends with a USE WHEN / AVOID WHEN / WHY callout that
   explains *when* to apply the concept and *why* it works.
4. **Pure client-side** — no backend, no API keys, no login, no tracking. Every
   computation runs in your browser. Works offline once cached.
5. **Accessibility-first** — every `<canvas>` has an `aria-label`, every page loads
   `accessibility.js`, and `prefers-reduced-motion: reduce` is honoured across all 17+
   animated components (the `autoFreeze()` monkey-patch freezes RAF loops when active).

---

## 🧪 Try the highlights

### Research-paper concept cards (interactive)

| Card | What it shows |
|------|---------------|
| [**AMKD**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/concepts-v2/paper-amkd.html) | Multimodal knowledge distillation for cancer survival — multi-modal teacher → unimodal student with 4 cross-attention modules + loss-curve graph showing all 4 loss components over 100 training epochs |
| [**Heatmap + Dendrogram**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/concepts-v2/viz-heatmap-dendrogram.html) | Animated agglomerative clustering playthrough — dendrogram grows bottom-up + heatmap reorders to match + cluster boundaries + cluster state panel showing live values |
| [**GeoWorld**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/geoworld.html) | Geometric world models for robotics — rotating 3D point cloud + articulated robot arm + gradient energy landscape + animated action sequence + feedback loop |
| [**BOLERO**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/bolero.html) | Cell-state-conditioned sequence-to-function Transformer — 6-stage pipeline + real t-SNE UMAP (computed in vanilla JS) + virtual DNA editing with regulatory motifs |
| [**scGPT**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/scgpt.html) | Single-cell foundation model — inference UI for cell-type prediction (simulated distilled model) |
| [**AlphaFold 3**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/alphafold3.html) | Multi-molecule structure prediction — 6-stage pipeline with diffusion noise + 3-atom output complex |
| [**Claude toxin binder**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/claude-toxin.html) | Key-and-lock enzyme binding — animated binder-toxin binding with pulsing hotspots |
| [**EditJumps**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/editjumps.html) | CRISPR antibody affinity maturation — gradient residue tiles + animated autoregressive Edit Flow |
| [**Lab in the Loop**](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/lab-in-the-loop.html) | Closed-loop AI drug discovery — 6-node circular pipeline with 3D RSI gauge + flowing particle trails |

### Concept cards (v2 grid)

Browse all 40+ at <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/concepts-v2/index.html> — including:
- 9 ML loss functions (MSE, MAE, BCE, CCE, Hinge, Log-Cosh, Huber, KL, Cosine)
- 3 activations (ReLU, GELU, SwiGLU, Sigmoid, Tanh)
- 3 optimisers (SGD, Adam, AdamW) with live convergence animation
- 5 normalisations (BatchNorm, LayerNorm, RMSNorm, GroupNorm, InstanceNorm)
- 3 attention (Scaled-Dot-Product, Multi-Head, Flash)
- 2 regularisation (Dropout, L1-L2)
- 11 NN architectures (MLP, CNN, RNN, LSTM, GRU, Transformer, Autoencoder, VAE, GAN, ResNet, Diffusion) — each with loss-curve + inflection-math panel
- CoCoNet (conformal prediction), AMKD, Heatmap+Dendrogram

### Quantum Shorts channel

[Bloch Sphere Shorts](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/bloch.html) — a glowing 3D Bloch sphere that animates 9 canonical scenes of quantum computing:
ground state, Hadamard, Rabi oscillation, phase gate, measurement collapse, decoherence,
Bell state, Bell singlet, CHSH violation. Hit ▶ Play to watch, then Record WebM to
download a 9:16 shorts clip.

---

## 📊 Audit dashboard

The platform reports its own health at
<https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/audit.html> — 66 automated
checks covering HTML well-formedness, ribbon presence, math-derivation blocks, JS
syntax, internal-link integrity, accessibility (aria-labels + accessibility.js + reduced
motion CSS), public-repo file-type rule, NN card enrichment, particle-bg extraction, and
more. As of the latest release: **66/66 checks pass**.

---

## 🏗️ Architecture

### Pure client-side

- **No backend** — every page is a static HTML file served from GitHub Pages CDN
- **No API keys** — no Google Analytics, no OpenAI API, no external services
- **No login** — no signup, no cookies, no fingerprinting
- **No tracking** — GDPR/HIPAA/SOC 2 compliant by design
- **Lazy evaluation** — every demo + concept card only computes when you click "Play"

### 254 HTML pages, 37 shared JS modules, 42 JSON data files

```
docs/
├── 254 HTML pages (paper cards, concept cards, demos, hubs, science pages)
├── 37 JS modules (canvas components, accessibility, particle-bg, zoom-loader, ...)
├── 42 JSON data files (feeds snapshots, search index, digest manifest, ...)
└── assets (svg logo, robots.txt, .nojekyll)
```

### Shared infrastructure

- **`particle-bg.js`** — Phase 41 algorithm (depth + parallax + radial-gradient halos +
  constellation lines) shared across 174 pages. Honours `prefers-reduced-motion`.
- **`accessibility.js`** — exposes `AIHPC_A11Y.reducedMotion()` +
  `AIHPC_A11Y.announce()` + `autoFreeze()` (monkey-patches RAF when reduced motion is
  active so all 17+ canvas components automatically render a single static frame).
- **`header-banner.js`** — auto-injects a contextual visual header (detects topic:
  quantum / DNA / neural / physics / etc.) on every page.
- **`zoom-loader.js`** — auto-injects zoom controls (±/reset + keyboard shortcuts) on
  every page with a canvas.

---

## ♿ Accessibility

- **397/397 `<canvas>` tags have `aria-label`** (WCAG 2.2 AA compliance)
- **238/238 pages load `accessibility.js`** (digest/archive/ snapshots excluded as
  frozen historical artifacts)
- **238/238 pages have `prefers-reduced-motion` CSS** that hides the particle background
  and reduces all animation/transition durations to 0.01ms
- **`autoFreeze()`** monkey-patches `requestAnimationFrame` + `setInterval` when
  `prefers-reduced-motion: reduce` is active — catches all 17+ canvas components
  without per-file patches

---

## 🔒 Compliance

| Standard | Status |
|----------|--------|
| **GDPR** | ✅ Compliant — no personal data, no cookies, no tracking |
| **HIPAA** | ✅ Ready — all computations client-side; no PHI leaves the browser |
| **SOC 2** | ✅ Aligned — pure client-side architecture eliminates most SOC 2 control surfaces |
| **MIT License** | ✅ Applied to all code in this public mirror |

---

## 🎓 Who is this for

- **Researchers** — explore the latest multimodal ML / quantum / bioinformatics papers
  with runnable code derived from the math
- **Students** — learn ML/NN/quantum concepts visually with animated derivations +
  runnable Python (Pyodide, no install)
- **Clinicians** — see how AI models like AMKD (cancer survival prediction) work, with
  honest USE WHEN / AVOID WHEN guidance
- **Curious technologists** — explore 18 interactive canvas components and 40+
  concept cards without signup or tracking
- **Potential funders / collaborators** — assess what the platform can do, end-to-end,
  before any commitment

---

## 📅 Release cadence

The platform is under active development. New concept cards, demos, and paper
visualisations ship every few weeks. The Live Journal Feeds refresh automatically every
6 hours via GitHub Actions cron.

Recent phases:
- **Phase 45** — AMKD card now has loss-curve graph + heatmap presentation improvements
- **Phase 44** — 2 new concept cards: AMKD (multimodal KD) + Heatmap+Dendrogram
- **Phase 43** — extracted 172 inlined particle-bg IIFEs into shared `particle-bg.js`
- **Phase 42** — NN card enrichment + dual-repo realignment + accessibility rollout
- **Phase 41** — animation clarity on 7 paper pages (gradients, glow, smooth transitions)

See the [platform timeline](https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/timeline.html)
for the full 50-phase history.

---

## 📞 Contact

- **Email:** <testdemoqwenai2025@gmail.com>
- **Live preview:** <https://testdemoqwenai2025-creator.github.io/DemoAISciMShub/>
- **GitHub (this public mirror):** <https://github.com/testdemoqwenai2025-creator/DemoAISciMShub>

For partnership, collaboration, or funding discussions, please email the address above.
The platform is available for evaluation 24/7/365 — no NDA required to access the public
preview.

---

## 📄 License

MIT License — © 2026 AISciMS Hub Advanced. All rights reserved.

The platform's source-of-truth lives in a private repository. This public mirror
contains only web files (`.html`, `.css`, `.js`, `.json`, image formats). See the
`.gitignore` for the file-type rule.
