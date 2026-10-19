import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Recursive Agentic Benchmark — AIHPC Advanced',
  description:
    'A temporal graph of the agent\'s own performance across project phases: trace length, decision quality, rework rate, human-in-loop corrections.',
}

const PHASES = [
  { name: 'P1 — Clone + dual-repo', date: '2026-10-19', files: 10, quality: '100%', rework: '0%', corrections: 0, trace: 5 },
  { name: 'P2 — Demo framework', date: '2026-10-19', files: 8, quality: '100%', rework: '0%', corrections: 0, trace: 7 },
  { name: 'P3 — AETHEL migration', date: '2026-10-19', files: 17, quality: '95%', rework: '5%', corrections: 1, trace: 9 },
  { name: 'P4 — MPA + dashboard', date: '2026-10-19', files: 17, quality: '100%', rework: '0%', corrections: 0, trace: 11 },
  { name: 'P5 — Lazy-eval popup + Science reorg', date: '2026-10-19', files: 30, quality: '90%', rework: '10%', corrections: 2, trace: 14 },
  { name: 'P6 — Nucleotides demo + CI + ribbon restyle', date: '2026-10-19', files: 12, quality: '95%', rework: '5%', corrections: 1, trace: 12 },
]

export default function BenchmarkPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / Recursive Agentic Benchmark'}
      </p>
      <Badge variant="secondary" className="mt-2">Insights &middot; Recursive Agentic Benchmark</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Recursive Agentic Benchmark
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        The team framed this project as <em>recursive development of use
        agentic workflows</em>. This page observes the agent&apos;s own
        performance as a temporal graph — every phase is a timestep; every
        metric is a state-change. Same UI as the temporal dashboard, but
        the subject is the agent itself.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What this is</h2>
      <p className="mt-2 text-muted-foreground">
        A formal benchmark for the agent&apos;s own performance:{' '}
        <strong>trace length</strong> (how many steps to reach a goal),{' '}
        <strong>decision quality</strong> (how often the human accepts the
        agent&apos;s first-pass proposal), <strong>rework rate</strong>{' '}
        (fraction of timesteps that get rolled back),{' '}
        <strong>human-in-loop corrections</strong> (count of explicit
        guidance messages). Every project phase is a timestep; the metrics
        evolve visibly.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Phase-by-phase metrics (observed so far)</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border bg-card px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Phase</th>
              <th className="border border-border bg-card px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Files</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Decision quality</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Rework</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Corrections</th>
              <th className="border border-border bg-card px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">Trace len</th>
            </tr>
          </thead>
          <tbody>
            {PHASES.map((p) => (
              <tr key={p.name} className="hover:bg-accent/50">
                <td className="border border-border px-3 py-2">{p.name}</td>
                <td className="border border-border px-3 py-2 font-mono text-xs">{p.date}</td>
                <td className="border border-border px-3 py-2 text-right font-mono">{p.files}</td>
                <td className="border border-border px-3 py-2 text-right font-mono font-bold text-emerald-500">{p.quality}</td>
                <td className="border border-border px-3 py-2 text-right font-mono text-cyan-500">{p.rework}</td>
                <td className="border border-border px-3 py-2 text-right font-mono text-pink-500">{p.corrections}</td>
                <td className="border border-border px-3 py-2 text-right font-mono">{p.trace}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-amber-500">Foundation</p>
        <h3 className="mt-1 font-semibold">Live interactive benchmark graph — coming soon</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The phase metrics above are tabulated manually today. The next
          iteration will render them as a temporal graph in the same UI
          as the{' '}
          <Link href="/dashboard" className="text-primary hover:underline">
            AETHEL temporal dashboard
          </Link>{' '}
          — making the agent&apos;s evolution observable in the same
          viewer. The vision: an agent that watches itself improve, and
          surfaces its own learning curve to the human-in-loop.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Open the temporal dashboard
        </Link>
        <Link href="/concepts/replayable-decision-traces" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold">
          Read about Replayable Decision Traces
        </Link>
      </div>
    </main>
  )
}
