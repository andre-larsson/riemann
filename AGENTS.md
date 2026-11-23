# AGENTS.md instructions for riemann

<INSTRUCTIONS>
- Primary goal: an interactive explainer of the Riemann hypothesis and its link to the primes, published at https://a403.space/riemann/ and linked from the root site.
- Repository: project GitHub Pages site (Vite + React, `base: "/riemann/"`).
- Build: `npm run build` (output in `dist/`).
- Lint: `npm run lint`.
- Preview/dev: `npm run dev`; `npm run preview` serves the build at http://localhost:4173/riemann/.
- Tests: No dedicated test suite is currently defined.
- Deploy: `.github/workflows/pages.yml` lints, builds and deploys `dist/` on push to `main`.
</INSTRUCTIONS>
