import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Mathematics — AIHPC Advanced Science',
  description:
    'AlphaProof-style natural-language to formal theorem proving in Lean / Coq style. Step-by-step proof traces with observable intermediate lemmas and downloadable proof certificates.',
}

export default function MathsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Badge variant="secondary" className="mb-3">
        Science &middot; Mathematics
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        Theorem proving
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        AlphaProof-style natural-language to formal theorem proving. Pose
        a conjecture in plain English, the assistant translates to Lean
        declarations, searches for lemmas in the cross-domain knowledge
        graph, proposes a proof, and emits a verifiable proof
        certificate. Every intermediate lemma is observable in the
        execution-trace popup.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>What the user supplies.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Natural-language conjecture (free text).</li>
              <li>Target system: Lean 4 / Coq / Isabelle (default Lean 4).</li>
              <li>Optional context (additional definitions, prior lemmas).</li>
              <li>Optional difficulty hint (olympiad / research).</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
            <CardDescription>What the user receives.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Formalised statement in Lean 4 syntax.</li>
              <li>Step-by-step proof with each tactic annotated.</li>
              <li>List of invoked lemmas (linked to knowledge graph).</li>
              <li>Verification status (compiled by lean — Phase 5+).</li>
              <li>
                <strong>Proof certificate download</strong> (Lean source
                + JSON trace).
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Method</CardTitle>
            <CardDescription>The mathematical backbone.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Two-stage: (1) an LLM proposes tactic steps conditioned on
              the proof goal state and the cross-domain knowledge graph;
              (2) a verifier (Lean kernel) accepts or rejects each
              step. Rejection triggers re-sampling with the failure
              feedback. Successive steps form the proof tree.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observability</CardTitle>
            <CardDescription>Execution trace steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Parse natural language → formal goal.</li>
              <li>Knowledge-graph lemma lookup.</li>
              <li>LLM tactic proposal.</li>
              <li>Verifier check (Lean kernel).</li>
              <li>Accept / reject / re-sample.</li>
              <li>Compile complete proof.</li>
              <li>Serialize certificate + offer download.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/science">Back to Science Hub</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/demos/linear-regression">Try the OLS demo</Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Theorem proving requires an LLM call (external service) and a Lean
        kernel verifier (sandboxed execution). Both are gated on the
        external-services phase, so this page is documentation-only for
        now. For early access, contact{' '}
        <a
          href="mailto:testdemoqwenai2025@gmail.com"
          className="text-primary hover:underline"
        >
          testdemoqwenai2025@gmail.com
        </a>
        .
      </p>
    </main>
  )
}
