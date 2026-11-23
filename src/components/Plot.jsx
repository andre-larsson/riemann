import { useEffect, useId, useState } from 'react'
import { fmt, logTicks, niceTicks, pow10Label, scale, useWidth } from '../lib/chart.js'

// A small SVG chart frame: scales, axes, gridlines, clipping and a hover layer.
// The caller draws the data marks with the scales it receives.

const LABEL_MIN_WIDTH = 560
const LABEL_GAP = 15

// Spread label positions so no two are closer than `gap`, staying inside [lo, hi].
function spread(items, gap, lo, hi) {
  const out = items.map((it) => ({ ...it, py: Math.min(hi, Math.max(lo, it.y0)) })).sort((a, b) => a.py - b.py)
  for (let i = 1; i < out.length; i++) out[i].py = Math.max(out[i].py, out[i - 1].py + gap)
  for (let i = out.length - 1; i >= 0; i--) {
    const cap = i === out.length - 1 ? hi : out[i + 1].py - gap
    out[i].py = Math.min(out[i].py, cap)
  }
  return out
}

export default function Plot({
  height = 300,
  x,
  y,
  margin,
  label,
  children,
  hover,
  xTickFormat,
  yTickFormat,
  endLabels,
}) {
  const [ref, width] = useWidth()
  const clipId = useId().replace(/:/g, '')
  const [hx, setHx] = useState(null)
  const showLabels = endLabels && width >= LABEL_MIN_WIDTH
  const labelRoom = showLabels ? 14 + Math.max(...endLabels.map((l) => l.text.length)) * 7 : 0
  const m = { top: y.label ? 30 : 12, right: 16 + labelRoom, bottom: 42, left: 52, ...margin }
  const iw = Math.max(10, width - m.left - m.right)
  const ih = Math.max(10, height - m.top - m.bottom)
  const sx = scale(x, [m.left, m.left + iw])
  const sy = scale(y, [m.top + ih, m.top])
  const xTicks = x.ticks ?? (x.type === 'log' ? logTicks(...x.domain) : niceTicks(...x.domain, Math.max(2, Math.floor(iw / 90))))
  const yTicks = y.ticks ?? (y.type === 'log' ? logTicks(...y.domain) : niceTicks(...y.domain, Math.max(2, Math.floor(ih / 50))))
  const xf = xTickFormat ?? (x.type === 'log' ? pow10Label : (v) => fmt(v))
  const yf = yTickFormat ?? (y.type === 'log' ? pow10Label : (v) => fmt(v))

  const info = hover && hx !== null ? hover(sx.invert(hx)) : null

  // A tap keeps its tooltip after the finger lifts; a tap anywhere else clears it.
  const active = hx !== null
  useEffect(() => {
    if (!active) return
    const clear = (e) => {
      if (!ref.current?.contains(e.target)) setHx(null)
    }
    document.addEventListener('pointerdown', clear)
    return () => document.removeEventListener('pointerdown', clear)
  }, [active, ref])

  const labels = showLabels
    ? spread(
        endLabels.map((l) => ({ ...l, y0: sy(l.y) })),
        LABEL_GAP,
        m.top + 4,
        m.top + ih,
      )
    : []

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    if (px < m.left || px > m.left + iw) setHx(null)
    else setHx(px)
  }

  const crossX = info ? sx(info.x) : null
  const tipLeft = crossX !== null && crossX > m.left + iw / 2

  return (
    <div className="plot" ref={ref}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={label}
        onPointerMove={hover ? onMove : undefined}
        onPointerDown={hover ? onMove : undefined}
        onPointerLeave={hover ? (e) => e.pointerType !== 'touch' && setHx(null) : undefined}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={m.left} y={m.top - 4} width={iw} height={ih + 8} />
          </clipPath>
        </defs>
        <g className="grid">
          {yTicks.map((v) => (
            <line key={'gy' + v} x1={m.left} x2={m.left + iw} y1={sy(v)} y2={sy(v)} />
          ))}
          {xTicks.map((v) => (
            <line key={'gx' + v} x1={sx(v)} x2={sx(v)} y1={m.top} y2={m.top + ih} />
          ))}
        </g>
        <line className="axis" x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
        <g className="ticks">
          {yTicks.map((v) => (
            <text key={'ty' + v} x={m.left - 8} y={sy(v)} dy="0.32em" textAnchor="end">
              {yf(v)}
            </text>
          ))}
          {xTicks.map((v) => (
            <text key={'tx' + v} x={sx(v)} y={m.top + ih + 18} textAnchor="middle">
              {xf(v)}
            </text>
          ))}
        </g>
        {x.label && (
          <text className="axis-label" x={m.left + iw} y={height - 4} textAnchor="end">
            {x.label}
          </text>
        )}
        {y.label && (
          <text className="axis-label" x={m.left} y={16} textAnchor="start">
            {y.label}
          </text>
        )}
        <g clipPath={`url(#${clipId})`}>{children({ sx, sy, m, iw, ih, width })}</g>
        {labels.length > 0 && (
          <g className="end-labels" aria-hidden="true">
            {labels.map((l) => (
              <g key={l.text}>
                <line
                  className="leader"
                  x1={m.left + iw + 2}
                  x2={m.left + iw + 8}
                  y1={Math.min(m.top + ih, Math.max(m.top, l.y0))}
                  y2={l.py}
                  style={{ stroke: l.color }}
                />
                <text className="end-label" x={m.left + iw + 11} y={l.py} dy="0.32em">
                  {l.text}
                </text>
              </g>
            ))}
          </g>
        )}
        {info && (
          <g className="hover-layer" pointerEvents="none">
            <line className="crosshair" x1={crossX} x2={crossX} y1={m.top} y2={m.top + ih} />
            {info.points?.map((p, i) =>
              Number.isFinite(p.y) && p.y >= Math.min(...y.domain) && p.y <= Math.max(...y.domain) ? (
                <circle key={i} className="hover-dot" cx={sx(p.x ?? info.x)} cy={sy(p.y)} r={4.5} style={{ fill: p.color }} />
              ) : null,
            )}
          </g>
        )}
      </svg>
      {info && (
        <div
          className="tooltip"
          style={{
            top: m.top + 4,
            left: tipLeft ? undefined : crossX + 12,
            right: tipLeft ? width - crossX + 12 : undefined,
          }}
        >
          {info.title && <div className="tooltip-title">{info.title}</div>}
          {info.rows.map((r) => (
            <div className="tooltip-row" key={r.label}>
              {r.color && <span className="key" style={{ background: r.color }} />}
              <span className="tooltip-label">{r.label}</span>
              <span className="tooltip-value">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map((it) => (
        <li key={it.label}>
          <span className={'swatch' + (it.dashed ? ' dashed' : '')} style={{ '--c': it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  )
}
