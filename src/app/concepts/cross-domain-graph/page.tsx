import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Cross-Domain Knowledge Graph — AIHPC Advanced Concept Card',
  description:
    'Demos, papers, datasets, and AETHEL Suite surfaces are all nodes; shared tags and domains are edges. Composability is the defensible angle.',
}

export default function CrossDomainGraphPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/concepts" className="hover:text-foreground">Concept Cards</Link>
        {' / Cross-Domain Knowledge Graph'}
      </p>
      <Badge variant="secondary" className="mt-2">Composability &middot; the defensible angle</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Cross-Domain Knowledge Graph</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Demos, papers, datasets, and AETHEL Suite surfaces are all nodes;
        shared tags and domains are edges. Composability across scientific
        fields is what no single-purpose tool gives you.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What it is</h2>
      <p className="mt-2 text-muted-foreground">
        A graph that places every artifact in AIHPC Advanced — a demo
        manifest, an AETHEL Connector page, a published paper, an ingested
        dataset, a generated hypothesis, a user-collaborator — on equal
        footing as nodes. Edges express provenance (this demo used that
        dataset), similarity (these two demos share a tag), and inference
        (this hypothesis connects these two domains).
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Why it matters for AIHPC</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li><strong>Discovery.</strong> A protein-folding researcher lands on /science/proteins; the graph shows 2-hop neighbours.</li>
        <li><strong>Composability.</strong> &quot;Compose this demo&apos;s output with that demo&apos;s input&quot; is one graph traversal away.</li>
        <li><strong>Citation.</strong> A paper cites a demo URL; the graph edge is automatic.</li>
        <li><strong>Recommendation.</strong> &quot;You ran the OLS demo; here are three demos that share the linear-algebra tag.&quot;</li>
        <li><strong>Surveillance of one&apos;s own AI.</strong> When AETHEL adds an inferred edge, the graph visualises it.</li>
      </ul>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">Hypothetical demo (live)</p>
        <h2 className="mt-1 text-xl font-semibold">2-hop neighbourhood for each demo card</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The hypothetical demo lets you click any demo card to see its
          2-hop neighbourhood rendered as an SVG graph.
        </p>
        <a
          href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/concepts/cross-domain-graph.html"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Open the hypothetical demo &rarr;
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/concepts" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">Back to Concept Cards</Link>
        <Link href="/dashboard" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">Open the temporal dashboard</Link>
      </div>
    </main>
  )
}
