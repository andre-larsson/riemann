// Numerical evaluation of the Riemann zeta function for the visualizations.
//
// Right of the critical line (Re s >= 1/2) we use Borwein's accelerated
// alternating series for the Dirichlet eta function. To the left we use the
// functional equation. Accuracy is about 1e-10 for |Im s| up to a few hundred,
// which is far more than the pictures need.

const LN2 = Math.LN2
const LNPI = Math.log(Math.PI)
const HALF_LN_2PI = 0.5 * Math.log(2 * Math.PI)
const MAX_TERMS = 380

const LOGS = new Float64Array(MAX_TERMS + 1)
for (let k = 0; k <= MAX_TERMS; k++) LOGS[k] = Math.log(k + 1)

const coefCache = new Map()

// c_k = (-1)^k (d_k - d_n) / d_n from Borwein's "Algorithm 2".
export function borweinCoefs(n) {
  let c = coefCache.get(n)
  if (c) return c
  const d = new Float64Array(n + 1)
  let term = 1
  let sum = 1
  d[0] = 1
  for (let i = 1; i <= n; i++) {
    term *= (4 * (n + i - 1) * (n - i + 1)) / (2 * i * (2 * i - 1))
    sum += term
    d[i] = sum
  }
  c = new Float64Array(n)
  for (let k = 0; k < n; k++) c[k] = ((k & 1 ? -1 : 1) * (d[k] - d[n])) / d[n]
  coefCache.set(n, c)
  return c
}

export function termsFor(t) {
  return Math.min(MAX_TERMS, Math.ceil(0.9 * Math.abs(t) + 30))
}

export const LOG_TABLE = LOGS

// zeta(sigma + i t) for sigma >= 1/2. Returns [re, im].
export function zetaRight(sigma, t, n = termsFor(t)) {
  const c = borweinCoefs(n)
  let sr = 0
  let si = 0
  for (let k = 0; k < n; k++) {
    const L = LOGS[k]
    const m = c[k] * Math.exp(-sigma * L)
    const a = t * L
    sr += m * Math.cos(a)
    si -= m * Math.sin(a)
  }
  // Divide -(sr + i si) by 1 - 2^(1-s).
  const p = Math.pow(2, 1 - sigma)
  const dr = 1 - p * Math.cos(t * LN2)
  const di = p * Math.sin(t * LN2)
  const den = dr * dr + di * di
  return [-(sr * dr + si * di) / den, -(si * dr - sr * di) / den]
}

// Complex log-gamma for Re z > 0, on the branch that is continuous in z.
export function lnGamma(re, im) {
  let shiftRe = 0
  let shiftIm = 0
  while (re < 10) {
    shiftRe += 0.5 * Math.log(re * re + im * im)
    shiftIm += Math.atan2(im, re)
    re += 1
  }
  // Stirling series at w = re + i im.
  const lnAbs = 0.5 * Math.log(re * re + im * im)
  const arg = Math.atan2(im, re)
  // (w - 1/2) ln w - w + ln(2 pi)/2
  const ar = re - 0.5
  let r = ar * lnAbs - im * arg - re + HALF_LN_2PI
  let i = ar * arg + im * lnAbs - im
  // 1/w and its powers
  const den = re * re + im * im
  const ir = re / den
  const ii = -im / den
  const i2r = ir * ir - ii * ii
  const i2i = 2 * ir * ii
  const coeffs = [1 / 12, -1 / 360, 1 / 1260, -1 / 1680, 1 / 1188]
  let pr = ir
  let pi = ii
  for (const cf of coeffs) {
    r += cf * pr
    i += cf * pi
    const nr = pr * i2r - pi * i2i
    pi = pr * i2i + pi * i2r
    pr = nr
  }
  return [r - shiftRe, i - shiftIm]
}

// zeta(sigma + i t) anywhere except the pole at s = 1. Returns [re, im].
export function zeta(sigma, t) {
  if (sigma >= 0.5) return zetaRight(sigma, t)
  // zeta(s) = 2^s pi^(s-1) sin(pi s / 2) Gamma(1 - s) zeta(1 - s)
  const [gr, gi] = lnGamma(1 - sigma, -t)
  const lr = sigma * LN2 + (sigma - 1) * LNPI + gr
  const li = t * LN2 + t * LNPI + gi
  const e = Math.exp(lr)
  const ar = e * Math.cos(li)
  const ai = e * Math.sin(li)
  const x = (Math.PI * sigma) / 2
  const y = (Math.PI * t) / 2
  const sr = Math.sin(x) * Math.cosh(y)
  const si = Math.cos(x) * Math.sinh(y)
  const br = ar * sr - ai * si
  const bi = ar * si + ai * sr
  const [zr, zi] = zetaRight(1 - sigma, -t)
  return [br * zr - bi * zi, br * zi + bi * zr]
}

// Riemann-Siegel theta function.
export function theta(t) {
  return lnGamma(0.25, t / 2)[1] - (t / 2) * LNPI
}

// Hardy's Z function: real-valued, |Z(t)| = |zeta(1/2 + i t)|.
export function hardyZ(t) {
  const th = theta(t)
  const [zr, zi] = zetaRight(0.5, t)
  return Math.cos(th) * zr - Math.sin(th) * zi
}
