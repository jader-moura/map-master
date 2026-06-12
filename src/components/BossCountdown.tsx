"use client";

import { useEffect, useState } from "react";
import { getBossStatus, formatCountdown, type Boss } from "@/lib/gw2/bosses";

// Live next-spawn countdown for a single boss. Server-rendered content (schedule,
// location) carries the SEO weight; this is the interactive enhancement on top.
export default function BossCountdown({ boss }: { boss: Boss }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-7">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-9 w-48 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  const s = getBossStatus(boss, now);
  const localTime = s.spawn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const localDay = s.spawn.toLocaleDateString([], { weekday: "short" });

  return (
    <div
      className={
        "rounded-2xl border px-6 py-7 " +
        (s.active
          ? "border-emerald-400/40 bg-emerald-400/10"
          : "border-orange-400/30 bg-orange-400/[0.06]")
      }
      aria-live="polite"
    >
      {s.active ? (
        <>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">
            Active now
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">
            {formatCountdown(s.msActiveLeft)} <span className="text-lg font-medium text-white/60">left</span>
          </p>
          <p className="mt-2 text-sm text-white/55">
            {boss.name} is up. Get to the map now.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium uppercase tracking-wide text-orange-300">
            Next spawn in
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">
            {formatCountdown(s.msUntilSpawn)}
          </p>
          <p className="mt-2 text-sm text-white/55">
            At {localTime} ({localDay}) your local time.
          </p>
        </>
      )}
    </div>
  );
}
