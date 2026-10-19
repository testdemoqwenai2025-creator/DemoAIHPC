import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Provenance Chain — AIHPC Advanced Concept Card',
  description:
    'Every result has a chain of evidence — the ordered steps that assembled it. The Provenance Chain visualisation renders this chain as a flowing path.',
}

export default function ProvenanceChainPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/concepts" className="hover:text-foreground">Concept Cards</Link>
        {' / Provenance Chain'}
      </p>
      <Badge variant="secondary" className="mt-2">Foundational &middot; footpaths &amp; chains</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Provenance Chain</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Every result has a <em>chain of evidence</em> — the ordered steps
        that assembled it. The chain visualisation renders this as a
        flowing path: each node is a step (input, computation, output,
        annotation), each edge is the data flow between them.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">Live interactive</p>
        <h2 className="mt-1 text-xl font-semibold">Walk the chain</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The full interactive chain visualisation — with Walk / Step /
          Reset controls and JSON-LD receipt download — lives on the
          static GitHub Pages page. When external hosting lands in a
          later phase, it will move into this Next.js route.
        </p>
        <p className="mt-4">
          <a
            href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/concepts/provenance-chain.html"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Open the live chain visualisation &rarr;
          </a>
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">What it is</h2>
      <p className="mt-2 text-muted-foreground">
        A <strong>provenance chain</strong> is a directed path that
        records how a result was assembled. Unlike the{' '}
        <Link href="/concepts/replayable-decision-traces" className="text-primary hover:underline">
          replayable decision trace
        </Link>{' '}
        (which captures the agent&apos;s evolving state), the chain
        captures the data flow: <em>this dataset fed this parser
        which produced this intermediate which fed this algorithm
        which produced this output which was wrapped in this receipt</em>.
        Every edge is a typed data dependency; every node has a hash.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Why it matters</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li><strong>Trust.</strong> The viewer can see exactly which steps produced the result they downloaded. No black box.</li>
        <li><strong>Audit.</strong> The chain is itself a downloadable artifact; a reviewer can replay it offline.</li>
        <li><strong>Citation.</strong> A paper citing a result cites the chain URL — a content-addressed provenance receipt.</li>
        <li><strong>Composability.</strong> The chain of demo A can become an input to demo B; the chains concatenate.</li>
        <li><strong>Failure isolation.</strong> When a result is wrong, the chain tells you which node introduced the error.</li>
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/concepts" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Back to Concept Cards
        </Link>
        <Link href="/concepts/provenance-first" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Provenance-First Computing
        </Link>
      </div>
    </main>
  )
}
