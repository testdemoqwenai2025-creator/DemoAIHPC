import Link from 'next/link'
import { listDemos } from '@/lib/demos/registry'

/**
 * /demos — listing page.
 *
 * Renders the registry as cards. Click-through to /demos/[id] for the full
 * 4-panel layout.
 *
 * NOTE: this route exists in the Next.js app (private repo). The GitHub
 * Pages preview currently serves the static landing page at
 * https://testdemoqwenai2025-creator.github.io/DemoAIHPC/ which embeds the
 * linear regression demo directly. When external hosting (Vercel / GCP /
 * Azure) is added in a later phase, this route becomes the canonical entry.
 */
export default function DemosPage() {
  const demos = listDemos()

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm text-muted-foreground">Demos</p>
      <h1 className="mt-1 text-4xl font-bold tracking-tight">
        Live, observable demos
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Each demo is a first-class artifact with provenance — math, code,
        annotations, an observable execution trace, and a downloadable result.
        All demos run in your browser; no data leaves your machine.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {demos.map((d) => (
          <Link
            key={d.meta.id}
            href={`/demos/${d.meta.id}`}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-violet-500/50"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{d.meta.domain}</span>
              <span className="rounded-full border border-border px-2 py-0.5">
                {d.meta.difficulty}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold group-hover:text-violet-500">
              {d.meta.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {d.meta.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-1">
              {d.meta.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Runtime: <span className="text-foreground">{d.runtime}</span>{' '}
              &middot; Data residency:{' '}
              <span className="text-foreground">{d.dataResidency}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
