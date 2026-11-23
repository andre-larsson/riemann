import { useMemo, useState } from 'react'
import Plot, { Legend } from '../components/Plot.jsx'
import { fmt, linePath, pow10Label } from '../lib/chart.js'
import { Slider } from '../components/Controls.jsx'
import { li, primePi, primesUpTo } from '../lib/primes.js'
import { ZEROS } from '../data/zeros.js'

const X0 = 100
const SCHOENFELD_X = 2657
const X1 = 1e7
const GAMMA = ZEROS[0]
const C = { err: 'var(--s1)', rh: 'var(--s2)', beta: 'var(--s3)' }

const rhBound = (x) => (Math.sqrt(x) * Math.log(x)) / (8 * Math.PI)
// Size of the wave that a pair of zeros at beta ± i*GAMMA adds to pi(x):
// 2 |li(x^rho)| ≈ 2 x^beta / (|rho| ln x).
const wave = (x, beta) => (2 * Math.pow(x, beta)) / (Math.hypot(beta, GAMMA) * Math.log(x))

export default function ErrorScale() {
  const [beta, setBeta] = useState(0.75)
  const primes = useMemo(() => primesUpTo(X1), [])

  const err = useMemo(() => {
    const pts = []
    const n = 700
    for (let i = 0; i <= n; i++) {
      const x = X0 * Math.pow(X1 / X0, i / n)
      pts.push([x, Math.max(1, li(x) - primePi(x, primes))])
    }
    return pts
  }, [primes])

  const smooth = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 120; i++) {
      const x = X0 * Math.pow(X1 / X0, i / 120)
      pts.push([x, x >= SCHOENFELD_X ? rhBound(x) : NaN, wave(x, beta)])
    }
    return pts
  }, [beta])

  const atEnd = { err: li(X1) - primePi(X1, primes), rh: rhBound(X1), beta: wave(X1, beta) }

  return (
    <figure className="widget">
      <div className="controls">
        <Slider
          label="Real part β of an imagined zero off the line"
          value={beta}
          min={0.5}
          max={1}
          step={0.01}
          onChange={setBeta}
          format={(v) => v.toFixed(2)}
        />
        <div className="readout full-row">
          <span className="nb">At x = 10⁷:</span> <span className="nb">actual error <strong>{fmt(atEnd.err, 0)}</strong>,</span>{' '}
          <span className="nb">RH bound {fmt(atEnd.rh, 0)},</span>{' '}
          <span className="nb">one zero’s wave {fmt(atEnd.beta, 0)}</span>
        </div>
      </div>
      <Legend
        items={[
          { label: 'Actual error li(x) − π(x)', color: C.err },
          { label: 'Bound if RH is true: √x · ln x / 8π', color: C.rh },
          { label: `Wave from one zero at ${beta.toFixed(2)} + ${GAMMA.toFixed(2)}i`, color: C.beta },
        ]}
      />
      <Plot
        height={320}
        x={{ domain: [X0, X1], type: 'log', label: 'x (log scale)' }}
        y={{ domain: [0.1, 1e6], type: 'log', label: 'size of error (log scale)' }}
        label="Error of li(x) as a count of primes, compared with the bound that RH gives and with the wave from one zero with real part beta"
        endLabels={[
          { y: Math.max(1, atEnd.err), text: 'error', color: C.err },
          { y: atEnd.rh, text: 'RH bound', color: C.rh },
          { y: atEnd.beta, text: 'one zero', color: C.beta },
        ]}
        hover={(x) => {
          const xv = Math.max(X0, Math.min(X1, x))
          const e = li(xv) - primePi(xv, primes)
          return {
            x: xv,
            title: `x = ${fmt(xv, 0)}`,
            rows: [
              { label: 'error', value: fmt(e, 1), color: C.err },
              { label: 'RH bound', value: xv >= SCHOENFELD_X ? fmt(rhBound(xv), 1) : 'from 2,657', color: C.rh },
              { label: 'one zero', value: fmt(wave(xv, beta), 1), color: C.beta },
            ],
            points: [
              { y: Math.max(1, e), color: C.err },
              { y: xv >= SCHOENFELD_X ? rhBound(xv) : NaN, color: C.rh },
              { y: wave(xv, beta), color: C.beta },
            ],
          }
        }}
        xTickFormat={pow10Label}
      >
        {({ sx, sy }) => (
          <>
            <path className="series" style={{ stroke: C.beta }} d={linePath(smooth.map((p) => [p[0], p[2]]), sx, sy)} />
            <path className="series" style={{ stroke: C.rh }} d={linePath(smooth.map((p) => [p[0], p[1]]), sx, sy)} />
            <path className="series thin" style={{ stroke: C.err }} d={linePath(err, sx, sy)} />
          </>
        )}
      </Plot>
      <figcaption>
        From x = 2,657 on, the real error stays under the bound that RH predicts. The green line is the size
        of the wave that one zero at β + 14.13i adds, about 2xᵝ / (|ρ| ln x). At β = ½ it is small: each zero on
        the line adds only a little, and all of them together stay under the bound. For any β above ½ the wave
        grows faster than the bound and passes it in the end. Above β ≈ 0.77 that happens before 10 million;
        at β = 0.6 not until about 10³². So counting primes alone can never settle the question.
      </figcaption>
    </figure>
  )
}
