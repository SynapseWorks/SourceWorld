# SourceWorld v0.2 — Living Code

An atmospheric, first-person 3D world constructed from animated digital rain. Built with Three.js and Vite, deployable as a static site with Netlify. No database needed.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Controls

- **Enter Construct / click canvas** — capture mouse (desktop)
- **WASD / arrow keys** — move
- **Mouse** — look around
- **Shift** — sprint
- **Space** — jump
- **Escape** — release pointer
- **Mobile** — left touch pad to move; drag right side to look
- **Settings** — adjust code density, visual quality and motion

## Architecture

- `src/main.js` — scene, interaction, world construction and render loop
- `src/matrixMaterial.js` — procedural tiled digital rain texture material
- `src/style.css` — UI styling, accessibility, responsive controls

The material uses a shared atlas of tiny neon glyphs and shader UV animation per surface, with randomized column speeds and highlights. Environmental props all reuse one underlying code-driven surface language.

## Living Code mission (v0.2)

Explore the open avenue to find three floating signal prisms. Walk up to each and press **E** (or tap the on-screen interaction prompt) to collect it. Each recovery creates an expanding luminous code pulse. After all three fragments are recovered, reach the giant Source Node at the end of the city and activate it.

- Rotating, floating signal artifacts with animated halos
- Exploration HUD and fragment progress tracker
- Procedural gateway structures and suspended digital sculptures
- World-scale radial shader pulses on recovery
- Final Source activation with a completion message

## Future ideas

Expand into a simulation forest, doors and interior spaces, a Source core chamber, object inspection, narrative environmental signals, spatial audio, and shader variants for geometry-sensitive character flow.
