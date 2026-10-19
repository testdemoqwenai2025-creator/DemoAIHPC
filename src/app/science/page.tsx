import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Science Hub — AIHPC Advanced',
  description:
    'Modern AI for science. AlphaFold-style protein structure prediction, AlphaMissense-style variant pathogenicity, nucleotide sequence analysis, AlphaProof-style theorem proving — all routed through the AETHEL knowledge graph.',
}

/**
 * /science — Science Hub.
 *
 * Surfaces the four Alpha-family-inspired pillars (proteins / genetics /
 * nucleotides / maths) as cards. Each card links to its dedicated page,
 * which today is a content-rich stub (no live execution yet — that comes
 * when Pyodide lands in Phase 4). All four pillars are framed as the
 * "surpass AETHEL" direction stated by the team: the AETHEL Suite keeps
 * the original AETHEL surface, while the Science group introduces the
 * modern AI for science tools that AETHEL did not have.
 */
const PILLARS = [
  {
    href: '/science/proteins',
    title: 'Proteins',
    inspiration: 'AlphaFold 3',
    desc: 'Predict 3D protein and protein–ligand complex structures from sequence. Visualise folding confidence, domains, and interfaces. Export structures as PDB files (client-side).',
    tags: ['structure prediction', 'deep learning', 'PDB export'],
  },
  {
    href: '/science/genetics',
    title: 'Genetics',
    inspiration: 'AlphaMissense',
    desc: 'Classify missense variants as pathogenic / benign. Annotate ClinVar-style records. Browse variant consequence across the human genome with in-browser filtering.',
    tags: ['variant effect', 'pathogenicity', 'ClinVar'],
  },
  {
    href: '/science/nucleotides',
    title: 'Nucleotides',
    inspiration: 'RNAfold / DeepMind Nucleotide Transformer',
    desc: 'DNA / RNA sequence analysis: ORF finding, GC content, motif search, secondary-structure prediction. Paste a sequence and run all checks in-browser; export as FASTA / GenBank.',
    tags: ['sequence analysis', 'ORF', 'motif search'],
  },
  {
    href: '/science/maths',
    title: 'Mathematics',
    inspiration: 'AlphaProof',
    desc: 'Natural-language to formal theorem proving in Lean / Coq style. Step-by-step proof traces, observable intermediate lemmas, downloadable proof certificate.',
    tags: ['theorem proving', 'Lean', 'formal verification'],
  },
]

export default function ScienceHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Science Hub
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">Modern AI for science</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        The direction of AIHPC Advanced is to <em>surpass AETHEL</em>. The
        AETHEL Suite preserves every original AETHEL surface (now
        deep-linkable). The Science group introduces the modern AI for
        science tools that AETHEL did not have — inspired by DeepMind's
        Alpha family and the broader scientific-AI ecosystem.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {PILLARS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-violet-500/50"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Inspired by {p.inspiration}</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold group-hover:text-violet-500">
              {p.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 flex flex-wrap gap-1">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
