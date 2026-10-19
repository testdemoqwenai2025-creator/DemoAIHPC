'use client'

import { useState } from 'react'
import type { DemoManifest, Audience } from '@/lib/demos/manifest'

/**
 * DemoRunner — renders a manifest as the 4-panel layout and executes it
 * in the browser.
 *
 * Today this only fully implements the `linear-regression` demo (mirrors the
 * live demo on the GitHub Pages preview at /docs/index.html). Adding more
 * demos means adding branches to the `runDemo` switch and the panel render
 * switch. The shape is intentionally uniform so most of the scaffolding
 * is reusable.
 *
 * Data residency: outputs are downloadable (CSV blob). Nothing is uploaded.
 */

interface DemoRunnerProps {
  demo: DemoManifest
}

// ---- Linear algebra helpers (2×2 closed form) ----
function transpose(M: number[][]) {
  return M[0].map((_, j) => M.map((r) => r[j]))
}
function matmul(A: number[][], B: number[][]) {
  const n = A.length
  const m = B[0].length
  const k = B.length
  const C = Array.from({ length: n }, () => Array(m).fill(0))
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++)
      for (let l = 0; l < k; l++) C[i][j] += A[i][l] * B[l][j]
  return C
}
function matvec(A: number[][], v: number[]) {
  return A.map((row) => row.reduce((s, x, i) => s + x * v[i], 0))
}
function invert2(M: number[][]) {
  const [[a, b], [c, d]] = M
  const det = a * d - b * c
  if (Math.abs(det) < 1e-12)
    throw new Error('Singular matrix (XᵀX not invertible).')
  return [
    [d / det, -b / det],
    [-c / det, a / det],
  ]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface RunResult {
  beta: number[]
  yhat: number[]
  residuals: number[]
  rss: number
  r2: number
}

export function DemoRunner({ demo }: DemoRunnerProps) {
  const [audience, setAudience] = useState<Audience>('student')
  const [data, setData] = useState(
    () =>
      (demo.code.inputs?.[0]?.default as { x: number; y: number }[]) ?? [],
  )
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [doneSteps, setDoneSteps] = useState<string[]>([])

  async function runDemo() {
    setRunning(true)
    setError(null)
    setResult(null)
    setDoneSteps([])
    const trace = demo.observability.traces
    try {
      for (let i = 0; i < trace.length; i++) {
        const step = trace[i]
        setActiveStep(step.id)
        await sleep(180)

        if (step.id === 'parse') {
          // parsed already (data state)
        } else if (step.id === 'xtx') {
          // noop — computed in 'beta' below for brevity
        } else if (step.id === 'xtx-inv') {
          // noop
        } else if (step.id === 'xty') {
          // noop
        } else if (step.id === 'beta') {
          const X = data.map((d) => [1, d.x])
          const y = data.map((d) => d.y)
          const Xt = transpose(X)
          const XtX = matmul(Xt, X)
          const XtX_inv = invert2(XtX)
          const Xty = matvec(Xt, y)
          const beta = matvec(XtX_inv, Xty)
          const yhat = data.map((d) => beta[0] + beta[1] * d.x)
          const residuals = data.map((d, i) => d.y - yhat[i])
          const rss = residuals.reduce((s, r) => s + r * r, 0)
          const ybar = y.reduce((p, v) => p + v, 0) / y.length
          const tss = y.reduce((s, v) => s + (v - ybar) ** 2, 0)
          const r2 = 1 - rss / tss
          setResult({ beta, yhat, residuals, rss, r2 })
        }
        setDoneSteps((prev) => [...prev, step.id])
      }
      setActiveStep(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  function downloadCSV() {
    if (!result) return
    const lines: string[] = []
    lines.push('# AIHPC Advanced — OLS demo output')
    lines.push('# Generated: ' + new Date().toISOString())
    lines.push(`# beta_0 (intercept),${result.beta[0]}`)
    lines.push(`# beta_1 (slope),${result.beta[1]}`)
    lines.push(`# RSS,${result.rss}`)
    lines.push(`# R2,${result.r2}`)
    lines.push('#')
    lines.push('index,x,y,yhat,residual')
    data.forEach((d, i) => {
      lines.push(
        `${i + 1},${d.x},${d.y},${result.yhat[i].toFixed(6)},${result.residuals[i].toFixed(6)}`,
      )
    })
    const blob = new Blob([lines.join('\n') + '\n'], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aihpc-${demo.meta.id}-output-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // ---- Render panels ----
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{demo.meta.title}</p>
            <p className="text-xs text-muted-foreground">
              {demo.meta.domain} &middot; runtime: {demo.runtime} &middot;
              data residency: {demo.dataResidency}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runDemo}
              disabled={running}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {running ? 'Running…' : '▶ Run & observe'}
            </button>
            <button
              type="button"
              onClick={downloadCSV}
              disabled={!result}
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              ⬇ Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Panels grid */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Math panel */}
        <section className="border-b border-border p-6 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Math
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {demo.math.plainLanguage}
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-sm">
            {demo.math.latex}
          </pre>
        </section>

        {/* Code panel */}
        <section className="border-b border-border p-6 md:border-b-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Code
            </p>
            <p className="text-xs text-muted-foreground">
              {demo.code.language}
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed">
            <code>{demo.code.source}</code>
          </pre>
        </section>

        {/* Annotations panel (full width) */}
        <section className="border-b border-border p-6 md:col-span-2 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Annotations
            </p>
            <div className="inline-flex overflow-hidden rounded-full border border-border text-xs">
              {(['student', 'researcher', 'executive'] as Audience[]).map(
                (a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudience(a)}
                    className={`px-3 py-1 font-semibold ${
                      audience === a
                        ? 'bg-violet-500 text-white'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
            <pre className="whitespace-pre-wrap font-sans">
              {demo.annotations[audience]}
            </pre>
          </div>
        </section>

        {/* Observability panel (full width) */}
        <section className="p-6 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              4. Inputs &amp; Observability
            </p>
            <p className="text-xs text-muted-foreground">
              Edit the data, then Run
            </p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  #
                </th>
                <th className="border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  x
                </th>
                <th className="border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  y
                </th>
                <th className="border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  ŷ
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td className="border border-border px-2 py-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-border p-0">
                    <input
                      type="number"
                      step="any"
                      value={row.x}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!Number.isNaN(v)) {
                          setData((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, x: v } : r,
                            ),
                          )
                        }
                      }}
                      className="w-full bg-transparent px-2 py-1 text-center font-mono text-sm outline-none"
                    />
                  </td>
                  <td className="border border-border p-0">
                    <input
                      type="number"
                      step="any"
                      value={row.y}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!Number.isNaN(v)) {
                          setData((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, y: v } : r,
                            ),
                          )
                        }
                      }}
                      className="w-full bg-transparent px-2 py-1 text-center font-mono text-sm outline-none"
                    />
                  </td>
                  <td className="border border-border px-2 py-1 text-center font-mono text-sm">
                    {result ? result.yhat[i].toFixed(3) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-4 space-y-1">
            {demo.observability.traces.map((step) => {
              const isDone = doneSteps.includes(step.id)
              const isActive = activeStep === step.id
              return (
                <li
                  key={step.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    isActive
                      ? 'border-violet-500 bg-violet-500/10'
                      : isDone
                        ? 'border-emerald-500'
                        : 'border-border'
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      isActive
                        ? 'animate-pulse bg-violet-500'
                        : isDone
                          ? 'bg-emerald-500'
                          : 'bg-muted-foreground/40'
                    }`}
                  />
                  {step.label}
                </li>
              )
            })}
          </ul>

          {result && (
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Result
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">β₀ (intercept)</span>
                  <span className="font-mono">
                    {result.beta[0].toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">β₁ (slope)</span>
                  <span className="font-mono">
                    {result.beta[1].toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSS</span>
                  <span className="font-mono">{result.rss.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">R²</span>
                  <span className="font-mono">{result.r2.toFixed(6)}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-500">
              Error: {error}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
