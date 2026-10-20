import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Proteins — AIHPC Advanced Science',
  description:
    'AlphaFold 3-style protein and protein-ligand complex structure prediction, visualisation, and PDB export. Direction page for the AIHPC Advanced Science group.',
}

/**
 * /science/proteins — Proteins pillar.
 *
 * Content-rich stub describing the planned protein structure prediction
 * capability. Live in-browser execution lands when Pyodide + a
 * lightweight ML runtime are integrated (planned Phase 4).
 */
export default function ProteinsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Science &middot; Proteins
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        Protein structure prediction
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        AlphaFold 3-style prediction of 3D protein and protein–ligand
        complex structures from amino-acid sequence. Folding confidence
        per residue, domain boundaries, interface residues, and
        downloadable PDB output — all client-side, no data leaves your
        browser.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              What a user supplies to run a prediction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Amino-acid sequence (FASTA or raw paste).</li>
              <li>
                Optional ligand SMILES for complex prediction (Phase 5+).
              </li>
              <li>
                Optional MSA (multiple sequence alignment) to boost
                confidence — Phase 5+.
              </li>
              <li>
                Optional template PDB for homology-guided folding — Phase
                5+.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
            <CardDescription>
              What the user receives and where it goes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Predicted 3D coordinates (C-alpha trace first, full atom in Phase 5+).</li>
              <li>Per-residue pLDDT confidence scores.</li>
              <li>PAE (Predicted Aligned Error) matrix.</li>
              <li>Domain boundary annotation.</li>
              <li>
                <strong>PDB file download</strong> — generated in-browser
                as a Blob, nothing is uploaded.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Method</CardTitle>
            <CardDescription>
              The mathematical backbone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The model is a graph neural network over the residue
              contact graph, trained end-to-end to predict both 3D
              coordinates and a confidence head. The structure module
              iteratively refines a point cloud using SE(3)-equivariant
              updates. The training loss combines FAPE (Frame-aligned
              point error) and a confidence CE.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observability</CardTitle>
            <CardDescription>
              What the execution trace exposes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Parse FASTA → residue graph.</li>
              <li>Embeddings (single-sequence or MSA).</li>
              <li>Pair stack updates (N iterations).</li>
              <li>Structure module refine (N iterations).</li>
              <li>Confidence head (pLDDT, PAE).</li>
              <li>Render 3D viewer (Three.js — Phase 5+).</li>
              <li>Serialize PDB + offer download.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/science">Back to Science Hub</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/demos">See live demos</Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Live execution of protein structure prediction is not yet wired
        into the demo runner — the heavy ML model needs WebGPU / WASM
        SIMD work that lands in Phase 4+. For now this page documents the
        planned interface. To accelerate, contact{' '}
        <a
          href="mailto:testdemoqwenai2025@gmail.com"
          className="text-primary hover:underline"
        >
          testdemoqwenai2025@gmail.com
        </a>
        .
      </p>
    </main>
  )
}
