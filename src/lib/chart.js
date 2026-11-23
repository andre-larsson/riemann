import { useLayoutEffect, useRef, useState } from 'react'

// Chart helpers: element width, scales, ticks, number formats and SVG paths.

export function useWidth(initial = 640) {
  const ref = useRef(null)
  const [width, setWidth] = useState(initial)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

export function scale({ domain, type = 'linear' }, range) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const f = type === 'log' ? Math.log10 : (v) => v
  const a = f(d0)
  const b = f(d1)
  const s = (v) => r0 + ((f(v) - a) / (b - a)) * (r1 - r0)
  s.invert = (p) => {
    const u = a + ((p - r0) / (r1 - r0)) * (b - a)
    return type === 'log' ? Math.pow(10, u) : u
  }
  return s
}

export function niceTicks(d0, d1, count = 5) {
  const span = d1 - d0
  if (!(span > 0)) return [d0]
  const raw = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const ticks = []
  for (let v = Math.ceil(d0 / step) * step; v <= d1 + step * 1e-9; v += step) {
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v)
  }
  return ticks
}

export function logTicks(d0, d1) {
  const ticks = []
  for (let e = Math.ceil(Math.log10(d0) - 1e-9); e <= Math.log10(d1) + 1e-9; e++) ticks.push(Math.pow(10, e))
  return ticks
}

export function fmt(v, digits = 2) {
  if (!Number.isFinite(v)) return '—'
  const a = Math.abs(v)
  if (a !== 0 && (a >= 1e10 || a < 1e-3)) return v.toExponential(digits)
  if (a >= 1000) return Math.round(v).toLocaleString('en-US')
  return Number(v.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits })
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
// An integer written in superscript digits, e.g. sup(316) -> '³¹⁶'.
export function sup(n) {
  return String(n)
    .split('')
    .map((c) => SUP[c])
    .join('')
}

export function pow10Label(v) {
  const e = Math.round(Math.log10(v))
  if (e < 0) return String(Number(v.toPrecision(1)))
  if (e <= 3) return Math.round(v).toLocaleString('en-US')
  return '10' + sup(e)
}

export function linePath(points, sx, sy) {
  let d = ''
  let pen = false
  for (const [x, y] of points) {
    if (!Number.isFinite(y)) {
      pen = false
      continue
    }
    d += (pen ? 'L' : 'M') + sx(x).toFixed(1) + ',' + sy(y).toFixed(1)
    pen = true
  }
  return d
}

// Step function: holds each y until the next x.
export function stepPath(points, sx, sy) {
  let d = ''
  let prevY = null
  for (const [x, y] of points) {
    const px = sx(x).toFixed(1)
    const py = sy(y).toFixed(1)
    if (prevY === null) d += 'M' + px + ',' + py
    else d += 'H' + px + 'V' + py
    prevY = py
  }
  return d
}
