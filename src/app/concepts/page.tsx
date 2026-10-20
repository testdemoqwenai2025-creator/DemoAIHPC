import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Concept Cards — AIHPC Advanced',
  description:
    'Deeper thoughts with the evolution of each subject, paired with hypothetical demos. Each concept card is a dedicated page expressing one foundational idea.',
}

const CARDS: { href: string; tag: string; title: string; desc: string; demo: string }[] = [
  {
    href: '/concepts/replayable-decision-traces',
    tag: 'Foundational · FoundationCapital / Aktiver',
    title: 'Replayable Decision Traces',
    desc: 'Every computation, every graph change, every demo run produces a trace that can be replayed timestep-by-timestep. The graph evolves in front of the viewer; the audit trail is the asset.',
    demo: 'Hypothetical demo: replay the OLS trace as a graph that grows a node per step',
  },
  {
    href: '/concepts/provenance-first',
    tag: 'Architecture · surpass AETHEL',
    title: 'Provenance-First Computing',
    desc: 'Every result is a first-class artifact with full provenance: input data, math, code, execution trace, output, report. Reproducibility isn\'t a feature; it\'s the substrate.',
    demo: 'Hypothetical demo: ship a "provenance receipt" alongside every downloadable CSV',
  },
  {
    href: '/concepts/lazy-evaluation',
    tag: 'UX · feels alive',
    title: 'Lazy Evaluation as a UX Primitive',
    desc: 'Popups open immediately with a "pending" state and stream updates as the computation progresses. Users feel progress rather than blocking — the "feels alive" property that\'s hard to copy.',
    demo: 'Hypothetical demo: a popup that streams "thinking..." tokens for a 5-second simulated query',
  },
  {
    href: '/concepts/cross-domain-graph',
    tag: 'Composability · the defensible angle',
    title: 'Cross-Domain Knowledge Graph',
    desc: 'Demos, papers, datasets, and AETHEL Suite surfaces are all nodes; shared tags and domains are edges. Composability across scientific fields is what no single-purpose tool gives you.',
    demo: 'Hypothetical demo: click any demo card to see its 2-hop neighbourhood in the graph',
  },
  {
    href: '/concepts/audience-annotations',
    tag: 'Pedagogy · no other platform does this',
    title: 'Audience-Specific Annotations',
    desc: 'The same computation gets annotated for student / researcher / executive audiences. The math is the same; the explanation shifts register. No other platform does this systematically.',
    demo: 'Hypothetical demo: audience toggle on a k-means clustering run',
  },
]

export default function ConceptsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Concept Cards &middot; deeper thoughts, evolution, hypothetical demos
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">Concept Cards</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Each concept card expresses a deeper thought that AIHPC Advanced
        builds on, traces the evolution of that subject in the public
        sphere, and pairs it with a hypothetical demo — a speculative
        interface that exercises what the platform will feel like when
        the live execution lands. The cards are intentionally opinionated;
        some ideas will be wrong, and we will revise them in the open.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-6 transition-colors hover:border-violet-500/50"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {c.tag}
            </span>
            <h2 className="text-xl font-semibold group-hover:text-violet-500">
              {c.title}
            </h2>
            <p className="flex-1 text-sm text-muted-foreground">{c.desc}</p>
            <span className="text-xs font-semibold text-cyan-500">
              {c.demo}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
