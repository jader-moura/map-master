"use client";

import { useEffect, useState } from "react";
import { getMetaStatus, type MetaEvent } from "@/lib/gw2/events";
import { formatCountdown } from "@/lib/gw2/bosses";

// Live next-start countdown for a meta event. The static schedule + location on
// the page carry the SEO weight; this is the interactive enhancement.
export default function MetaCountdown({ event }: { event: MetaEvent }) {
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

  const s = getMetaStatus(event, now);
  if (!s) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-7 text-sm text-white/50">
        Schedule unavailable right now.
      </div>
    );
  }

  const localTime = s.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">Active now</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">
            {formatCountdown(s.msUntil)} <span className="text-lg font-medium text-white/60">left</span>
          </p>
          <p className="mt-2 text-sm text-white/55">{s.eventName} is running. Get to {s.map} now.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium uppercase tracking-wide text-orange-300">Next event in</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">{formatCountdown(s.msUntil)}</p>
          <p className="mt-2 text-sm text-white/55">
            {s.eventName} at {localTime} your local time.
          </p>
        </>
      )}
    </div>
  );
}
