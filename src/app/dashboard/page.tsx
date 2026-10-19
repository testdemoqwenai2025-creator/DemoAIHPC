import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { TemporalGraph, type Timestep, type Series } from '@/components/demos/TemporalGraph'

export const metadata = {
  title: 'Temporal Knowledge Graph Dashboard — AIHPC Advanced',
  description:
    'Watch the AETHEL knowledge graph change over time as new data evolves relationships. Temporal RDF semantic knowledge-graph UI with knowledge tracing and play / replay / scrub controls. Inspired by FoundationCapital / Aktiver context-graphs and replayable decision traces.',
}

/**
 * The 10 timesteps of AETHEL evolving. Each timestep carries the
 * cumulative state of the graph after that timestep's changes were
 * applied. The metrics plotted are:
 *   - nodes:        RDF nodes (subjects) seen so far
 *   - edges:        RDF triples (S-P-O) seen so far
 *   - domains:     number of distinct domain:* nodes
 *   - avgConf:     mean confidence over hypothesis edges (0 if none)
 *
 * Computed by replaying the applyTimesteps() logic from the static
 * dashboard.html — these numbers match what the live GitHub Pages
 * dashboard shows at each timestep.
 */
const TIMESTEPS: Timestep[] = [
  { id: 'T0', label: 'Initial seed',                       ts: '2026-01-01T00:00:00Z', metrics: { nodes: 9,  edges: 8,  domains: 8, avgConf: 0.00 } },
  { id: 'T1', label: 'Paper P1 indexed',                   ts: '2026-02-14T09:30:00Z', metrics: { nodes: 11, edges: 13, domains: 8, avgConf: 0.00 } },
  { id: 'T2', label: 'Dataset D1 ingested',                ts: '2026-03-03T14:12:00Z', metrics: { nodes: 12, edges: 17, domains: 8, avgConf: 0.00 } },
  { id: 'T3', label: 'AETHEL generates hypothesis H1',     ts: '2026-04-21T11:05:00Z', metrics: { nodes: 13, edges: 21, domains: 8, avgConf: 0.65 } },
  { id: 'T4', label: 'Experiment E1 confirms H1',         ts: '2026-05-09T16:40:00Z', metrics: { nodes: 14, edges: 23, domains: 8, avgConf: 0.95 } },
  { id: 'T5', label: 'Cross-domain: Proteins↔Mathematics', ts: '2026-06-18T08:00:00Z', metrics: { nodes: 15, edges: 27, domains: 8, avgConf: 0.95 } },
  { id: 'T6', label: 'Collaborator C2 joins (Materials)',  ts: '2026-07-22T10:15:00Z', metrics: { nodes: 16, edges: 30, domains: 8, avgConf: 0.95 } },
  { id: 'T7', label: 'Retraction: H1 partially debunked',  ts: '2026-08-30T13:25:00Z', metrics: { nodes: 16, edges: 29, domains: 8, avgConf: 0.42 } },
  { id: 'T8', label: 'Citation network update',            ts: '2026-09-19T09:00:00Z', metrics: { nodes: 17, edges: 33, domains: 8, avgConf: 0.42 } },
  { id: 'T9', label: 'Final consolidated state',           ts: '2026-10-19T00:00:00Z', metrics: { nodes: 17, edges: 34, domains: 8, avgConf: 0.48 } },
]

const SERIES: Series[] = [
  { key: 'nodes',    label: 'RDF nodes',   color: '#8b5cf6' },
  { key: 'edges',    label: 'RDF triples', color: '#06b6d4' },
  { key: 'domains',  label: 'Domains',     color: '#f59e0b' },
  { key: 'avgConf',  label: 'Avg confidence', color: '#ec4899' },
]

/**
 * /dashboard — temporal RDF knowledge graph dashboard.
 *
 * The full interactive dashboard — with the radial knowledge graph
 * visualisation, decision-trace panel, and play / replay / scrub
 * controls — runs on GitHub Pages at
 * https://testdemoqwenai2025-creator.github.io/DemoAIHPC/dashboard.html
 *
 * This Next.js route renders the *same* 10 timesteps through the
 * reusable <TemporalGraph> React component — extracted from the
 * static page in Phase 21. The result is a unified codebase: the
 * Next.js route and the GitHub Pages page share the same data and
 * the same React component.
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Dashboard &middot; Temporal RDF Knowledge Graph
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        Watch the graph change over time
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        A temporal RDF semantic knowledge-graph UI complete with knowledge
        tracing and play / replay of how a given state changes over time.
        Context graphs (popularised alongside the concept of replayable
        decision traces) are a framework introduced by FoundationCapital
        and solved by Aktiver; this dashboard is AIHPC Advanced&apos;s open,
        client-side implementation — applied to the AETHEL scientific
        knowledge graph.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-1">
          Live temporal graph
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          The same 10 timesteps that drive the GitHub Pages dashboard,
          rendered through the reusable <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;TemporalGraph&gt;</code> React component
          (extracted from the static page in Phase 21). Press Play to
          watch the graph evolve from initial seed to the final
          consolidated state.
        </p>
        <TemporalGraph timesteps={TIMESTEPS} series={SERIES} height={280} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold">10 timesteps of AETHEL evolving</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Initial seed → paper indexed → dataset ingested →
            hypothesis generated → experiment confirms → cross-domain
            link → collaborator joins → retraction → citation update →
            final consolidated state.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold">Replayable decision traces</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Every timestep records the decisions that added, removed, or
            updated RDF triples, so a viewer can scrub through time and
            watch the graph evolve. See the{' '}
            <Link
              href="/concepts/replayable-decision-traces"
              className="text-primary hover:underline"
            >
              concept card
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <h3 className="font-semibold">Open the full live dashboard</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The complete interactive dashboard — with the radial
          knowledge-graph visualisation, decision-trace panel, and
          live stats — runs on GitHub Pages (24/7 / 365):
        </p>
        <p className="mt-4">
          <a
            href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/dashboard.html"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Open the live dashboard &rarr;
          </a>
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/concepts"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Browse Concept Cards
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Return to Home
        </Link>
      </div>
    </main>
  )
}
