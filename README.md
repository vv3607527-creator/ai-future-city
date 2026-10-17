# AI Future City

A Vite-powered Three.js interactive 3D city explored by scrolling. The app is a static client-side experience; it does not require production services or secrets.

## Reproduce locally

Requires Node.js 20+.

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run dev
```

`npm test` runs deterministic data and UI-safety smoke tests. `npm run build` creates the production bundle in `dist/`. Open the local Vite URL in a WebGL-capable browser.

## Controls

Scroll through districts, use the navigation dots to jump, and use the Day/Night button (or `T`) to change lighting.
