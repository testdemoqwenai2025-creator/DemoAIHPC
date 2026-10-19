import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Temporal Knowledge Graph Dashboard — AIHPC Advanced',
  description:
    'Watch the AETHEL knowledge graph change over time as new data evolves relationships. Temporal RDF semantic knowledge-graph UI with knowledge tracing and play / replay / scrub controls. Inspired by FoundationCapital / Aktiver context-graphs and replayable decision traces.',
}

/**
 * /dashboard — temporal RDF knowledge graph dashboard.
 *
 * The interactive dashboard is at
 * https://testdemoqwenai2025-creator.github.io/DemoAIHPC/dashboard.html
 * (served by GitHub Pages from /docs/dashboard.html). This Next.js route
 * is the deep-linkable foundation; when external hosting lands in a
 * later phase, the same SVG-based temporal graph will render here too.
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

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Live interactive dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The full interactive temporal graph — with timeline scrubber,
          play / replay / step controls, decision-trace panel, and
          knowledge-tracing stats — runs on GitHub Pages:
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
