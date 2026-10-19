'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from './ThemeProvider'

/**
 * Ribbon — the new top-of-page global navigation.
 *
 * Replaces the earlier `SiteNav`. The ribbon exposes every page in the
 * platform grouped into three dropdowns (Platform / AETHEL Suite /
 * Science) plus a global dark/light theme toggle, a search affordance, a
 * Get Started CTA, and a Login button.
 *
 * The grouping mirrors the "surpass AETHEL" direction stated by the team:
 * the AETHEL Suite preserves every page from the original AETHEL archive
 * (now deep-linkable instead of trapped in tabs), and the Science group
 * introduces the Alpha-family modern AI tools (proteins / genetics /
 * nucleotides / maths).
 */
type NavItem = { href: string; label: string; desc?: string }
type NavGroup = { label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/demos', label: 'Demos' },
      { href: '/preview1', label: 'Preview 1' },
      { href: '/microservices', label: 'Microservices' },
      { href: '/subscribe', label: 'Subscribe' },
    ],
  },
  {
    label: 'AETHEL Suite',
    items: [
      {
        href: '/aethel',
        label: 'AETHEL Connector',
        desc: 'Hypercomputing emulation layer',
      },
      {
        href: '/connectors',
        label: 'Scientific Connectors Hub',
        desc: 'Bio / chem / materials / molecular',
      },
      {
        href: '/query',
        label: 'Query Executor',
        desc: 'Natural-language + structured query',
      },
      {
        href: '/knowledge-graph',
        label: 'Knowledge Graph',
        desc: 'Cross-domain 2.4M-node graph',
      },
      {
        href: '/workflows',
        label: 'Domain Workflows',
        desc: 'Pre-built scientific workflow templates',
      },
    ],
  },
  {
    label: 'Science',
    items: [
      {
        href: '/science/biology',
        label: 'Biology Hub',
        desc: 'Molecular / Genetics / Proteins / Imaging / Systems / Evolutionary',
      },
      {
        href: '/science/chemistry',
        label: 'Chemistry Hub',
        desc: 'Organic / Inorganic / Physical / Analytical / Materials / Computational',
      },
      {
        href: '/science/physics',
        label: 'Physics Hub',
        desc: 'Space / Waves / Sound / Mechanics / Quantum / Thermo',
      },
      {
        href: '/science/maths',
        label: 'Mathematics Hub',
        desc: 'Theorem proving / Algebra / Analysis / Geometry / Number theory / Probability',
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        href: '/dashboard',
        label: 'Temporal Knowledge Graph Dashboard',
        desc: 'Replayable decision traces, play / replay / scrub',
      },
      {
        href: '/graph',
        label: 'Cross-Domain Knowledge Graph',
        desc: 'Every artifact as a node · provenance / similarity / inferred edges',
      },
      {
        href: '/benchmark',
        label: 'Recursive Agentic Benchmark',
        desc: 'The agent observes itself · trace length / decision quality / rework',
      },
      {
        href: '/concepts',
        label: 'Concept Cards',
        desc: 'Deeper thoughts with evolution + hypothetical demos',
      },
      {
        href: '/concepts/replayable-decision-traces',
        label: 'Replayable Decision Traces',
        desc: 'FoundationCapital / Aktiver inspiration',
      },
      {
        href: '/concepts/provenance-first',
        label: 'Provenance-First Computing',
        desc: 'Reproducibility as the substrate',
      },
      {
        href: '/concepts/lazy-evaluation',
        label: 'Lazy Evaluation as UX',
        desc: 'The feels-alive property · 4-panel popup',
      },
      {
        href: '/concepts/cross-domain-graph',
        label: 'Cross-Domain Knowledge Graph',
        desc: 'Composability across scientific fields',
      },
      {
        href: '/concepts/audience-annotations',
        label: 'Audience-Specific Annotations',
        desc: 'Student / researcher / executive',
      },
      {
        href: '/concepts/provenance-chain',
        label: 'Provenance Chain',
        desc: 'Footpaths & chains · how a result was assembled',
      },
    ],
  },
]

export function Ribbon() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')

  // Find the group containing the current path so we can highlight it.
  const activeGroup = GROUPS.find((g) =>
    g.items.some((i) =>
      i.href === '/' ? pathname === '/' : pathname?.startsWith(i.href),
    ),
  )?.label

  return (
    <header className="sticky top-0 z-40 w-full border-b border-violet-500/25 bg-gradient-to-b from-[rgba(7,9,15,0.95)] to-[rgba(11,15,26,0.85)] backdrop-blur supports-[backdrop-filter]:bg-gradient-to-b shadow-[0_1px_0_0_rgba(6,182,212,0.4),0_4px_16px_rgba(0,0,0,0.4)] before:content-[''] before:absolute before:left-0 before:right-0 before:bottom-[-1px] before:h-[2px] before:bg-gradient-to-r before:from-cyan-500 before:via-violet-500 before:to-pink-500 before:opacity-70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-white text-xs font-bold">
            A
          </span>
          <span className="hidden sm:inline">AIHPC Advanced</span>
        </Link>

        {/* Grouped nav dropdowns */}
        <nav className="flex items-center gap-1">
          {GROUPS.map((g) => {
            const isActive = activeGroup === g.label
            return (
              <DropdownMenu key={g.label}>
                <DropdownMenuTrigger
                  className={`inline-flex h-9 items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {g.label}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {g.items.map((item) => {
                    const itemActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname?.startsWith(item.href) ?? false
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={`flex flex-col items-start gap-0.5 ${
                            itemActive ? 'opacity-100' : 'opacity-90'
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {item.desc && (
                            <span className="text-xs text-muted-foreground">
                              {item.desc}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </nav>

        {/* Search affordance — purely client-side, no server call */}
        <div className="ml-auto hidden items-center md:flex">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages…"
              className="h-9 w-44 rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
              list="ribbon-search-pages"
            />
            <datalist id="ribbon-search-pages">
              {GROUPS.flatMap((g) =>
                g.items.map((i) => (
                  <option key={i.href} value={i.label}>
                    {i.href}
                  </option>
                )),
              )}
            </datalist>
          </div>
        </div>

        {/* Dark/light toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          aria-label="Toggle dark / light theme"
          title="Toggle dark / light theme"
        >
          {theme === 'dark' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </Button>

        {/* Login button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden h-9 sm:inline-flex"
        >
          <Link href="/login">Login</Link>
        </Button>

        {/* Get Started CTA */}
        <Button
          asChild
          size="sm"
          className="h-9 bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
        >
          <Link href="/demos">Get Started</Link>
        </Button>
      </div>
    </header>
  )
}
