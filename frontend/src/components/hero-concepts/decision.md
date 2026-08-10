# Final Decision: The Curator's Room

**Chosen Concept:** The Curator's Room — a private viewing gallery in 3D

**Date:** July 29, 2026

---

## Score Breakdown

| Criteria | Curator's Room | Golden Frame | Salon Wall |
|---|---|---|---|
| Brand Fit (25%) | **9** /10 | 7 /10 | 9 /10 |
| Feasibility (20%) | **7** /10 | 9 /10 | 5 /10 |
| Performance (15%) | **8** /10 | 9 /10 | 6 /10 |
| Integration Ease (20%) | **9** /10 | 8 /10 | 6 /10 |
| Wow Factor (20%) | **9** /10 | 7 /10 | 8 /10 |
| **Unweighted Average** | **8.4** /10 | 8.0 /10 | 6.8 /10 |

**Winner: The Curator's Room**

---

## Why It Won

### 1. Brand Fit (9/10) — Decisive advantage

The Curator's Room directly translates FrameCraft's in-person consultation experience into the browser. A client walks into the FrameCraft Manhattan studio, sits in a curated space, and views artwork presented with museum-quality framing. That exact metaphor now happens on the homepage. The gallery room with a single spotlighted piece says "premium, focused, curatorial" — exactly the brand identity FrameCraft needs to project to art collectors, interior designers, and galleries.

The Golden Frame (7/10) loses points here because a floating frame in a void, while beautiful, lacks environmental context. It doesn't tell the "gallery studio" story. The Salon Wall (9/10) matches on narrative but is better suited to a secondary page (Gallery) where browsing multiple pieces is the goal.

### 2. Feasibility (7/10) — Solid and achievable

The room is simple geometry: 3-4 planes for walls and floor. One frame mesh. One spotlight. One artwork texture that crossfades. The project already has React Three Fiber working in production (HeroAssembly.tsx demonstrates frame meshes, CanvasTexture compositing, and dynamic imports with `ssr: false`). The 8-12 day estimate is realistic — the hardest parts (camera system with scroll push-in, lighting tuning) are well-understood R3F patterns.

The Golden Frame (9/10) is technically simpler, but its material cycling and environment map tuning still take real effort. The Salon Wall (5/10) is genuinely complex — 3-5 distinct frames with independent cycling, multiple spotlights, camera path animation — and introduces too much risk for the hero.

### 3. Performance (8/10) — Well within budget

A room of 3-4 planes + one frame + one spotlight is exceptionally light. The performance budget is easy to hit (< 500 draw calls, < 50k triangles). The single dynamic texture update per crossfade is O(1). The CSS fallback already exists for mobile/low-end devices.

The Golden Frame (9/10) is lighter, but the gap is small — the room adds maybe 20 triangles. The Salon Wall (6/10) with 3-5 frames and staggered texture updates is genuinely heavier.

### 4. Integration Ease (9/10) — Nearly drop-in

The Curator's Room slots into the current Hero.tsx by replacing exactly two things:
- The CSS gallery wall background (gradients, noise, track lighting) — becomes the 3D room
- The `FramedArtwork` component (CSS frame layers) — becomes the 3D frame on the wall

Everything else stays unchanged: brand plaque, headline, CTA buttons, navigation rail, dot pagination, top accent line. The museum captions render as 2D HTML overlays driven by the same gallery item state, preserving the DM Mono typography and gold left-border styling.

The dynamic import pattern is proven (HeroAssemblySection already uses it). The gallery item cycling timer and index state remain in Hero.tsx, passed down to the 3D scene.

### 5. Wow Factor (9/10) — Genuinely unique

A fully immersive 3D gallery room as a framing website hero is genuinely distinctive. Most framing competitors use static images, slideshows, or videos. Walking into a virtual gallery room creates a memorable first impression that signals FrameCraft operates at a different level. The scroll push-in creates a natural transition to the FrameAssemblySection below — a narrative journey from "viewing the art in a gallery" to "seeing how the frame is made."

The Golden Frame (7/10) is beautiful but has been done by luxury product brands. The Salon Wall (8/10) is impressive but risks overwhelming the viewer.

### Why Not the Phased Approach (Golden Frame first)

The research report's phased approach (Golden Frame now, Curator's Room later) is valid but overly conservative. The incremental difference — adding a room around the frame — is not where the complexity lies. The room is the simplest part. The bulk of the work is the frame mesh, artwork display, lighting system, camera controls, and integration — all of which are shared between both concepts. Building just the frame first and then retrofitting a room around it is more work than building it right the first time.

Build the Curator's Room directly.

---

## What Exactly Will Be Built

### 3D Scene (`HeroScene3D.tsx`)

A React Three Fiber scene containing:

| Element | Detail |
|---|---|
| **Room** | Back wall, left wall, right wall, floor — simple planes with subtle plaster texture (noise overlay). Charcoal/black materials (`#1a1512` to `#0a0a08`). |
| **Frame** | Gold frame in the center of the back wall. Simplified bar-geometry matching the existing HeroAssembly pattern (4 bars forming a rectangle). Gold material: `color: #d4a838`, `metalness: 0.85`, `roughness: 0.2`, `envMapIntensity: 0.8`. |
| **Artwork** | Plane inside the frame with a `CanvasTexture` compositing the gallery item image. Crossfades via opacity when the gallery index changes. |
| **Spotlight** | Drei `<SpotLight>` from above-center, warm golden tint, casting a cone onto the artwork. |
| **Ambient fill** | Drei `<ambientLight>` at intensity 0.08. One `<pointLight>` at 0.1 for subtle fill. |
| **Camera** | `PerspectiveCamera` at `z=4.5, y=0.3, x=0.8`. Spring-based mouse parallax (subtle camera rotation). Slow auto-oscillation via `useFrame` with sin/cos (0.5 degrees, 8-second period). Scroll-driven z-position push-in mapped via `useScroll`. |
| **Environment** | Drei `<Environment preset="night" />` at 128px resolution for gold reflections on the frame. |
| **Post-processing** | Optional Drei `<EffectComposer>` with subtle bloom on the spotlight only. |

### Integration with Hero.tsx

The integration is surgical:

1. **Replace** the CSS gallery wall layers (lines 256-266: gradient, noise overlay, wall grain) with a `<div>` container for the R3F Canvas
2. **Replace** the `FramedArtwork` + `AnimatePresence` block (lines 320-350: main image area) — the 3D scene renders the frame and artwork instead
3. **Keep** the museum captions as 2D HTML overlay positioned over the 3D canvas (same styling, same DM Mono typography, same gold left-border accent)
4. **Keep** everything else: brand plaque, headline, CTA buttons, navigation rail, dot pagination, top accent line

The gallery item index is managed in Hero.tsx (same timer logic). The current item is passed as a prop to the 3D scene. The scene crossfades its artwork texture when the prop changes.

### Dynamic Import Pattern (proven)

```tsx
const HeroScene3D = dynamic(() => import("@/components/hero-concepts/HeroScene3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1512]">
      {/* Loading spinner — gold ring, same as HeroAssemblySection pattern */}
    </div>
  ),
});
```

### Mobile Fallback

Device capability detection (check for `maxTouchPoints > 1` or run a quick FPS probe). On low-end mobile, render the current 2D hero instead. The 3D hero is progressive enhancement — the 2D hero is already excellent.

---

## What Stays from the Current Hero

| Layer | Status |
|---|---|
| Brand plaque (top-left, "FrameCraft / Custom Framing Studio") | **Stays** — same position, same motion animation |
| Gallery wall gradient background | **Replaced** by 3D room walls |
| Noise overlay / wall grain texture | **Replaced** by 3D wall texture (or kept as CSS overlay on top of 3D canvas for consistency) |
| Track lighting CSS effects (spotlight cones, fill lights) | **Replaced** by actual 3D spotlights |
| FramedArtwork component (CSS frame borders, mat, image, vignette) | **Replaced** by 3D frame and artwork plane |
| Museum caption (gold left-border, DM Mono category, title, client) | **Stays** — rendered as 2D HTML overlay positioned over the 3D canvas, driven by same gallery item state |
| Exhibition headline ("The Art of *Framing*") | **Stays** — same position, same motion animation |
| CTA buttons (Explore Frames, Get a Quote) | **Stays** — same position, same styling, same hover effects |
| Navigation rail (desktop, right side) | **Stays** — same position, same styling |
| Dot pagination (mobile, bottom-center) | **Stays** — same position, same styling |
| Top edge accent line | **Stays** — same position, same gradient |
| Gallery item cycling logic (interval, pause-on-hover, preloading) | **Stays** — moved/referenced in the updated Hero.tsx, state passed to 3D scene |

---

## Simplified Implementation Plan

### Phase 1: Foundation (Days 1-3)

**Day 1 — Room + Lighting**
- Create `HeroScene3D.tsx` with R3F `<Canvas>`
- Build room geometry (back wall + side walls + floor as planes)
- Add `ambientLight` (0.08), `pointLight` (0.1), Drei `<SpotLight>` from above
- Apply subtle plaster/noise texture to the back wall
- Camera positioned at `z=4.5, y=0.3, x=0.8`

**Day 2 — Frame + Artwork**
- Build gold frame mesh (4 bars, matching HeroAssembly's `buildPieceConfigs` pattern)
- Add artwork plane inside the frame with `CanvasTexture` compositing
- Wire up texture update when gallery item changes (props from Hero.tsx)

**Day 3 — Dynamic Import + Hero.tsx Integration**
- Add dynamic import of `HeroScene3D` in Hero.tsx with `ssr: false`
- Replace CSS background layers with R3F canvas container
- Replace `FramedArtwork`/`AnimatePresence` block with 3D scene
- Preserve museum caption as 2D overlay driven by same gallery item state
- Verify all other UI elements render correctly above the canvas

### Phase 2: Interaction (Days 4-6)

**Day 4 — Camera: Auto-Oscillation + Mouse Parallax**
- Add slow auto-oscillation via `useFrame` (sin/cos, 0.5-degree amplitude, 8-second period)
- Add spring-based mouse tracking using Framer Motion `useSpring` fed into camera position
- Tune responsiveness (stiffness, damping)

**Day 5 — Camera: Scroll Push-In**
- Integrate Framer Motion `useScroll` to drive camera z-position
- As user scrolls, camera inches closer to the artwork
- Smooth transition from hero to FrameAssemblySection
- Verify Lenis scroll compatibility (no interference)

**Day 6 — Artwork Crossfade + Caption Sync**
- Smooth crossfade between artwork textures when gallery index changes
- Sync the 2D museum caption with the current gallery item
- Ensure crossfade timing matches the 5.5-second interval

### Phase 3: Polish (Days 7-9)

**Day 7 — Gold Material + Environment Map**
- Add Drei `<Environment preset="night" />` at 128px resolution
- Tune gold material: `color: #d4a838, metalness: 0.85, roughness: 0.2, clearcoat: 0.2`
- Verify the gold catches the spotlight and env map realistically

**Day 8 — Mobile Fallback + Performance**
- Add device detection for mobile/low-end devices
- Implement fallback to current 2D hero
- Profile: ensure < 500 draw calls and < 50k triangles on desktop
- Add `<EffectComposer>` with subtle bloom on spotlight (optional, perf-dependent)

**Day 9 — Polish + Edge Cases**
- Fine-tune camera positions and lighting intensity
- Handle navigation rail clicks (jump to specific gallery item)
- Handle window resize (camera aspect ratio)
- Test pause-on-hover interaction with 3D scene
- Test scroll push-in boundary conditions

### Phase 4: Launch (Day 10)
- Cross-browser testing
- Mobile device testing (iOS Safari, Android Chrome)
- Performance validation on mid-range devices
- Final visual review against brand guidelines

---

**Commitment: The Curator's Room. No half-measures. Build it as the primary hero with the 2D hero as the mobile fallback.**
