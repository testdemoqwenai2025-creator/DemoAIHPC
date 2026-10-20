import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nucleotides — AIHPC Advanced Science',
  description:
    'DNA / RNA sequence analysis: ORF finding, GC content, motif search, secondary-structure prediction. Paste a sequence and run all checks in-browser; export as FASTA / GenBank.',
}

export default function NucleotidesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Science &middot; Nucleotides
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        DNA / RNA sequence analysis
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Paste a nucleotide sequence and run a battery of checks entirely
        in-browser: open-reading-frame finding, GC-content sliding
        window, motif search, restriction-site mapping, and
        secondary-structure prediction (RNA). Export as FASTA or
        GenBank-format — nothing is uploaded.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>What the user supplies.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Raw nucleotide string (A/C/G/T/U) — case-insensitive.</li>
              <li>FASTA paste (single or multi-record).</li>
              <li>Optional motif list for search.</li>
              <li>Optional restriction enzyme list.</li>
              <li>Sequence type: DNA / RNA / ambiguous-IUPAC.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
            <CardDescription>What the user receives.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>ORF table (start, stop, frame, length, translated protein).</li>
              <li>GC content per sliding window (SVG plot).</li>
              <li>Motif hit coordinates with strand.</li>
              <li>Restriction map with fragment count.</li>
              <li>RNA secondary structure (dot-bracket + SVG arc plot).</li>
              <li>
                <strong>FASTA / GenBank download</strong> — generated
                in-browser.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Method</CardTitle>
            <CardDescription>The mathematical backbone.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sequence analysis is mostly combinatorial — O(n) for
              motif search with KMP, O(n · w) for sliding GC, O(n²) for
              Nussinov RNA folding. The PLM-based variant consequence is
              a separate concern handled under /science/genetics.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observability</CardTitle>
            <CardDescription>Execution trace steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Parse input → normalised sequence + alphabet check.</li>
              <li>ORF scan (six-frame for DNA).</li>
              <li>Sliding GC / AT content.</li>
              <li>Motif search (KMP / Aho-Corasick).</li>
              <li>Restriction map.</li>
              <li>RNA secondary structure (Nussinov).</li>
              <li>Render plots + tables + offer FASTA / GenBank download.</li>
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
        The nucleotide demo runner is the most tractable next live demo
        (pure JS, no ML model needed) and is a strong candidate for
        Phase 3.
      </p>
    </main>
  )
}
