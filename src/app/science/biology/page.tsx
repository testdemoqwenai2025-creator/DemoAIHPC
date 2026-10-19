import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Biology Hub — AIHPC Advanced Science',
  description:
    'Biology Hub — Molecular, Genetics, Proteins, Cell Imaging, Systems Biology, Evolutionary Biology. Modern AI for biology, inspired by AlphaFold / AlphaMissense.',
}

const SUBDOMAINS = [
  { href: '/science/biology/molecular', title: 'Molecular Biology', desc: 'DNA / RNA / protein, central dogma, transcription, translation. AlphaFold-style and molecular-dynamics demos.', tools: 'BLAST, Pyodide, Three.js viewer' },
  { href: '/science/genetics', title: 'Genetics', desc: 'Variant pathogenicity, GWAS, heritability. AlphaMissense-style variant classification with ClinVar-style annotation.', tools: 'VCF parser, ClinVar join, PLM forward pass' },
  { href: '/science/proteins', title: 'Proteins', desc: '3D structure prediction, protein-ligand complexes, binding affinity. AlphaFold 3-style models with pLDDT, PAE, PDB export.', tools: 'SE(3)-equivariant NN, MSA, PDB exporter' },
  { href: '/science/biology/imaging', title: 'Cell Imaging', desc: 'Microscopy image analysis: segmentation, denoising, super-resolution. Cellpose-style and StarDist-style models in-browser.', tools: 'WebGL conv, UNet, TIFF loader' },
  { href: '/science/biology/systems', title: 'Systems Biology', desc: 'Pathway modelling, ODE / SDE simulation, flux-balance analysis. Multi-omics integration.', tools: 'ODE solver, FBA, network diffusion' },
  { href: '/science/biology/evolutionary', title: 'Evolutionary Biology', desc: 'Phylogenetics, sequence alignment, positive-selection detection. Tree visualisation and dN/dS analysis.', tools: 'MSA, NJ tree, PAML-style dN/dS' },
]

export default function BiologyHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">Science Hub &middot; Biology</Badge>
      <h1 className="text-4xl font-bold tracking-tight">Biology</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Modern AI for biology — molecular, genetic, protein, imaging,
        systems, and evolutionary subdomains. Inspired by DeepMind&apos;s
        AlphaFold 3 (protein structure), AlphaMissense (variant
        pathogenicity), and the broader scientific-AI ecosystem.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {SUBDOMAINS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-6 transition-colors hover:border-emerald-500/50"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Subdomain
            </span>
            <h2 className="text-xl font-semibold group-hover:text-emerald-500">
              {s.title}
            </h2>
            <p className="flex-1 text-sm text-muted-foreground">{s.desc}</p>
            <span className="text-xs font-semibold text-cyan-500">
              Tools: {s.tools}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
