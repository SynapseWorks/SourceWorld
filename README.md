# SourceWorld v2.1 — The Living Underworld

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

## The Living Underworld — v2.1

SourceWorld now has a second playable subterranean layer **beneath the same biome-node world**. It expands the original authored Syntax Vault rather than replacing or resetting it.

- **Wireframe-only fissures:** press **V** while walking on the surface. Look for luminous seam markers at five known biome sites and near generated frontier nodes. At ground level, approach one and press **E** to descend. You cannot enter from the sky; flight safely disables on entry. The entrance returns you to the same surface position, and switching Wireframe off also exits safely.
- **Five authored entry sites:** Whispering Rootwell (X 43, Z -163), Reedwater Cavern (79, -244), Amber Hollow (-79, -248), Glassroot Grotto (143, -107), and Hush Chamber (-40, -112). Distant frontier nodes generate equivalent deterministic portals using the existing node lattice and biome seed.
- **Walkable rooms:** each cave opens into a large connected stone chamber at **Layer -02** with a return gate, a fungal nursery, an aquifer-rewrite nexus and a Listening Chamber. Surface/underground movement uses the same WASD, mouse and interaction controls, with a separate safe height and circular cavern bounds.
- **Underground nature:** the caves have biome-specific colour and geometry—hanging roots, tall glass, reeds, amber formations and ribbed stone—plus slow bioluminescent spores, fungal gardens, pools, and branching water channels. Generated cave meshes are unloaded when you return to the surface.
- **Rearrange the aquifer:** at the nexus, **E** cycles Dormant → Spring → Stream → Living Aquifer → Dormant. Water becomes visible and more developed through the stages. Restored aquifers appear as persistent springs above ground, even in Code and Anime Reality. Groundwater affects actual local surface biome humidity, plant nectar and growth. Ecological boosts are capped and awarded at most once per cave per day when advancing an aquifer stage.
- **Tend the mycelium:** at the fungal nursery, **E** tends the underground ecosystem once per simulated day. Its plants respond to care, and the connected surface biome receives a small nutrient/water benefit.
- **Listen to stone:** a fourth landmark reveals the cave's story, current aquifer state and care history. It can be revisited, but the Field Notes entry is recorded only once per cave per simulated day.
- **Persisted world:** only discovered cave IDs and validated water/tending history are saved under `underworldState` in local continuity; generated meshes are disposable. An old save with no cave data still works. Visited caves appear as discovered destinations on the Source Atlas.
- **Bounded rendering:** only one cave is resident at a time; at most 15 portal markers and 15 spring-marker groups are reused as you move. The underground biome grammar shares surface-node coordinates instead of creating a competing procedural world. Reduced-motion preferences stop decorative spore and water animation, not cave care or ecological logic.

**Current limits:** caves are connected, authored-style chamber layouts with deterministic local decoration—not yet true dynamically carved 3D tunnels, mineable voxel walls or a fully editable building system. Water channels currently change ecology and visual appearance, not player swimming. Frontier biomes beyond the original ecosystem model visibly retain spring changes; wider regional simulation effects are future work.

### Test plan

The new `tests/underworld.spec.js` covers deterministic portal selection, no midair entry, cave actions, save/restore, bounded portal pools, actual surface-ecology effects, and compatibility with the original Syntax Vault. GitHub Actions builds and tests on Chromium desktop/mobile; verify final WebGL visuals and collision clearance in a real GPU browser.

## Sky Ecology — v2.0

The sky has become a continuous ecological layer rather than a set of airborne rewards. **Birds nest, raise young, migrate and carry seeds into the environment below whether or not the player is nearby.**

- **Nest sites** exist on the five authored sanctuaries, the six named city rooftop gardens, and up to 16 streamed biome sky islands. Every habitat receives an illustrated or Code Reality nest with its own deterministic identity.
- **Lifecycle:** nests progress through weaving, eggs, chicks, and fledglings across successive 12-minute world days. Care can gently advance the apparent progress. Discoveries are observational: approach a nest and press **E** to record its stage in Field Notes. Re-observing the same stage doesn't flood the journal.
- **Independent wildlife routines:** birds return to nests during simulated nighttime and shelter near them during storms; their existing migration, foraging and flight interactions remain active.
- **Autonomous seedfall:** every 210 seconds of simulation time, a seeded world event chooses a real location from a stable roster of authored sky and roof habitats. The event runs whether or not it is being observed. When a seedfall reaches a managed ground biome, `ecosystem.receiveSkySeeds()` gently increases local plant nectar, growth and humidity and leaves a visible surface trace. Seedfall appears briefly as falling light when the player is nearby.
- **Persistence:** observed nest stages and the last completed world-event tick are saved under `skyEcologyState` in browser continuity, preventing duplicate observations or events after reload. Reloads and older saves remain safe. Existing biome progression and offline ecological changes are preserved.
- **Performance & accessibility:** reusable procedural geometries and materials, at most 27 nests in memory, streamed generated-nest instances, a 24-point seedfall particle buffer and low-frequency habitat reconciliation. Decorative motion and particles stop under reduced-motion preferences; lifecycle state and ecological effects continue.
- **Startup repair:** `createRooftopGardens` now exports `setQuality`, which `main.js` requires during startup. Previously the absent export could stop the game before the awakening overlay initialized.

### Follow-up development

The next meaningful passes are more distinct bird species and family behaviors, gentle observatory interactions, weather-aware nests, bird migration routes between generated node clusters, and procedural underground cave ecology. These are future work, not claimed as implemented.

## The Living Sky — v1.9

**The map now grows upward as well as outward.** The first five Sky Seed sanctuaries remain handcrafted landmarks. Beyond the original world, a seeded archipelago streams from the same 384-unit biome-node lattice as the surface frontier.

- **Procedural aerial habitats:** `src/skyFrontierData.js` defines stable island coordinates, names, biome appearance and altitude per node. `src/skyFrontier.js` streams at most **16 active island clusters** near the player and unloads distant geometry. Returning to the same place regenerates the same islands. We save identities and care, not meshes.
- **Distinct regional silhouettes:** Mosslight nodes grow hanging tree crowns; Glassfall forms upright crystal spires; Amber islands bloom with wildflowers; Siltreed creates aerial reed thickets; Hollow Ridges forms cracked-looking stone arches. Each uses Code Reality materials or Anime Reality colors, while remaining the same physical space.
- **Landing and wind:** each generated island offers a physical floating top and a soft updraft. These feed into the existing flight controller alongside the five handcrafted sanctuaries. The new islands are intended for discovering and tending, **not unlimited new Sky Seeds**; the five original reserve upgrades remain finite and verifiable.
- **Six city rooftop gardens:** land above Lantern & Leaf, Moth & Moss, Windowsill House, Moonmilk Table, the Seed Exchange, or the Green Balcony. Water the habitat once per simulated day with **E**. Leaves respond to accumulated care and lanterns brighten at night. Gardens have independently persisted discovery and care states.
- **Nature acts without you:** birds now switch between **foraging, migration, roosting and sheltering** based on the simulated day and storms. They orbit authored sanctuaries, frontier habitats and rooftops. Tended habitats become stronger roost destinations. Brief observations are added to Field Notes when players witness local wildlife, without turning every flock into a quest.
- **Discovery and navigation:** previously visited generated islands and city roof gardens appear on the Source Atlas with distinct cyan aerial markers and elevation labels. Hidden Echo and Sky Seed locations are not revealed automatically.
- **Mobile/accessibility:** graphic quality reduces procedural vegetation; material/detail geometry is reused and bounded. All tending works with existing accessible interact buttons, and reduced-motion settings stop purely decorative motion, not wildlife routines or ecological cycles.
- **Persistence:** `generatedSkyState` and `rooftopState` are stored in the existing local-only continuity object, and the reset control clears them. Old saves remain valid.
- **QA:** browser tests check deterministic generation, bounds and regeneration, once-daily care, persistent discoveries, reversible view modes, rooftop landing elevations and bird routines.

**Scope:** this is deterministic local world generation, not a fully simulated planetary atmosphere or an online shared world. Procedural garden plants are lightweight 3D stand-ins; individual NPC conversations, complex flock pathfinding, detailed interiors and user-built airborne settlements are future work.

## Flight and the living sky — v1.8

Flight is a first-class movement state, not a camera teleport. Interact with the **Skywell** near the first avenue (X 0, Z −9) to awaken it, then press **X** to take off. Hold **Space** to climb, **C / Ctrl** to descend, and move with the existing directional controls. Use **Shift** to boost at higher energy cost. Press **X** again to enter a controlled glide.

- **Safe physics:** horizontal movement eases in and out with velocity damping; the flight controller clamps altitude at 112 world units, obeys nearby building collision at low altitude, and never permits flight inside the underground Syntax Vault. Energy drains during flight and regenerates on the ground. When depleted, flight automatically converts to a gentle, non-damaging glide. Islands support landing and walking on their raised platforms; stepping off them gently catches the player in a glide.
- **Sky Seed progression:** five authored floating sanctuaries, each with a hidden Sky Seed, a landing surface and a readable wind-current updraft. Gathering a Seed increases maximum flight energy by 15 points (up to +75), and that upgrade persists in the browser continuity save. Collected seeds cannot be picked up twice.
- **Aerial destinations:** the Swallow Perch above the city, Cloud Orchard above the forest, Reed Crown over the marsh, Glass Aerie over the plateau, and Wanderer's Rest above the wilds. They are never compulsory for the original narrative. As you approach them in the air, their discovery is recorded in Field Notes and the Source Atlas.
- **Visible sky life:** flocks circle both the city and the sanctuaries, shift their height in storm conditions, and occasionally investigate nearby airborne players. Soft airflow bands around islands make the lift areas recognizable.
- **Rendering:** floating platforms, nests, decorative flora, collectible gems and lift currents have Code and Anime appearances. Their meshes are static and reused; the underlying flight/collision rules remain identical across rendering modes.
- **Accessibility:** desktop shortcut **X** and mobile FLY/ascend/descend touch controls; a compact flight HUD shows elevation, energy, flight state, and recovered Sky Seeds. Reduced-motion settings suppress unnecessary flourish rather than gameplay functionality.
- **Persistence:** saves include flight unlock, energy capacity, collected Sky Seeds and discovered aerial locations. A reload starts safely at the existing ground spawn instead of leaving the player midair. No backend or database is required.

**Historical note:** the initial five sanctuaries were handcrafted; v1.9 adds separate streamed sky habitats beyond the original map. The first flight pass uses controller-based horizontal flight and vertical ascent rather than aerodynamically accurate gliding; dynamic rooftop walking and detailed bird interactions are next steps. Flight areas should be checked visually on desktop and mobile, particularly the clearance between structures and landing surfaces.

## The world beyond the first map — v1.7

The seeded frontier streams **128-unit terrain tiles**, retaining no more than 25 active generated tiles around the explorer. Biome nodes roughly 384 units apart determine one of five nearby environments, with smooth artistic transitions in Anime Reality. Generated tiles unload outside the active radius and reappear consistently when revisited. New region discoveries and node attunements are saved in browser continuity, not the raw meshes.

**The underground prototype** is the Syntax Vault at approximately X 0, Z -116. In Wireframe Vision, approach the gate and press **E** to enter; the same movement controls work at layer -01. At the underground nexus, **E** cycles three spatial arrangements. These edits now also leave *persistent, visible surface consequences* near the entrance, even when returning to Code or Anime Reality. Return via the exit gate.

**At the time of v1.7**, an aerial ecology preview added migratory signal-birds but not user-controlled flight. Flight arrived in v1.8 and expanded with generated sky habitats in v1.9 and living nests in v2.0.

### Next development phases

1. **Aerial community:** deepen the procedural archipelago with flock-led routes, nesting cycles, tiny airborne villages, wind puzzles, and rare discoveries that require following the ecology rather than only flying to a waypoint.
2. **Multi-depth geology:** extend the authored Syntax Vault into a reusable procedural underground chunk system with naturally generated tunnels, ceilings, chambers, cave flora, and safe portal entrances. Keep upper and lower layer data synchronized via per-node state.
3. **World editing:** provide a diegetic Wireframe construction interface with selection, snapping, movement bounds, undo and a clear preview. Persist only edits rather than whole meshes. Surface consequences should affect citizens and ecology.
4. **World-streaming polish:** profile chunk regeneration, reduce generation spikes, implement biome-transition sound/lighting, add landmarks unique to each node and a discovery-based atlas that expands rather than exposing the infinite frontier.

## Controls

- **Enter Simulation** — the entry menu disappears into total blackness; **a second click, tap or keypress** begins the green code rain and Big Bang reveal. Desktop requests pointer lock on the second gesture; if the browser declines, select Resume when prompted.
- **WASD / arrow keys** — move
- **Mouse** — look around
- **Shift** — sprint
- **Space** — jump while grounded; **ascend** in flight
- **X** — launch, glide, or resume flight once awakened at the Skywell
- **E near a bird nest** — observe its current life stage and record a new stage once in Field Notes. Ground, rooftop, and sky-garden care actions remain separate.
- **V near a glowing fissure** — reveal a subterranean biome entrance. Press **E** to descend; within, interact with the return gate, aquifer, fungal nursery or listening chamber.
- **C** or **Ctrl** — descend in flight; **Shift** increases flight speed while consuming more energy
- **Skywell** — near the city entrance at X 0, Z −9. Interact with **E** to permanently unlock flight.
- **Sky Seeds** — five airborne discoveries increase your maximum flight energy when gathered with **E**. Land on sanctuaries to recharge. Updraft streams replenish energy while airborne.
- **P** — open/close simulation pause menu and settings
- **J** — open/close Field Notes, showing encounters from the current session
- **M** — open/close the Source Atlas, choose a navigation target
- **Q** — use Resonance Bloom once unlocked (also available as a button)
- **F** — Signal Call, attracts wildlife (unlock at six hidden Echoes)
- **G** — World Rewrite, restores neglected structures (unlock at eight hidden Echoes)
- **R** — toggle Anime Reality 2.0, with painterly sky, semantic materials, wetland reflections, anime-dressed inhabitants and cinematic day/night lighting
- **Escape** — release pointer and open pause menu (or close settings)
- **V** — toggle wireframe/code vision; on mobile, use the CODE VISION button
- **Mobile** — left touch pad to move; drag right side to look; after flight unlock, tap **FLY**, hold the jump arrow to ascend, or hold **DOWN** to descend.
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
- `src/flight.js` — pure flight physics, stamina, gliding and safe landing state
- `src/skyRoutes.js` — authored aerial sanctuary geometry, updrafts and Sky Seed persistence
- `src/matrixMaterial.js` — UV-independent code volumes and shared anime surface-family shader
- `src/animeEnvironment.js` — illustrated biome scatter, puddle shaders, lighting and weather visuals
- `src/animeArchitecture.js` — illustrated city windows, doorways and awnings
- `src/animeCitizens.js` — swappable character stand-ins with anime walking motion
- `src/style.css` — UI styling, accessibility, responsive controls

In Code Reality, geometry samples scrolling neon glyphs in **world space**, not per-mesh UV seams. Anime Reality uses a shared sun-responsive painterly shading system with semantic material types so the same geometry looks like stone, foliage, pathways, or constructed architecture.

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
- **Environmental richness**: `animeEnvironment.js` adds instanced grass, flowers, pebbles, illustrated rain, small ponds and benches at the same world coordinates. `forest.js` adds rounded illustrated canopy clusters and soft contact shadows only while anime view is active. The graphics-quality setting reduces instanced scenery counts on constrained devices.
- **Wetlands**: four anime-only reflective ponds blend into the marsh and Memory Pool areas; shader reflections and ripples respond to day/night and reduced motion. These are decorative surfaces and do not change gameplay collisions or currently provide swimming.
- **People**: `animeCitizens.js` makes city inhabitants and caretakers appear as illustrated placeholder characters with clothing, hair, hands, eyes, shoes, bags and walking cycles. `animeArchitecture.js` overlays windows, awnings, doorways and warm evening glass onto the existing city buildings. Mobile quality reduces citizen visibility distance.
- **Cinematic finish**: ambient/directional lighting powers the illustrated props, while the code shader uses matched simulated sunlight directly. The Anime Reality UI receives warmer, higher-contrast legible overlays and a restrained non-blurred vignette.
- **View switching**: pressing **R** enters/exits Anime Reality without resetting progress or position; **V** still switches to wireframe and automatically exits anime view. Anime rain replaces falling-code particles without changing the weather driving vegetation and regional humidity. Reduced-motion preferences disable the visual precipitation, not the underlying climate. No images, textures, downloads or server costs were added.

### Rendering and QA limits

The anime look is still built on stylized geometry and procedural materials, not realistic imported character/architecture art. True screen-space outline detection, HDR bloom and full shadow maps are intentionally not enabled; they would raise mobile WebGL costs. Runtime GPU compatibility and final in-game art direction should be checked with real browser screenshots and device testing.

## The Neighbourhoods (v1.6)

**The goal is to turn procedural blocks into recognizable, lived-in places.** Existing missions, movement, collisions and hidden Echo locations stay in place.

- **16 individually named shops and homes** occupy the existing 16 city parcels. `CITY_PARCELS` in `src/neighborhoods.js` is the shared coordinate source of truth for the new storefronts and the existing city's collision geometry. Stores include Lantern & Leaf (tea room), Folded Worlds (bookbindery), The Clockhouse (timeworks), The Seed Exchange, Story & Stone (print studio), Ribbon House, and the Green Balcony collective homes.
- **Anime Reality façades** are no longer identical flat blocks: distinct facade palettes, pitched and stepped roofs, small rooftop structures, shop signs, porches, windows, awnings, window gardens, cafe tables, letters and bookshop displays. The buildings remain lightweight, procedural and collision-safe rather than navigable interiors.
- **Code Reality gets identity too:** individual luminous name signs and purpose-specific roof motifs make the businesses recognizable without needing to enter anime mode.
- **Eight discoverable districts** include Lantern Lane, the Paper Quarter, Maker's Walk, Moss Market, Reedwalk Lookout, the Old Orchard, Windchime Ridge and the Story Camp. First arrival gets an unobtrusive banner and a Field Notes entry; revisits use the smaller location label. Discovered districts persist in the browser save.
- **Recognizable civic locations:** the Clockhouse's visible clockwork, elevated paper-lantern strings, a small market with seeded goods, a shaded Memory Pool pergola, the Old Orchard's seating and trees, marsh boardwalk, plateau chimes and the Story Camp's gathering circle give practical reasons to explore beyond the avenue.
- **Daily tending is available immediately:** the Community Lantern, Public Planter, Orchard Seedbed and Reed Garden can each be cared for once per simulated day with **E** (or the interaction button). Repeat visits increase the visible garden growth and slightly improve local ecological resources. Care history is saved locally. These acts do not require collecting Echoes; Resonance Bloom remains a stronger ability.
- **People have favorite shops:** the existing placeholder inhabitants have deterministic favorite businesses and stop to visit during recurring daily windows, producing occasional local observations when the player witnesses them.
- **Navigation and accessibility:** the Source Atlas offers each district as a destination; its map pins do not reveal hidden Echo positions. First-arrival banners honor reduced-motion settings and the location subtitle is visible in either visual mode.

**Technical notes:** all added meshes are procedural, with one shared set of facade coordinates, reusable meshes and local textures. No database, external character art, site tracking or new npm dependency. Interiors, true citizen pathfinding and rich conversations remain future milestones. Verify both Code and Anime facades, movement around the avenue, readable shop signs at varied window sizes, save/reload and the first-entry banner.

## The Unwritten Frontier (v1.7)

SourceWorld now extends beyond its original city and forest through a **seeded lattice of stable world nodes**. Rather than continuously appending random objects, the terrain generator samples the nearest two biome nodes and gradually shifts environmental forms and foliage as the player crosses the boundary.

- **Five frontier biome families**: Mosslight Gardens, Glassfall Reaches, Amber Meadows, Siltreed Fens and Hollow Ridges. Each world node has deterministic coordinates, identity, ecology, colors and a brief history. Individual seeds are stable across revisits and browser sessions.
- **Infinite-feeling local streaming**: nearby 128-unit terrain tiles are generated as you travel and distant ones removed. A 5×5 neighborhood bounds the active procedural world to 25 chunks; shared mesh geometry and instancing keep draw calls down. The authored city/forest core remains untouched, and clear objectives/paths stay unobstructed.
- **World node attunement**: approach a node's floating crystal and use **E**. The node responds with a visual growth marker, creates a Field Notes observation and remembers its attuned state in your browser's continuity save.
- **Atlas charts only discovered nodes**, not unvisited nodes or hidden Echoes. The Atlas can follow far-off discoveries, so moving beyond the original map doesn't leave your position marker offscreen.
- **A first playable underlayer**: switch to **Wireframe Vision (V)** near X 0, Z -116 and use **E** on the gate. You enter **Underlayer-01: The Syntax Vault**, a small room underneath the forest boundary. Move using normal exploration controls; find the Rewrite Nexus within the chamber and use E to change the structural arrangement. Changes persist after reload. Return through its exit ring, or switch off Wireframe to return safely to the surface.
- **No forced checklist**: node attunement and below-ground discovery are optional, and neither changes the existing main narrative or previous collectibles. Character and biome simulation continue to follow the same single world clock.

### Technical boundaries and next directions

This is a frontier **foundation**, not a complete procedural planet. The traversable ground is intentionally flat to match the existing movement physics. Node transitions currently affect distribution and material palettes, not full erosion/hydrology, enemy populations, narrative arcs or physical elevation. The initial underground vault is authored; the system does not yet procedurally generate connected cave networks or permit unrestricted terrain sculpting.

Next systems:
1. **Flight & aerial navigation**: earn an aerial ability, add altitude-safe movement/landing physics, first-person and third-person camera options, stamina/altitude limits and mobile controls.
2. **Birds and the sky ecology**: flocking and migration between the procedural world nodes, nests, roosts, aerial discoveries and weather-responsive motion.
3. **Deep world generation**: procedural cave and underlayer tiles linked to above-ground node geology, surface-to-depth entrances, layered Atlas navigation and reversible object rearrangement.
4. **Ecological feedback**: rainfall, foraging and player tending alter long-term biome edges, wildlife presence and how restored landmarks look over time.
5. **World polish and QA**: visual contrast and loading quality at tile seams, distance fog, performance on lower-end devices, collision and accessibility audits.

## Future ideas

Expand into a simulation forest, doors and interior spaces, a Source core chamber, object inspection, narrative environmental signals, spatial audio, and shader variants for geometry-sensitive character flow.
