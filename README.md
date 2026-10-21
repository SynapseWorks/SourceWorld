# SourceWorld v0.5 — Reality in Bloom

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
- **V** — toggle wireframe/code vision; on mobile, use the CODE VISION button
- **Mobile** — left touch pad to move; drag right side to look
- **Settings** — adjust code density, visual quality and motion

## Architecture

- `src/main.js` — scene, interaction, world construction and render loop
- `src/forest.js` — seeded procedural forest, terrain, luminous trail, and Heart of the Grove
- `src/openWorld.js` — organic clearings, winding spline ribbons, undulating perimeter terrain
- `src/reconstruction.js` — glyph-particle dissolution and proximity-based reassembly
- `src/sky.js` — dynamic camera-centered digital sky dome
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

## The Simulation Forest (v0.3)

Once you recover the three code fragments and activate the Source Node at Z ≈ -85, keep walking **past the Source** toward negative Z coordinates. A luminous path leads into the grove (Z ≈ -115 to -250), with coded trees, branches, rocks, lantern-mushrooms, and an enormous Heart Tree. Approach its glowing floating seed near Z ≈ -217 and press **E** to restore it.

Technical updates: forest geometry uses shared materials and seeded placement to avoid per-frame creation. World-distance fading now follows the camera, and collision checks correctly continue past irrelevant structures. Touch movement controls were isolated from the look surface.

## The Unbound World (v0.4)

The world opens outward via four off-axis destinations: Mirror Plaza (X -43, Z -34), Fracture Garden (X 46, Z -67), Echo Clearing (X -31, Z -153), and Memory Pool (X 32, Z -190). Each is connected to the central route and each other by wide pathways, allowing lateral exploration rather than a linear corridor. Approach a landmark to receive its environmental memory and a world-space code pulse.

A camera-centered spherical digital sky replaces the flat backdrop; distant data traces and stars remain overhead as you explore. Nearby geometry brightens its glyphs subtly. **V** toggles wireframe inspection of world meshes (a simple development-style geometry view), and a touch-friendly button provides the same action on phones.

## Reality in Bloom (v0.5)

- Previous straight connector roads replaced with wide, continuously curved Catmull-Rom paths and alternative loop routes.
- Previously circular clearings now have subtle irregular edges; natural rock arrangements and rolling perimeter ridges extend the horizon. The traversable centre stays at the same ground level for compatibility with the current first-person controller.
- Sky-scale rings, fractured arcs and suspended data beams make the sky feel constructed rather than flat.
- The Mirror Plaza now contains a monument made from hundreds of animated glyph particles. Its object shell reconstructs as the observer approaches and dissolves as they move away. Approaching triggers an atmospheric discovery line and code pulse.
- Reduced-motion settings suppress dynamic sky rotation and particle flutter.

## Future ideas

Expand into a simulation forest, doors and interior spaces, a Source core chamber, object inspection, narrative environmental signals, spatial audio, and shader variants for geometry-sensitive character flow.
