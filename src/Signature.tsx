import { useEffect, useRef, useState } from 'react';

const HANDLES = ['ro', 'frgmt0', 'ro_dawoof'] as const;
const HOLD_MS = 3200;
const SCRAMBLE_MS = 760;
const GLYPHS = '!<>-_\\/[]{}—=+*^?#________0123456789abcdef';

/**
 * Scrambling, channel-offset signature.
 * Cycles through the active handle set with a per-character decode pass.
 * Three stacked color channels (cream / orange / sea-green) sit at offsets
 * that drift with scroll `t` to feel like a misregistered print.
 *
 * `t` is the same world-time signal driving the curve scroll, so signature
 * drift stays in lockstep with the rest of the page.
 */
type Props = { t: number };

export default function Signature({ t }: Props) {
  const [text, setText] = useState<string>(HANDLES[0]);
  const idxRef = useRef(0);
  const queueRef = useRef<{
    from: string;
    to: string;
    start: number;
    chars: Array<{ from: string; to: string; ready: number }>;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

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

  // Drift derived from world t — channels separate as you scroll.
  const drift = Math.sin(t * 0.45) * 3 + Math.sin(t * 1.3) * 1.5;
  const driftY = Math.cos(t * 0.31) * 2.2;

  return (
    <div className="sig" aria-label={`handle: ${HANDLES[idxRef.current]}`}>
      <span
        className="sig-chan sig-chan--c"
        aria-hidden
        style={{ transform: `translate3d(${-drift}px, ${driftY}px, 0)` }}
      >
        {text}
      </span>
      <span
        className="sig-chan sig-chan--m"
        aria-hidden
        style={{ transform: `translate3d(${drift}px, ${-driftY}px, 0)` }}
      >
        {text}
      </span>
      <span className="sig-chan sig-chan--k">{text}</span>
      <span className="sig-cursor" aria-hidden>
        _
      </span>
    </div>
  );
}
