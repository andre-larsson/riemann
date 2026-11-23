// Renders a phase portrait ("domain coloring") of zeta(s) off the main thread.
// Color = direction (argument) of zeta(s); the repeating light bands mark
// where |zeta(s)| doubles.

import { LOG_TABLE, borweinCoefs, lnGamma, termsFor } from './zeta.js'

const LN2 = Math.LN2
const LNPI = Math.log(Math.PI)
const TWO_PI_3 = (2 * Math.PI) / 3

self.onmessage = (e) => {
  const { id, w, h, s0, s1, t0, t1 } = e.data
  const img = new Uint8ClampedArray(w * h * 4)
  const n = termsFor(Math.max(Math.abs(t0), Math.abs(t1)))
  const c = borweinCoefs(n)

  // Per column: the real part used inside the series (sigma, or 1 - sigma on
  // the left where we use the functional equation) and its weights.
  const sig = new Float64Array(w)
  const E = new Float64Array(w * n)
  const P = new Float64Array(w)
  for (let x = 0; x < w; x++) {
    const s = s0 + ((x + 0.5) / w) * (s1 - s0)
    sig[x] = s
    const se = s >= 0.5 ? s : 1 - s
    P[x] = Math.pow(2, 1 - se)
    for (let k = 0; k < n; k++) E[x * n + k] = c[k] * Math.exp(-se * LOG_TABLE[k])
  }

  const COS = new Float64Array(n)
  const SIN = new Float64Array(n)
  for (let y = 0; y < h; y++) {
    const t = t1 - ((y + 0.5) / h) * (t1 - t0)
    for (let k = 0; k < n; k++) {
      COS[k] = Math.cos(t * LOG_TABLE[k])
      SIN[k] = Math.sin(t * LOG_TABLE[k])
    }
    const cl = Math.cos(t * LN2)
    const sl = Math.sin(t * LN2)
    for (let x = 0; x < w; x++) {
      const sigma = sig[x]
      const left = sigma < 0.5
      let sr = 0
      let si = 0
      const base = x * n
      for (let k = 0; k < n; k++) {
        const ev = E[base + k]
        sr += ev * COS[k]
        si += ev * SIN[k]
      }
      // Series value at sigma_e + i tt, with tt = t (right) or -t (left).
      const sumIm = left ? si : -si
      const p = P[x]
      const dr = 1 - p * cl
      const di = left ? -p * sl : p * sl
      const den = dr * dr + di * di
      let zr = -(sr * dr + sumIm * di) / den
      let zi = -(sumIm * dr - sr * di) / den
      if (left) {
        // zeta(s) = 2^s pi^(s-1) sin(pi s/2) Gamma(1-s) zeta(1-s)
        const [gr, gi] = lnGamma(1 - sigma, -t)
        const lr = sigma * LN2 + (sigma - 1) * LNPI + gr
        const li = t * LN2 + t * LNPI + gi
        const ex = Math.exp(lr)
        const ar = ex * Math.cos(li)
        const ai = ex * Math.sin(li)
        const xa = (Math.PI * sigma) / 2
        const ya = (Math.PI * t) / 2
        const fr = Math.sin(xa) * Math.cosh(ya)
        const fi = Math.cos(xa) * Math.sinh(ya)
        const br = ar * fr - ai * fi
        const bi = ar * fi + ai * fr
        const nr = br * zr - bi * zi
        zi = br * zi + bi * zr
        zr = nr
      }
      const o = (y * w + x) * 4
      const mod = Math.hypot(zr, zi)
      if (!Number.isFinite(mod)) {
        img[o] = img[o + 1] = img[o + 2] = 255
        img[o + 3] = 255
        continue
      }
      const th = Math.atan2(zi, zr)
      const l2 = Math.log2(mod)
      const band = l2 - Math.floor(l2)
      const b = 0.58 + 0.42 * Math.sqrt(band)
      img[o] = 255 * b * (0.5 + 0.45 * Math.cos(th))
      img[o + 1] = 255 * b * (0.5 + 0.45 * Math.cos(th - TWO_PI_3))
      img[o + 2] = 255 * b * (0.5 + 0.45 * Math.cos(th + TWO_PI_3))
      img[o + 3] = 255
    }
  }
  self.postMessage({ id, w, h, img }, [img.buffer])
}
