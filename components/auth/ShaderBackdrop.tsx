"use client";

import * as React from "react";

const VERT = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

/**
 * Flowing data-stream field. The palette arrives as uniforms rather than being
 * hardcoded, so the backdrop tracks the design tokens instead of pinning a
 * literal blue that would fight the brand.
 */
const FRAG = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec3 u_accent;
uniform vec3 u_base;
varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  vec2 mouse = u_mouse / u_resolution;

  float flow = sin(uv.x * 10.0 + u_time * 0.5) * 0.1;
  float lines = smoothstep(0.48, 0.5, abs(fract(uv.y * 20.0 + flow + u_time * 0.2) - 0.5));

  float mask = lines * (1.0 - uv.x);
  vec3 color = mix(u_base, u_accent, mask * 0.35);

  float dist = length(uv - mouse);
  color += u_accent * (0.05 / (dist + 0.5));

  gl_FragColor = vec4(color, 1.0);
}`;

/** Reads a CSS custom property and returns it as linear-ish 0–1 RGB. */
function readColor(el: HTMLElement, prop: string, fallback: [number, number, number]) {
  const probe = document.createElement("span");
  probe.style.color = getComputedStyle(el).getPropertyValue(prop).trim();
  probe.style.display = "none";
  el.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  if (!rgb || rgb.length < 3) return fallback;
  return [Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255] as [
    number,
    number,
    number,
  ];
}

export function ShaderBackdrop({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // A perpetually animating full-bleed canvas is exactly what this setting is
    // for; fall back to the static gradient instead.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFailed(true);
      return;
    }

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      setFailed(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    // The source never checked compilation or link status — a driver quirk
    // produced a silently black panel with no way to tell why.
    if (!vs || !fs) {
      setFailed(true);
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const attr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uAccent = gl.getUniformLocation(program, "u_accent");
    const uBase = gl.getUniformLocation(program, "u_base");

    const accent = readColor(canvas.parentElement ?? canvas, "--brand", [0.02, 0.67, 0.45]);
    const base = readColor(canvas.parentElement ?? canvas, "--canvas", [0.04, 0.05, 0.09]);
    gl.uniform3fv(uAccent, accent);
    gl.uniform3fv(uBase, base);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const sync = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    sync();

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      mouse.y = (1 - (e.clientY - rect.top) / rect.height) * canvas.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let frame = 0;
    let running = true;
    const render = (t: number) => {
      if (!running) return;
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    // The source's rAF loop ran forever with no teardown. On a client-routed
    // app that leaks a GL context per visit until the browser drops the oldest.
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  if (failed) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background:
            "linear-gradient(160deg, var(--canvas), color-mix(in oklch, var(--brand) 18%, var(--canvas)))",
        }}
      />
    );
  }

  return <canvas ref={ref} aria-hidden className={className} />;
}
