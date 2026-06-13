"use client";

import { useEffect, useState } from "react";

// Upcoming spawn clock times in the visitor's local timezone, derived from the
// boss's UTC schedule. Client-only because it depends on "now" + local tz.
export default function BossNextSpawns({ times, count = 4 }: { times: string[]; count?: number }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;

  const DAY = 86_400_000;
  const upcoming: Date[] = [];
  for (const time of times) {
    const [h, m] = time.split(":").map(Number);
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m);
    for (const ms of [today, today + DAY]) {
      if (ms > now.getTime()) upcoming.push(new Date(ms));
    }
  }
  upcoming.sort((a, b) => a.getTime() - b.getTime());
  const next = upcoming.slice(0, count);
  if (!next.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((d, i) => (
        <span
          key={d.getTime()}
          className={
            "rounded-lg border px-3 py-1.5 text-sm tabular-nums " +
            (i === 0
              ? "border-orange-400/40 bg-orange-400/10 text-orange-200"
              : "border-white/10 bg-white/[0.03] text-white/75")
          }
        >
          {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <span className="ml-1.5 text-xs text-white/40">
            {d.toLocaleDateString([], { weekday: "short" })}
          </span>
        </span>
      ))}
    </div>
  );
}
