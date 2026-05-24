import { useEffect, useRef } from 'react';

const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }
`;

// CMYK-misregistered halftone field over a drifting fbm.
// - Field: 4-octave value noise offset by (t, t·~0.4). Mouse adds a soft
//   radial attractor so dot density blooms locally.
// - Halftone: three angled cell-grids (K / C / M-as-accent) each rendered
//   as filled discs whose radius is driven by local tone. The K-grid is
//   the chassis; the offset grids create the misregistered print feel
//   without needing real channel compositing.
// - Vignette: subtle dot-product darkening at edges; no glow, no neon.
const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 u_res;
uniform float u_t;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_bg;
uniform vec3 u_fg;
uniform vec3 u_accent;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0;
  float amp = 0.55;
  for(int i = 0; i < 4; i++){
    v += amp * vnoise(p);
    p *= 2.07;
    amp *= 0.5;
  }
  return v;
}

float halftone(vec2 uv, float angle, float cell, float tone){
  float ca = cos(angle); float sa = sin(angle);
  vec2 r = vec2(uv.x * ca - uv.y * sa, uv.x * sa + uv.y * ca);
  vec2 inCell = fract(r / cell) - 0.5;
  float radius = clamp(tone, 0.0, 1.0) * 0.58;
  float d = length(inCell);
  return smoothstep(radius + 0.015, radius - 0.015, d);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.y;
  vec2 mouse = u_mouse / u_res.y;

  vec2 p = uv * 1.35
    + vec2(u_t * 0.18, u_t * 0.07)
    + vec2(u_time * 0.00003, u_time * 0.00002);
  float n = fbm(p);

  float mDist = distance(uv, mouse);
  float mAtt = smoothstep(0.45, 0.0, mDist) * 0.42;
  float tone = clamp(n + mAtt, 0.0, 1.0);

  // Cell sizes in normalized (y-aspect) coords. Larger cells = chunkier dots.
  float cellK = 9.5 / u_res.y;
  float cellC = 11.0 / u_res.y;
  float cellM = 14.0 / u_res.y;

  float k  = halftone(uv,                              0.00, cellK, pow(tone, 1.10));
  float c1 = halftone(uv + vec2(0.0009,  0.0007),      0.78, cellC, pow(tone, 1.35));
  float m  = halftone(uv - vec2(0.0007,  0.0008),     -0.52, cellM, pow(smoothstep(0.52, 0.86, tone), 1.4));

  vec3 col = u_bg;
  col = mix(col, u_fg,        k  * 0.28);
  col = mix(col, u_fg * 0.72, c1 * 0.18);
  col = mix(col, u_accent,    m  * 0.55);

  vec2 vUv = (gl_FragCoord.xy / u_res) - 0.5;
  float vig = 1.0 - dot(vUv, vUv) * 0.95;
  col *= vig;

  o = vec4(col, 1.0);
}
`;

type Props = { tRef: React.MutableRefObject<number> };

export default function DitherBackdrop({ tRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) {
      canvas.style.background = '#0a0a0b';
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uT = gl.getUniformLocation(prog, 'u_t');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uBg = gl.getUniformLocation(prog, 'u_bg');
    const uFg = gl.getUniformLocation(prog, 'u_fg');
    const uAccent = gl.getUniformLocation(prog, 'u_accent');

    // Off-black bg, warm bone fg, desaturated vermillion accent.
    gl.uniform3f(uBg, 0.039, 0.039, 0.043);
    gl.uniform3f(uFg, 0.945, 0.925, 0.878);
    gl.uniform3f(uAccent, 0.910, 0.329, 0.121);

    const RENDER_SCALE = 0.5;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.floor(window.innerWidth * dpr * RENDER_SCALE));
      const h = Math.max(2, Math.floor(window.innerHeight * dpr * RENDER_SCALE));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    // Throttle mouse via RAF — never on every move event.
    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const start = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      gl.uniform1f(uT, tRef.current);
      gl.uniform1f(uTime, now - start);
      const w = canvas.width;
      const h = canvas.height;
      gl.uniform2f(uMouse, mouseRef.current.x * w, mouseRef.current.y * h);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={canvasRef} className="dither" />;
}
