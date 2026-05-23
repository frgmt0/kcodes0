import { useEffect, useState } from 'react';

const PAD = (n: number, w = 2) => String(n).padStart(w, '0');

function useClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type HudProps = {
  t: number;
  total: number;
  focusIdx: number;
  focusName: string | null;
};

export function TopBar({ t, total, focusIdx }: Omit<HudProps, 'focusName'>) {
  const now = useClock();
  const hh = PAD(now.getUTCHours());
  const mm = PAD(now.getUTCMinutes());
  const ss = PAD(now.getUTCSeconds());

  const progress = total > 0 ? ((focusIdx + 1) / total) * 100 : 0;
  const tFmt = t.toFixed(3);

  return (
    <header className="hud-top" aria-label="status bar">
      <div className="hud-cell hud-cell--left">
        <span className="hud-dot" aria-hidden />
        <span className="hud-label">tx</span>
        <span className="hud-sep">/</span>
        <span className="hud-value">live</span>
        <span className="hud-sep">·</span>
        <span className="hud-value hud-value--strong">ro_dawoof</span>
        <span className="hud-sep">/</span>
        <span className="hud-label">ch.07</span>
      </div>

      <div className="hud-cell hud-cell--center" aria-hidden>
        <span className="hud-mark" />
        <span className="hud-time">{hh}:{mm}:{ss}</span>
        <span className="hud-sep">utc</span>
        <span className="hud-sep">·</span>
        <span className="hud-value">Δt</span>
        <span className="hud-value hud-value--num">{tFmt}</span>
        <span className="hud-mark" />
      </div>

      <div className="hud-cell hud-cell--right">
        <span className="hud-label">specimen</span>
        <span className="hud-value hud-value--num">
          {PAD(focusIdx + 1)} / {PAD(total)}
        </span>
        <span className="hud-progress" aria-hidden>
          <span
            className="hud-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </span>
      </div>
    </header>
  );
}

const RAIL_CHARS = '!<>-_/[]{}=+*^?# 0123456789·ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function railString(seed: number, len: number) {
  let s = '';
  let x = Math.floor(seed * 1e6);
  for (let i = 0; i < len; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    s += RAIL_CHARS[x % RAIL_CHARS.length];
  }
  return s;
}

export function LeftRail({ t }: { t: number }) {
  // Recompute the strip slowly with t — feels like ticker tape moving past.
  const s = railString(Math.floor(t * 4) * 0.0001, 110);
  return (
    <aside className="hud-rail hud-rail--left" aria-hidden>
      <div className="hud-rail-cap">
        <span className="hud-rail-tag">RAIL_A</span>
        <span className="hud-rail-bar" />
      </div>
      <div className="hud-rail-strip">{s}</div>
      <div className="hud-rail-foot">
        <span className="hud-rail-tag">END</span>
      </div>
    </aside>
  );
}

export function RightRail({ focusName, focusIdx, total }: Omit<HudProps, 't'>) {
  const safeName = focusName ?? '—';
  return (
    <aside className="hud-rail hud-rail--right" aria-hidden>
      <div className="hud-rail-cap">
        <span className="hud-rail-tag">FOCUS</span>
        <span className="hud-rail-bar" />
      </div>
      <div className="hud-rail-focus">
        <span className="hud-rail-num">{PAD(focusIdx + 1)}/{PAD(total)}</span>
        <span className="hud-rail-name">{safeName}</span>
      </div>
      <div className="hud-rail-foot">
        <span className="hud-rail-tag">REC</span>
      </div>
    </aside>
  );
}

export function Marquee() {
  // One row of fragments duplicated; CSS animates -50% to loop seamlessly.
  const frag = (
    <>
      <span>ro_dawoof</span>
      <em>◇</em>
      <span>frgmt0</span>
      <em>◇</em>
      <span>ro</span>
      <em>◇</em>
      <span>transmission_07</span>
      <em>◇</em>
      <span>specimens.archive</span>
      <em>◇</em>
      <span>last_pushed</span>
      <em>◇</em>
    </>
  );
  return (
    <div className="hud-marquee" aria-hidden>
      <div className="hud-marquee-track">
        {frag}
        {frag}
        {frag}
        {frag}
      </div>
    </div>
  );
}

export default function HUD(props: HudProps) {
  return (
    <>
      <TopBar t={props.t} total={props.total} focusIdx={props.focusIdx} />
      <LeftRail t={props.t} />
      <RightRail
        focusName={props.focusName}
        focusIdx={props.focusIdx}
        total={props.total}
      />
      <Marquee />
    </>
  );
}
