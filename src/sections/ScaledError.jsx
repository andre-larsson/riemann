import { useMemo, useState } from 'react'
import Plot, { Legend } from '../components/Plot.jsx'
import { fmt, linePath, pow10Label, sup } from '../lib/chart.js'
import { Segmented, Slider } from '../components/Controls.jsx'
import { li, primePi, primesUpTo } from '../lib/primes.js'
import { ZEROS } from '../data/zeros.js'

const C = { err: 'var(--s1)', waves: 'var(--s2)', offset: 'var(--ink-2)' }
const Y = [-0.4, 3]

// Near view: real prime counts, x from 100 to 10^7.
const NEAR = [100, 1e7]

// Far views: regions where pi(x) > li(x) is known or reported. x itself would
// overflow a double, so these views work in log10 x and never form x.
// lo/hi/ticks/mark are mantissas: x = mantissa × 10^e.
const REGIONS = {
  r316: {
    e: 316,
    lo: 1,
    hi: 2,
    ticks: [1, 1.2, 1.4, 1.6, 1.8, 2],
    mark: [1.39822],
    markLabel: 'known crossing, 1.398 × 10³¹⁶',
    story:
      'Bays and Hudson found this region in 2000, and later work pinned it down further. It is the earliest ' +
      'crossing known. Here the zeros line up and pull the curve down close to 0: to about 0.1 with 300 zeros, ' +
      'and to about 0.001 with 10,000.',
    status:
      'It has been proved that the real error goes below 0 here, but only very slightly. So for a stretch of ' +
      'numbers, π(x) is larger than li(x). The proofs use a million or more zeros, plus a proven limit on how ' +
      'much all the remaining zeros can add.',
  },
  r370: {
    e: 370,
    lo: 4.7,
    hi: 9.4,
    ticks: [5, 6, 7, 8, 9],
    mark: [6.62, 6.69],
    markLabel: 'known crossings, 6.62–6.69 × 10³⁷⁰',
    story: 'te Riele found this region in 1987. It was the earliest known crossing until 2000.',
    status:
      'te Riele proved in 1987 that the real error goes below 0 here: π(x) is larger than li(x) for more than ' +
      '10¹⁸⁰ numbers in a row.',
  },
  r1165: {
    e: 1165,
    lo: 1.1,
    hi: 2.2,
    ticks: [1.2, 1.4, 1.6, 1.8, 2, 2.2],
    mark: [1.53, 1.65],
    markLabel: 'known crossings, 1.53–1.65 × 10¹¹⁶⁵',
    story: 'Lehman found this region in 1966, with the method that the later searches also use.',
    status:
      'Lehman proved in 1966 that the real error goes below 0 here: π(x) is larger than li(x) for more than ' +
      '10⁵⁰⁰ numbers in a row.',
  },
  r9608: {
    e: 9608,
    lo: 1.1,
    hi: 2.2,
    ticks: [1.2, 1.4, 1.6, 1.8, 2, 2.2],
    mark: [1.617],
    markLabel: 'crossing region, 1.617 × 10⁹⁶⁰⁸',
    story: 'Bays and Hudson found this region in 2000, far beyond the earliest one.',
    status:
      'Bays and Hudson’s computation suggests that the real error goes well below 0 here, to below about −0.18. ' +
      'This dip is much deeper than the earlier ones.',
  },
}

const VIEWS = [
  { value: 'near', label: 'Up to 10 million' },
  { value: 'r316', label: '1.4 × 10³¹⁶' },
  { value: 'r370', label: '6.7 × 10³⁷⁰' },
  { value: 'r1165', label: '1.6 × 10¹¹⁶⁵' },
  { value: 'r9608', label: '1.6 × 10⁹⁶⁰⁸' },
]

// Prime-power terms of Riemann's formula, li(x) - R(x) = sum over n >= 2 of
// -mu(n)/n li(x^(1/n)), as [n, -mu(n)].
const MU = [[2, 1], [3, 1], [5, 1], [6, -1], [7, 1], [10, -1], [11, 1], [13, 1]]

// The offset, scaled by ln x / sqrt x, as a function of u = ln x. It tends to 1.
function offset(u) {
  if (u > 60) return 1 + 2 / u + 8 / (u * u) + 48 / (u * u * u)
  let s = 0
  for (const [n, sign] of MU) {
    const y = Math.exp(u / n)
    if (y > 1.0001) s += (sign / n) * li(y)
  }
  return (s * u) / Math.exp(u / 2)
}

// The waves from the first N pairs of zeros, scaled the same way:
// sum of 2 Re(x^(i gamma) / rho) with rho = 1/2 + i gamma.
function waves(u, N) {
  let s = 0
  for (let k = 0; k < N; k++) {
    const g = ZEROS[k]
    s += (2 * (0.5 * Math.cos(g * u) + g * Math.sin(g * u))) / (0.25 + g * g)
  }
  return s
}

const scaleBy = (x) => Math.log(x) / Math.sqrt(x)
const approxW = (s) => s.length * 6.6

export default function ScaledError() {
  const [view, setView] = useState('near')
  const [N, setN] = useState(300)
  const primes = useMemo(() => primesUpTo(NEAR[1]), [])
  const region = REGIONS[view] ?? null
  const far = region !== null
  const E = far ? region.e : 0
  const mant = (lx) => Math.pow(10, lx - E)
  const xLabel = (lx) => `${mant(lx).toFixed(3)} × 10${sup(E)}`

  // x positions as log10 x, so all views share one code path.
  const grid = useMemo(() => {
    const [a, b] = region
      ? [region.e + Math.log10(region.lo), region.e + Math.log10(region.hi)]
      : [Math.log10(NEAR[0]), Math.log10(NEAR[1])]
    const n = 1500
    return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n)
  }, [region])

  const actual = useMemo(
    () =>
      far
        ? []
        : grid.map((lx) => {
            const x = Math.pow(10, lx)
            return [x, (li(x) - primePi(x, primes)) * scaleBy(x)]
          }),
    [far, grid, primes],
  )

  const curves = useMemo(() => {
    const at = (lx) => (far ? lx : Math.pow(10, lx))
    const off = grid.map((lx) => [at(lx), offset(lx * Math.LN10)])
    const model = grid.map((lx, i) => [at(lx), off[i][1] + waves(lx * Math.LN10, N)])
    return { off, model }
  }, [far, grid, N])

  const low = (pts) => pts.reduce((b, p) => (p[1] < b[1] ? p : b), [0, Infinity])
  const lowActual = far ? null : low(actual)
  const lowModel = low(curves.model)
  const last = (pts) => pts[pts.length - 1][1]

  const x = far
    ? {
        domain: [E + Math.log10(region.lo), E + Math.log10(region.hi)],
        ticks: region.ticks.map((m) => E + Math.log10(m)),
        label: `x, in units of 10${sup(E)} (log scale)`,
      }
    : { domain: NEAR, type: 'log', label: 'x (log scale)' }

  return (
    <figure className="widget">
      <div className="controls">
        <Segmented label="Range" options={VIEWS} value={view} onChange={setView} />
        <Slider
          label="Zeros in the waves"
          value={N}
          min={0}
          max={ZEROS.length}
          step={1}
          onChange={setN}
          format={(v) => (v === 0 ? 'none' : v === 1 ? 'the first one' : `the first ${v}`)}
        />
        <div className="readout full-row">
          {far ? (
            <>
              Lowest point of the waves on the chart: <strong>{fmt(lowModel[1], 2)}</strong>,{' '}
              <span className="nb">at x ≈ {xLabel(lowModel[0])}</span>
            </>
          ) : (
            <>
              Lowest scaled error on the chart: <strong>{fmt(lowActual[1], 2)}</strong>,{' '}
              <span className="nb">at x ≈ {fmt(lowActual[0], 0)}</span>
            </>
          )}
        </div>
      </div>
      <Legend
        items={[
          ...(far ? [] : [{ label: 'Scaled error (li(x) − π(x)) · ln x / √x', color: C.err }]),
          { label: `Riemann’s waves: offset + ${N} zero${N === 1 ? '' : 's'}`, color: C.waves },
          { label: 'Offset from prime powers', color: C.offset, dashed: true },
        ]}
      />
      <Plot
        height={320}
        x={x}
        y={{ domain: Y, label: 'scaled error' }}
        xTickFormat={far ? (v) => String(Number(mant(v).toFixed(1))) : pow10Label}
        label={
          far
            ? `Riemann's waves from ${N} zeros, scaled, for x between ${region.lo} and ${region.hi} times 10 to the ${E}`
            : `Error of li(x) scaled by ln x over root x, for x up to 10 million, with Riemann's waves from ${N} zeros`
        }
        endLabels={[
          ...(far ? [] : [{ y: last(actual), text: 'error', color: C.err }]),
          { y: last(curves.model), text: 'waves', color: C.waves },
          { y: last(curves.off), text: 'offset', color: C.offset },
        ]}
        hover={(xv) => {
          if (far) {
            const lx = Math.max(x.domain[0], Math.min(x.domain[1], xv))
            const u = lx * Math.LN10
            const o = offset(u)
            const w = o + waves(u, N)
            return {
              x: lx,
              title: `x ≈ ${xLabel(lx)}`,
              rows: [
                { label: 'waves', value: fmt(w, 3), color: C.waves },
                { label: 'offset', value: fmt(o, 3), color: C.offset },
              ],
              points: [{ y: w, color: C.waves }],
            }
          }
          const xx = Math.max(NEAR[0], Math.min(NEAR[1], xv))
          const u = Math.log(xx)
          const e = (li(xx) - primePi(xx, primes)) * scaleBy(xx)
          const o = offset(u)
          const w = o + waves(u, N)
          return {
            x: xx,
            title: `x = ${fmt(xx, 0)}`,
            rows: [
              { label: 'scaled error', value: fmt(e, 3), color: C.err },
              { label: 'waves', value: fmt(w, 3), color: C.waves },
              { label: 'offset', value: fmt(o, 3), color: C.offset },
            ],
            points: [
              { y: e, color: C.err },
              { y: w, color: C.waves },
            ],
          }
        }}
      >
        {({ sx, sy, m, iw, ih }) => (
          <>
            <rect className="below-zero" x={m.left} y={sy(0)} width={iw} height={m.top + ih - sy(0)} />
            <line className="zero-line" x1={m.left} x2={m.left + iw} y1={sy(0)} y2={sy(0)} />
            <text className="axis-label" x={m.left + 8} y={sy(0) + 17}>
              below 0: π(x) is larger than li(x)
            </text>
            {far && <CrossingMark region={region} sx={sx} m={m} iw={iw} ih={ih} />}
            <path className="series thin" style={{ stroke: C.waves }} d={linePath(curves.model, sx, sy)} />
            {!far && <path className="series thin" style={{ stroke: C.err }} d={linePath(actual, sx, sy)} />}
            {/* The offset goes on top, on a casing, so the swings do not bury it. */}
            <path className="series casing" d={linePath(curves.off, sx, sy)} />
            <path className="series thin dashed" style={{ stroke: C.offset }} d={linePath(curves.off, sx, sy)} />
          </>
        )}
      </Plot>
      {far && (
        <p className="verdict">
          <strong>{lowModel[1] >= 0 ? 'Why the line does not cross 0.' : 'The line is an approximation.'}</strong>{' '}
          The line adds up {N === 0 ? 'none of the zeros' : `only the first ${N} zero${N === 1 ? '' : 's'}`}, so it
          is an approximation. The sum over all of the infinitely many zeros is exact: it is the real scaled error.{' '}
          {region.status}
        </p>
      )}
      <figcaption>
        {far ? (
          <>
            Nobody can count the primes this far out, but the waves only need ln x ≈{' '}
            {Math.round((E + Math.log10(region.mark[0])) * Math.LN10).toLocaleString('en-US')}, so they are easy to
            add up. {region.story}
          </>
        ) : (
          <>
            Divided by √x / ln x, the error stops growing. It swings around the offset, which is still above 1 here
            and falls slowly toward it. Up to 10 million it never comes near 0, so li(x) is always a little too
            high. With more zeros, the waves follow the swings more closely.
          </>
        )}
      </figcaption>
    </figure>
  )
}

// A line (one mantissa) or band (two) marking where the crossing was found, with a label that fits.
function CrossingMark({ region, sx, m, iw, ih }) {
  const pos = region.mark.map((v) => sx(region.e + Math.log10(v)))
  const left = pos[0]
  const right = pos[pos.length - 1]
  const full = region.markLabel
  const short = pos.length > 1 ? 'known crossings' : 'known crossing'
  let label
  if (m.left + iw - right - 8 >= approxW(full)) label = { x: right + 6, anchor: 'start', text: full }
  else if (left - m.left - 8 >= approxW(full)) label = { x: left - 6, anchor: 'end', text: full }
  else if (m.left + iw - right - 8 >= approxW(short)) label = { x: right + 6, anchor: 'start', text: short }
  else label = { x: left - 6, anchor: 'end', text: short }
  return (
    <g>
      {pos.length > 1 ? (
        <rect className="crossing-band" x={left} y={m.top} width={Math.max(2, right - left)} height={ih} />
      ) : (
        <line className="cursor" x1={left} x2={left} y1={m.top} y2={m.top + ih} />
      )}
      <text className="axis-label" x={label.x} y={m.top + 14} textAnchor={label.anchor}>
        {label.text}
      </text>
    </g>
  )
}
