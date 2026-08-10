"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { useTranslations } from "next-intl";
import { Rotate3d } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   The Curator's Room — a private viewing gallery in 3D.

   A dim, minimalist room with a single gold-framed artwork on the back wall,
   lit by a warm spotlight from above. The artwork crossfades on the same
   cycle the 2D hero uses. The camera drifts slowly, follows the pointer with
   a spring-like feel, and inches closer to the piece as the user scrolls.
   ──────────────────────────────────────────────────────────────────────────── */

// ── Scene constants ──────────────────────────────────────────────────────────

const ROOM = { width: 14, height: 9, depth: 11, floorY: -2.55, wallZ: -4.1 };

// Frame (world units). Opening is the window the mat sits in.
const OPEN_W = 2.5;
const OPEN_H = 3.3;
const BAR = 0.17; // frame bar thickness
const DEPTH = 0.24; // frame depth
const ART_W = 1.98; // artwork opening (inside the ivory mat)
const ART_H = 2.78;

const GOLD = "#d4a838";
const CREAM = "#f2ead8";

const FRAME_X = 0;
const FRAME_Y = 0.55;
// The display floats 1.65 in front of the wall so it can spin a full 180°
// without its corners ever touching the wall — the back artwork is visible
// face-on when the visitor drags the piece around.
const FRAME_Z = ROOM.wallZ + DEPTH / 2 + 1.65;

const FADE_SECONDS = 1.3;

// ── Turntable drag state ─────────────────────────────────────────────────────
const MAX_TILT = 0.15; // vertical drag tilt — kept small so corners clear the wall
const DRAG_SPEED = 0.007; // radians per pixel of horizontal drag

type DragState = {
  active: boolean;
  lastX: number;
  lastY: number;
  rotY: number;
  rotX: number;
  velY: number;
  velX: number;
  settle: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clampRad = (v: number) => clamp(v, -Math.PI, Math.PI);

// Warm light pool that falls on the wall behind the frame.
function useLightPoolTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    grad.addColorStop(0, "rgba(255, 214, 150, 0.55)");
    grad.addColorStop(0.45, "rgba(255, 205, 140, 0.18)");
    grad.addColorStop(1, "rgba(255, 205, 140, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);
}

// Subtle plaster / gallery-wall texture (procedural speckle).
function usePlasterTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1c1814";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const v = 26 + Math.random() * 22;
      const c = Math.round(v);
      ctx.fillStyle = `rgba(${c}, ${c - 2}, ${c - 4}, ${0.35 + Math.random() * 0.3})`;
      ctx.fillRect(x, y, 1, 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }, []);
}

// Diagonal glass-reflection sheen used over the artwork.
function useGlassSheenTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(512, 0, 0, 512);
    grad.addColorStop(0, "rgba(255,255,255,0.5)");
    grad.addColorStop(0.16, "rgba(255,255,255,0.16)");
    grad.addColorStop(0.42, "rgba(255,255,255,0.02)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

// Soft volumetric hint: a faint cone of light from above onto the frame.
function LightCone() {
  const coneRef = useRef<THREE.Mesh>(null);

  const gradient = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "rgba(255, 224, 168, 0)");
    grad.addColorStop(1, "rgba(255, 214, 150, 0.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!coneRef.current) return;
    const t = state.clock.elapsedTime;
    (coneRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.05 + Math.sin(t * 0.6) * 0.015;
  });

  return (
    <mesh ref={coneRef} position={[FRAME_X, 3.1, FRAME_Z]} rotation-x={Math.PI}>
      <coneGeometry args={[1.45, 4.4, 40, 1, true]} />
      <meshBasicMaterial
        map={gradient}
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ── Artwork with crossfade ──────────────────────────────────────────────────
   Two planes: the current piece and the incoming piece. A useFrame loop ramps
   a 0→1 blend whenever the `index` prop changes, then swaps the "current".
   When `back` is set the planes render double-sided so the piece is visible
   from behind the frame too. */
function CrossfadeArtwork({
  items,
  index,
  back = false,
}: {
  items: { id: number; image: string }[];
  index: number;
  back?: boolean;
}) {
  const [shownIndex, setShownIndex] = useState(index);
  const currentMat = useRef<THREE.MeshBasicMaterial>(null);
  const nextMat = useRef<THREE.MeshBasicMaterial>(null);
  const targetRef = useRef(index);
  const t = useRef(0);
  const cache = useRef<Map<string, THREE.Texture>>(new Map());

  const loadTexture = (url: string) => {
    let tex = cache.current.get(url);
    if (!tex) {
      tex = new THREE.TextureLoader().load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      cache.current.set(url, tex);
    }
    return tex;
  };

  const currentUrl = items[shownIndex]?.image;
  const nextUrl = items[index]?.image;

  useFrame((_, delta) => {
    if (index !== shownIndex) {
      if (targetRef.current !== index) {
        targetRef.current = index;
        t.current = 0;
      }
      t.current = Math.min(1, t.current + delta / FADE_SECONDS);
      if (t.current >= 1) {
        setShownIndex(index);
      }
    } else {
      targetRef.current = index;
      t.current = 0;
    }
    if (currentMat.current) currentMat.current.opacity = 1 - t.current;
    if (nextMat.current) nextMat.current.opacity = t.current;
  });

  return (
    <group
      position={[0, 0, back ? -DEPTH / 2 + 0.02 : DEPTH / 2 - 0.02]}
      rotation-y={back ? Math.PI : 0}
    >
      {/* Backing board behind the artwork */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[OPEN_W, OPEN_H]} />
        <meshBasicMaterial color="#0a0705" side={back ? THREE.DoubleSide : THREE.FrontSide} />
      </mesh>

      {/* Current artwork */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[ART_W, ART_H]} />
        <meshBasicMaterial
          ref={currentMat}
          map={currentUrl ? loadTexture(currentUrl) : undefined}
          transparent
          opacity={1}
          side={back ? THREE.DoubleSide : THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* Incoming artwork */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[ART_W, ART_H]} />
        <meshBasicMaterial
          ref={nextMat}
          map={nextUrl ? loadTexture(nextUrl) : undefined}
          transparent
          opacity={0}
          side={back ? THREE.DoubleSide : THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ── The gold frame (bars + ivory mat + glass sheen) ─────────────────────── */

function GoldFrame() {
  const glassSheen = useGlassSheenTexture();

  const barMaterial = useMemo(
    () => ({
      color: GOLD,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.9,
    }),
    []
  );

  const W = OPEN_W + BAR * 2;
  const H = OPEN_H + BAR * 2;
  const topY = OPEN_H / 2 + BAR / 2;
  const bottomY = -OPEN_H / 2 - BAR / 2;
  const leftX = -OPEN_W / 2 - BAR / 2;
  const rightX = OPEN_W / 2 + BAR / 2;

  return (
    <group position={[0, 0, 0]}>
      {/* Frame bars */}
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[W, BAR, DEPTH]} />
        <meshPhysicalMaterial {...barMaterial} />
      </mesh>
      <mesh position={[0, bottomY, 0]}>
        <boxGeometry args={[W, BAR, DEPTH]} />
        <meshPhysicalMaterial {...barMaterial} />
      </mesh>
      <mesh position={[leftX, 0, 0]}>
        <boxGeometry args={[BAR, H, DEPTH]} />
        <meshPhysicalMaterial {...barMaterial} />
      </mesh>
      <mesh position={[rightX, 0, 0]}>
        <boxGeometry args={[BAR, H, DEPTH]} />
        <meshPhysicalMaterial {...barMaterial} />
      </mesh>

      {/* Inner gold fillet — thin strips just inside the bars, in front of the mat */}
      {[
        { position: [0, OPEN_H / 2 + 0.02, 0.012], size: [OPEN_W - 0.12, 0.05, 0.02] },
        { position: [0, -OPEN_H / 2 - 0.02, 0.012], size: [OPEN_W - 0.12, 0.05, 0.02] },
        { position: [-(OPEN_W / 2 - 0.02), 0, 0.012], size: [0.05, OPEN_H - 0.12, 0.02] },
        { position: [OPEN_W / 2 - 0.02, 0, 0.012], size: [0.05, OPEN_H - 0.12, 0.02] },
      ].map((strip, i) => (
        <mesh key={`fillet-${i}`} position={strip.position as [number, number, number]}>
          <boxGeometry args={strip.size as [number, number, number]} />
          <meshPhysicalMaterial
            color="#bf9330"
            metalness={0.85}
            roughness={0.3}
            envMapIntensity={1}
          />
        </mesh>
      ))}

      {/* Ivory mat — four strips framing the artwork opening */}
      {[
        { position: [0, ART_H / 2 + 0.09, 0], size: [ART_W + 0.18, 0.18, 0.02] },
        { position: [0, -ART_H / 2 - 0.09, 0], size: [ART_W + 0.18, 0.18, 0.02] },
        { position: [-(ART_W / 2 + 0.09), 0, 0], size: [0.18, ART_H + 0.36, 0.02] },
        { position: [ART_W / 2 + 0.09, 0, 0], size: [0.18, ART_H + 0.36, 0.02] },
      ].map((strip, i) => (
        <mesh key={i} position={strip.position as [number, number, number]}>
          <boxGeometry args={strip.size as [number, number, number]} />
          <meshStandardMaterial color={CREAM} roughness={0.85} />
        </mesh>
      ))}

      {/* Glass sheen over the artwork */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[OPEN_W, OPEN_H]} />
        <meshBasicMaterial
          map={glassSheen}
          transparent
          opacity={0.14}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ── Brass floor stand ──────────────────────────────────────────────────────
   Grounds the floating display: a slim brass pole from the floor up to the
   frame's underside, like a gallery turntable plinth. */
function BrassStand() {
  const bottomY = FRAME_Y - OPEN_H / 2 - BAR; // frame underside
  const poleH = bottomY - ROOM.floorY;

  const brass = useMemo(
    () => ({ color: "#8f6b1f", metalness: 0.9, roughness: 0.32, envMapIntensity: 0.8 }),
    []
  );

  return (
    <group position={[FRAME_X, 0, FRAME_Z]}>
      {/* Slim pole */}
      <mesh position={[0, ROOM.floorY + poleH / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.05, poleH, 20]} />
        <meshPhysicalMaterial {...brass} />
      </mesh>
      {/* Floor base */}
      <mesh position={[0, ROOM.floorY + 0.02, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.04, 40]} />
        <meshPhysicalMaterial {...brass} />
      </mesh>
      {/* Mount plate under the frame */}
      <mesh position={[0, bottomY - 0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 28]} />
        <meshPhysicalMaterial {...brass} />
      </mesh>
    </group>
  );
}

/* ── The two-sided turntable display ────────────────────────────────────────
   Gold frame + artwork on the front AND the back. The visitor drags the
   scene to spin the display; on release it coasts with inertia, then settles
   onto whichever face is nearer — front or back. */
function FrameDisplay({
  items,
  index,
  drag,
}: {
  items: { id: number; image: string }[];
  index: number;
  drag: RefObject<DragState>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Offset the back by half the collection so the two faces never match.
  const backIndex = items.length ? (index + Math.floor(items.length / 2)) % items.length : index;  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const d = drag.current;
    const g = groupRef.current;
    const t = state.clock.elapsedTime;
    const k = 1 - Math.pow(0.001, delta);

    if (d.active) {
      // Fully user-controlled while dragging.
      g.rotation.y = d.rotY;
      g.rotation.x = d.rotX;
      return;
    }

    // Fling inertia after release — coast, then ease off.
    if (Math.abs(d.velY) > 0.0005 || Math.abs(d.velX) > 0.0005) {
      d.rotY = clampRad(d.rotY + d.velY);
      d.rotX = clamp(d.rotX + d.velX, -MAX_TILT, MAX_TILT);
      d.velY *= 0.94;
      d.velX *= 0.94;
      g.rotation.y = d.rotY;
      g.rotation.x = d.rotX;
      return;
    }

    // Settle onto the nearer face, with a faint idle sway on top.
    d.rotY += (d.settle - d.rotY) * k;
    d.rotX += (0 - d.rotX) * k;
    g.rotation.y = d.rotY + Math.sin(t * 0.28) * 0.05;
    g.rotation.x = d.rotX + Math.cos(t * 0.21) * 0.015;
  });

  return (
    <group ref={groupRef} position={[FRAME_X, FRAME_Y, FRAME_Z]}>
      <GoldFrame />
      <CrossfadeArtwork items={items} index={index} />
      {/* Back face — offset piece, double-sided so it reads from behind */}
      <CrossfadeArtwork items={items} index={backIndex} back />
    </group>
  );
}

/* ── Room ─────────────────────────────────────────────────────────────────── */

function Room() {
  const plaster = usePlasterTexture();
  const lightPool = useLightPoolTexture();

  const wallMaterial = useMemo(
    () => ({ color: "#171310", map: plaster, roughness: 0.92, metalness: 0 }),
    [plaster]
  );

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 0, ROOM.wallZ]}>
        <planeGeometry args={[ROOM.width, ROOM.height]} />
        <meshStandardMaterial {...wallMaterial} side={THREE.FrontSide} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-ROOM.width / 2, 0, ROOM.wallZ + ROOM.depth / 2]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[ROOM.depth, ROOM.height]} />
        <meshStandardMaterial color="#13100c" roughness={0.95} />
      </mesh>

      {/* Right wall */}
      <mesh position={[ROOM.width / 2, 0, ROOM.wallZ + ROOM.depth / 2]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[ROOM.depth, ROOM.height]} />
        <meshStandardMaterial color="#13100c" roughness={0.95} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, ROOM.floorY, ROOM.wallZ + ROOM.depth / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#0e0b08" roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Warm pool of light on the wall behind the frame */}
      <mesh position={[FRAME_X, FRAME_Y, ROOM.wallZ + 0.01]}>
        <planeGeometry args={[7, 8.4]} />
        <meshBasicMaterial
          map={lightPool}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ── Camera rig: pointer parallax + slow drift + scroll push-in ──────────── */

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const { camera, pointer } = useThree();
  const progressRef = useRef(0);

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      progressRef.current = v;
    });
    return () => unsub();
  }, [progress]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const driftX = Math.sin(t * 0.22) * 0.14;
    const driftY = Math.cos(t * 0.18) * 0.08;

    const targetZ = 5.4 - progressRef.current * 1.2;
    const targetX = pointer.x * 0.55 + driftX;
    const targetY = 0.3 + pointer.y * 0.3 + driftY;

    const k = 0.05;
    camera.position.x += (targetX - camera.position.x) * k;
    camera.position.y += (targetY - camera.position.y) * k;
    camera.position.z += (targetZ - camera.position.z) * k;
    camera.lookAt(FRAME_X, FRAME_Y, FRAME_Z);
  });

  return null;
}

/* ── Lights + environment ─────────────────────────────────────────────────── */

function Lights() {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.14} />
      {/* Gallery spotlight */}
      <spotLight
        ref={lightRef}
        position={[FRAME_X, 3.7, 0.4]}
        angle={0.52}
        penumbra={0.6}
        intensity={280}
        distance={16}
        decay={1.5}
        color="#ffe1ad"
      />
      {/* Warm fill from lower left */}
      <pointLight position={[-3.2, 0.6, 1.6]} intensity={22} decay={2} color="#ffd9a0" />
      {/* Warm counter-fill behind the display — keeps the back artwork
          readable when the frame is spun around */}
      <pointLight position={[0, FRAME_Y, FRAME_Z + 1.2]} intensity={10} decay={2} color="#ffcf8a" />
      {/* Cool, faint counter-light */}
      <pointLight position={[3.4, -0.3, 2]} intensity={7} decay={2} color="#cfd6ff" />

      {/* Target for the spotlight: the center of the frame */}
      <mesh ref={targetRef} position={[FRAME_X, FRAME_Y, FRAME_Z]} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>

      {/* Procedural environment — gives the gold a real metallic sheen */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} color="#fff2dc" />
        <Lightformer form="rect" intensity={1.1} position={[-4, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#ffd9a0" />
        <Lightformer form="rect" intensity={0.7} position={[4, -1, 3]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} color="#ffffff" />
      </Environment>
    </>
  );
}

/* ── Scene composition ────────────────────────────────────────────────────── */

function Scene({
  items,
  index,
  progress,
  drag,
}: {
  items: { id: number; image: string }[];
  index: number;
  progress: MotionValue<number>;
  drag: RefObject<DragState>;
}) {
  return (
    <>
      <Room />
      <BrassStand />
      <FrameDisplay items={items} index={index} drag={drag} />
      <LightCone />
      <Lights />
      <CameraRig progress={progress} />
    </>
  );
}

/* ── Exported component ───────────────────────────────────────────────────── */

export default function HeroScene3D({
  items,
  index,
  progress,
}: {
  items: { id: number; image: string }[];
  index: number;
  progress: MotionValue<number>;
}) {
  const t = useTranslations("hero");
  const dragRef = useRef<DragState>({
    active: false,
    lastX: 0,
    lastY: 0,
    rotY: 0,
    rotX: 0,
    velY: 0,
    velX: 0,
    settle: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(true);

  // Fade the "drag to rotate" hint after a while even without interaction —
  // the frame's idle sway still teases the second side.
  useEffect(() => {
    const id = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(id);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    d.active = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.velY = 0;
    d.velX = 0;
    setDragging(true);
    setHint(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.rotY = clampRad(d.rotY + dx * DRAG_SPEED);
    d.rotX = clamp(d.rotX + dy * 0.004, -MAX_TILT, MAX_TILT);
    d.velY = dx * DRAG_SPEED;
    d.velX = dy * 0.004;
  };

  const endDrag = () => {
    const d = dragRef.current;
    d.active = false;
    setDragging(false);
    // Settle onto the nearer side — front (0) or back (±π) — so the piece
    // always lands on a composed pose instead of an arbitrary angle.
    const candidates = [0, Math.PI, -Math.PI];
    d.settle = candidates.reduce((best, target) => {
      const diff = Math.abs(d.rotY - target);
      return diff < Math.abs(d.rotY - best) ? target : best;
    }, 0);
  };

  return (
    <div
      className="relative h-full w-full touch-pan-y select-none"
      style={{ cursor: dragging ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      <Canvas
        camera={{ position: [0.8, 0.3, 5.4], fov: 50 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene items={items} index={index} progress={progress} drag={dragRef} />
      </Canvas>

      {/* Drag hint — placed below the fixed navbar (top-right auth buttons
          sit at the very top), fades once the visitor grabs the piece */}
      {hint && (
        <div
          className="absolute top-24 right-5 z-10 flex items-center gap-2 rounded-full border px-3.5 py-2 backdrop-blur-sm"
          style={{ borderColor: "rgba(212,168,56,0.25)", backgroundColor: "rgba(10,8,6,0.45)" }}
        >
          <Rotate3d size={13} style={{ color: "#d4a838" }} />
          <span
            className="font-mono text-[8px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(212,168,56,0.85)" }}
          >
            {t("dragToRotate")}
          </span>
        </div>
      )}
    </div>
  );
}
