/**
 * DemoManifest — the single file format that defines an AIHPC Advanced demo
 * end-to-end.
 *
 * The vision (see worklog Phase 2 entry) is that every demo is a first-class
 * artifact with provenance: math → code → annotations → observability →
 * downloadable report. A `DemoManifest` describes all of those layers
 * declaratively so that:
 *
 *   - the `/demos/[id]` route can render the four panels uniformly;
 *   - the run popup can stream execution steps without knowing the
 *     specifics of each demo;
 *   - reports can be auto-generated from the manifest + execution trace;
 *   - the cross-domain knowledge graph can index demos by `meta.tags` and
 *     `meta.domain`.
 *
 * Data residency rule (locked in Phase 2): outputs are downloadable. The
 * `runtime` field must be `'browser'` for the foreseeable future (no external
 * services). When GCP / Azure come online in a later phase, `'server'` and
 * `'server-sandboxed'` runtimes will be added.
 */

export type Audience = 'student' | 'researcher' | 'executive'

export type DemoRuntime =
  // Pure client-side JS / WASM (Pyodide). No network calls. Default for Phase 2.
  | 'browser'
  // Future: server-side sandboxed execution (Firecracker / gVisor). Not yet
  // implemented — gated on external hosting.
  | 'server-sandboxed'

export type ReportFormat = 'summary' | 'blog' | 'paper' | 'csv' | 'json'

export interface MetricDef {
  /** Stable identifier, e.g. `rss`, `r2`. */
  id: string
  /** Human label, e.g. `Residual sum of squares`. */
  label: string
  /** Format hint, e.g. `float:6`, `int`, `percent`. */
  format: 'float' | 'int' | 'percent' | 'string'
}

export interface TraceDef {
  /** Step identifier matched at runtime. */
  id: string
  /** Human label shown in the observability popup. */
  label: string
  /** Optional sub-steps for nested traces. */
  children?: TraceDef[]
}

export interface DatasetRef {
  /**
   * Either a preset web dataset id (resolved from the dataset registry) or
   * `upload` to indicate the user must attach a private file in-browser.
   *
   * Private uploads NEVER leave the browser — see the data residency
   * callout in `docs/index.html` and the README.
   */
  id: string
  kind: 'web' | 'upload'
  /** Required for `kind === 'upload'`; gated by subscription tier. */
  tier?: 'free' | 'pro' | 'team'
  label: string
  description?: string
}

export interface InputDef {
  id: string
  label: string
  type: 'number' | 'text' | 'select' | 'data-table'
  default?: unknown
  options?: { value: string; label: string }[]
}

export interface DemoManifest {
  /** Stable id, e.g. `linear-regression`. Used as URL slug. */
  meta: {
    id: string
    title: string
    domain: string
    tags: string[]
    difficulty: 'introductory' | 'intermediate' | 'advanced'
    audience: Audience[]
    /** One-line summary for the listing page. */
    summary: string
  }

  /** Math panel content. */
  math: {
    /** LaTeX source rendered by KaTeX (Phase 3 dependency). */
    latex: string
    /** Plain-language restatement for accessibility & SEO. */
    plainLanguage: string
  }

  /** Code panel content. */
  code: {
    language: 'typescript' | 'python' | 'rust' | 'golang' | 'elixir' | 'scala' | 'c'
    source: string
    /** Optional inputs the user can tweak before running. */
    inputs?: InputDef[]
  }

  /** Annotations panel content — audience-specific. */
  annotations: Record<Audience, string>

  /** Dataset references. */
  datasets: {
    required: DatasetRef[]
  }

  /** Observability spec — what metrics and trace steps the runtime emits. */
  observability: {
    metrics: MetricDef[]
    traces: TraceDef[]
  }

  /** Supported report formats. CSV/JSON are always available; others gated. */
  reports: {
    formats: ReportFormat[]
  }

  /** Where this demo runs. `browser` = no external services (Phase 2 default). */
  runtime: DemoRuntime

  /**
   * Data residency contract. For Phase 2 this is always `downloadable` —
   * the result of a run is offered as a browser-side download and is never
   * persisted server-side. When external hosting is added later, this field
   * will admit `server-persisted` and `ephemeral` options.
   */
  dataResidency: 'downloadable'
}
