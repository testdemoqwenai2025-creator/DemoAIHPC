import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Subscribe — AIHPC Advanced',
  description:
    'Subscription portal foundation. localStorage-based session gating; "Download Receipt" is the first gated feature. Free / Pro / Team tiers.',
}

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">Subscription Portal &middot; foundation</Badge>
      <h1 className="text-4xl font-bold tracking-tight">Subscribe</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Sign in (no external service — localStorage session only).
        Tiers gate features locally today; when external auth + billing
        lands in a later phase, the gate points swap to Clerk /
        Supabase without changing the UX.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-amber-500">Live interactive</p>
        <h2 className="mt-1 text-xl font-semibold">Sign in + upgrade tiers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The full interactive subscribe page — with sign-in form,
          tier cards (Free / Pro / Team), and localStorage session
          management — lives on the static GitHub Pages page.
        </p>
        <p className="mt-4">
          <a
            href="https://testdemoqwenai2025-creator.github.io/DemoAIHPC/subscribe.html"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Open the live subscribe page &rarr;
          </a>
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Tiers</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Free</p>
          <p className="mt-2 text-2xl font-bold text-cyan-500">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>✓ All live demos (run in browser)</li>
            <li>✓ CSV download</li>
            <li>✗ Provenance receipt</li>
            <li>✗ Replayable trace</li>
          </ul>
        </div>
        <div className="rounded-xl border border-violet-500/50 bg-card p-5 shadow-[0_0_24px_rgba(139,92,246,0.3)]">
          <p className="text-xs uppercase tracking-wider text-violet-400">Pro</p>
          <p className="mt-2 text-2xl font-bold text-cyan-500">$20<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>✓ Everything in Free</li>
            <li>✓ Provenance receipt (JSON-LD)</li>
            <li>✓ Replayable trace (temporal graph)</li>
            <li>✓ Pyodide execution (run Python in-browser)</li>
          </ul>
        </div>
        <div className="rounded-xl border border-cyan-500/50 bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-cyan-400">Team</p>
          <p className="mt-2 text-2xl font-bold text-cyan-500">$100<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>✓ Everything in Pro</li>
            <li>✓ Private datasets</li>
            <li>✓ N-D visualisations (3D protein, hypercube)</li>
            <li>✓ HIPAA / GDPR DPA / BAA on request</li>
          </ul>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">What&apos;s gated today</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Today only one feature is gated: the <strong>Download Receipt</strong>
        button on the lazy-evaluation concept card and the nucleotide
        analysis demo. Free users get CSV only; Pro users get CSV +
        receipt; Team users get CSV + receipt + trace. When external
        billing lands, the gate points stay the same; only the back-end
        changes.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/concepts/lazy-evaluation" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Test gating on lazy-eval popup
        </Link>
        <Link href="/" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Return to Home
        </Link>
      </div>
    </main>
  )
}
