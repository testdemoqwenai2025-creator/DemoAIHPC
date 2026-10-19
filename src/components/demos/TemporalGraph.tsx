'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * TemporalGraph — reusable React component for rendering any list of
 * timesteps as a temporal line chart with play/replay/scrub controls.
 *
 * Extracted from docs/dashboard.html. Used by:
 *   - /benchmark (phase metrics over time)
 *   - future /dashboard Next.js route (AETHEL knowledge graph evolution)
 *   - any demo that ships a temporal trace
 *
 * Props:
 *   - timesteps: array of { id, label, ts, metrics: { key: value } }
 *   - series: array of { key, label, color } — which metrics to plot
 *   - height (default 240)
 *   - autoPlay (default false)
 */
export interface Timestep {
  id: string
  label: string
  ts?: string
  metrics: Record<string, number>
}

export interface Series {
  key: string
  label: string
  color: string
}

interface TemporalGraphProps {
  timesteps: Timestep[]
  series: Series[]
  height?: number
  autoPlay?: boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function TemporalGraph({
  timesteps,
  series,
  height = 240,
  autoPlay = false,
}: TemporalGraphProps) {
  const [currentT, setCurrentT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Compute min/max across all series for y-axis scaling
  const allValues = timesteps.flatMap((t) =>
    series.map((s) => t.metrics[s.key]).filter((v) => v != null && !Number.isNaN(v)),
  )
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yRange = yMax - yMin || 1

  const W = 800
  const H = height
  const padL = 50
  const padR = 20
  const padT = 16
  const padB = 40
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const xFor = (i: number) =>
    padL + (i / Math.max(timesteps.length - 1, 1)) * innerW
  const yFor = (v: number) =>
    padT + innerH - ((v - yMin) / yRange) * innerH

  function startPlay() {
    if (playing) return
    setPlaying(true)
    const stepMs = 800 / speed
    timerRef.current = setInterval(() => {
      setCurrentT((t) => {
        if (t >= timesteps.length - 1) {
          stopPlay()
          return t
        }
        return t + 1
      })
    }, stepMs)
  }
  function stopPlay() {
    setPlaying(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }
  function replay() {
    stopPlay()
    setCurrentT(0)
    setTimeout(startPlay, 200)
  }
  function stepFwd() {
    stopPlay()
    setCurrentT((t) => Math.min(t + 1, timesteps.length - 1))
  }
  function stepBack() {
    stopPlay()
    setCurrentT((t) => Math.max(t - 1, 0))
  }

  useEffect(() => {
    if (autoPlay) startPlay()
    return () => stopPlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cur = timesteps[currentT]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Top row: title + step info */}
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="font-mono text-xs text-muted-foreground">
          {cur ? `${cur.id} · ${cur.label}` : '—'}
        </span>
        <span className="text-xs text-muted-foreground">
          Timestep {currentT + 1} of {timesteps.length}
        </span>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Axes */}
        <line
          x1={padL}
          y1={padT + innerH}
          x2={padL + innerW}
          y2={padT + innerH}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground"
          opacity="0.4"
        />
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + innerH}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground"
          opacity="0.4"
        />

        {/* Y-axis labels (min/max) */}
        <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="10" fill="currentColor" className="text-muted-foreground">
          {yMax.toFixed(2)}
        </text>
        <text x={padL - 6} y={padT + innerH} textAnchor="end" fontSize="10" fill="currentColor" className="text-muted-foreground">
          {yMin.toFixed(2)}
        </text>

        {/* X-axis labels (timestep ids) */}
        {timesteps.map((t, i) => (
          <text
            key={t.id}
            x={xFor(i)}
            y={padT + innerH + 14}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            className={i === currentT ? 'text-violet-500 font-bold' : 'text-muted-foreground'}
          >
            {t.id}
          </text>
        ))}

        {/* Vertical cursor line at current timestep */}
        <line
          x1={xFor(currentT)}
          y1={padT}
          x2={xFor(currentT)}
          y2={padT + innerH}
          stroke="#8b5cf6"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.6"
        />

        {/* Series polylines — show only up to currentT */}
        {series.map((s) => {
          const points = timesteps
            .slice(0, currentT + 1)
            .map((t, i) => {
              const v = t.metrics[s.key]
              if (v == null || Number.isNaN(v)) return null
              return `${xFor(i)},${yFor(v)}`
            })
            .filter(Boolean)
            .join(' ')
          return (
            <polyline
              key={s.key}
              points={points}
              stroke={s.color}
              strokeWidth="2"
              fill="none"
            />
          )
        })}

        {/* Dots at current timestep */}
        {series.map((s) => {
          const v = cur?.metrics[s.key]
          if (v == null || Number.isNaN(v)) return null
          return (
            <circle
              key={s.key}
              cx={xFor(currentT)}
              cy={yFor(v)}
              r="4"
              fill={s.color}
            />
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono font-bold">
              {cur?.metrics[s.key]?.toFixed(2) ?? '—'}
            </span>
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={playing ? stopPlay : startPlay}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          onClick={replay}
          className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
        >
          ↺ Replay
        </button>
        <button
          type="button"
          onClick={stepBack}
          disabled={currentT === 0}
          className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          ◀ Step
        </button>
        <button
          type="button"
          onClick={stepFwd}
          disabled={currentT >= timesteps.length - 1}
          className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          Step ▶
        </button>
        <div className="ml-auto inline-flex overflow-hidden rounded-md border border-border">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs font-semibold ${
                speed === s ? 'bg-violet-500 text-white' : 'text-muted-foreground'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={timesteps.length - 1}
        value={currentT}
        onChange={(e) => {
          stopPlay()
          setCurrentT(parseInt(e.target.value, 10))
        }}
        className="mt-3 w-full accent-violet-500"
      />
    </div>
  )
}
