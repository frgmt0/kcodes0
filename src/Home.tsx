import { useEffect, useMemo, useRef, useState } from 'react';
import DitherBackdrop from './DitherBackdrop';
import Signature from './Signature';
import HUD from './components/HUD';

type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  pushed_at: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
};

const GH_USER = 'frgmt0';
const REFRESH_MS = 60_000;

// Quasi-periodic curve (two incommensurate sines per axis + forward drift).
// `drift * step` is sized larger than a card width so consecutive cards
// can never horizontally collide. Z is a separate slow wave so cards
// breathe through depth as the camera tracks past them.
const CURVE = {
  step: 1.45,
  drift: 980,

  fx: 1.0,
  fy: 0.666,
  scaleX: 340,
  scaleY: 360,
  px: 0,
  py: Math.PI / 2,

  hfx: 2.37,
  hfy: 1.71,
  harmX: 140,
  harmY: 150,
  hpx: 0.4,
  hpy: 1.2,

  fz1: 0.43, az1: 200, pz1: 1.7,
  fz2: 0.91, az2: 90,  pz2: 0.3,
};

function pathPos(t: number) {
  const x =
    Math.sin(CURVE.fx * t + CURVE.px) * CURVE.scaleX +
    Math.sin(CURVE.hfx * t + CURVE.hpx) * CURVE.harmX +
    t * CURVE.drift;
  const y =
    Math.cos(CURVE.fy * t + CURVE.py) * CURVE.scaleY +
    Math.sin(CURVE.hfy * t + CURVE.hpy) * CURVE.harmY;
  const z =
    Math.sin(CURVE.fz1 * t + CURVE.pz1) * CURVE.az1 +
    Math.cos(CURVE.fz2 * t + CURVE.pz2) * CURVE.az2;
  return { x, y, z };
}

function fmtWhen(iso: string): string {
  const t = new Date(iso).getTime();
  const d = (Date.now() - t) / 1000;
  if (d < 60) return `${Math.floor(d)}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}d`;
  if (d < 86400 * 365) return `${Math.floor(d / (86400 * 30))}mo`;
  return `${Math.floor(d / (86400 * 365))}y`;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mod = (n: number, m: number) => ((n % m) + m) % m;

function thumbprintCells(name: string): number[] {
  const seedBase = (() => {
    let h = 2166136261;
    for (let i = 0; i < name.length; i++) {
      h ^= name.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  })();
  const cells: number[] = [];
  let x = seedBase || 1;
  for (let i = 0; i < 25; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    cells.push(x & 3);
  }
  return cells;
}

function Thumbprint({ name }: { name: string }) {
  const cells = useMemo(() => thumbprintCells(name), [name]);
  return (
    <div className="thumb" aria-hidden>
      {cells.map((v, i) => (
        <span key={i} className={`thumb-dot thumb-dot--${v}`} />
      ))}
    </div>
  );
}

export default function Home() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // t and parallax are refs only — no React state, no per-frame renders.
  // Cards and world transforms are updated imperatively in the RAF tick.
  const tRef = useRef(0);
  const targetT = useRef(0);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // focusIdx is the only animation-derived value that drives React renders
  // — used by HUD. Only sets state on transitions, not per frame.
  const [focusIdx, setFocusIdx] = useState(0);
  const focusIdxRef = useRef(0);

  const worldRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const cardFocusRefs = useRef<Array<boolean>>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed&type=owner`
        );
        if (!res.ok) throw new Error(`gh ${res.status}`);
        const data: Repo[] = await res.json();
        if (!alive) return;
        const filtered = data
          .filter((r) => !r.fork)
          .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
        setRepos(filtered);
        setError(null);
      } catch (e) {
        if (!alive) return;
        console.error('gh fetch failed', e);
        setError('uplink failure — retrying');
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Input listeners — all write to refs only. No setState in the hot path.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = 0.0026;
      targetT.current += (e.deltaY + e.deltaX) * k;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j' || e.key === 'l') {
        targetT.current += CURVE.step;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'k' || e.key === 'h') {
        targetT.current -= CURVE.step;
      } else if (e.key === 'Home') {
        targetT.current = 0;
      }
    };

    let touchY = 0;
    let touchX = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t0 = e.touches[0];
      if (!t0) return;
      touchY = t0.clientY;
      touchX = t0.clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t0 = e.touches[0];
      if (!t0) return;
      const dy = touchY - t0.clientY;
      const dx = touchX - t0.clientX;
      targetT.current += (dy + dx) * 0.007;
      touchY = t0.clientY;
      touchX = t0.clientX;
      e.preventDefault();
    };

    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('a, button')) return;
      dragging = true;
      dragX = e.clientX;
      dragY = e.clientY;
      document.body.classList.add('is-dragging');
    };
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onMove = (e: PointerEvent) => {
      if (!reduceMotion) {
        parallaxTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
        parallaxTarget.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }
      if (!dragging) return;
      const dx = dragX - e.clientX;
      const dy = dragY - e.clientY;
      targetT.current += (dx + dy) * 0.0028;
      dragX = e.clientX;
      dragY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      document.body.classList.remove('is-dragging');
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  // RAF tick — pure imperative DOM mutation. The only React state update
  // is setFocusIdx when the focused card actually changes (rare).
  useEffect(() => {
    if (!repos || repos.length === 0) return;
    const N = repos.length;
    const totalSpan = N * CURVE.step;
    const totalCards = 3 * N;

    cardRefs.current.length = totalCards;
    cardFocusRefs.current.length = totalCards;

    const tick = () => {
      tRef.current += (targetT.current - tRef.current) * 0.09;
      parallaxRef.current.x +=
        (parallaxTarget.current.x - parallaxRef.current.x) * 0.06;
      parallaxRef.current.y +=
        (parallaxTarget.current.y - parallaxRef.current.y) * 0.06;

      const t = tRef.current;
      const px = parallaxRef.current.x;
      const py = parallaxRef.current.y;
      const cam = pathPos(t);

      const w = worldRef.current;
      if (w) {
        w.style.transform = `rotateX(${(py * -3).toFixed(3)}deg) rotateY(${(px * 5).toFixed(3)}deg) translate3d(${(-cam.x).toFixed(2)}px, ${(-cam.y).toFixed(2)}px, 0)`;
      }

      const section = Math.floor((t + CURVE.step / 2) / totalSpan);

      for (let slot = 0; slot < totalCards; slot++) {
        const el = cardRefs.current[slot];
        if (!el) continue;
        const sIdx = Math.floor(slot / N);
        const i = slot % N;
        const sec = section - 1 + sIdx;
        const absIdx = sec * N + i;
        const ti = absIdx * CURVE.step;
        const p = pathPos(ti);
        const du = (ti - t) / CURVE.step;
        const absDu = du < 0 ? -du : du;
        const angle = clamp(du * 38, -78, 78);
        const baseOp = absDu > 3.2 ? 0 : clamp(1 - Math.pow(absDu / 3.2, 2), 0, 1);
        const depthFade = clamp(1 + Math.min(0, p.z) / 700, 0.62, 1);
        const opacity = baseOp * depthFade;
        const focused = absDu < 0.5;

        const s = el.style;
        s.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`;
        s.opacity = opacity.toFixed(3);
        s.pointerEvents = absDu > 1.5 ? 'none' : 'auto';

        if (focused !== cardFocusRefs.current[slot]) {
          cardFocusRefs.current[slot] = focused;
          el.classList.toggle('is-focus', focused);
        }
      }

      const focusAbs = Math.round(t / CURVE.step);
      const nextFocusIdx = mod(focusAbs, N);
      if (nextFocusIdx !== focusIdxRef.current) {
        focusIdxRef.current = nextFocusIdx;
        setFocusIdx(nextFocusIdx);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [repos]);

  // Card pool — rendered once per repos change. 3*N stable DOM nodes
  // whose transforms are mutated imperatively in the tick. Keys are
  // slot-based (not section-based) so React never tears them down.
  const cardPool = useMemo(() => {
    if (!repos || repos.length === 0) return null;
    const N = repos.length;
    return Array.from({ length: 3 * N }, (_, slot) => {
      const i = slot % N;
      const r = repos[i]!;
      return (
        <a
          key={`slot_${slot}`}
          ref={(el) => {
            cardRefs.current[slot] = el;
          }}
          className="card"
          href={r.html_url}
          target="_blank"
          rel="noreferrer"
          style={{ opacity: 0 }}
        >
          <span className="card-corners" aria-hidden>
            <span /><span /><span /><span />
          </span>

          <div className="card-head">
            <span className="card-spec">
              spec_{String(i + 1).padStart(2, '0')}
              <em>/</em>
              {String(N).padStart(2, '0')}
            </span>
            <span className="card-when">{fmtWhen(r.pushed_at)}</span>
          </div>

          <div className="card-body">
            <Thumbprint name={r.name} />
            <div className="card-titles">
              <div className="card-name" data-text={r.name}>{r.name}</div>
              {r.description && (
                <div className="card-desc">{r.description}</div>
              )}
            </div>
          </div>

          <div className="card-foot">
            <span className="card-foot-lang">
              <span className="card-pip" />
              {r.language ? r.language.toLowerCase() : 'none'}
            </span>
            <span className="card-foot-stars">
              {r.stargazers_count > 0 ? `★${r.stargazers_count}` : '—'}
            </span>
            <span
              className={`card-foot-status${r.archived ? ' is-archived' : ''}`}
            >
              {r.archived ? 'archived' : 'live'}
            </span>
          </div>
        </a>
      );
    });
  }, [repos]);

  const N = repos?.length ?? 0;
  const focusRepo = repos?.[focusIdx] ?? null;

  return (
    <div className="home">
      <DitherBackdrop tRef={tRef} />
      <div className="scanlines" aria-hidden />
      <div className="grain" aria-hidden />

      <HUD
        total={N}
        focusIdx={focusIdx}
        focusName={focusRepo?.name ?? null}
      />

      <Signature tRef={tRef} />

      <main className="stage" aria-label="repositories">
        <div ref={worldRef} className="world">
          {cardPool}
        </div>

        <div className="reticle" aria-hidden>
          <span className="r-tick r-tick--n" />
          <span className="r-tick r-tick--s" />
          <span className="r-tick r-tick--e" />
          <span className="r-tick r-tick--w" />
          <span className="r-dot" />
        </div>

        {error && !repos && (
          <div className="overlay-status" role="status">
            <span className="chip-dot chip-dot--err" /> {error}
          </div>
        )}
        {!error && !repos && (
          <div className="overlay-status" role="status">
            <span className="chip-dot" /> loading transmission
          </div>
        )}
      </main>
    </div>
  );
}
