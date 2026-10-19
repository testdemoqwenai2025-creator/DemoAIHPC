import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Genetics — AIHPC Advanced Science',
  description:
    'AlphaMissense-style missense variant pathogenicity classification, ClinVar-style record annotation, in-browser variant consequence filtering.',
}

export default function GeneticsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Science &middot; Genetics
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        Variant pathogenicity
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        AlphaMissense-style classification of missense variants as
        pathogenic / benign, with ClinVar-style record annotation and
        in-browser filtering by gene, consequence, and allele frequency.
        Paste a VCF slice or a single HGVS expression and the result is
        rendered inline; nothing is uploaded.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>What a user supplies.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Single HGVS expression (e.g. <code>c.34G&gt;A</code> in <code>BRCA1</code>).</li>
              <li>VCF slice (parsed in-browser — no upload).</li>
              <li>Optional reference genome build (GRCh38 default).</li>
              <li>Optional population frequency filter (gnomAD-style).</li>
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
              <li>Pathogenicity score (0..1) and class label.</li>
              <li>Annotated ClinVar record (if matched).</li>
              <li>Cross-references to UniProt / dbSNP / ClinGen.</li>
              <li>
                <strong>TSV download</strong> of the result table —
                generated in-browser.
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
              The model is a protein-language-model fine-tune that scores
              the log-odds of the wild-type residue against the variant at
              each position. Calibration against ClinVar gives the
              pathogenicity posterior. Allele frequency from gnomAD
              acts as a Bayesian prior.
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
              <li>Parse input → normalised variant call.</li>
              <li>Look up transcript / protein context.</li>
              <li>Run PLM forward pass.</li>
              <li>Calibrate against ClinVar / gnomAD.</li>
              <li>Render result + ClinVar card.</li>
              <li>Serialize TSV + offer download.</li>
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
        Live variant classification is a planned Phase 4+ deliverable. For
        NDA-protected genomics work, contact{' '}
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
