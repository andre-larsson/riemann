import { useEffect, useId, useRef, useState } from 'react'
import { niceTicks, useWidth } from '../lib/chart.js'
import { Slider, Toggle } from '../components/Controls.jsx'
import { zeta } from '../lib/zeta.js'
import { ZEROS } from '../data/zeros.js'

// The critical line sits at this fraction of the width at every zoom level,
// so zooming in always closes in on the line instead of losing it.
const LINE_AT = 0.6
// Rough widths of the overlay labels, used to keep them inside the picture.
const LINE_LABEL_W = 120
const POLE_LABEL_W = 90

function phaseColor(th) {
  const c = (o) => Math.round(255 * (0.5 + 0.45 * Math.cos(th + o)))
  return `rgb(${c(0)},${c((-2 * Math.PI) / 3)},${c((2 * Math.PI) / 3)})`
}

// conic-gradient runs clockwise from the top; rotate so 0 is to the right and
// negate so the wheel turns counterclockwise like the complex plane.
const WHEEL = `conic-gradient(from 90deg, ${Array.from({ length: 13 }, (_, i) => `${phaseColor((-i * Math.PI) / 6)} ${i * 30}deg`).join(', ')})`

function fmtC(re, im) {
  const f = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : v.toFixed(3))
  return `${f(re)} ${im < 0 ? '−' : '+'} ${f(Math.abs(im))}i`
}

export default function ZetaPlane() {
  const [wrapRef, width] = useWidth()
  const [span, setSpan] = useState(30)
  const [tc, setTc] = useState(8)
  const [showZeros, setShowZeros] = useState(true)
  const [pt, setPt] = useState(null)
  const clipId = 'plane' + useId().replace(/:/g, '')
  const canvasRef = useRef(null)
  const workerRef = useRef(null)
  const queue = useRef({ busy: false, pending: [], id: 0 })

  const m = { top: 28, right: 12, bottom: 42, left: 44 }
  const height = Math.round(Math.min(560, Math.max(340, width * 0.72)))
  const iw = Math.max(10, width - m.left - m.right)
  const ih = Math.max(10, height - m.top - m.bottom)
  const s0 = 0.5 - LINE_AT * span
  const s1 = s0 + span
  const tSpan = (span * ih) / iw
  const t0 = tc - tSpan / 2
  const t1 = tc + tSpan / 2
  const sx = (s) => m.left + ((s - s0) / (s1 - s0)) * iw
  const sy = (t) => m.top + ((t1 - t) / (t1 - t0)) * ih

  useEffect(() => {
    const q = queue.current
    const worker = new Worker(new URL('../lib/planeWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (e) => {
      const { w, h, img } = e.data
      const cv = canvasRef.current
      if (cv) {
        cv.width = w
        cv.height = h
        cv.getContext('2d').putImageData(new ImageData(img, w, h), 0, 0)
      }
      q.busy = false
      pump(q, worker)
    }
    pump(q, worker)
    return () => {
      worker.terminate()
      workerRef.current = null
      q.busy = false
    }
  }, [])

  useEffect(() => {
    const q = queue.current
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const job = (k) => ({
      id: ++q.id,
      w: Math.max(8, Math.round(iw * k)),
      h: Math.max(8, Math.round(ih * k)),
      s0,
      s1,
      t0,
      t1,
    })
    q.pending = [job(0.3), job(dpr)]
    if (workerRef.current) pump(q, workerRef.current)
  }, [iw, ih, s0, s1, t0, t1])

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    if (px < m.left || px > m.left + iw || py < m.top || py > m.top + ih) return setPt(null)
    setPt({ s: s0 + ((px - m.left) / iw) * (s1 - s0), t: t1 - ((py - m.top) / ih) * (t1 - t0), px, py })
  }

  const zerosInView = ZEROS.flatMap((g) => [g, -g]).filter((g) => g >= t0 && g <= t1)
  const trivial = []
  // Only rings that fit fully inside the picture, so none is cut by the edge.
  for (let k = 2; sx(-k) - 7 >= m.left; k += 2) if (t0 <= 0 && t1 >= 0) trivial.push(-k)

  // Put a label right of the strip when it fits, otherwise left of it.
  const fitsRight = (w) => sx(1) + 6 + w <= m.left + iw
  const sideLabel = (w) => (fitsRight(w) ? { x: sx(1) + 6, textAnchor: 'start' } : { x: sx(0) - 6, textAnchor: 'end' })

  const readout = pt ? zeta(pt.s, pt.t) : null
  const sTicks = niceTicks(s0, s1, Math.max(3, Math.floor(iw / 70)))
  const tTicks = niceTicks(t0, t1, Math.max(3, Math.floor(ih / 60)))

  return (
    <figure className="widget">
      <div className="controls">
        <Slider label="Height (centre of view)" value={tc} min={0} max={120} step={0.5} onChange={setTc} format={(v) => `t = ${v.toFixed(1)}`} />
        <Slider label="Zoom (width of view)" value={span} min={4} max={60} step={1} onChange={setSpan} format={(v) => `${v} units`} />
        <Toggle label="Mark the zeros" checked={showZeros} onChange={setShowZeros} />
      </div>
      <div className="plane" ref={wrapRef} style={{ height }}>
        <canvas
          ref={canvasRef}
          className="plane-canvas"
          style={{ left: m.left, top: m.top, width: iw, height: ih }}
          aria-hidden="true"
        />
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Phase portrait of the Riemann zeta function for real part ${s0.toFixed(0)} to ${s1.toFixed(0)} and imaginary part ${t0.toFixed(0)} to ${t1.toFixed(0)}. Zeros on the critical line are marked with rings.`}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={(e) => e.pointerType !== 'touch' && setPt(null)}
        >
          <g className="ticks">
            {sTicks.map((v) => (
              <text key={'s' + v} x={sx(v)} y={m.top + ih + 18} textAnchor="middle">
                {v}
              </text>
            ))}
            {tTicks.map((v) => (
              <text key={'t' + v} x={m.left - 8} y={sy(v)} dy="0.32em" textAnchor="end">
                {v}
              </text>
            ))}
          </g>
          <text className="axis-label" x={m.left + iw} y={height - 4} textAnchor="end">
            real part σ
          </text>
          <text className="axis-label" x={m.left} y={16}>
            imaginary part t
          </text>
          <defs>
            <clipPath id={clipId}>
              <rect x={m.left} y={m.top} width={iw} height={ih} />
            </clipPath>
          </defs>
          <g className="plane-overlay" clipPath={`url(#${clipId})`}>
            <line className="strip-edge" x1={sx(0)} x2={sx(0)} y1={m.top} y2={m.top + ih} />
            <line className="strip-edge" x1={sx(1)} x2={sx(1)} y1={m.top} y2={m.top + ih} />
            <line className="critical-line" x1={sx(0.5)} x2={sx(0.5)} y1={m.top} y2={m.top + ih} />
            <text className="plane-label" {...sideLabel(LINE_LABEL_W)} y={m.top + 16}>
              critical line σ = ½
            </text>
            {t0 <= 0 && t1 >= 0 && (
              <g>
                <line className="real-axis" x1={m.left} x2={m.left + iw} y1={sy(0)} y2={sy(0)} />
                <text className="plane-label" {...sideLabel(POLE_LABEL_W)} y={sy(0) - 8}>
                  pole at s = 1
                </text>
                <path className="pole" d={`M${sx(1) - 5},${sy(0) - 5}l10,10m0,-10l-10,10`} />
              </g>
            )}
            {showZeros &&
              zerosInView.map((g) => <circle key={g} className="zero-ring" cx={sx(0.5)} cy={sy(g)} r={6} />)}
            {showZeros &&
              trivial.map((s) => <circle key={s} className="zero-ring trivial" cx={sx(s)} cy={sy(0)} r={6} />)}
            {showZeros && trivial.length > 0 && (
              <text className="plane-label" x={sx(trivial[0])} y={sy(0) + 22} textAnchor="middle">
                trivial zeros
              </text>
            )}
            {pt && <circle className="probe" cx={pt.px} cy={pt.py} r={5} />}
          </g>
        </svg>
      </div>
      <div className="plane-footer">
        <div className="wheel-legend">
          <span className="wheel" style={{ background: WHEEL }} aria-hidden="true" />
          <span>
            Colour shows the direction of ζ(s): red for positive real values, yellow-green for +i, cyan for
            negative, violet for −i. Each band from dark to light is one doubling of |ζ(s)|. At a zero, every
            colour meets.
          </span>
        </div>
        <p className="readout mono" aria-live="polite">
          {readout ? (
            <>
              s = {fmtC(pt.s, pt.t)} → ζ(s) = {fmtC(readout[0], readout[1])}, |ζ(s)| ={' '}
              {Math.hypot(readout[0], readout[1]).toPrecision(3)}
            </>
          ) : (
            'Hover over the picture (or tap it) to read off ζ(s).'
          )}
        </p>
      </div>
    </figure>
  )
}

function pump(q, worker) {
  if (q.busy || q.pending.length === 0) return
  q.busy = true
  worker.postMessage(q.pending.shift())
}
