import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDemoById, listDemos } from '@/lib/demos/registry'
import { DemoRunner } from '@/components/demos/DemoRunner'

/**
 * /demos/[id] — single demo view with the 4-panel layout.
 *
 * Renders: Math | Code | Annotations | Observability popup.
 *
 * The actual execution is delegated to <DemoRunner>, which currently only
 * knows how to run `linear-regression` (matches the live demo on the GitHub
 * Pages preview). Additional demos are added by:
 *   1. creating a manifest in `src/lib/demos/seeds/`,
 *   2. registering it in `src/lib/demos/registry.ts`,
 *   3. implementing a runner branch in `DemoRunner`.
 */

export function generateStaticParams() {
  return listDemos().map((d) => ({ id: d.meta.id }))
}

export default function DemoPage({ params }: { params: { id: string } }) {
  const demo = getDemoById(params.id)
  if (!demo) notFound()

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/demos" className="hover:text-foreground">
          Demos
        </Link>{' '}
        / {demo.meta.id}
      </p>
      <h1 className="mt-1 text-4xl font-bold tracking-tight">
        {demo.meta.title}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {demo.meta.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-border px-2 py-0.5">
          {demo.meta.domain}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5">
          {demo.meta.difficulty}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5">
          Runtime: {demo.runtime}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5">
          Data residency: {demo.dataResidency}
        </span>
        {demo.meta.audience.map((a) => (
          <span
            key={a}
            className="rounded-full border border-border px-2 py-0.5"
          >
            audience: {a}
          </span>
        ))}
      </div>

      <DemoRunner demo={demo} />
    </main>
  )
}
