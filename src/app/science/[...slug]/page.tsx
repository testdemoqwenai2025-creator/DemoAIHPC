import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Science Subdomain — AIHPC Advanced',
  description:
    'Science subdomain page. Live execution lands in a later phase; the static GitHub Pages preview has the rich content (animated SVG + polyglot code).',
}

/**
 * Catch-all route for science sub-pages.
 *
 * /science/biology/molecular, /science/chemistry/organic,
 * /science/physics/waves, etc. all hit this route. More specific
 * routes (/science/proteins, /science/genetics, /science/nucleotides,
 * /science/maths) take precedence for those paths.
 *
 * Each subdomain has a corresponding static page at
 * /docs/science/<slug>.html on the public GitHub Pages preview with
 * rich content (animated SVG illustration, polyglot code toggle in
 * 6 platform languages, inputs/outputs/method/observability). This
 * Next.js route is the deep-linkable foundation; the live interactive
 * content lives on the static page until external hosting lands.
 */

interface SubdomainMeta {
  hub: string
  hubHref: string
  title: string
  staticHref: string
  color: string
}

const SUBDOMAINS: Record<string, SubdomainMeta> = {
  'biology/molecular': { hub: 'Biology', hubHref: '/science/biology', title: 'Molecular Biology', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/biology/molecular.html', color: 'emerald' },
  'biology/imaging': { hub: 'Biology', hubHref: '/science/biology', title: 'Cell Imaging', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/biology/imaging.html', color: 'emerald' },
  'biology/systems': { hub: 'Biology', hubHref: '/science/biology', title: 'Systems Biology', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/biology/systems.html', color: 'emerald' },
  'biology/evolutionary': { hub: 'Biology', hubHref: '/science/biology', title: 'Evolutionary Biology', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/biology/evolutionary.html', color: 'emerald' },
  'chemistry/organic': { hub: 'Chemistry', hubHref: '/science/chemistry', title: 'Organic Chemistry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/chemistry/organic.html', color: 'amber' },
  'chemistry/inorganic': { hub: 'Chemistry', hubHref: '/science/chemistry', title: 'Inorganic Chemistry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/chemistry/inorganic.html', color: 'amber' },
  'chemistry/physical': { hub: 'Chemistry', hubHref: '/science/chemistry', title: 'Physical Chemistry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/chemistry/physical.html', color: 'amber' },
  'chemistry/analytical': { hub: 'Chemistry', hubHref: '/science/chemistry', title: 'Analytical Chemistry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/chemistry/analytical.html', color: 'amber' },
  'chemistry/materials': { hub: 'Chemistry', hubHref: '/science/chemistry', title: 'Materials Chemistry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/chemistry/materials.html', color: 'amber' },
  'chemistry/computational': { hub: 'Chemistry', hubHref: '/science/chemistry', title: 'Computational Chemistry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/chemistry/computational.html', color: 'amber' },
  'physics/space': { hub: 'Physics', hubHref: '/science/physics', title: 'Space & Astrophysics', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/physics/space.html', color: 'blue' },
  'physics/waves': { hub: 'Physics', hubHref: '/science/physics', title: 'Waves & Optics', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/physics/waves.html', color: 'blue' },
  'physics/sound': { hub: 'Physics', hubHref: '/science/physics', title: 'Sound & Acoustics', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/physics/sound.html', color: 'blue' },
  'physics/mechanics': { hub: 'Physics', hubHref: '/science/physics', title: 'Mechanics', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/physics/mechanics.html', color: 'blue' },
  'physics/quantum': { hub: 'Physics', hubHref: '/science/physics', title: 'Quantum', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/physics/quantum.html', color: 'blue' },
  'physics/thermo': { hub: 'Physics', hubHref: '/science/physics', title: 'Thermodynamics', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/physics/thermo.html', color: 'blue' },
  'maths/algebra': { hub: 'Mathematics', hubHref: '/science/maths', title: 'Algebra', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/maths/algebra.html', color: 'pink' },
  'maths/analysis': { hub: 'Mathematics', hubHref: '/science/maths', title: 'Analysis', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/maths/analysis.html', color: 'pink' },
  'maths/geometry': { hub: 'Mathematics', hubHref: '/science/maths', title: 'Geometry', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/maths/geometry.html', color: 'pink' },
  'maths/number-theory': { hub: 'Mathematics', hubHref: '/science/maths', title: 'Number Theory', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/maths/number-theory.html', color: 'pink' },
  'maths/probability': { hub: 'Mathematics', hubHref: '/science/maths', title: 'Probability & Statistics', staticHref: 'https://testdemoqwenai2025-creator.github.io/DemoAIHPC/science/maths/probability.html', color: 'pink' },
}

export function generateStaticParams() {
  return Object.keys(SUBDOMAINS).map((slug) => ({ slug: slug.split('/') }))
}

export default async function ScienceSubdomainPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const slugPath = slug.join('/')
  const meta = SUBDOMAINS[slugPath]
  if (!meta) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href={meta.hubHref} className="hover:text-foreground">
          {meta.hub} Hub
        </Link>{' '}
        / {meta.title}
      </p>
      <Badge variant="secondary" className="mt-2">
        Science &middot; {meta.hub} &middot; {meta.title}
      </Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{meta.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        This subdomain page documents the planned interface for{' '}
        {meta.title.toLowerCase()} on AIHPC Advanced.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Live interactive page</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The rich content for this subdomain — animated SVG illustration,
        polyglot code toggle (Python / Rust / Go / C / Elixir / Scala),
        inputs / outputs / method / observability — lives on the static
        GitHub Pages page (kept there because Pages can&apos;t run
        server-side Next.js). When external hosting lands in a later
        phase, the rich content will move into this Next.js route.
      </p>
      <p className="mt-4">
        <a
          href={meta.staticHref}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Open the live page &rarr;
        </a>
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Related concepts</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/concepts/replayable-decision-traces"
            className="text-primary hover:underline"
          >
            Replayable Decision Traces
          </Link>{' '}
          — every computation produces a replayable trace.
        </li>
        <li>
          <Link
            href="/concepts/provenance-first"
            className="text-primary hover:underline"
          >
            Provenance-First Computing
          </Link>{' '}
          — every output is a first-class artifact with full provenance.
        </li>
        <li>
          <Link
            href="/concepts/lazy-evaluation"
            className="text-primary hover:underline"
          >
            Lazy Evaluation as UX
          </Link>{' '}
          — popups open immediately and stream updates.
        </li>
        <li>
          <Link
            href="/concepts/audience-annotations"
            className="text-primary hover:underline"
          >
            Audience-Specific Annotations
          </Link>{' '}
          — student / researcher / executive.
        </li>
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={meta.hubHref}
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Back to {meta.hub} Hub
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Open the temporal dashboard
        </Link>
      </div>
    </main>
  )
}
