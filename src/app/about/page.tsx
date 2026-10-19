'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * About page.
 *
 * Explains the dual-repository workflow (public preview + private source of
 * truth), the AETHEL platform scope, and the compliance posture. Styled with
 * shadcn/ui tokens so the global dark/light toggle applies here too.
 */
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Badge variant="secondary" className="mb-4">
        About
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        About AIHPC Advanced
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        AIHPC Advanced is a unified scientific computing platform that bundles
        bioinformatics, cheminformatics, molecular modelling and materials
        science workflows behind a single polyglot microservices architecture,
        integrated with the AETHEL hypercomputing emulation layer.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dual-repository workflow</CardTitle>
            <CardDescription>
              Why we maintain two repositories and how they relate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              <strong>AIHPC-Advanced</strong> (private) is the source of truth.
              All code changes, worklogs, internal assets (.txt, .md, .png
              capture from the studio IDE, etc.) live here. Access requires an
              NDA.
            </p>
            <p>
              <strong>DemoAIHPC</strong> (public) is a synced mirror intended
              for preview by interested parties without an NDA in place. It is
              kept in sync with the private repository on every push, so the
              two are functionally identical at HEAD.
            </p>
            <p>
              This separation keeps legal scenarios simple: external reviewers
              interact with the public mirror, while contributors work in the
              private one and their commits propagate automatically.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AETHEL integration</CardTitle>
            <CardDescription>
              Advanced Experimental Theoretical Hypercomputing Emulation
              Layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              AETHEL exposes quantum circuit simulation, neural architecture
              search, automated hypothesis generation, a cross-domain knowledge
              graph, predictive model ensembles and citation network analysis
              behind one stable API.
            </p>
            <p>
              The platform reports a 12&nbsp;ms inference latency, 94.7% model
              accuracy and a 2.4&nbsp;M-node knowledge graph across the
              catalogue of integrated scientific domains.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Polyglot stack</CardTitle>
            <CardDescription>
              Each language is used where it is strongest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <ul className="list-disc space-y-1 pl-5">
              <li>Golang — API gateway &amp; gRPC services</li>
              <li>Elixir — real-time concurrency &amp; websockets</li>
              <li>Python — ML/AI pipeline &amp; scientific computing core</li>
              <li>Scala — Spark / Flink streaming engine</li>
              <li>Rust — query engine core &amp; memory-safe compute</li>
              <li>C — low-level system calls &amp; BLAS/LAPACK integration</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance &amp; contact</CardTitle>
            <CardDescription>
              GDPR, HIPAA and how to reach us.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              <strong>GDPR.</strong> The public preview does not collect
              personal data. A Data Processing Agreement is available for
              enterprise deployments.
            </p>
            <p>
              <strong>HIPAA.</strong> No PHI is processed by the public
              preview. A Business Associate Agreement is available for
              regulated workloads.
            </p>
            <p>
              <strong>Contact:</strong>{' '}
              <a
                className="text-primary hover:underline"
                href="mailto:testdemoqwenai2025@gmail.com"
              >
                testdemoqwenai2025@gmail.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/preview1">View Preview 1</Link>
        </Button>
        <Button asChild variant="outline">
          <a
            href="https://github.com/testdemoqwenai2025-creator/DemoAIHPC"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open DemoAIHPC on GitHub
          </a>
        </Button>
      </div>
    </main>
  )
}
