# AIHPC Advanced — Scientific Computing Platform

> Public preview mirror of the AIHPC Advanced scientific computing platform.
> Source-of-truth lives in the **private** [`AIHPC-Advanced`](https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced)
> repository. This repository (`DemoAIHPC`) is a synced public mirror intended
> for preview by interested parties **without an NDA** in place.

[![Public Mirror](https://img.shields.io/badge/repo-public%20mirror-success.svg)](https://github.com/testdemoqwenai2025-creator/DemoAIHPC)
[![Source of Truth](https://img.shields.io/badge/source-private%20repo-important.svg)](https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey.svg)](#license)

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
- **Scientific connectors hub** — bioinformatics, cheminformatics, molecular
  modelling, materials science.
- **Knowledge graph visualization** — interactive cross-domain graph.
- **Domain workflows** — pre-built workflow templates per scientific domain.
- **Query executor** — natural-language + structured query interface.
- **About page** — explains the platform, dual-repo workflow and compliance
  posture.
- **Dark / light theme toggle on every page** — global toggle in the top
  navigation bar, persisted to `localStorage`.
- **Compliance footer on every page** — GDPR, HIPAA, contact e-mail, and a
  "Return to Home" button.
- **Global site navigation** — Home / About / Preview 1.

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
│   │   ├── preview1/page.tsx    # Static sci-fi themed preview
│   │   ├── api/route.ts         # API route
│   │   └── globals.css          # Tailwind + shadcn tokens (:root and .dark)
│   ├── components/
│   │   ├── site/
│   │   │   ├── ThemeProvider.tsx # Global theme context (dark / light)
│   │   │   ├── SiteNav.tsx       # Global top navigation + theme toggle
│   │   │   └── SiteFooter.tsx    # Global footer (GDPR / HIPAA / contact / return home)
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
│   ├── hooks/
│   └── lib/
├── prisma/schema.prisma
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

| Path | Description |
|------|-------------|
| `/` | Home — landing view + microservices dashboard with AETHEL integration, knowledge graph, connectors, query executor, domain workflows. |
| `/about` | About — explains the platform, dual-repo workflow, AETHEL integration, polyglot stack, compliance and contact. |
| `/preview1` | Static sci-fi themed preview page (Hero, Features, Domains, Architecture, Pricing, CTA). |
| `/api` | API route. |

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
