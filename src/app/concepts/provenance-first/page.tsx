import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Provenance-First Computing — AIHPC Advanced Concept Card',
  description:
    'Every result is a first-class artifact with full provenance: input data, math, code, execution trace, output, report. Reproducibility isn\'t a feature; it\'s the substrate.',
}

export default function ProvenanceFirstPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/concepts" className="hover:text-foreground">Concept Cards</Link>
        {' / Provenance-First Computing'}
      </p>
      <Badge variant="secondary" className="mt-2">Architecture &middot; surpass AETHEL</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Provenance-First Computing</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Every result is a first-class artifact with full provenance: input
        data, math, code, execution trace, output, report. Reproducibility
        isn&apos;t a feature; it&apos;s the substrate. The &quot;surpass
        AETHEL&quot; thesis rests here.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What it is</h2>
      <p className="mt-2 text-muted-foreground">
        A <strong>provenance receipt</strong> is a JSON document that travels
        with every downloadable result. It records: the demo manifest
        (math, code, annotations), the input data hash, the runtime, the
        version of every library touched, the execution trace, the output
        hash, and the timestamp. Given the same manifest, same input, and
        same runtime, the result is bit-for-bit reproducible.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Why it matters for AIHPC</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li><strong>Audit without NDA.</strong> A reviewer can verify a claim by replaying the trace locally; they never need to access your private data.</li>
        <li><strong>Citation.</strong> A demo result cites its own provenance receipt; a paper cites the demo URL. Citations become computable.</li>
        <li><strong>Composability.</strong> Workflow A&apos;s output is workflow B&apos;s input; the receipts chain. The composite receipt is itself a receipt.</li>
        <li><strong>Versioning.</strong> AETHEL&apos;s knowledge graph updates an edge; the old edge isn&apos;t deleted, it&apos;s superseded with a pointer.</li>
      </ul>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">Hypothetical demo (live)</p>
        <h2 className="mt-1 text-xl font-semibold">Provenance receipt sketch</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The hypothetical demo shows a sketch of the JSON receipt that
          would ship alongside every downloadable CSV. Open the live page
          to see it.
        </p>
        <a
          href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/concepts/provenance-first.html"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Open the hypothetical demo &rarr;
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/concepts" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">Back to Concept Cards</Link>
      </div>
    </main>
  )
}
