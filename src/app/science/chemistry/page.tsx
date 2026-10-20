import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Chemistry Hub — AIHPC Advanced Science',
  description:
    'Chemistry Hub — Organic, Inorganic, Physical, Analytical, Materials, Computational Chemistry. Modern AI for chemistry, inspired by GNoME / molecular GNNs.',
}

const SUBDOMAINS = [
  { href: '/science/chemistry/organic', title: 'Organic Chemistry', desc: 'Reaction prediction, retrosynthesis, SMILES / InChI parsing. Graph neural networks for reaction classification.', tools: 'RDKit (Pyodide), GNN, SMILES parser' },
  { href: '/science/chemistry/inorganic', title: 'Inorganic Chemistry', desc: 'Crystal-structure prediction, coordination chemistry, ligand-field theory. GNoME-style materials discovery.', tools: 'VASP-style DFT, symmetry groups, CIF export' },
  { href: '/science/chemistry/physical', title: 'Physical Chemistry', desc: 'Thermodynamics, kinetics, quantum chemistry. Transition-state search, Arrhenius plots, partition-function calculators.', tools: 'ODE solver, TST, Boltzmann sampling' },
  { href: '/science/chemistry/analytical', title: 'Analytical Chemistry', desc: 'NMR / MS / IR spectrum processing, peak picking, deconvolution. Chromatogram integration.', tools: 'FFT, Gaussian deconvolution, peak picker' },
  { href: '/science/chemistry/materials', title: 'Materials Chemistry', desc: 'Battery materials, catalysts, polymers. Phase-diagram exploration and Pourbaix diagrams.', tools: 'Phase-diagram viewer, Pourbaix, convex hull' },
  { href: '/science/chemistry/computational', title: 'Computational Chemistry', desc: 'Molecular dynamics, DFT, semi-empirical methods. Force-field parameterisation and free-energy perturbation.', tools: 'OpenMM (Pyodide), xTB, FEP' },
]

export default function ChemistryHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">Science Hub &middot; Chemistry</Badge>
      <h1 className="text-4xl font-bold tracking-tight">Chemistry</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Modern AI for chemistry — organic, inorganic, physical, analytical,
        materials, and computational subdomains. Inspired by DeepMind&apos;s
        GNoME (materials discovery), AlphaFold-style molecular structure
        prediction, and graph-neural-network molecular property models.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {SUBDOMAINS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-6 transition-colors hover:border-amber-500/50"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Subdomain
            </span>
            <h2 className="text-xl font-semibold group-hover:text-amber-500">
              {s.title}
            </h2>
            <p className="flex-1 text-sm text-muted-foreground">{s.desc}</p>
            <span className="text-xs font-semibold text-amber-500">
              Tools: {s.tools}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
