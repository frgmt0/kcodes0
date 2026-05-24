import { useEffect, useRef, useState } from 'react';

const HANDLES = ['ro', 'frgmt0', 'ro_dawoof'] as const;
const HOLD_MS = 3200;
const SCRAMBLE_MS = 760;
const GLYPHS = '!<>-_\\/[]{}—=+*^?#________0123456789abcdef';

// Melt energy below this is treated as "off" — filter is removed from the
// DOM via display:none so the browser skips feTurbulence entirely. The
// glitch spike always counts as active regardless of melt level.
const MELT_OFF_THRESHOLD = 0.012;

type Props = { tRef: React.MutableRefObject<number> };

export default function Signature({ tRef }: Props) {
  const [text, setText] = useState<string>(HANDLES[0]);
  const idxRef = useRef(0);
  const queueRef = useRef<{
    from: string;
    to: string;
    start: number;
    chars: Array<{ from: string; to: string; ready: number }>;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const sigRef = useRef<HTMLDivElement | null>(null);
  const meltStackRef = useRef<HTMLDivElement | null>(null);

  // Channel refs for imperative drift updates — avoids re-rendering
  // Signature on every parent t-tick.
  const sharpCRef = useRef<HTMLSpanElement | null>(null);
  const sharpMRef = useRef<HTMLSpanElement | null>(null);
  const meltCRef = useRef<HTMLSpanElement | null>(null);
  const meltMRef = useRef<HTMLSpanElement | null>(null);

  // Cursor tracking in .sig local coords.
  const mouseTarget = useRef({ x: 0, y: 0, inside: false });
  const mousePos = useRef({ x: 0, y: 0 });
  const wasInsideRef = useRef(false);

  const meltTarget = useRef(0);
  const meltCurrent = useRef(0);
  const glitchStartRef = useRef(0);
  const meltActiveRef = useRef(false);

  // SVG filter primitive refs.
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement | null>(null);
  const matrixRef = useRef<SVGFEColorMatrixElement | null>(null);
  const offsetRef = useRef<SVGFEOffsetElement | null>(null);

  const filterRafRef = useRef<number | null>(null);

  useEffect(() => {
    let cycleTimer: ReturnType<typeof setTimeout>;

    const setScramble = (to: string) => {
      const from = text;
      const length = Math.max(from.length, to.length);
      const chars = [];
      for (let i = 0; i < length; i++) {
        const start = Math.floor((i / length) * (SCRAMBLE_MS * 0.5));
        const ready = start + 120 + Math.random() * (SCRAMBLE_MS * 0.45);
        chars.push({
          from: from[i] ?? '',
          to: to[i] ?? '',
          ready,
        });
      }
      queueRef.current = {
        from,
        to,
        start: performance.now(),
        chars,
      };
      tick();
    };

    const tick = () => {
      const q = queueRef.current;
      if (!q) return;
      const now = performance.now();
      const elapsed = now - q.start;
      let out = '';
      let done = true;
      for (let i = 0; i < q.chars.length; i++) {
        const c = q.chars[i];
        if (!c) continue;
        if (elapsed >= c.ready) {
          out += c.to;
        } else if (elapsed < 60) {
          out += c.from;
          done = false;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '·';
          done = false;
        }
      }
      setText(out);
      if (!done) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        queueRef.current = null;
      }
    };

    const advance = () => {
      idxRef.current = (idxRef.current + 1) % HANDLES.length;
      const next = HANDLES[idxRef.current] ?? HANDLES[0];
      setScramble(next);
      cycleTimer = setTimeout(advance, HOLD_MS + SCRAMBLE_MS);
    };

    cycleTimer = setTimeout(advance, HOLD_MS);

    return () => {
      clearTimeout(cycleTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Liquify + drift driver. All animation reads from refs and writes to
  // DOM directly — no React re-renders triggered per frame.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const NEAR_PAD = 40;

    const onMove = (e: PointerEvent) => {
      const el = sigRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside =
        x >= -NEAR_PAD &&
        y >= -NEAR_PAD &&
        x <= r.width + NEAR_PAD &&
        y <= r.height + NEAR_PAD;

      mouseTarget.current.x = x;
      mouseTarget.current.y = y;
      mouseTarget.current.inside = inside;

      if (inside && !wasInsideRef.current) {
        glitchStartRef.current = performance.now();
      }
      wasInsideRef.current = inside;

      meltTarget.current = inside ? 1 : 0;
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    if (reduce) {
      return () => window.removeEventListener('pointermove', onMove);
    }

    const setMeltActive = (active: boolean) => {
      if (active === meltActiveRef.current) return;
      meltActiveRef.current = active;
      const el = meltStackRef.current;
      if (!el) return;
      // display:none avoids paint AND filter computation while idle.
      // Switching back to '' restores the CSS-defined display value.
      el.style.display = active ? '' : 'none';
    };

    const drive = () => {
      const now = performance.now();

      const m =
        meltCurrent.current + (meltTarget.current - meltCurrent.current) * 0.08;
      meltCurrent.current = m;

      const gT = glitchStartRef.current;
      const glitchEnergy = gT ? Math.max(0, 1 - (now - gT) / 380) : 0;
      if (gT && glitchEnergy <= 0) glitchStartRef.current = 0;

      const active = m > MELT_OFF_THRESHOLD || glitchEnergy > 0;
      setMeltActive(active);

      // CMY channel drift from world t — applied directly to channel refs.
      // Amplified by melt so misregistration widens during heat.
      const t = tRef.current;
      const meltScale = 1 + m * 1.4;
      const drift =
        (Math.sin(t * 0.45) * 3 + Math.sin(t * 1.3) * 1.5) * meltScale;
      const driftY = Math.cos(t * 0.31) * 2.2 * meltScale;

      const sc = sharpCRef.current;
      const sm = sharpMRef.current;
      if (sc) sc.style.transform = `translate3d(${-drift}px, ${driftY}px, 0)`;
      if (sm) sm.style.transform = `translate3d(${drift}px, ${-driftY}px, 0)`;

      if (!active) {
        // Snap cursor to current target so the mask is correctly placed
        // the moment we reactivate.
        mousePos.current.x = mouseTarget.current.x;
        mousePos.current.y = mouseTarget.current.y;
        filterRafRef.current = requestAnimationFrame(drive);
        return;
      }

      // Active path — update mask + filter primitives.
      const mt = mouseTarget.current;
      const mp = mousePos.current;
      mp.x += (mt.x - mp.x) * 0.18;
      mp.y += (mt.y - mp.y) * 0.18;

      const el = sigRef.current;
      if (el) {
        el.style.setProperty('--hx', `${mp.x.toFixed(1)}px`);
        el.style.setProperty('--hy', `${mp.y.toFixed(1)}px`);
        el.style.setProperty('--melt', m.toFixed(3));
      }

      const mc = meltCRef.current;
      const mm = meltMRef.current;
      if (mc) mc.style.transform = `translate3d(${-drift}px, ${driftY}px, 0)`;
      if (mm) mm.style.transform = `translate3d(${drift}px, ${-driftY}px, 0)`;

      const time = now * 0.001;
      const baseFx = 0.012 + 0.003 * Math.sin(time * 0.6);
      const baseFy = 0.022 + 0.004 * Math.cos(time * 0.43);
      const fxJ = glitchEnergy * 0.05 * Math.sin(time * 72);
      const fyJ = glitchEnergy * 0.07 * Math.cos(time * 91);

      const fx = Math.max(0.001, baseFx + m * 0.004 + fxJ);
      const fy = Math.max(0.001, baseFy + m * 0.010 + fyJ);

      const scale = 2 + m * 38 + glitchEnergy * 26;
      const blur = m * 0.65;
      const sag = m * 0.32 + glitchEnergy * 0.06;
      const dripDy = m * 6 + glitchEnergy * 4;

      turbRef.current?.setAttribute(
        'baseFrequency',
        `${fx.toFixed(4)} ${fy.toFixed(4)}`
      );
      dispRef.current?.setAttribute('scale', scale.toFixed(2));
      blurRef.current?.setAttribute('stdDeviation', blur.toFixed(3));
      matrixRef.current?.setAttribute(
        'values',
        `1 0 0 0 0  0 1 0 0 ${sag.toFixed(3)}  0 0 1 0 0  0 0 0 1 0`
      );
      offsetRef.current?.setAttribute('dy', dripDy.toFixed(2));

      filterRafRef.current = requestAnimationFrame(drive);
    };
    filterRafRef.current = requestAnimationFrame(drive);

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (filterRafRef.current) cancelAnimationFrame(filterRafRef.current);
    };
  }, [tRef]);

  return (
    <>
      <svg className="sig-defs" aria-hidden width="0" height="0" focusable="false">
        <defs>
          <filter
            id="sig-liquify"
            x="-15%"
            y="-15%"
            width="130%"
            height="320%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.012 0.022"
              numOctaves="2"
              seed="2"
              result="turb"
            />
            <feColorMatrix
              ref={matrixRef}
              in="turb"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="biased"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="biased"
              scale="2"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warp"
            />
            <feOffset ref={offsetRef} in="warp" dx="0" dy="0" result="dripped" />
            <feGaussianBlur ref={blurRef} in="dripped" stdDeviation="0" />
          </filter>
        </defs>
      </svg>

      <div
        ref={sigRef}
        className="sig"
        aria-label={`handle: ${HANDLES[idxRef.current]}`}
      >
        <div className="sig-stack sig-stack--sharp">
          <span ref={sharpCRef} className="sig-chan sig-chan--c" aria-hidden>
            {text}
          </span>
          <span ref={sharpMRef} className="sig-chan sig-chan--m" aria-hidden>
            {text}
          </span>
          <span className="sig-chan sig-chan--k">{text}</span>
          <span className="sig-cursor" aria-hidden>
            _
          </span>
        </div>

        <div
          ref={meltStackRef}
          className="sig-stack sig-stack--melt"
          aria-hidden
          style={{ display: 'none' }}
        >
          <span ref={meltCRef} className="sig-chan sig-chan--c">
            {text}
          </span>
          <span ref={meltMRef} className="sig-chan sig-chan--m">
            {text}
          </span>
          <span className="sig-chan sig-chan--k">{text}</span>
        </div>
      </div>
    </>
  );
}
