import { useMemo, useState } from 'react'
import Plot, { Legend } from '../components/Plot.jsx'
import { fmt, linePath } from '../lib/chart.js'
import { Slider } from '../components/Controls.jsx'
import { primesUpTo } from '../lib/primes.js'
import { zetaRight } from '../lib/zeta.js'

const N_MAX = 10000
const C = { sum: 'var(--s1)', prod: 'var(--s2)' }

export default function EulerProduct() {
  const [s, setS] = useState(2)
  const primes = useMemo(() => primesUpTo(N_MAX), [])

  const { series, exact } = useMemo(() => {
    const exact = zetaRight(s, 0)[0]
    const sum = new Float64Array(N_MAX + 1)
    const prod = new Float64Array(N_MAX + 1)
    let acc = 0
    for (let n = 1; n <= N_MAX; n++) {
      acc += Math.pow(n, -s)
      sum[n] = acc
    }
    let pr = 1
    let j = 0
    for (let n = 1; n <= N_MAX; n++) {
      if (j < primes.length && primes[j] === n) {
        pr /= 1 - Math.pow(n, -s)
        j++
      }
      prod[n] = pr
    }
    const series = []
    for (let i = 0; i <= 300; i++) {
      const n = Math.max(1, Math.round(Math.pow(N_MAX, i / 300)))
      series.push([n, sum[n], prod[n]])
    }
    return { series, exact }
  }, [s, primes])

  // Both curves start at 1 (N = 1), so the axis starts there too.
  const yMax = 1 + (exact - 1) * 1.12

  return (
    <figure className="widget">
      <div className="controls">
        <Slider label="Exponent s" value={s} min={1.1} max={4} step={0.05} onChange={setS} format={(v) => v.toFixed(2)} />
        <div className="readout">
          ζ({s.toFixed(2)}) = <strong>{exact.toFixed(5)}</strong>
          {Math.abs(s - 2) < 1e-9 && <span className="muted"> = π²/6</span>}
        </div>
      </div>
      <Legend
        items={[
          { label: 'Sum of 1/nˢ for n ≤ N', color: C.sum },
          { label: 'Product over primes p ≤ N', color: C.prod },
          { label: 'Limit ζ(s)', color: 'var(--ink-muted)' },
        ]}
      />
      <Plot
        height={280}
        x={{ domain: [1, N_MAX], type: 'log', label: 'N (log scale)' }}
        y={{ domain: [1, yMax], label: 'value' }}
        label={`Partial sums and partial Euler products of zeta at s = ${s.toFixed(2)}`}
        hover={(x) => {
          const n = Math.max(1, Math.min(N_MAX, Math.round(x)))
          const row = series.reduce((best, r) => (Math.abs(r[0] - n) < Math.abs(best[0] - n) ? r : best), series[0])
          return {
            x: row[0],
            title: `N = ${row[0].toLocaleString('en-US')}`,
            rows: [
              { label: 'sum', value: fmt(row[1], 4), color: C.sum },
              { label: 'product', value: fmt(row[2], 4), color: C.prod },
              { label: 'ζ(s)', value: fmt(exact, 4) },
            ],
            points: [
              { y: row[1], color: C.sum },
              { y: row[2], color: C.prod },
            ],
          }
        }}
      >
        {({ sx, sy, m, iw }) => (
          <>
            <line className="reference" x1={m.left} x2={m.left + iw} y1={sy(exact)} y2={sy(exact)} />
            <path className="series" style={{ stroke: C.sum }} d={linePath(series.map((r) => [r[0], r[1]]), sx, sy)} />
            <path className="series" style={{ stroke: C.prod }} d={linePath(series.map((r) => [r[0], r[2]]), sx, sy)} />
          </>
        )}
      </Plot>
      <figcaption>
        Both climb to the same limit. The sum uses every whole number; the product uses only primes. Move s
        toward 1 and both grow without end: at s = 1 the sum is 1 + ½ + ⅓ + …, which diverges. That is
        Euler&apos;s proof that there are infinitely many primes.
      </figcaption>
    </figure>
  )
}
