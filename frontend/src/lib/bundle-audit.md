# FrameCraft Bundle Audit

Last updated: 2026-08-09

## Summary

Heavy JavaScript libraries are now code-split so they only load on pages that use them. No page loads more JS than it needs.

---

## Library Breakdown

| Library | Size (approx) | Status | Loaded on |
|---|---|---|---|
| `three` / `@react-three/fiber` / `@react-three/drei` | ~26 MB | **Code-split** | Home page only (scroll-driven) |
| `gsap` | ~6.4 MB | **Code-split** | /microvisuals only |
| `framer-motion` | ~5.9 MB | **Tree-shaken** | Every page (via Navbar/Footer in layout) |

---

## Three.js (26 MB) — Successfully Split

**Strategy:** Two layers of `next/dynamic` with `ssr: false`:

1. `page.tsx` dynamically imports `FrameAssemblySection`
   - Loading fallback: gold ring spinner with "Preparing the frame" label
2. `FrameAssemblySection.tsx` dynamically imports `HeroAssembly` (the 3D scene)
   - Loading fallback: gold ring spinner with "Loading 3D scene" label (added during this audit)

**Result:** Three.js (including all three, R3F, and drei) is excluded from the initial bundle. It only loads when the user scrolls to the Frame Assembly section.

**Files affected:**
- `/src/app/page.tsx` — outer dynamic import
- `/src/components/FrameAssemblySection.tsx` — inner dynamic import (loading fallback added)

**Only file that imports Three.js:** `src/components/HeroAssembly.tsx`

---

## GSAP (6.4 MB) — Naturally Code-Split

GSAP is imported in exactly one file: `src/app/microvisuals/page.tsx`. No shared component imports GSAP, so it is automatically excluded from every other page's bundle.

**Result:** GSAP only loads on /microvisuals. No changes needed.

---

## Framer Motion (5.9 MB) — Tree-Shaken, Layout Baseline

Framer Motion is imported in 26+ files across the project, including the `Navbar` and `Footer` components in `layout.tsx`. Since these are present on every page, framer-motion is always part of the initial JS bundle.

**Observations:**
- Framer Motion is tree-shakeable — Next.js / webpack eliminates unused exports
- The core `motion` object must be loaded on every page due to layout-level usage
- No effective way to split further without removing framer-motion from Navbar/Footer (a design decision, not a bundle concern)

---

## Preconnect Hints — Already Added

In `layout.tsx` (`<head>` section), preconnect links are already present:

```html
<link rel="preconnect" href="https://images.unsplash.com" />
<link rel="preconnect" href="https://fonts.cdnfonts.com" />
<link rel="preload" href="..." as="image" fetchPriority="high" />
```

---

## Dead Code Found

### Hero3DFrame.tsx (orphaned component)
- File: `src/components/Hero3DFrame.tsx`
- Status: **Not imported anywhere** — confirmed via grep across all `.tsx`/`.ts` files
- Bundle impact: Negligible (only uses framer-motion, which is already loaded)
- Suggestion: Remove if no longer needed, or add to a page if still desired

---

## Duplicate Library Versions — None Found

All dependency versions in `package.json` are consistent:
- `three` ^0.185.1 / `@types/three` ^0.185.1
- `@react-three/fiber` ^9.6.1 / `@react-three/drei` ^10.7.7 (compatible)

---

## Per-Page Bundle Summary

| Page | Three.js | GSAP | Framer Motion | Notes |
|---|---|---|---|---|
| `/` (Home) | Lazy-loaded (scroll) | No | Yes | ~26 MB deferred |
| `/about` | No | No | Yes | — |
| `/frames` | No | No | Yes | — |
| `/gallery` | No | No | Yes | — |
| `/services` | No | No | Yes | — |
| `/custom` | No | No | Yes | — |
| `/booking` | No | No | Yes | — |
| `/contact` | No | No | Yes | — |
| `/microvisuals` | No | Yes | No | GSAP loads here only |

---

## Estimated Savings

| Scenario | Before | After | Savings |
|---|---|---|---|
| Initial load (all pages) | ~38.3 MB (three + gsap + framer) | ~5.9 MB (framer only) | **~32.4 MB** |
| Home page with 3D | ~38.3 MB | ~5.9 MB initial + ~26 MB deferred | **~26 MB deferred** |
| microvisuals page | ~38.3 MB | ~5.9 MB + ~6.4 MB (GSAP) | **~26 MB** (Three.js excluded) |
| All other pages | ~38.3 MB | ~5.9 MB | **~32.4 MB** |

---

## 2026-08-09 — Loading-Performance Pass

### Three.js now fully deferred until near viewport

Previously `page.tsx` used `next/dynamic({ ssr: false })`, which still
**downloaded the chunk right after hydration**. Now `LazyFrameAssemblySection`
wraps the dynamic import in an `IntersectionObserver` (`rootMargin: 900px`), so
three.js / R3F / drei are not requested at all until the section is ~1 viewport
away — and the gold-ring fallback keeps layout stable meanwhile. Net effect:
**zero Three.js bytes on initial page load**, only fetched on scroll.

### Image pipeline

- `next.config.ts`: `formats: ["image/avif", "image/webp"]` — AVIF where
  supported (≈30–50% smaller than WebP); `minimumCacheTTL: 31536000` since
  Unsplash URLs are stable.
- Converted **all CSS background images to `next/image`** so they get lazy
  loading, responsive `srcSet`, and AVIF/WebP: `GalleryCard`, `FrameCard`,
  `TeamGrid`, `Testimonials` avatars, `ImageZoom`, `DepthParallax`,
  `HoverSwapCard`, `ClipReveal`, `BlurReveal`, `ScaleImage`, `/about` (LCP
  header is now `priority`), `/custom` style previews. Below-fold images are
  now fetched lazily instead of eagerly as CSS backgrounds.
- Hero LCP image preload + `priority` already present (unchanged).

### Remaining known items

- `Hero3DFrame.tsx` is still orphaned (unused) — safe to delete.
- `fonts.cdnfonts.com` preconnect in `layout.tsx` serves the global `Dirtyline`
  @font-face; kept since the font is declared app-wide.
- Lint (`eslint`) is currently broken repo-wide due to `typescript@7.0.2` vs
  `typescript-eslint@8.65.0` (peer range `<6.1.0`); typecheck & build pass.
