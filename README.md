# SourceWorld v1.5 — Anime Reality 2.0

An atmospheric, first-person 3D world constructed from animated digital rain. Built with Three.js and Vite, deployable as a static site with Netlify. No database needed.

## Run locally

```bash
npm install
npm run dev
```

## Build and smoke tests

```bash
npm run build
npm run preview
npx playwright install chromium
npm test
```

GitHub Actions verifies JavaScript syntax, creates a production build, and runs Chromium desktop/mobile smoke tests. Traces are preserved for failures.

## Controls

- **Enter Simulation** — the entry menu disappears into total blackness; **a second click, tap or keypress** begins the green code rain and Big Bang reveal. Desktop requests pointer lock on the second gesture; if the browser declines, select Resume when prompted.
- **WASD / arrow keys** — move
- **Mouse** — look around
- **Shift** — sprint
- **Space** — jump
- **P** — open/close simulation pause menu and settings
- **J** — open/close Field Notes, showing encounters from the current session
- **M** — open/close the Source Atlas, choose a navigation target
- **Q** — use Resonance Bloom once unlocked (also available as a button)
- **F** — Signal Call, attracts wildlife (unlock at six hidden Echoes)
- **G** — World Rewrite, restores neglected structures (unlock at eight hidden Echoes)
- **R** — toggle Anime Reality 2.0, with painterly sky, semantic materials, wetland reflections, anime-dressed inhabitants and cinematic day/night lighting
- **Escape** — release pointer and open pause menu (or close settings)
- **V** — toggle wireframe/code vision; on mobile, use the CODE VISION button
- **Mobile** — left touch pad to move; drag right side to look
- **Settings** — adjust code density, visual quality and motion. Replay the awakening while keeping progress, or **Reset World & Reawaken** to delete this browser's saved ecosystem/Echoes/restorations and start over.

## Architecture

- `src/main.js` — scene, interaction, world construction and render loop
- `src/awakening.js` — two-gesture black void, procedural falling code, radial world-formation animation and reduced-motion timing
- `src/continuity.js` — versioned local save/load with offline evolution and reset support
- `src/ecosystem.js` — named placeholder inhabitants, daily movement, restored-place visitors and ecological state
- `src/forest.js` — seeded procedural forest, terrain, luminous trail, and Heart of the Grove
- `src/openWorld.js` — organic clearings, winding spline ribbons, undulating perimeter terrain
- `src/reconstruction.js` — glyph-particle dissolution and proximity-based reassembly
- `src/worldgen.js` — seeded, instanced sector expansion and biomes
- `src/weather.js` — shader-animated code drizzle, storms, and fault lines
- `src/artDirection.js` — transition arches, levitating shards, and landmark crowns
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

## A Living System (v0.6)

- Reusable, deterministic sector generation via `createGeneratedSectors(scene,{seed,count})` for reproducible environment layouts. Instanced meshes reduce per-object draw calls.
- Periodic digital rainstorms, GPU-animated vertical glyph fragments, and glitching wireframe fault lines during storms; weather can be disabled in Settings and is also disabled under Reduced Motion.
- HUD overhaul with a consistent typographic scale, restrained green accents, weather indicators, redesigned onboarding, and objective-direction guidance.
- Reduced-motion support for nearby animated geometry.
- Code shader supports InstancedMesh transforms, necessary for reliable scalable landscape generation.
- Landmark crowns, sky arches, hovering code sculptures and distant lighting create larger-scale visual focal points.

## QA pass (v0.6.1)

- Corrected heading guidance when rotating the camera.
- Replaced click-only prompt with an accessible, focusable interaction button.
- Optimized starting pixel ratio and antialiasing for touch hardware, with updated quality presets.
- Added forest-distance group culling and early exit for dispersed monument particles.
- Improved Escape behavior in the settings panel, pointer-cancellation handling, and joystick reset on focus loss.
- Added responsive layout fixes to prevent mission/navigation widgets colliding on narrow screens.
- Added desktop/mobile browser smoke tests and CI execution.

## Inside the Code (v0.7)

- Digital glyphs are now sampled from world-space positions rather than restarting with each mesh's UV coordinates. This creates a continuous environmental data field whose illumination is shaped by objects rather than painted onto them.
- Two scrolling glyph layers, with parallax-like displacement, create the impression of illuminated information behind the visible shell. Bright streams are paired with a separate Fresnel-based contour for recognizable shapes.
- A new **Object outlines** slider adjusts silhouette strength (0–180%), independently of code density and rain speed.
- Forest crowns now use three distinct procedural families: tall conifers, broad crystalline canopies, and irregular angular forms.
- Geometries stay opaque to avoid expensive transparency sorting; this is a stylized volume illusion, not ray-marched volumetric transparency.

## Pause and settings fix (v0.7.1)

- A dedicated accessible pause screen opens with **P** or by releasing pointer lock with Escape.
- The pause screen provides **Resume Exploring** and **World Parameters** buttons; settings no longer require clicking through a locked cursor.
- Settings pause player movement and return focus to the menu; resuming intentionally re-enters pointer lock.
- Touch devices can use the always-visible Menu button. Input is disabled while settings are open.

## The Living World (v0.8)

Three kinds of life drive this milestone: **chosen actions** (interactive Listening Well, Unwritten Seed, and Forgotten Archive); **reactive life** (fourteen roaming signal-creatures and artifacts that brighten when approached); and **autonomous events** (a recurring Memory Bloom near the forest clearing at X 10, Z -155, whether or not the player is nearby). The observation journal records whispers, discoveries, and world events during the session only. No backend, login, persistence, or external telemetry is introduced. Press **J** or select **Field Notes** to inspect it. The narrative encourages optional wandering, not compulsory task collection.

## The Living Ecosystem (v0.9)

- New `src/ecosystem.js` with deterministic seeded placement and a simple bounded ecology simulation.
- Extended ground and winding links to Reflection Marsh, Emergent Wilds and Glass Plateau; the original city, forest and primary narrative remain intact.
- Biome states respond differently to simulated weather: moisture rises during code storms, drains at environment-dependent rates, and affects slow vegetation growth.
- 26 scheduled human-shaped city inhabitants traverse authored pedestrian routes, while 34 wildlife signals roam through ecological zones and react to player proximity.
- Distinct plant populations use shared meshes/materials and grow with ecological conditions. A local readout shows the nearest region's moisture and growth.
- Autonomous changes happen on simulation time. World state is session-local and pauses alongside gameplay; no database, login or tracking.

### Current limits

This is the first ecosystem prototype, not a full agent-based society. Residents follow scripted paths and do not yet converse, work, exchange resources or avoid every building. Biome transitions are approximate, and vegetation changes are intentionally slow. Later milestones should add a route network, ecosystem interactions, persistence controls and a dedicated world map.

## Connections (v1.0)

- The Source Atlas is a lightweight responsive SVG map, showing biome bounds, routes, landmarks, player location, and select-to-navigate destinations. Press M or click Atlas; it safely pauses first-person movement while open. Closing it returns to the pause screen, where you can resume.
- Wildlife now has an energy state, chooses vegetation to forage, consumes available nectar, and restores energy when feeding. Plants replenish resources based on regional moisture; a plant's visible size includes its available resources. Weather therefore indirectly influences foraging.
- The system is deterministic and bounded, with session-local state and no database. Ecological processes update in fixed batches; visuals animate smoothly.
- Current limitations: routes are schematic and don't yet support pathfinding, creature navigation is approximate, wildlife doesn't breed or die, and ecosystem state resets on reload.

## A World With Memory (v1.1)

- Ecological state is now saved locally in the current browser, with a versioned document and safe fallback if storage is blocked. No server, account, or cross-device sync.
- When you return, elapsed wall-clock time advances the ecology using a deterministic bounded aggregate update (maximum seven days of offline progression). Plants mature, nectar recovers, regional moisture and growth evolve, and wildlife energy/positions shift.
- Time has day/night phases (12 real minutes per simulation day). City walkers are more active during daylight; some remain visible overnight.
- A 'While You Were Away' report summarizes changes. A small HUD shows simulation day and phase. The settings menu includes a local-memory reset control.
- Saves occur periodically and on page hide. Clearing the browser's site data will remove the save.
- This is offline progression **for the ecosystem only**. Narrative items and exact individual NPC positions are not yet persisted. No simulation runs on a server while the game is closed; instead, elapsed time is applied on the next visit.

## The World Responds (v1.2)

- Three main recovery prisms have been moved toward side streets rather than the middle of the road. Their mission function remains intact.
- Nine additional **optional hidden Echoes** are scattered beyond the obvious path. They become noticeable on approach rather than being permanently marked on the compass. Collect with E when nearby; a subtle HUD shows progression.
- Collect **four Echoes** to unlock **Resonance Bloom**. Press Q (or its button) to boost nearby vegetation and the moisture/growth of the nearest non-city biome. It creates a new, visibly growing garden trace at your location.
- Resonance has a 90-second in-world cooldown. Collected Echo IDs and intervention traces are saved locally alongside the ecosystem, so returning retains changes you've made.
- The city now has changing street-light brightness and temporary gatherings at authored plaza sites as simulation time advances. NPCs are still placeholder assets and scripted walkers, ready to be replaced with more detailed characters later.
- The main narrative remains achievable without collecting optional Echoes.

## Explore & Tend / Anime Reality (v1.3)

- Optional controls are grouped in an expandable **Explorer Tools** dock; keyboard shortcuts work during pointer-lock exploration. On mobile, open the dock to access the viewing modes and unlocked tending actions.

- **Signal Call** unlocks at six collected Echoes, attracts wildlife for 38 simulated seconds and recharges after 60 seconds. The player's presence now creates observable gatherings rather than just startling creatures.
- **World Rewrite** unlocks at eight collected Echoes. Restore the Quiet Garden, Fractured Crossing and Wilds Beacon using G or the existing E interaction when nearby; restoration persists in browser continuity saves.
- Prompts highlight nearby sites and encourage observing city routines, the wetland, forest and wild signals without adding compulsory missions.
- **Anime Reality** toggles with R or the visible control: a cel-shaded hand-painted material palette replaces matrix glyphs in shared code-surface shaders, with stylized edge bands, a pastel procedural sky and a softer atmosphere. Wireframe and Anime Reality are mutually exclusive, and toggling does not move the player or reset progress.
- The sky and code shader stay GPU-driven; character assets remain placeholders for a future visual asset pass.

## The Awakening & Living Neighbourhoods (v1.4)

**Sequence**

1. The original Enter button is presented on a completely black background. Nothing from the 3D world is visible behind it.
2. The first activation makes the screen uniformly black. No progress indicator, simulated movement, sound or on-screen instructions break the silence.
3. Only the **next real interaction** (click, tap or nonmodifier key) triggers procedural green glyphs falling from the top, followed by a radially expanding Big Bang of code.
4. The curtain fades to show the same world, its objects already carrying their shader-driven code. Gameplay begins without reloading. If a desktop pointer lock request is blocked, the existing Resume control provides an accessible fallback.

The two-step gate also occurs on every subsequent page load. The animation respects `prefers-reduced-motion` with shorter, less intense motion. No additional database, media download or external libraries are required.

**Continuity and reset**

- `Replay Awakening (Keep Progress)` saves the world and reloads the intro.
- `Reset World & Reawaken` asks for confirmation, deletes the local SourceWorld continuity save and reloads. Page-hide autosave is explicitly suppressed during reset, so the old progress cannot immediately return.
- SourceWorld stores browser-local ecosystem state, hidden Echoes, abilities, restored sites and Field Notes. Data is not synchronized across devices.

**Lived-in consequences**

- The 26 placeholder citizens now have stable names, roles and small identifying details. Meeting one creates a once-per-day observation rather than repeated proximity spam.
- Restoring the Quiet Garden, Fractured Crossing or Wilds Beacon attracts a recurring pair of caretaker visitors on later daytime cycles. The same restoration strengthens the surrounding biome and its plants.
- Returning after a prolonged absence can describe neighbours visiting restored places in the arrival report.
- The placeholder geometry remains intentionally lightweight until the dedicated character-art pass.

**Verification**

- GitHub Actions builds the production bundle and runs Playwright desktop/mobile tests covering the black waiting phase, second gesture, reveal, interface access, view switching, and full local-state reset. Live GPU rendering and detailed browser visuals require follow-up visual QA.

## Anime Reality 2.0 (v1.5)

The alternate visual mode now uses **material-aware rendering instead of a generic pastel filter**. The simulation state, map, movement, discoveries and collisions are shared with Code Reality and Wireframe.

- **Material families**: ground, path, foliage, bark, stone, architecture, crystal, metal, flower and skin have distinct anime palettes. Regional wetland, forest, wilds and plateau tints create coherent transitions. Four softened tone steps, warm sunlight, cooler shadows, gentle pigment noise and selective colored silhouette inks improve object readability.
- **Sun and sky**: a procedural sky shader now includes layered, drifting painted clouds, a sun halo, warm horizon light, moon and stars at night. Sun direction and brightness follow the existing 12-minute simulation day rather than a separate clock.
- **Environmental richness**: the `animeEnvironment.js` scene adds instanced grass and foliage, flower accents, pebbles and a handful of benches at the same world coordinates. Instancing keeps draw calls low. The graphics-quality setting reduces their counts on constrained devices.
- **Wetlands**: four anime-only reflective ponds blend into the marsh and Memory Pool areas; shader reflections and ripples respond to day/night and reduced motion. These are decorative surfaces and do not change gameplay collisions or currently provide swimming.
- **People**: city inhabitants and returning caretakers swap their original code proxies for simple, illustrated models with clothing, hair, hands, eyes, shoes, bags and basic walking cycles. They remain placeholders for final character assets. Mobile quality reduces their visibility distance to preserve performance.
- **Cinematic finish**: ambient/directional lighting powers the illustrated props, while the code shader uses matched simulated sunlight directly. The Anime Reality UI receives warmer, higher-contrast legible overlays and a restrained non-blurred vignette.
- **View switching**: pressing **R** enters/exits Anime Reality without resetting progress or position; **V** still switches to wireframe and automatically exits anime view. No images, textures, downloads or server costs were added.

### Rendering and QA limits

The anime look is still built on stylized geometry and procedural materials, not realistic imported character/architecture art. True screen-space outline detection, HDR bloom and full shadow maps are intentionally not enabled; they would raise mobile WebGL costs. Runtime GPU compatibility and final in-game art direction should be checked with real browser screenshots and device testing.

## Future ideas

Expand into a simulation forest, doors and interior spaces, a Source core chamber, object inspection, narrative environmental signals, spatial audio, and shader variants for geometry-sensitive character flow.
