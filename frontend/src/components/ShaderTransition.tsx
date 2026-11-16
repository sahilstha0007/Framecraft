"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";

/**
 * Gold-leaf page transitions using a small selection of gl-transitions
 * shaders, inlined so the 860KB package index never enters the bundle. Each
 * destination gets its own motion, all tinted walnut ↔ gold to match Kala
 * Bazaar. WebGL is optional — no WebGL, no overlay.
 */

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const SHADERS: Record<string, string> = {
  // gl-transitions: CrossWarp (MIT, Eke Péter)
  warp: `vec4 transition(vec2 p) {
    float x = smoothstep(0.0, 1.0, progress * 2.0 + p.x - 1.0);
    return mix(getFromColor((p - 0.5) * (1.0 - x) + 0.5), getToColor((p - 0.5) * x + 0.5), x);
  }`,
  // gl-transitions: Wind (MIT, gre)
  wind: `float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
  vec4 transition(vec2 uv) {
    float x = uv.x;
    float r = rand(vec2(0, uv.y));
    float m = smoothstep(0.0, -0.2, x * 0.8 + 0.2 * r - progress * 1.2);
    return mix(getFromColor(uv), getToColor(uv), m);
  }`,
  // gl-transitions: WindowBlinds (MIT, gre)
  blinds: `vec4 transition(vec2 uv) {
    float t = progress;
    if (mod(floor(uv.y * 100.0 * progress), 2.0) == 0.0) t *= 1.5;
    return mix(getFromColor(uv), getToColor(uv), mix(t, progress, smoothstep(0.8, 1.0, progress)));
  }`,
  // gl-transitions: VerticalOpen (MIT, gre)
  open: `vec4 transition(vec2 uv) {
    float regress = 1.0 - progress;
    float s = 2.0 - abs((uv.x - 0.5) / (regress - 1.0)) - 2.0 * regress;
    return mix(getFromColor(uv), getToColor(uv), smoothstep(0.0, 0.5, s));
  }`,
  fade: `vec4 transition(vec2 uv) {
    return mix(getFromColor(uv), getToColor(uv), progress);
  }`,
};

function shaderFor(path: string) {
  if (path.includes("/products")) return SHADERS.blinds;
  if (path.includes("/blog")) return SHADERS.wind;
  if (path.includes("/sellers")) return SHADERS.open;
  if (path.includes("/shop")) return SHADERS.warp;
  return SHADERS.fade;
}

function fragment(body: string) {
  return `
precision mediump float;
uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
uniform float ratio;
varying vec2 v_uv;
vec4 getFromColor(vec2 uv) { return texture2D(from, uv); }
vec4 getToColor(vec2 uv) { return texture2D(to, uv); }
${body}
void main() { gl_FragColor = transition(v_uv); }
`;
}

function gradientTexture(gl: WebGLRenderingContext, reverse: boolean) {
  const tex = gl.createTexture();
  const px = new Uint8Array(64 * 4);
  for (let i = 0; i < 64; i++) {
    const warm = reverse ? 1 - i / 63 : i / 63;
    px[i * 4 + 0] = Math.round(26 + warm * 187);
    px[i * 4 + 1] = Math.round(21 + warm * 147);
    px[i * 4 + 2] = Math.round(18 + warm * 38);
    px[i * 4 + 3] = 255;
  }
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

export default function ShaderTransition() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const first = useRef(true);
  const lastPath = useRef("");

  useEffect(() => {
    // A full locale reload remounts this component; the switcher leaves a
    // one-shot flag so the destination still plays the wind transition.
    let arrivedFromSwitch = false;
    let localeOnly = false;
    try {
      arrivedFromSwitch = sessionStorage.getItem("kalabazaar-locale-switch") === "1";
      if (arrivedFromSwitch) sessionStorage.removeItem("kalabazaar-locale-switch");
    } catch {}
    const bare = (p: string) => p.replace(/^\/(en|ne)(?=\/|$)/, "") || "/";
    localeOnly = arrivedFromSwitch || Boolean(lastPath.current && bare(lastPath.current) === bare(pathname));
    lastPath.current = pathname;
    if (reduce || (first.current && !localeOnly)) {
      first.current = false;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    // A language switch is a text swap, so use the gentlest wind wipe for it.
    const shader = localeOnly ? SHADERS.wind : shaderFor(pathname);
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment(shader)));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const pos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const from = gradientTexture(gl, false);
    const to = gradientTexture(gl, true);
    gl.uniform1i(gl.getUniformLocation(program, "from"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "to"), 1);
    gl.uniform1f(gl.getUniformLocation(program, "ratio"), canvas.width / canvas.height);
    const progressLoc = gl.getUniformLocation(program, "progress");

    let raf = 0;
    const start = performance.now();
    const duration = 520;
    const draw = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      // Fade the shader in/out so it never appears as a hard full-screen flash.
      gl.uniform1f(progressLoc, eased);
      const edge = Math.min(1, p * 6, (1 - p) * 6);
      canvas.style.opacity = String(0.28 * edge);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, from);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, to);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (p < 1) raf = requestAnimationFrame(draw);
      else canvas.style.opacity = "0";
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteTexture(from);
      gl.deleteTexture(to);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [pathname, reduce]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] h-screen w-screen mix-blend-screen opacity-0"
    />
  );
}
