import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Lazy Evaluation as UX — AIHPC Advanced Concept Card',
  description:
    'Popups open immediately and stream updates. The "feels alive" property that\'s hard to copy.',
}

export default function LazyEvaluationPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/concepts" className="hover:text-foreground">Concept Cards</Link>
        {' / Lazy Evaluation as UX'}
      </p>
      <Badge variant="secondary" className="mt-2">UX &middot; feels alive</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Lazy Evaluation as a UX Primitive</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Popups open immediately with a &quot;pending&quot; state and stream
        updates as the computation progresses. Users feel progress rather
        than blocking — the &quot;feels alive&quot; property that&apos;s
        hard to copy.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What it is</h2>
      <p className="mt-2 text-muted-foreground">
        A <strong>lazy-evaluated popup</strong> is a UI container that
        appears instantly (zero perceived latency), shows a streaming
        progress trace, and progressively fills in the result as
        sub-steps complete. The viewer sees the computation happening
        rather than waiting for it.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Why it matters for AIHPC</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li><strong>Perceived latency.</strong> A 5-second computation feels instant if the popup opens in 50ms and streams updates every 200ms.</li>
        <li><strong>Trust.</strong> When the viewer sees steps arriving, they trust the result more than a black-box spinner.</li>
        <li><strong>Composability.</strong> Each step can be a sub-trace; the popup becomes a viewer onto the trace.</li>
        <li><strong>Pedagogy.</strong> A student can pause mid-stream to inspect an intermediate value.</li>
        <li><strong>Cancellation.</strong> Long-running computations get a Cancel button because the popup owns the lifecycle.</li>
      </ul>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">Hypothetical demo (live)</p>
        <h2 className="mt-1 text-xl font-semibold">&quot;Thinking…&quot; token streaming popup</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The hypothetical demo streams &quot;thinking&quot; tokens for a
          5-second simulated AETHEL query, with a progress bar and step
          indicator. Open it on the live page.
        </p>
        <a
          href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/concepts/lazy-evaluation.html"
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
