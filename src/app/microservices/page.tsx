import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = {
  title: 'Microservices — AIHPC Advanced',
  description:
    'The full polyglot microservices dashboard. Open the home page and switch to microservices view for the interactive experience.',
}

/**
 * /microservices — gateway to the full polyglot microservices dashboard.
 *
 * The dashboard itself is the home page (`/`) in `viewMode === 'microservices'`.
 * This route acts as a landing/summary that deep-links into it.
 */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Platform metrics, AETHEL status, polyglot stack overview.' },
  { id: 'architecture', label: 'Architecture', desc: 'Service mesh, deployment topology, observability.' },
  { id: 'connectors', label: 'Connectors Overview', desc: 'Catalogue of integrations across scientific domains.' },
  { id: 'ide-studio', label: 'IDE Studio', desc: 'In-browser authoring of demos, queries, and workflows.' },
  { id: 'data-lake', label: 'Data Lake', desc: 'Ingestion, schema registry, binary parsing.' },
  { id: 'publish', label: 'Publishing', desc: 'DOI minting, authorship, open-access / peer review flags.' },
]

export default function MicroservicesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm text-muted-foreground">Platform</p>
      <h1 className="mt-1 text-4xl font-bold tracking-tight">Microservices</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        The polyglot microservices dashboard unifies the platform's core
        infrastructure, data layer, streaming hub, and scientific connectors.
        Open the home page in microservices view for the interactive
        experience, or jump directly to a section below.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Open full dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/aethel">AETHEL Connector</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/knowledge-graph">Knowledge Graph</Link>
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {TABS.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.label}</CardTitle>
              <CardDescription>{t.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Open in dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
