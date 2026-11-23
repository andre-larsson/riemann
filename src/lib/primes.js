// Primes, prime counting and the logarithmic integral.

export const EULER_GAMMA = 0.5772156649015329

let cached = null

// All primes up to `limit`, as an Int32Array. Sieve of Eratosthenes on odd numbers.
export function primesUpTo(limit) {
  if (cached && cached.limit >= limit) return cached.primes
  const size = (limit - 1) >> 1 // index i stands for 2i + 3
  const composite = new Uint8Array(size)
  for (let i = 0; i * i * 4 + 12 * i + 9 <= limit; i++) {
    if (composite[i]) continue
    const p = 2 * i + 3
    for (let j = (p * p - 3) >> 1; j < size; j += p) composite[j] = 1
  }
  let count = 1
  for (let i = 0; i < size; i++) if (!composite[i]) count++
  const primes = new Int32Array(count)
  primes[0] = 2
  let k = 1
  for (let i = 0; i < size; i++) if (!composite[i]) primes[k++] = 2 * i + 3
  cached = { limit, primes }
  return primes
}

// pi(x): the number of primes <= x. `primes` must reach past x.
export function primePi(x, primes) {
  let lo = 0
  let hi = primes.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (primes[mid] <= x) lo = mid + 1
    else hi = mid
  }
  return lo
}

// li(x) = integral from 0 to x of dt / ln t (principal value), for x > 1.
// Ramanujan's series; converges fast for the ranges used here.
export function li(x) {
  const L = Math.log(x)
  let sum = 0
  let term = 1 // (-1)^(n-1) L^n / (n! 2^(n-1))
  let inner = 0 // sum over k <= (n-1)/2 of 1/(2k+1)
  for (let n = 1; n < 200; n++) {
    term = n === 1 ? L : (-term * L) / (2 * n)
    if ((n - 1) % 2 === 0) inner += 1 / n
    const add = term * inner
    sum += add
    if (Math.abs(add) < 1e-17 * Math.abs(sum) && n > 2 * L) break
  }
  return EULER_GAMMA + Math.log(L) + Math.sqrt(x) * sum
}

// Jumps of Chebyshev's psi(x) up to `limit`: every prime power p^k with jump ln p.
export function primePowerJumps(limit) {
  const primes = primesUpTo(Math.max(limit, 10))
  const jumps = []
  for (const p of primes) {
    if (p > limit) break
    const lp = Math.log(p)
    for (let q = p; q <= limit; q *= p) jumps.push({ x: q, size: lp, p, isPrime: q === p })
  }
  jumps.sort((a, b) => a.x - b.x)
  return jumps
}
