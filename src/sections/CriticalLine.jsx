import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Plot from '../components/Plot.jsx'
import { linePath, niceTicks, scale, useWidth } from '../lib/chart.js'
import { Slider } from '../components/Controls.jsx'
import { zeta } from '../lib/zeta.js'
import { ZEROS } from '../data/zeros.js'

const T_MAX = 60
const ZEROS_HERE = ZEROS.filter((g) => g <= T_MAX)

function tracePath(sigma) {
  const ts = []
  for (let t = 0; t <= T_MAX + 1e-9; t += 0.02) ts.push(t)
  for (const g of ZEROS_HERE) ts.push(g)
  ts.sort((a, b) => a - b)
  return ts.map((t) => {
    const [re, im] = zeta(sigma, t)
    return { t, re, im, abs: Math.hypot(re, im) }
  })
}

function at(path, t) {
  let lo = 0
  let hi = path.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (path[mid].t <= t) lo = mid
    else hi = mid
  }
  return path[lo]
}

export default function CriticalLine() {
  const [sigma, setSigma] = useState(0.5)
  const [t, setT] = useState(14.134725142)
  const [playing, setPlaying] = useState(false)
  const path = useMemo(() => tracePath(sigma), [sigma])
  const cur = at(path, t)

  const best = useMemo(() => path.reduce((b, p) => (p.t > 1 && p.abs < b.abs ? p : b), { abs: Infinity }), [path])

  const startRef = useRef(0)
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let now_t = startRef.current
    let id = 0
    const step = (now) => {
      now_t = Math.min(T_MAX, now_t + ((now - last) / 1000) * 5)
      last = now
      setT(now_t)
      if (now_t >= T_MAX) setPlaying(false)
      else id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [playing])

  function togglePlay() {
    startRef.current = t >= T_MAX - 0.01 ? 0 : t
    setPlaying(!playing)
  }

  const yMax = useMemo(() => Math.min(10, Math.max(4, Math.ceil(Math.max(...path.filter((p) => p.t > 2).map((p) => p.abs))))), [path])
  const onLine = Math.abs(sigma - 0.5) < 1e-9
  const nearZero = cur.abs < 0.02

  return (
    <figure className="widget">
      <div className="controls">
        <Slider
          label="Real part σ"
          value={sigma}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={setSigma}
          format={(v) => (Math.abs(v - 0.5) < 1e-9 ? '0.50 (the critical line)' : v.toFixed(2))}
        />
        <Slider
          label="Height t"
          value={t}
          min={0}
          max={T_MAX}
          step={0.01}
          onChange={(v) => {
            setPlaying(false)
            setT(v)
          }}
          format={(v) => v.toFixed(2)}
        />
        <button type="button" className="play" onClick={togglePlay} aria-pressed={playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="twin">
        <SpiralPanel path={path} t={t} cur={cur} />
        <div>
          <Plot
            height={300}
            x={{ domain: [0, T_MAX], label: 'height t' }}
            y={{ domain: [0, yMax], label: `|ζ(${sigma.toFixed(2)} + it)|` }}
            margin={{ left: 40 }}
            label={`Absolute value of zeta along the vertical line with real part ${sigma.toFixed(2)}`}
            hover={(x) => {
              const p = at(path, Math.max(0, Math.min(T_MAX, x)))
              return {
                x: p.t,
                title: `t = ${p.t.toFixed(2)}`,
                rows: [{ label: '|ζ(s)|', value: p.abs.toFixed(3), color: 'var(--s1)' }],
                points: [{ y: p.abs, color: 'var(--s1)' }],
              }
            }}
          >
            {({ sx, sy, m, ih }) => (
              <>
                {ZEROS_HERE.map((g) => (
                  <line key={g} className="zero-tick" x1={sx(g)} x2={sx(g)} y1={m.top + ih} y2={m.top + ih - 8} />
                ))}
                <path className="series" style={{ stroke: 'var(--s1)' }} d={linePath(path.map((p) => [p.t, p.abs]), sx, sy)} />
                <line className="cursor" x1={sx(t)} x2={sx(t)} y1={m.top} y2={m.top + ih} />
                <circle className="end-dot" cx={sx(t)} cy={sy(Math.min(cur.abs, yMax))} r={5} style={{ fill: 'var(--s1)' }} />
              </>
            )}
          </Plot>
          <p className="small muted">Ticks on the axis: heights of the first {ZEROS_HERE.length} zeros.</p>
        </div>
      </div>
      <p className={'verdict' + (onLine ? ' hit' : '')} aria-live="polite">
        {nearZero && onLine ? (
          <>
            <strong>Zero.</strong> At t = {cur.t.toFixed(3)} the curve passes through the origin: ζ(½ + {cur.t.toFixed(3)}i) = 0.
          </>
        ) : onLine ? (
          <>
            On σ = ½ the curve hits the origin {ZEROS_HERE.length} times between t = 0 and {T_MAX}. Press play, or
            move t to one of the ticks.
          </>
        ) : (
          <>
            On σ = {sigma.toFixed(2)} the smallest value of |ζ| is <strong>{best.abs.toFixed(3)}</strong> (at t ≈{' '}
            {best.t.toFixed(1)}). The curve comes close to the origin but never hits it.
          </>
        )}
      </p>
    </figure>
  )
}

function SpiralPanel({ path, t, cur }) {
  const [ref, width] = useWidth(320)
  const clipId = 'clip' + useId().replace(/:/g, '')
  const size = Math.min(width, 340)
  const ext = useMemo(() => {
    let e = 1.5
    for (const p of path) e = Math.max(e, Math.min(6, Math.max(Math.abs(p.re), Math.abs(p.im))))
    return Math.ceil(e * 1.05 * 2) / 2
  }, [path])
  const pad = 26
  const x0 = -ext + 0.6
  const sx = scale({ domain: [x0, x0 + 2 * ext] }, [pad, size - 8])
  const sy = scale({ domain: [-ext, ext] }, [size - pad, 8])
  const traced = path.filter((p) => p.t <= t)
  const ticks = niceTicks(-ext, ext, 4)

  return (
    <div className="spiral" ref={ref}>
      <svg width={size} height={size} role="img" aria-label="Path of zeta(s) in the complex plane as the height t increases">
        <g className="grid">
          {ticks.map((v) => (
            <line key={'v' + v} x1={sx(v)} x2={sx(v)} y1={8} y2={size - pad} />
          ))}
          {ticks.map((v) => (
            <line key={'h' + v} x1={pad} x2={size - 8} y1={sy(v)} y2={sy(v)} />
          ))}
        </g>
        <line className="axis" x1={pad} x2={size - 8} y1={sy(0)} y2={sy(0)} />
        <line className="axis" x1={sx(0)} x2={sx(0)} y1={8} y2={size - pad} />
        <g className="ticks">
          {ticks.map((v) =>
            v === 0 || v < x0 || v > x0 + 2 * ext ? null : (
              <text key={'tx' + v} x={sx(v)} y={size - pad + 16} textAnchor="middle">
                {v}
              </text>
            ),
          )}
          {ticks.map((v) =>
            v === 0 ? null : (
              <text key={'ty' + v} x={pad - 6} y={sy(v)} dy="0.32em" textAnchor="end">
                {v}
              </text>
            ),
          )}
        </g>
        <defs>
          <clipPath id={clipId}>
            <rect x={pad} y={8} width={size - pad - 8} height={size - pad - 8} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path className="series ghost" d={linePath(path.map((p) => [p.re, p.im]), sx, sy)} />
          <path className="series" style={{ stroke: 'var(--s1)' }} d={linePath(traced.map((p) => [p.re, p.im]), sx, sy)} />
          <circle className="origin" cx={sx(0)} cy={sy(0)} r={4} />
          <circle className="end-dot" cx={sx(cur.re)} cy={sy(cur.im)} r={5} style={{ fill: 'var(--s1)' }} />
        </g>
        <text className="axis-label" x={size - 10} y={sy(0) - 6} textAnchor="end">
          Re ζ
        </text>
        <text className="axis-label" x={sx(0) + 6} y={18}>
          Im ζ
        </text>
      </svg>
    </div>
  )
}
