import { useMemo, useState } from 'react'
import Plot, { Legend } from '../components/Plot.jsx'
import { fmt, linePath, pow10Label, stepPath } from '../lib/chart.js'
import { Segmented } from '../components/Controls.jsx'
import { li, primePi, primesUpTo } from '../lib/primes.js'

const RANGES = [
  { value: 100, label: '100' },
  { value: 1000, label: '1,000' },
  { value: 100000, label: '100,000' },
  { value: 10000000, label: '10 million' },
]

const C = { pi: 'var(--s1)', li: 'var(--s2)', xlog: 'var(--s3)' }

export default function PrimeCount() {
  const [xMax, setXMax] = useState(100)
  const primes = useMemo(() => primesUpTo(1e7), [])

  const data = useMemo(() => {
    let pi
    if (xMax <= 1000) {
      pi = [[0, 0]]
      let k = 0
      for (const p of primes) {
        if (p > xMax) break
        pi.push([p, ++k])
      }
      pi.push([xMax, k])
    } else {
      pi = []
      for (let i = 0; i <= 600; i++) {
        const x = (xMax * i) / 600
        pi.push([x, primePi(x, primes)])
      }
    }
    const smooth = []
    for (let i = 0; i <= 400; i++) {
      const x = 2 + ((xMax - 2) * i) / 400
      smooth.push([x, li(x), x / Math.log(x)])
    }
    return { pi, smooth }
  }, [xMax, primes])

  const yMax = li(xMax) * 1.05

  return (
    <figure className="widget">
      <div className="controls">
        <Segmented label="Count primes up to" options={RANGES} value={xMax} onChange={setXMax} />
      </div>
      <Legend
        items={[
          { label: 'π(x), the true count', color: C.pi },
          { label: 'li(x), the logarithmic integral', color: C.li },
          { label: 'x / ln x', color: C.xlog },
        ]}
      />
      <Plot
        height={320}
        x={{ domain: [0, xMax], label: 'x' }}
        xTickFormat={xMax >= 1e6 ? (v) => (v === 0 ? '0' : `${v / 1e6}M`) : undefined}
        y={{ domain: [0, yMax], label: 'primes ≤ x' }}
        label={`Prime counting function compared with li(x) and x over ln x, for x up to ${xMax}`}
        endLabels={[
          { y: primePi(xMax, primes), text: 'π(x)', color: C.pi },
          { y: li(xMax), text: 'li(x)', color: C.li },
          { y: xMax / Math.log(xMax), text: 'x / ln x', color: C.xlog },
        ]}
        hover={(x) => {
          const xv = Math.max(2, Math.min(xMax, x))
          const n = primePi(xv, primes)
          return {
            x: xv,
            title: `x = ${fmt(xv, 1)}`,
            rows: [
              { label: 'π(x)', value: fmt(n, 0), color: C.pi },
              { label: 'li(x)', value: fmt(li(xv), 1), color: C.li },
              { label: 'x / ln x', value: fmt(xv / Math.log(xv), 1), color: C.xlog },
            ],
            points: [
              { y: n, color: C.pi },
              { y: li(xv), color: C.li },
              { y: xv / Math.log(xv), color: C.xlog },
            ],
          }
        }}
      >
        {({ sx, sy }) => (
          <>
            <path className="series" style={{ stroke: C.xlog }} d={linePath(data.smooth.map((p) => [p[0], p[2]]), sx, sy)} />
            <path className="series" style={{ stroke: C.li }} d={linePath(data.smooth.map((p) => [p[0], p[1]]), sx, sy)} />
            <path
              className="series"
              style={{ stroke: C.pi }}
              d={xMax <= 1000 ? stepPath(data.pi, sx, sy) : linePath(data.pi, sx, sy)}
            />
          </>
        )}
      </Plot>
      <figcaption>
        Zoomed out, the staircase π(x) is a smooth curve. li(x) follows it far more closely than x / ln x.
      </figcaption>
      <PrimeTable primes={primes} />
    </figure>
  )
}

function PrimeTable({ primes }) {
  const rows = [10, 100, 1000, 1e4, 1e5, 1e6, 1e7].map((x) => {
    const n = primePi(x, primes)
    return { x, n, xl: x / Math.log(x), li: li(x) }
  })
  return (
    <details className="table-view">
      <summary>Show the numbers</summary>
      <table>
        <thead>
          <tr>
            <th>x</th>
            <th>π(x)</th>
            <th>x / ln x</th>
            <th>li(x)</th>
            <th>li(x) − π(x)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.x}>
              <td>{pow10Label(r.x)}</td>
              <td>{r.n.toLocaleString('en-US')}</td>
              <td>{Math.round(r.xl).toLocaleString('en-US')}</td>
              <td>{Math.round(r.li).toLocaleString('en-US')}</td>
              <td>{Math.round(r.li - r.n).toLocaleString('en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
