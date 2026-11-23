# The Riemann Hypothesis

An interactive explainer of the Riemann hypothesis and how the zeros of the zeta function control the prime numbers. It has live charts for prime counting, the Euler product, a phase portrait of ζ(s), the critical line, Riemann's explicit formula and the error term.

Live URL: https://a403.space/riemann/

## Commands

```bash
npm install       # install dependencies
npm run dev       # start the dev server
npm run build     # build to dist/
npm run preview   # serve the build at http://localhost:4173/riemann/
npm run lint      # run ESLint
```

## Notes

- `src/lib/zeta.js` evaluates ζ(s) with Borwein's series and the functional equation.
- `src/lib/planeWorker.js` renders the phase portrait in a Web Worker.
- `src/data/zeros.js` holds the first 300 zeros, computed with mpmath.
