import type { DemoManifest } from './manifest'
import { linearRegression } from './seeds/linear-regression'
import { nucleotideAnalysis } from './seeds/nucleotide-analysis'

/**
 * Demo registry.
 *
 * Single source of truth for the demos available in the Next.js app. The
 * `/demos` route iterates this list to render the listing page; the
 * `/demos/[id]` route looks up by id.
 *
 * Mirrors the demos embedded in `docs/` so visitors to the GitHub
 * Pages preview see the same content as visitors to the running app.
 */
export const demos: DemoManifest[] = [linearRegression, nucleotideAnalysis]

export function getDemoById(id: string): DemoManifest | undefined {
  return demos.find((d) => d.meta.id === id)
}

export function listDemos(): DemoManifest[] {
  return demos
}
