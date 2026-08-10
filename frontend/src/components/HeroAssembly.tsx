"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Constants ───────────────────────────────────────────────────────────────

const BAR_COLOR = "#d4a838";
const CORNER_GLOW_COLOR = "#d4a838";
const GLASS_OPACITY = 0.15;

const FRAME_WIDTH = 1.7; // inner opening width
const FRAME_HEIGHT = 2.3; // inner opening height
const BAR_WIDTH = 0.15; // cross-section width of the bar
const BAR_DEPTH = 0.2; // cross-section depth of the bar
const ARTWORK_THICKNESS = 0.05;
const GLASS_THICKNESS = 0.02;

const OUTER_WIDTH = FRAME_WIDTH + 2 * BAR_WIDTH; // 2.0
const OUTER_HEIGHT = FRAME_HEIGHT + 2 * BAR_WIDTH; // 2.6
const HW = OUTER_WIDTH / 2; // 1.0
const HH = OUTER_HEIGHT / 2; // 1.3

const SCATTER_MIN_RADIUS = 3;
const SCATTER_MAX_RADIUS = 4;
const SCATTER_SCALE_MIN = 0.3;
const SCATTER_SCALE_MAX = 0.7;

// Artwork image URLs — real artwork images from Unsplash
const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=85",
  "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=1200&q=85",
  "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=1200&q=85",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=85",
  "https://images.unsplash.com/photo-1529254479751-faeedc59e78f?w=1200&q=85",
  "https://images.unsplash.com/photo-1515288207449-100e125abccb?w=1200&q=85",
  "https://images.unsplash.com/photo-1609811692040-35b06faddb8d?w=1200&q=85",
  "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=1200&q=85",
];

const DISPLAY_DURATION = 5; // seconds each image is shown before transitioning
const CROSSFADE_DURATION = 1.2; // seconds for the crossfade between images

// Canvas resolution for the composited artwork texture.
// Dimensions are chosen to exactly match the frame aspect ratio (FRAME_WIDTH/FRAME_HEIGHT)
// so the texture maps without any distortion on the plane geometry.
const CANVAS_W = Math.round(1360);
const CANVAS_H = Math.round(1360 * (FRAME_HEIGHT / FRAME_WIDTH));
// CANVAS_W=1360, CANVAS_H≈1840 → ratio 1360/1840 ≈ 0.73913, matching 1.7/2.3

// ─── Easing ──────────────────────────────────────────────────────────────────

function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Scatter helpers ─────────────────────────────────────────────────────────

function randomSpherePosition(
  minRadius = SCATTER_MIN_RADIUS,
  maxRadius = SCATTER_MAX_RADIUS
): THREE.Vector3 {
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

function randomScatterScale(): THREE.Vector3 {
  const s =
    SCATTER_SCALE_MIN + Math.random() * (SCATTER_SCALE_MAX - SCATTER_SCALE_MIN);
  return new THREE.Vector3(s, s, s);
}

function randomScatterRotation(): THREE.Euler {
  return new THREE.Euler(
    (Math.random() - 0.5) * Math.PI * 2,
    (Math.random() - 0.5) * Math.PI * 2,
    (Math.random() - 0.5) * Math.PI * 2
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PieceConfig {
  endPosition: [number, number, number];
  endScale: [number, number, number];
  endRotation: [number, number, number];
  color: string;
  transparent?: boolean;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}

interface PieceState {
  startPosition: THREE.Vector3;
  startScale: THREE.Vector3;
  startRotation: THREE.Euler;
  endPosition: THREE.Vector3;
  endScale: THREE.Vector3;
  endRotation: THREE.Euler;
  color: string;
  transparent: boolean;
  opacity: number;
  metalness: number;
  roughness: number;
}

// ─── Build piece configs ──────────────────────────────────────────────────────
// Note: the artwork plane and its reflection overlay are handled separately by
// the ArtworkDisplay component below instead of being part of the bar pieces.

function buildPieceConfigs(): PieceConfig[] {
  const topY = HH - BAR_WIDTH / 2;
  const bottomY = -(HH - BAR_WIDTH / 2);
  const leftX = -(HW - BAR_WIDTH / 2);
  const rightX = HW - BAR_WIDTH / 2;

  return [
    // Top bar
    {
      endPosition: [0, topY, 0],
      endScale: [OUTER_WIDTH, BAR_WIDTH, BAR_DEPTH],
      endRotation: [0, 0, 0],
      color: BAR_COLOR,
      metalness: 0.6,
      roughness: 0.3,
    },
    // Bottom bar
    {
      endPosition: [0, bottomY, 0],
      endScale: [OUTER_WIDTH, BAR_WIDTH, BAR_DEPTH],
      endRotation: [0, 0, 0],
      color: BAR_COLOR,
      metalness: 0.6,
      roughness: 0.3,
    },
    // Left bar
    {
      endPosition: [leftX, 0, 0],
      endScale: [BAR_WIDTH, OUTER_HEIGHT, BAR_DEPTH],
      endRotation: [0, 0, 0],
      color: BAR_COLOR,
      metalness: 0.6,
      roughness: 0.3,
    },
    // Right bar
    {
      endPosition: [rightX, 0, 0],
      endScale: [BAR_WIDTH, OUTER_HEIGHT, BAR_DEPTH],
      endRotation: [0, 0, 0],
      color: BAR_COLOR,
      metalness: 0.6,
      roughness: 0.3,
    },
    // Glass overlay (slightly inset, pushed forward in front of the bars)
    {
      endPosition: [0, 0, BAR_DEPTH / 2 + GLASS_THICKNESS / 2],
      endScale: [
        FRAME_WIDTH + BAR_WIDTH,
        FRAME_HEIGHT + BAR_WIDTH,
        GLASS_THICKNESS,
      ],
      endRotation: [0, 0, 0],
      color: "#ffffff",
      transparent: true,
      opacity: GLASS_OPACITY,
      metalness: 0.0,
      roughness: 0.0,
    },
  ];
}

function buildPieceState(config: PieceConfig): PieceState {
  return {
    startPosition: randomSpherePosition(),
    startScale: randomScatterScale(),
    startRotation: randomScatterRotation(),
    endPosition: new THREE.Vector3(...config.endPosition),
    endScale: new THREE.Vector3(...config.endScale),
    endRotation: new THREE.Euler(...config.endRotation),
    color: config.color,
    transparent: config.transparent ?? false,
    opacity: config.opacity ?? 1.0,
    metalness: config.metalness ?? 0.5,
    roughness: config.roughness ?? 0.4,
  };
}

// ─── Frame Piece ──────────────────────────────────────────────────────────────

function FramePiece({
  state,
  progress,
}: {
  state: PieceState;
  progress: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const eased = easeInOutCubic(progress);

    // Interpolate position
    mesh.position.lerpVectors(state.startPosition, state.endPosition, eased);

    // Interpolate scale
    mesh.scale.lerpVectors(state.startScale, state.endScale, eased);

    // Interpolate rotation (manual for each axis since Euler doesn't have lerpVectors)
    mesh.rotation.x =
      state.startRotation.x +
      (state.endRotation.x - state.startRotation.x) * eased;
    mesh.rotation.y =
      state.startRotation.y +
      (state.endRotation.y - state.startRotation.y) * eased;
    mesh.rotation.z =
      state.startRotation.z +
      (state.endRotation.z - state.startRotation.z) * eased;
  }, [progress, state]);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial
        color={state.color}
        transparent={state.transparent}
        opacity={state.opacity}
        metalness={state.metalness}
        roughness={state.roughness}
        clearcoat={state.transparent ? 0.0 : 0.15}
        clearcoatRoughness={0.3}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

// ─── Artwork Display ─────────────────────────────────────────────────────────
// Renders a plane with artwork images that crossfade every few seconds, plus a
// subtle glass reflection overlay with a diagonal gradient on top.

/**
 * Draws an HTML image onto a 2D canvas context using "cover" sizing — the image
 * is scaled to fill the canvas while maintaining its aspect ratio, cropping any
 * overflow. This ensures the frame is always fully filled regardless of the
 * source image's aspect ratio.
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number
) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = cw / ch;

  let drawW: number;
  let drawH: number;
  let offsetX = 0;
  let offsetY = 0;

  if (imgAspect > canvasAspect) {
    // Image is wider than the canvas — match height, crop left/right
    drawH = ch;
    drawW = ch * imgAspect;
    offsetX = (drawW - cw) / 2;
  } else {
    // Image is taller than the canvas — match width, crop top/bottom
    drawW = cw;
    drawH = cw / imgAspect;
    offsetY = (drawH - ch) / 2;
  }

  ctx.drawImage(img, -offsetX, -offsetY, drawW, drawH);
}

function ArtworkDisplay({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentIdxRef = useRef(0);
  const nextIdxRef = useRef(1);
  const crossfadeRef = useRef(0);
  const transitioningRef = useRef(false);
  const displayTimerRef = useRef(0);
  const imagesLoadedRef = useRef(false);

  // Fixed random start state for the scatter-to-assembly animation.
  // Seeded once via useMemo so it doesn't change across re-renders.
  const assemblyStart = useMemo(
    () => ({
      position: randomSpherePosition(),
      scale: randomScatterScale(),
    }),
    []
  );

  // ── Glass reflection gradient texture ──────────────────────────────────
  // A diagonal gradient texture that creates the illusion of a subtle glass
  // reflection across the artwork surface.
  const gradientTexture = useMemo(() => {
    const gradCanvas = document.createElement("canvas");
    gradCanvas.width = 512;
    gradCanvas.height = 512;
    const gCtx = gradCanvas.getContext("2d")!;

    // Diagonal gradient from top-right toward bottom-left — simulates light
    // hitting the glass from above and to the right.
    const gradient = gCtx.createLinearGradient(512, 0, 0, 512);
    gradient.addColorStop(0, "rgba(255,255,255,0.35)");
    gradient.addColorStop(0.15, "rgba(255,255,255,0.15)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.03)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.0)");
    gradient.addColorStop(1, "rgba(255,255,255,0.0)");

    gCtx.fillStyle = gradient;
    gCtx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(gradCanvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }, []);

  // ── Draw helper ────────────────────────────────────────────────────────
  // Blends the current and next image onto the shared canvas.
  // Both images crossfade: current fades out (alpha 1→0) as next fades in
  // (alpha 0→1). blend ranges from 0 (fully current image) to 1 (fully next
  // image).
  function drawCrossfade(
    currentIdx: number,
    nextIdx: number,
    blend: number
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const images = imagesRef.current;
    if (images.length < 2) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw the current image fading OUT as blend increases
    if (images[currentIdx]) {
      ctx.globalAlpha = 1 - blend;
      drawCoverImage(ctx, images[currentIdx], CANVAS_W, CANVAS_H);
    }

    // Draw the next image fading IN as blend increases
    if (images[nextIdx]) {
      ctx.globalAlpha = blend;
      drawCoverImage(ctx, images[nextIdx], CANVAS_W, CANVAS_H);
    }

    ctx.globalAlpha = 1;
  }

  // ── Image loading & canvas setup ───────────────────────────────────────
  useEffect(() => {
    // Create an off-screen canvas that will be composited into a Three.js texture
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvasRef.current = canvas;

    // Draw a warm dark placeholder while images load
    const initialCtx = canvas.getContext("2d");
    if (initialCtx) {
      initialCtx.fillStyle = "#2a2018";
      initialCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle border hint
      initialCtx.strokeStyle = "#d4a838";
      initialCtx.lineWidth = 2;
      initialCtx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;
    // Set texture state so the JSX re-renders and the material picks up the map
    setTexture(texture);

    // Pre-allocate array of the right length — each slot will be filled when
    // its corresponding image finishes loading. This preserves the original
    // IMAGE_URLS order regardless of async callback timing.
    const loaded: HTMLImageElement[] = new Array(IMAGE_URLS.length);
    let loadedCount = 0;

    const loader = new THREE.TextureLoader();

    IMAGE_URLS.forEach((url, i) => {
      loader.load(
        url,
        (tex) => {
          // Store the image at its original index to preserve ordering
          loaded[i] = tex.image;
          loadedCount++;
          if (loadedCount === IMAGE_URLS.length) {
            // All images loaded — store them and draw the first frame
            imagesRef.current = loaded;
            imagesLoadedRef.current = true;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
              drawCoverImage(ctx, loaded[0], CANVAS_W, CANVAS_H);
            }
            texture.needsUpdate = true;
          }
        },
        undefined,
        () => {
          // On load error, create a fallback colored image so the show goes on
          const fallbackCanvas = document.createElement("canvas");
          fallbackCanvas.width = 200;
          fallbackCanvas.height = Math.round(200 * (FRAME_HEIGHT / FRAME_WIDTH));
          const fCtx = fallbackCanvas.getContext("2d")!;
          const colors = ["#8b663a", "#5a7a6a", "#6a5a7a", "#7a6a5a"];
          fCtx.fillStyle = colors[i % colors.length];
          fCtx.fillRect(0, 0, 200, 200);

          const fallbackImg = document.createElement("img");
          fallbackImg.onload = () => {
            loaded[i] = fallbackImg;
            loadedCount++;
            if (loadedCount === IMAGE_URLS.length) {
              imagesRef.current = loaded;
              imagesLoadedRef.current = true;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
                drawCoverImage(ctx, loaded[0], CANVAS_W, CANVAS_H);
              }
              texture.needsUpdate = true;
            }
          };
          fallbackImg.src = fallbackCanvas.toDataURL();
        }
      );
    });

    return () => {
      texture.dispose();
    };
  }, []);

  // ── Crossfade cycling (runs every frame via R3F's render loop) ────────
  useFrame((_state, delta) => {
    if (!imagesLoadedRef.current) return;

    if (transitioningRef.current) {
      crossfadeRef.current += delta / CROSSFADE_DURATION;
      const clamped = Math.min(crossfadeRef.current, 1);
      if (clamped >= 1) {
        // Transition finished — swap images and reset the display timer
        currentIdxRef.current = nextIdxRef.current;
        transitioningRef.current = false;
        displayTimerRef.current = 0;
      }
      drawCrossfade(
        currentIdxRef.current,
        nextIdxRef.current,
        easeInOutCubic(clamped)
      );
    } else {
      displayTimerRef.current += delta;
      if (displayTimerRef.current >= DISPLAY_DURATION) {
        // Time to transition to the next image in the sequence
        nextIdxRef.current =
          (currentIdxRef.current + 1) % IMAGE_URLS.length;
        crossfadeRef.current = 0;
        transitioningRef.current = true;
      }
    }

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  });

  // ── Assembly animation ─────────────────────────────────────────────────
  // Interpolates the group's world position and scale based on the scroll-
  // driven progress value so the artwork flies in from a scattered position.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const eased = easeInOutCubic(progress);

    const endPosition = new THREE.Vector3(
      0,
      0,
      -BAR_DEPTH / 2 - ARTWORK_THICKNESS / 2
    );
    group.position.lerpVectors(assemblyStart.position, endPosition, eased);

    const endScale = new THREE.Vector3(1, 1, 1);
    group.scale.lerpVectors(assemblyStart.scale, endScale, eased);
  }, [progress, assemblyStart]);

  // Fade the artwork in as the frame assembles
  const groupOpacity = Math.min(progress * 2, 1);

  return (
    <group ref={groupRef}>
      {/* ── Artwork plane ──────────────────────────────────────────────── */}
      {/* Displays the composited canvas texture with crossfading images */}
      <mesh>
        <planeGeometry args={[FRAME_WIDTH, FRAME_HEIGHT]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={groupOpacity}
          toneMapped={false}
        />
      </mesh>

      {/* ── Glass reflection overlay ──────────────────────────────────── */}
      {/* Positioned a hair in front of the artwork to prevent z-fighting.
          Uses a diagonal gradient map and a physically-based material for
          a subtle glass-like sheen. */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[FRAME_WIDTH, FRAME_HEIGHT]} />
        <meshPhysicalMaterial
          map={gradientTexture}
          transparent
          opacity={0.12 * groupOpacity}
          metalness={0.0}
          roughness={0.1}
          side={THREE.DoubleSide}
          envMapIntensity={0.2}
          clearcoat={0.05}
          clearcoatRoughness={0.4}
        />
      </mesh>
    </group>
  );
}

// ─── Corner Glow Points ──────────────────────────────────────────────────────

const cornerPositions: [number, number, number][] = [
  [-HW, HH, BAR_DEPTH / 2],
  [HW, HH, BAR_DEPTH / 2],
  [-HW, -HH, BAR_DEPTH / 2],
  [HW, -HH, BAR_DEPTH / 2],
];

function CornerGlow({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Fade in as the frame assembles
  const glowOpacity = Math.min(progress * 1.5, 0.9);

  // Gentle pulse based on progress so it subtly breathes
  const pulse = 0.85 + 0.15 * Math.sin(progress * Math.PI * 6);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {cornerPositions.map((pos, i) => (
        <mesh key={i} position={new THREE.Vector3(...pos)}>
          <sphereGeometry args={[0.04 * pulse, 8, 8]} />
          <meshPhysicalMaterial
            color={CORNER_GLOW_COLOR}
            emissive={CORNER_GLOW_COLOR}
            emissiveIntensity={1.2 * glowOpacity}
            transparent
            opacity={glowOpacity}
            metalness={0.0}
            roughness={0.2}
          />
        </mesh>
      ))}
    </mesh>
  );
}

// ─── Particles ───────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 70;
const PARTICLE_SPREAD = 5;

function ParticleField({ progress }: { progress: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const posArr = new Float32Array(PARTICLE_COUNT * 3);
    const sizeArr = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 1.5 + Math.random() * (PARTICLE_SPREAD - 1.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      posArr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      posArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      posArr[i * 3 + 2] = r * Math.cos(phi);
      sizeArr[i] = 0.02 + Math.random() * 0.04;
    }
    return [posArr, sizeArr];
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

  // Particle opacity fades in as the scene assembles
  const particleOpacity = Math.min(progress * 2, 0.6);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#d4a838"
        size={0.04}
        transparent
        opacity={particleOpacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({ progress }: { progress: number }) {
  const pieceStates = useMemo(
    () => buildPieceConfigs().map((cfg) => buildPieceState(cfg)),
    // Intentionally empty — we want random seeds to stay fixed for the
    // lifetime of the component instance, even though the progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.5} />

      {/* Key light from upper right */}
      <directionalLight position={[3, 4, 5]} intensity={1.4} />

      {/* Fill light from lower left */}
      <directionalLight position={[-3, -2, 2]} intensity={0.5} />

      {/* Rim light from behind */}
      <directionalLight position={[0, 2, -5]} intensity={0.4} />

      {/* Frame pieces — bars + outermost glass sheet */}
      {pieceStates.map((state, i) => (
        <FramePiece key={i} state={state} progress={progress} />
      ))}

      {/* Artwork display with cycling images and glass reflection overlay */}
      <ArtworkDisplay progress={progress} />

      {/* Corner glow points */}
      <CornerGlow progress={progress} />

      {/* Floating particles */}
      <ParticleField progress={progress} />

      {/* Orbit controls — user-driven, no auto-rotate. Zoom is disabled so
          mouse-wheel over the canvas never dollies the camera and fights the
          scroll-driven assembly/disassembly (Lenis owns the wheel here). */}
      <OrbitControls
        autoRotate={false}
        enableZoom={false}
        enablePan={false}
      />
    </>
  );
}


// ─── Exported Component ───────────────────────────────────────────────────────

interface HeroAssemblyProps {
  /** Scroll progress from 0 (scattered) to 1 (assembled) */
  progress: number;
}

export default function HeroAssembly({ progress }: HeroAssemblyProps) {
  // Clamp progress to [0, 1]
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="w-full h-full"
      style={{ backgroundColor: isDark ? 'transparent' : '#faf6ed' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene progress={clampedProgress} />
      </Canvas>
    </div>
  );
}
