"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";

/**
 * Gold-leaf page transition. Uses gl-transitions' CrossWarp shader, inlined so
 * the 860KB transition index never enters the bundle. Two procedural gradient
 * textures (walnut ↔ gold) make the warp read as a polished metal sweep that
 * matches the Kala Bazaar identity. WebGL is optional — no WebGL, no overlay.
 */

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
uniform float ratio;
varying vec2 v_uv;

vec4 getFromColor(vec2 uv) { return texture2D(from, uv); }
vec4 getToColor(vec2 uv) { return texture2D(to, uv); }

// gl-transitions: CrossWarp (MIT, Eke Péter)
vec4 transition(vec2 p) {
  float x = progress;
  x = smoothstep(0.0, 1.0, (x * 2.0 + p.x - 1.0));
  return mix(getFromColor((p - 0.5) * (1.0 - x) + 0.5), getToColor((p - 0.5) * x + 0.5), x);
}

void main() { gl_FragColor = transition(v_uv); }
`;

function gradientTexture(gl: WebGLRenderingContext, reverse: boolean) {
  const tex = gl.createTexture();
  const px = new Uint8Array(64 * 4);
  for (let i = 0; i < 64; i++) {
    const t = i / 63;
    const warm = reverse ? 1 - t : t;
    px[i * 4 + 0] = Math.round(26 + warm * 187); // walnut → gold
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
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduce || first.current) {
      first.current = false;
      return;
    }
    setActive(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
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
    const duration = 620;
    const draw = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      gl.uniform1f(progressLoc, eased);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, from);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, to);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (p < 1) raf = requestAnimationFrame(draw);
      else setActive(false);
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
      className={`pointer-events-none fixed inset-0 z-[100] h-screen w-screen mix-blend-screen transition-opacity duration-300 ${
        active ? "opacity-80" : "opacity-0"
      }`}
    />
  );
}
