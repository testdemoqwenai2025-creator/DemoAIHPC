import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Audience-Specific Annotations — AIHPC Advanced Concept Card',
  description:
    'The same computation gets annotated for student / researcher / executive audiences. No other platform does this systematically.',
}

export default function AudienceAnnotationsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/concepts" className="hover:text-foreground">Concept Cards</Link>
        {' / Audience-Specific Annotations'}
      </p>
      <Badge variant="secondary" className="mt-2">Pedagogy &middot; no other platform does this</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Audience-Specific Annotations</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        The same computation gets annotated for student / researcher /
        executive audiences. The math is the same; the explanation shifts
        register. No other platform does this systematically.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What it is</h2>
      <p className="mt-2 text-muted-foreground">
        An <strong>audience annotation</strong> is a per-audience block of
        prose that explains a computation. The audience is one of
        <code className="mx-1">student</code>,
        <code className="mx-1">researcher</code>, or
        <code className="mx-1">executive</code> (extensible). The math, code,
        and result are identical across audiences; only the explanation
        shifts register — vocabulary, depth, framing, and the
        &quot;what should I do with this&quot; differ.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Why it matters for AIHPC</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li><strong>Reach.</strong> The same demo is useful to an undergrad, a postdoc, and a CTO without rewriting the demo.</li>
        <li><strong>Trust.</strong> An executive can read an executive summary without a translator; they trust what they can read.</li>
        <li><strong>Curriculum.</strong> A professor can assign the student annotation as homework; the researcher annotation as further reading.</li>
        <li><strong>Compliance.</strong> A risk officer can read an executive summary that surfaces the assumptions and failure modes the math elides.</li>
      </ul>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">Hypothetical demo (live)</p>
        <h2 className="mt-1 text-xl font-semibold">k-means clustering, audience toggle</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The hypothetical demo shows a k-means clustering annotation with
          a Student / Researcher / Executive toggle. Switch the audience
          and watch the explanation shift register while the math stays
          the same.
        </p>
        <a
          href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/concepts/audience-annotations.html"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Open the hypothetical demo &rarr;
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/concepts" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">Back to Concept Cards</Link>
        <Link href="/demos/linear-regression" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">See audience toggle on the live OLS demo</Link>
      </div>
    </main>
  )
}
