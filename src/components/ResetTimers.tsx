"use client";

import { useEffect, useState } from "react";

// Guild Wars 2 reset schedule (all UTC). Daily = every day 00:00; weekly =
// Monday 07:30; WvW matchups reset Friday 18:00 (EU) / Saturday 02:00 (NA).
type Reset = {
  id: string;
  label: string;
  blurb: string;
  /** UTC day of week (0=Sun..6=Sat), or null for a daily reset. */
  dow: number | null;
  h: number;
  m: number;
};

const RESETS: Reset[] = [
  {
    id: "daily",
    label: "Daily reset",
    blurb:
      "Daily achievements, Wizard's Vault daily objectives, the daily login reward, daily fractals and karma/vendor stock all refresh.",
    dow: null,
    h: 0,
    m: 0,
  },
  {
    id: "weekly",
    label: "Weekly reset",
    blurb:
      "Wizard's Vault weekly objectives, weekly raid, strike and fractal clears, and weekly vendor caps reset.",
    dow: 1,
    h: 7,
    m: 30,
  },
  {
    id: "wvw-na",
    label: "WvW reset (NA)",
    blurb: "North American World vs World weekly matchups reset.",
    dow: 6,
    h: 2,
    m: 0,
  },
  {
    id: "wvw-eu",
    label: "WvW reset (EU)",
    blurb: "European World vs World weekly matchups reset.",
    dow: 5,
    h: 18,
    m: 0,
  },
];

const DAY = 86_400_000;

function nextOccurrence(now: Date, r: Reset): Date {
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), r.h, r.m);
  if (r.dow === null) {
    return new Date(base > now.getTime() ? base : base + DAY);
  }
  const curDow = new Date(base).getUTCDay();
  let candidate = base + ((r.dow - curDow + 7) % 7) * DAY;
  if (candidate <= now.getTime()) candidate += 7 * DAY;
  return new Date(candidate);
}

function fmt(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  return `${m}m ${pad(s)}s`;
}

export default function ResetTimers() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {RESETS.map((r) => {
        const next = now ? nextOccurrence(now, r) : null;
        return (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{r.label}</h2>
              <span className="text-xs text-white/40">
                {r.dow === null
                  ? `${String(r.h).padStart(2, "0")}:${String(r.m).padStart(2, "0")} UTC daily`
                  : `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][r.dow]} ${String(r.h).padStart(2, "0")}:${String(r.m).padStart(2, "0")} UTC`}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-orange-300">
              {next ? fmt(next.getTime() - now!.getTime()) : "—"}
            </p>
            {next && (
              <p className="mt-1 text-sm text-white/50">
                Next: {next.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })} local
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-white/55">{r.blurb}</p>
          </div>
        );
      })}
    </div>
  );
}
