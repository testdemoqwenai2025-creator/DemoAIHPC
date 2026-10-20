import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Replayable Decision Traces — AIHPC Advanced Concept Card',
  description:
    'Every computation produces a trace that can be replayed timestep-by-timestep. The graph evolves in front of the viewer; the audit trail is the asset. Inspired by FoundationCapital / Aktiver context graphs.',
}

export default function ReplayableDecisionTracesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/concepts" className="hover:text-foreground">
          Concept Cards
        </Link>{' '}
        / Replayable Decision Traces
      </p>
      <Badge variant="secondary" className="mt-2">
        Foundational &middot; FoundationCapital / Aktiver inspiration
      </Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Replayable Decision Traces
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Every computation, every graph change, every demo run produces a
        trace that can be replayed timestep-by-timestep. The graph evolves
        in front of the viewer; the audit trail <em>is</em> the asset.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What it is</h2>
      <p className="mt-2 text-muted-foreground">
        A <strong>decision trace</strong> is an ordered list of state
        changes — RDF triples being added, removed, or updated — paired
        with the reason each change was made. A trace is replayable when
        a viewer can scrub through timesteps and watch the graph (or
        the computation) reconstruct itself step by step. The point
        isn&apos;t a slick animation; the point is that every state is
        recoverable, every decision is auditable, and every claim has a
        path back to its evidence.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Where the idea came from</h2>
      <p className="mt-2 text-muted-foreground">
        Context graphs — popularised alongside the concept of replayable
        decision traces — represent a framework introduced by the venture
        capital firm FoundationCapital and solved by Aktiver. The public
        sphere (LinkedIn posts, talks, and product pages from that
        ecosystem) has been refining the vocabulary for several years.
        AIHPC Advanced is an open, client-side implementation of the same
        idea, applied to scientific knowledge.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">
          Live interactive
        </p>
        <h2 className="mt-1 text-xl font-semibold">
          The temporal dashboard + hypothetical demo
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The temporal knowledge graph dashboard at
          <code className="mx-1">/docs/dashboard.html</code>
          is the live implementation; the hypothetical &quot;replay the
          OLS trace as a graph that grows a node per step&quot; demo is
          on the static concept card.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/dashboard.html"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Open the temporal dashboard &rarr;
          </a>
          <a
            href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/concepts/replayable-decision-traces.html"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
          >
            Open the hypothetical demo &rarr;
          </a>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Why it matters for AIHPC</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li><strong>Audit.</strong> When AETHEL generates a hypothesis, a viewer can scrub back to see which papers, datasets, and prior hypotheses led to it.</li>
        <li><strong>Reproducibility.</strong> A demo run is a trace; re-running the trace reproduces the same output bit-for-bit.</li>
        <li><strong>Debuggability.</strong> When a result is wrong, the trace tells you which step introduced the error.</li>
        <li><strong>Pedagogy.</strong> A student can scrub slowly through a trace to see how a regression line is fit, how PageRank converges, how a knowledge graph grows.</li>
        <li><strong>Trust.</strong> &quot;Trust the result because you can replay the reasoning.&quot;</li>
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/concepts"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Back to Concept Cards
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Open the Dashboard
        </Link>
      </div>
    </main>
  )
}
