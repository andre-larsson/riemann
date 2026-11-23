import { useMemo, useState } from 'react'
import Plot, { Legend } from '../components/Plot.jsx'
import { fmt, linePath, stepPath } from '../lib/chart.js'
import { Segmented, Slider } from '../components/Controls.jsx'
import { primePowerJumps } from '../lib/primes.js'
import { ZEROS } from '../data/zeros.js'

const C = { psi: 'var(--s1)', approx: 'var(--s2)' }
const RANGES = [
  { value: 30, label: '30' },
  { value: 100, label: '100' },
  { value: 400, label: '400' },
]
const LN_2PI = Math.log(2 * Math.PI)

// Riemann-von Mangoldt explicit formula, truncated after the first N zeros:
// psi(x) = x - sum_rho x^rho / rho - ln(2 pi) - 1/2 ln(1 - x^-2)
function psiFromZeros(x, N) {
  const lx = Math.log(x)
  let osc = 0
  for (let k = 0; k < N; k++) {
    const g = ZEROS[k]
    const a = g * lx
    osc += (0.5 * Math.cos(a) + g * Math.sin(a)) / (0.25 + g * g)
  }
  return x - 2 * Math.sqrt(x) * osc - LN_2PI - 0.5 * Math.log(1 - 1 / (x * x))
}

function psiExact(x, jumps) {
  let s = 0
  for (const j of jumps) {
    if (j.x > x) break
    s += j.size
  }
  return s
}

export default function ExplicitFormula() {
  const [N, setN] = useState(10)
  const [xMax, setXMax] = useState(30)
  const jumps = useMemo(() => primePowerJumps(400), [])

  const staircase = useMemo(() => {
    const pts = [[1, 0]]
    let s = 0
    for (const j of jumps) {
      if (j.x > xMax) break
      s += j.size
      pts.push([j.x, s])
    }
    pts.push([xMax, s])
    return pts
  }, [jumps, xMax])

  const approx = useMemo(() => {
    const pts = []
    const n = 1400
    for (let i = 0; i <= n; i++) {
      const x = 1.5 + ((xMax - 1.5) * i) / n
      pts.push([x, psiFromZeros(x, N)])
    }
    return pts
  }, [N, xMax])

  const yMax = xMax * 1.15

  return (
    <figure className="widget">
      <div className="controls">
        <Slider
          label="Zeros used"
          value={N}
          min={0}
          max={ZEROS.length}
          step={1}
          onChange={setN}
          format={(v) => (v === 0 ? 'none' : v === 1 ? 'the first one' : `the first ${v}`)}
        />
        <Segmented label="x up to" options={RANGES} value={xMax} onChange={setXMax} />
      </div>
      <Legend
        items={[
          { label: 'ψ(x), the weighted prime count', color: C.psi },
          { label: `Riemann's formula with ${N} zero${N === 1 ? '' : 's'}`, color: C.approx },
        ]}
      />
      <Plot
        height={340}
        x={{ domain: [1, xMax], label: 'x' }}
        y={{ domain: [0, yMax], label: 'ψ(x)' }}
        label={`Chebyshev psi function and its reconstruction from ${N} zeta zeros, for x up to ${xMax}`}
        hover={(x) => {
          const xv = Math.max(1.5, Math.min(xMax, x))
          const exact = psiExact(xv, jumps)
          const ap = psiFromZeros(xv, N)
          const j = jumps.find((q) => Math.abs(q.x - xv) < Math.max(0.35, xMax / 250))
          return {
            x: xv,
            title: j ? `x ≈ ${j.x} (${j.isPrime ? 'prime' : `power of ${j.p}`})` : `x = ${xv.toFixed(2)}`,
            rows: [
              { label: 'ψ(x)', value: fmt(exact, 2), color: C.psi },
              { label: 'formula', value: fmt(ap, 2), color: C.approx },
            ],
            points: [
              { y: exact, color: C.psi },
              { y: ap, color: C.approx },
            ],
          }
        }}
      >
        {({ sx, sy, m, ih }) => (
          <>
            {jumps
              .filter((j) => j.x <= xMax && j.isPrime)
              .map((j) => (
                <line key={j.x} className="zero-tick" x1={sx(j.x)} x2={sx(j.x)} y1={m.top + ih} y2={m.top + ih - 6} />
              ))}
            <path className="series" style={{ stroke: C.psi }} d={stepPath(staircase, sx, sy)} />
            <path className="series thin" style={{ stroke: C.approx }} d={linePath(approx, sx, sy)} />
          </>
        )}
      </Plot>
      <figcaption>
        With no zeros the formula gives a straight line, roughly x. Each zero adds one wave. With enough waves
        the curve snaps into a staircase, and the steps sit exactly on the primes (ticks on the axis) and prime
        powers.
      </figcaption>
    </figure>
  )
}
