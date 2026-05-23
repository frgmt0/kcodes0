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
  total: number;
  focusIdx: number;
  focusName: string | null;
};

/**
 * Small floating chip in the top-right corner. Replaces the previous
 * full-width top bar — just pulse indicator + UTC time + channel id.
 */
export function StatusChip() {
  const now = useClock();
  const hh = PAD(now.getUTCHours());
  const mm = PAD(now.getUTCMinutes());
  const ss = PAD(now.getUTCSeconds());

  return (
    <div className="chip" aria-label="status">
      <span className="chip-dot" aria-hidden />
      <span className="chip-label">tx</span>
      <span className="chip-sep">·</span>
      <span className="chip-time">{hh}:{mm}:{ss}</span>
      <span className="chip-sep">utc</span>
      <span className="chip-sep">·</span>
      <span className="chip-channel">ro_dawoof / ch.07</span>
    </div>
  );
}

/**
 * Vertical repo index running down the left edge. Each repo is a tick;
 * the focused tick is filled accent. The focused repo's name rotates
 * alongside the strip so the rail actually tells you where you are.
 */
export function LeftIndex({ total, focusIdx, focusName }: HudProps) {
  // Cap visible ticks so very long lists stay legible. If the user has
  // more repos than maxTicks we render a sampled subset, but always
  // anchor the focused position correctly within the strip height.
  const maxTicks = 36;
  const drawCount = Math.min(total, maxTicks);
  const focusRatio = total > 0 ? focusIdx / Math.max(1, total - 1) : 0;

  const ticks = Array.from({ length: drawCount }, (_, i) => {
    // For long lists, drawIdx corresponds to a fractional position in the
    // real list. Highlight the tick closest to the actual focused index.
    const realIdx = total > drawCount
      ? Math.round((i / Math.max(1, drawCount - 1)) * (total - 1))
      : i;
    const isFocus = realIdx === focusIdx;
    return { i, isFocus };
  });

  return (
    <aside className="rail" aria-label="repo index">
      <div className="rail-cap">
        <span className="rail-tag">INDEX</span>
        <span className="rail-bar" />
      </div>

      <div className="rail-ticks" aria-hidden>
        {ticks.map((t) => (
          <span
            key={t.i}
            className={`rail-tick${t.isFocus ? ' is-focus' : ''}`}
          />
        ))}
      </div>

      <div className="rail-focus" aria-hidden>
        <span className="rail-focus-num">
          {PAD(focusIdx + 1)}/{PAD(total)}
        </span>
        {focusName && (
          <span className="rail-focus-name">{focusName}</span>
        )}
      </div>

      <div className="rail-foot">
        <span className="rail-foot-bar" aria-hidden style={{ height: `${focusRatio * 100}%` }} />
        <span className="rail-tag">N={PAD(total)}</span>
      </div>
    </aside>
  );
}

export default function HUD(props: HudProps) {
  return (
    <>
      <StatusChip />
      <LeftIndex
        total={props.total}
        focusIdx={props.focusIdx}
        focusName={props.focusName}
      />
    </>
  );
}
