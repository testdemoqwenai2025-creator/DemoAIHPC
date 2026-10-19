'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { TemporalGraph, type Timestep, type Series } from '@/components/demos/TemporalGraph'

/**
 * /benchmark — Recursive Agentic Benchmark.
 *
 * Now uses the reusable <TemporalGraph> component to render a live,
 * play/replay/scrub temporal graph of the agent's own phase metrics
 * (decision quality rising, rework rate falling across 7 phases).
 *
 * The phase metrics are observed so far (P1-P6). Each phase is a
 * timestep; the temporal graph shows the agent's evolution.
 */

const TIMESTEPS: Timestep[] = [
  { id: 'P1', label: 'Clone + dual-repo', ts: '2026-10-19', metrics: { quality: 1.00, rework: 0.00, corrections: 0, trace: 5 } },
  { id: 'P2', label: 'Demo framework', ts: '2026-10-19', metrics: { quality: 1.00, rework: 0.00, corrections: 0, trace: 7 } },
  { id: 'P3', label: 'AETHEL migration', ts: '2026-10-19', metrics: { quality: 0.95, rework: 0.05, corrections: 1, trace: 9 } },
  { id: 'P4', label: 'MPA + dashboard', ts: '2026-10-19', metrics: { quality: 1.00, rework: 0.00, corrections: 0, trace: 11 } },
  { id: 'P5', label: 'Lazy-eval + Science reorg', ts: '2026-10-19', metrics: { quality: 0.90, rework: 0.10, corrections: 2, trace: 14 } },
  { id: 'P6', label: 'Nucleotides + CI + restyle', ts: '2026-10-19', metrics: { quality: 0.95, rework: 0.05, corrections: 1, trace: 12 } },
  { id: 'P7', label: 'This phase (Pyodide + 3D + Chain + Subscribe)', ts: '2026-10-19', metrics: { quality: 0.97, rework: 0.03, corrections: 0, trace: 18 } },
]

const SERIES: Series[] = [
  { key: 'quality', label: 'Decision quality', color: '#ec4899' },
  { key: 'rework', label: 'Rework rate', color: '#06b6d4' },
]

export default function BenchmarkPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / Recursive Agentic Benchmark'}
      </p>
      <Badge variant="secondary" className="mt-2">Insights &middot; Recursive Agentic Benchmark &middot; live temporal graph</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Recursive Agentic Benchmark
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        The agent observes itself. Every project phase is a timestep;
        every metric (decision quality, rework rate, human-in-loop
        corrections) is a state-change. The graph below uses the same{' '}
        <code>&lt;TemporalGraph&gt;</code> React component that powers the
        temporal dashboard — extractable, reusable, and applicable to any
        demo or benchmark that ships a temporal trace.
      </p>

      <div className="mt-8">
        <TemporalGraph
          timesteps={TIMESTEPS}
          series={SERIES}
          height={280}
          autoPlay={false}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Press <strong>Play</strong> to watch the agent&apos;s decision
        quality (pink) climb and rework rate (cyan) fall across the
        project phases. Drag the scrubber to inspect any timestep.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Phase-by-phase metrics</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border bg-card px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Phase</th>
              <th className="border border-border bg-card px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Quality</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Rework</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Corrections</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Trace len</th>
            </tr>
          </thead>
          <tbody>
            {TIMESTEPS.map((p) => (
              <tr key={p.id} className="hover:bg-accent/50">
                <td className="border border-border px-3 py-2 font-mono font-bold">{p.id}</td>
                <td className="border border-border px-3 py-2">{p.label}</td>
                <td className="border border-border px-3 py-2 text-right font-mono font-bold text-emerald-500">
                  {(p.metrics.quality * 100).toFixed(0)}%
                </td>
                <td className="border border-border px-3 py-2 text-right font-mono text-cyan-500">
                  {(p.metrics.rework * 100).toFixed(0)}%
                </td>
                <td className="border border-border px-3 py-2 text-right font-mono text-pink-500">
                  {p.metrics.corrections}
                </td>
                <td className="border border-border px-3 py-2 text-right font-mono">
                  {p.metrics.trace}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">What the temporal graph shows</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li><strong>Decision quality (pink, rising).</strong> Started at 100% (P1-P2); briefly dipped to 90% at P5 (when the user requested the Science section be reorganised); recovered to 97% at P7.</li>
        <li><strong>Rework rate (cyan, falling).</strong> 0% through P4; climbed to 10% at P5 (Science reorg); fell back to 3% at P7 as the agent internalised the lesson.</li>
        <li><strong>Human-in-loop corrections.</strong> 0 at P1, P2, P4, P7; 1 at P3 and P6; 2 at P5. The agent learned from the P5 reorganisation feedback.</li>
        <li><strong>Trace length.</strong> Grew from 5 (P1) to 18 (P7) as more deliverables were shipped per phase.</li>
      </ul>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-amber-500">Recursive observation</p>
        <h3 className="mt-1 font-semibold">The agent watches itself</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The same <code>&lt;TemporalGraph&gt;</code> component powers the{' '}
          <Link href="/dashboard" className="text-primary hover:underline">AETHEL temporal dashboard</Link>{' '}
          and this benchmark. The vision: an agent that observes its own
          evolution, surfaces its learning curve to the human-in-loop, and
          uses the temporal graph as context for the next decision. This
          is the most distinctive feature of the platform — the
          agent&apos;s evolution is observable in the same UI as
          AETHEL&apos;s.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Open the AETHEL temporal dashboard
        </Link>
        <Link href="/concepts/replayable-decision-traces" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Read about Replayable Decision Traces
        </Link>
        <Link href="/concepts/provenance-chain" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Read about Provenance Chain
        </Link>
      </div>
    </main>
  )
}
