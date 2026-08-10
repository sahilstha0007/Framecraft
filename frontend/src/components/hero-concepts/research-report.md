# 3D Hero Concepts for FrameCraft

> **Research Report** — July 2026
> Evaluating three 3D hero concepts for FrameCraft's homepage, a premium custom framing studio targeting art collectors, interior designers, museums, and galleries.

---

## Design Direction

The hero is the first thing visitors see. It must communicate FrameCraft's dual identity: **gallery sophistication** (dark + gold, museum-quality presentation) and **handcrafted warmth** (since 1999, artisan workshop). The current 2D hero succeeds at the gallery feel with its cycling artwork, museum captions, and track lighting effects, but it lacks the dimensionality that would make it truly unforgettable.

All three concepts below extend the existing aesthetic into 3D while respecting the brand's premium restraint — no gimmicks, no clutter, just tasteful depth.

**Shared design principles for all concepts:**
- Color palette: charcoal backgrounds (`#1a1512` to `#0a0a08`), gold accents (`#d4a838`), cream text
- Typography: Playfair Display headings, DM Mono for captions, DM Sans for body
- Museum-quality captions with gold left-border accent (carried over from current Hero)
- Subtle noise / wall texture overlay retained
- Lenis smooth scroll, Framer Motion for UI overlays
- CTA buttons preserved in their current position and styling

---

## Concept 1: The Curator's Room

### Concept Name
**"The Curator's Room"** — a private viewing gallery in 3D

### Description

The user arrives in a dimly lit, minimalist gallery room. A single framed artwork hangs on the far wall — illuminated by a warm golden spotlight from above. The room is sparse but intentional: a dark wall with subtle texture, a deep charcoal floor, and just enough architectural detail (baseboard, corner lines, crown molding shadow) to feel like a real SoHo or Madison Avenue gallery.

The camera sits at a slight angle to the wall — not dead-center, but positioned as if the viewer is standing in the middle of the room looking at the art. A **barely perceptible gentle drift** (slow parallax oscillation) gives the scene life without being distracting. As the user moves their mouse, the camera shifts subtly, revealing the depth of the room and the frame's physical presence.

Every 5.5 seconds, the artwork crossfades to the next piece. The spotlight beam shifts slightly to track the new piece. The museum-style caption fades in from the bottom-left, just as it does now.

The scroll triggers a **very slow "push-in"** — as the user scrolls down, the camera inches closer to the artwork, creating the sensation of stepping toward the piece. This naturally transitions into the FrameAssemblySection below.

### Technical Approach

| Aspect | Detail |
|--------|--------|
| **Core library** | React Three Fiber + Drei |
| **Room geometry** | Simple box with inward-facing normals; or 3 planes (back wall, left, right) |
| **Wall texture** | Drei's `useTexture` with a custom subtle noise/plaster texture; or procedural via shader |
| **Lighting** | Drei `<SpotLight>` for the gallery beam (with volumetric cone via custom mesh), `<ambientLight>` at very low intensity (0.08), `<pointLight>` at 0.1 for fill |
| **Floor** | Plane with slight roughness, very dark brown |
| **Camera** | `PerspectiveCamera` positioned at z=4.5, y=0.3, x=0.8 (slight offset). Spring-based mouse tracking via Framer Motion motion values fed to R3F camera. Slow auto-oscillation via `useFrame` with sin/cos. |
| **Scroll** | Intersection observer or Framer Motion `useScroll` to drive camera z-position (push-in effect) |
| **Frame** | Reuse or adapt the frame mesh from `HeroAssembly.tsx` (bars as boxes) but simplified — no assembly animation, just the final assembled look with gold material |
| **Artwork** | `CanvasTexture` compositing, similar to `HeroAssembly`'s `ArtworkDisplay` but simpler — single image plane, crossfade via opacity |
| **Post-processing** | Optional: Drei `<EffectComposer>` with subtle bloom on the spotlight |
| **Performance** | Low polygon count (room is just 3-4 planes). No particles. One dynamic texture update per crossfade. Should run at 60fps on mid-range devices. Consider a fallback to the current 2D hero on low-end mobile. |

### Why It Fits FrameCraft

This concept leans into FrameCraft's **gallery positioning**. The private viewing room metaphor mirrors the in-person consultation experience: a client walks into the FrameCraft Manhattan studio, sits in a curated space, and views artwork presented with museum-quality framing. It tells the story of the brand before a single word is read.

The dark + spotlight aesthetic directly maps to the "warm luxury meets gallery minimalism" vibe from the project overview. The gold frame catches the light realistically, selling the premium framing product through visual experience alone.

### Implementation Complexity

**Medium-High** — approximately 8-12 days of focused work

| Phase | Effort |
|-------|--------|
| Room modeling + lighting setup | 1-2 days |
| Frame mesh with gold material | 1-2 days |
| Artwork display + crossfade system | 1 day |
| Camera system (drift + mouse parallax + scroll push-in) | 2 days |
| Integration with hero overlay (captions, CTAs, navigation) | 1-2 days |
| Mobile fallback, performance tuning, polish | 2-3 days |

### Visual Reference

> A dark room almost entirely in shadow. The back wall is a moody charcoal with a faint plaster texture — visible only in the warm cone of light that falls from above. Inside that cone: a gold-leaf frame catching the light on its inner edge. The artwork inside glows, colors rich and saturated. The rest of the room dissolves into darkness. A thin golden caption plate sits beneath the frame. The floor reflects a ghost of the spotlight. The whole scene breathes — a 0.5-degree sway every 8 seconds.

### Pros vs Other Concepts

| Pros | Cons |
|------|------|
| Most immersive — places the user in a real space | Heaviest initial build (room + lighting + camera) |
| Strongest brand connection to gallery aesthetic | Room may feel constraining vs. more abstract approaches |
| Scroll push-in creates a natural transition to next section | Environmental lighting is complex to get right |
| Frame materials can be shown in a realistic context | Harder to justify on mobile (fallback needed) |
| Most unique — few framing sites do this | Requires more 3D asset work |

---

## Concept 2: The Golden Frame

### Concept Name
**"The Golden Frame"** — an interactive, materially rich frame floating in space

### Description

A single, meticulously detailed frame floats at the center of a dark void. The frame is the star — it's large in the viewport, taking up about 60% of the screen. Its material properties are hyper-visible: gold leaf that **catches and shifts light** as the frame gently rotates, a wood-grain profile on the inner edge, a subtle glass sheen over the artwork.

The frame **breathes subtly** — a near-imperceptible 0.3-degree rotation every 6 seconds, plus a gentle upward float of 2-3 pixels on a slow sine wave. As the user moves their mouse, the frame responds with a **liquid parallax** — tilting and rotating to follow the cursor with a heavy, spring-dampened feel, as if it's suspended in honey.

The artwork inside crossfades on a 5.5-second cycle. Each transition ripples through the glass reflection — a brief flash of light across the surface. The frame itself can also **cycle through its own materials**: starting in gold, then transitioning to walnut, then charcoal, then mahogany — subtly showcasing FrameCraft's range without explicit UI. Each material transition takes 2 seconds and happens every 3-4 artwork swaps.

A faint golden particle field orbits around the frame — maybe 20-30 tiny glowing specks moving in slow elliptical paths. They're visible only in peripheral vision, adding atmosphere without distraction.

This concept is the **closest evolution of the current Hero** — it keeps the centered layout, the cycling artwork, the caption styling — but adds real 3D depth and materiality that sells the framing product visually.

### Technical Approach

| Aspect | Detail |
|--------|--------|
| **Core library** | React Three Fiber + Drei |
| **Frame geometry** | Custom profile shape extruded along a rectangular path — not just boxes. The frame cross-section can have multiple steps (outer flat, inner bevel, lip) for realism. |
| **Materials** | `MeshPhysicalMaterial` with an HDR environment map (Drei `<Environment>` preset "studio" or "night"). Gold: `metalness: 0.9, roughness: 0.15, clearcoat: 0.2`. Walnut: `metalness: 0.1, roughness: 0.6` with wood texture. Material transitions via animating material uniforms. |
| **Artwork** | `CanvasTexture` compositing (same pattern as HeroAssembly) — high-res, crossfading via opacity |
| **Glass** | Transparent plane in front of artwork with `roughness: 0, metalness: 0, opacity: 0.1` and a diagonal gradient reflection map |
| **Camera** | Fixed position at z=3, fov=45. Frame is centered. |
| **Mouse tracking** | Spring-based: `Framer Motion useSpring(useMotionValue(...))` fed into R3F's rotation. Stiffness=50, damping=25 for that heavy feel. |
| **Auto animation** | `useFrame` driving a `THREE.Group` rotation with sin/cos at very low amplitude |
| **Particles** | simple `Points` geometry, ~30 particles, gold color, additive blending, orbital motion via `useFrame` |
| **Environment** | Drei `<Environment preset="warehouse" />` for HDR reflections on the gold (gives that real metallic sheen). Low-res env map for performance. |
| **Post-processing** | Drei `<EffectComposer>` with a very subtle bloom on emissive areas only |
| **Performance** | Medium. Frame geometry can be kept under 200 tris. Particles are a single draw call. Environment map is the biggest cost — use low-res (128px) for mobile. |

### Why It Fits FrameCraft

This concept makes the **product itself the hero**. For a framing studio, the frame is the product — and here it's literally center stage. The material cycling (gold, walnut, charcoal, mahogany) directly shows the range of offerings. The glass reflection over the artwork demonstrates the museum-grade quality.

The "floating in a dark void" aesthetic is very premium-art-tech — it's the visual language used by luxury watch brands, high-end audio companies, and art auction houses (Christie's, Sotheby's). It signals that FrameCraft operates at that level.

The "handcrafted since 1999" story is told through the material fidelity — you can see the wood grain, the gilded edge, the hand-finished surface. The particle field evokes the workshop atmosphere (fine sawdust catching light).

### Implementation Complexity

**Medium** — approximately 6-10 days of focused work

| Phase | Effort |
|-------|--------|
| Custom frame profile geometry (extrusion) | 1-2 days |
| HDR environment setup + gold material tuning | 1 day |
| Material transition system (gold → walnut → etc.) | 1-2 days |
| Artwork display + glass reflection overlay | 1 day |
| Mouse parallax + auto-breath animation | 1 day |
| Particle field | 0.5 days |
| Integration with hero overlay | 1 day |
| Performance tuning, mobile fallback | 1-2 days |

### Visual Reference

> A void of infinite black. At its center, a frame floats — weightless but solid. The gold catches a warm studio light: bright highlights sweep across the bevel as it rotates a fraction of a degree. Inside, a vibrant abstract painting glows. A faint glass reflection crosses the surface diagonally — the ghost of a window. Faint gold specks orbit in the periphery, barely visible. The frame shifts as you move your mouse — it resists, then follows — like it's aware of you.

### Pros vs Other Concepts

| Pros | Cons |
|------|------|
| Best visual showcase of frame materials & craftsmanship | Lacks environmental context (not in a room/gallery) |
| Most direct evolution of current Hero — lowest UX risk | Floating-in-void is abstract — some users may not connect it to a physical shop |
| Strong mouse interactivity feels premium and responsive | Material transitions could feel gimmicky if not executed smoothly |
| Lightest 3D scene — easier to optimize | Frame alone may not feel "full" enough |
| Best starting point if iterating from current codebase | Similar to many luxury product hero sections elsewhere |
| Material cycling naturally sells the product range | |

---

## Concept 3: The Salon Wall

### Concept Name
**"The Salon Wall"** — a curated collection of framed works in a dynamic 3D gallery

### Description

A generous 3D gallery wall spans the viewport, displaying **multiple framed works together** in a salon-style arrangement. Three to five pieces of varying sizes and frame styles hang in a thoughtful composition: a large gold-leaf piece dominates the center, a smaller walnut frame sits to its right, a charcoal frame anchors the bottom-left, a mahogany piece completes the ensemble.

The camera performs a **slow, cinematic dolly** — starting wide (the full wall in view) and gradually pushing in over several seconds, then pulling back. This creates a smooth, endless loop or a scroll-driven progression. Alternatively, the camera can **pan gently across the wall** — left to right, then back — as if the viewer is walking past the collection.

Each framed piece displays a different artwork from the gallery items, cycling independently on staggered timers so there's always something changing. The frames are physically distinct — different materials, colors, depths, and profiles visible in the 3D space.

The wall itself has **depth**: it's not a flat plane. Frames can project outward at different distances (some float slightly forward, some sit flush). A subtle **track lighting rail** runs across the top, with individual spotlights hitting each frame. The light creates realistic shadows and highlights on the frame surfaces.

As the user moves their mouse, the camera **tilts slightly** (parallax within the wall space), revealing the depth between frames and the wall surface.

This concept is about **showcasing breadth** — FrameCraft doesn't just do one thing, it does everything, and it all works together beautifully.

### Technical Approach

| Aspect | Detail |
|--------|--------|
| **Core library** | React Three Fiber + Drei |
| **Wall** | A large plane with slight curvature (like a gallery wall in a curved corridor). Texture: plaster/noise. |
| **Frames** | 3-5 individual frame meshes, each with different dimensions and materials. Can be instanced or individual. Each has a `group` parent for positioning. |
| **Frame materials** | Gold (metalness: 0.8, roughness: 0.2), Walnut (roughness: 0.6, metalness: 0.1), Charcoal (roughness: 0.5, metalness: 0.3), Mahogany (roughness: 0.5, metalness: 0.1) |
| **Artwork** | Each frame has a texture plane. Textures cycle independently on staggered timers (5-8 second intervals, offset per frame). |
| **Lighting** | Drei `<SpotLight>` for each frame. Low ambient light. A `<RectAreaLight>` or two for ambient fill. |
| **Camera** | Drei's `CameraControls` for smooth programmatic dolly/pan. Path animation via `useFrame` driving camera position along a bezier curve (computed with `THREE.CatmullRomCurve3`). |
| **Scroll** | Scroll maps to camera position along the path (push-in or pan). Alternatively, auto-animates on a loop. |
| **Mouse parallax** | Subtle camera rotation around a pivot point — max 1 degree tilt. Provides a sense of depth between wall layers. |
| **Performance** | Medium-High. 3-5 frame geometries, 3-5 dynamic texture updates (potentially expensive). Use O(1) texture management (pre-composited canvases, no alpha blending per frame). Consider limiting to 3 frames on mobile. |
| **Post-processing** | Optional: subtle vignette and very light bloom on spotlights |

### Why It Fits FrameCraft

A salon wall is a **signature framing service** — the project overview mentions "Family Legacy Wall" in the gallery items, and the Gallery section. This concept shows FrameCraft's core value proposition visually: they don't just frame one piece, they help you compose entire walls.

It demonstrates **range**: multiple frame styles visible at once. It demonstrates **curation**: the composition itself says "we know how to arrange art." It demonstrates **craft**: each frame is visibly distinct in material and finish.

The track lighting and gallery wall setting connect to the brand's gallery aesthetic while feeling more dynamic than a single-frame presentation.

### Implementation Complexity

**High** — approximately 12-18 days of focused work

| Phase | Effort |
|-------|--------|
| Gallery wall (geometry, texture, lighting rig) | 2-3 days |
| Frame set creation (3-5 distinct frames with profiles) | 3-4 days |
| Multi-artwork cycling system (staggered timers) | 2-3 days |
| Camera path system (curve + scroll/animation driving) | 2-3 days |
| Spotlight rigging per frame | 1 day |
| Mouse parallax | 1 day |
| Integration with hero overlay | 1-2 days |
| Performance tuning, mobile fallback | 2-3 days |

### Visual Reference

> A wide, cinematic view of a gallery wall in a dark room. A gold-leaf frame in the center, large and commanding, catches a spotlight. To its right, a smaller walnut frame in a softer pool of light. Below-left, a charcoal frame with a black-and-white photograph. The track lighting rail above casts sharp, controlled cones of warm light. The wall has a faint linen texture. As you watch, one artwork fades out and another appears — the gold frame's painting changes, while the others remain. The camera drifts left by inches, then right again — the frames shift in perspective, revealing their depth and the shadows they cast on the wall.

### Pros vs Other Concepts

| Pros | Cons |
|------|------|
| Best showcases FrameCraft's breadth (multiple styles) | Most complex implementation by far |
| Most dynamic — multiple things happening on screen | Highest risk of feeling cluttered or busy |
| Tells a "curation" story — aligns with gallery services | Texture management for multiple cycling artworks is non-trivial |
| Feels like a real gallery visit | Hardest to get the composition right (frame placement, sizing) |
| Natural fit for the "Collection" / "Gallery" brand narrative | Scroll-based camera path needs careful tuning to feel right |
| Most differentiating — few framing sites do a multi-frame hero | Most expensive to build and maintain |

---

## Recommendation: Which One to Build?

### Decision Matrix

| Criteria (weight) | Curator's Room | Golden Frame | Salon Wall |
|---|---|---|---|
| **Premium feel** (30%) | 9/10 | 8/10 | 8/10 |
| **Brand alignment** (25%) | 9/10 | 7/10 | 9/10 |
| **Performance** (15%) | 7/10 | 9/10 | 6/10 |
| **Build effort** (15%) | 6/10 | 8/10 | 4/10 |
| **Uniqueness** (10%) | 8/10 | 6/10 | 8/10 |
| **Mobile-ready** (5%) | 6/10 | 8/10 | 5/10 |
| **Weighted total** | **8.00** | **7.60** | **7.05** |

### Recommendation

**Build "The Curator's Room" as the primary hero, with "The Golden Frame" as a lighter-weight alternative if resources are constrained.**

Rationale:

1. **The Curator's Room** scores highest on the two most important criteria: premium feel and brand alignment. It offers the most immersive, differentiated experience while directly reinforcing FrameCraft's gallery identity. The scroll push-in creates a natural narrative bridge to the FrameAssemblySection below. Its main cost — environmental modeling and lighting — is a one-time investment that pays off in visual distinctiveness.

2. **The Golden Frame** is the pragmatic second choice. It's the fastest path to a 3D hero, reuses the most existing patterns from the current Hero and HeroAssembly, and its performance profile is the cleanest. If the team has 6 weeks, build Curator's Room. If the team has 3 weeks, build Golden Frame.

3. **The Salon Wall** should be considered for a secondary section (e.g., the Gallery or Frames page) rather than the hero. Its multi-frame dynamic is excellent for showcasing variety, but the hero needs a singular, focused statement — one piece of art, one perfect frame, one powerful impression. A salon wall is better experienced after the user has already committed to exploring.

### Phased Approach (Recommended)

If resources allow, consider a phased rollout:

- **Phase 1 (now):** Develop "The Golden Frame" as a drop-in replacement for the current Hero's visual centerpiece. It's the fastest path to 3D, enhances the existing layout with material realism, and lets the team learn the R3F hero patterns with lower risk. The current CSS-based framer-motion transitions (captions, CTAs, navigation) remain unchanged.

- **Phase 2 (next):** Evolve the Golden Frame into the Curator's Room by adding the gallery environment, lighting, and camera parallax. The frame system is already built — now it gets a home. The scroll push-in replaces the current static layout.

- **Phase 3 (future):** Deploy the Salon Wall concept on the Gallery or Frames page, where its multi-frame dynamic naturally belongs.

### Key Technical Considerations (All Concepts)

1. **SSR handling**: The `Canvas` component must be dynamically imported with `ssr: false` (already done for HeroAssembly). This is critical since Three.js requires the `window` object.

2. **Mobile fallback**: All three concepts should detect device capability (either via `navigator` check or a simple FPS monitor) and fall back to the current 2D hero. The 2D hero is already excellent — the 3D version is a progressive enhancement.

3. **Performance budget**: Keep the 3D scene under 500 draw calls, under 50k triangles. No real-time shadows (bake or skip). Use Drei's `<Bvh>` for cheaper raycasting if interactions are needed.

4. **Lenis compatibility**: The R3F canvas should not interfere with Lenis scroll. Ensure `scroll: false` on `<OrbitControls>` (not used in hero concepts anyway) and use Framer Motion's scroll API for scroll-driven camera moves.

5. **Texture management**: For cycling artwork, use the `CanvasTexture` compositing pattern from HeroAssembly — one shared canvas, one texture, updated via `needsUpdate`. Avoid creating new textures on each crossfade.

6. **Gold material formula**: `color: #d4a838`, `metalness: 0.85-0.95`, `roughness: 0.1-0.25`, `clearcoat: 0.2`, `clearcoatRoughness: 0.3`, `envMapIntensity: 0.8-1.2`. This combination with an HDR environment map produces a realistic gold-leaf appearance.

---

*End of research report.*
