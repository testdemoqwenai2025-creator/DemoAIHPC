import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Cross-Domain Knowledge Graph — AIHPC Advanced',
  description:
    'Every demo, paper, dataset, and AETHEL Suite surface as a node, with provenance / similarity / inferred edges. Foundation page; live interactive graph coming in a later phase.',
}

export default function GraphPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / Cross-Domain Knowledge Graph'}
      </p>
      <Badge variant="secondary" className="mt-2">Insights &middot; Cross-Domain Knowledge Graph</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Cross-Domain Knowledge Graph
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Every artifact in AIHPC Advanced — demos, papers, datasets, AETHEL
        Suite surfaces — as a node. Edges express provenance, similarity,
        and inference.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What this is</h2>
      <p className="mt-2 text-muted-foreground">
        A graph that places every artifact — a demo manifest, an AETHEL
        Connector page, a published paper, an ingested dataset, a
        generated hypothesis, a user-collaborator — on equal footing as
        nodes. Three classes of edges:{' '}
        <strong>provenance</strong> (output of A is input of B),{' '}
        <strong>similarity</strong> (shared tag/domain),{' '}
        <strong>inferred</strong> (AETHEL hypothesis).
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Live interactive graph</h2>
      <p className="mt-2 text-muted-foreground">
        The full interactive cross-domain graph is in development. The
        temporal dashboard at{' '}
        <Link href="/dashboard" className="text-primary hover:underline">/dashboard</Link>{' '}
        shows the AETHEL evolution sub-graph; the per-demo 2-hop
        neighbourhood visualisation is on the{' '}
        <Link href="/concepts/cross-domain-graph" className="text-primary hover:underline">
          Cross-Domain Knowledge Graph concept card
        </Link>.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-amber-500">Foundation</p>
        <h3 className="mt-1 font-semibold">Live interactive graph — coming in a later phase</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The full <code>/graph</code> route will render all demos, papers,
          datasets, and AETHEL Suite pages as nodes with provenance +
          similarity + inferred edges. Click any node to see its 2-hop
          neighbourhood; traverse the graph to discover related artifacts
          across scientific domains. Uses the existing{' '}
          <code>KnowledgeGraph.tsx</code> component as a starting point.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Open the temporal dashboard
        </Link>
        <Link href="/concepts/cross-domain-graph" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Read the concept card
        </Link>
      </div>
    </main>
  )
}
