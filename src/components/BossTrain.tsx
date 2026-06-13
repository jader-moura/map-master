"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CopyWaypoint from "@/components/CopyWaypoint";
import { Icon, P } from "@/components/icons";
import { BOSSES, BOSS_WAYPOINTS, formatCountdown } from "@/lib/gw2/bosses";

// "Boss train" planner. Given the next N minutes, work out which world bosses
// you can realistically chain. Because waypoint travel in GW2 is instant, the
// only constraint is that you can't be at two bosses whose active windows
// overlap, so this is the classic activity-selection problem: greedily take the
// boss that finishes earliest, which yields the maximum number you can attend.

const DAY_MS = 86_400_000;
const WINDOWS = [
  { label: "1 hour", min: 60 },
  { label: "2 hours", min: 120 },
  { label: "4 hours", min: 240 },
];

type Candidate = {
  id: string;
  name: string;
  zone: string;
  hardcore: boolean;
  waypoint?: string;
  start: number; // ms epoch
  end: number; // ms epoch
  inTrain: boolean;
};

function buildCandidates(now: Date, windowMin: number): Candidate[] {
  const nowMs = now.getTime();
  const horizon = nowMs + windowMin * 60_000;

  // Every spawn occurrence in [now-ish, horizon], across the day boundary.
  const raw: Omit<Candidate, "inTrain">[] = [];
  for (const b of BOSSES) {
    const durMs = b.durationMin * 60_000;
    for (const t of b.times) {
      const [h, m] = t.split(":").map(Number);
      const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m);
      for (const start of [today - DAY_MS, today, today + DAY_MS]) {
        const end = start + durMs;
        // catchable (not fully over) and starts before the horizon
        if (end > nowMs && start < horizon) {
          raw.push({ id: b.id, name: b.name, zone: b.zone, hardcore: b.hardcore, waypoint: BOSS_WAYPOINTS[b.id], start, end });
        }
      }
    }
  }

  // Greedy by earliest finish → maximum attendable set.
  const byFinish = [...raw].sort((a, b) => a.end - b.end || a.start - b.start);
  const chosen = new Set<Omit<Candidate, "inTrain">>();
  let lastEnd = -Infinity;
  for (const c of byFinish) {
    if (c.start >= lastEnd) {
      chosen.add(c);
      lastEnd = c.end;
    }
  }

  return raw
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((c) => ({ ...c, inTrain: chosen.has(c) }));
}

export default function BossTrain() {
  const [now, setNow] = useState<Date | null>(null);
  const [windowMin, setWindowMin] = useState(120);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const candidates = useMemo(
    () => (now ? buildCandidates(now, windowMin) : []),
    [now, windowMin],
  );
  const trainCount = candidates.filter((c) => c.inTrain).length;

  return (
    <div>
      {/* Window picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-white/50">Plan the next</span>
        {WINDOWS.map((w) => (
          <button
            key={w.min}
            type="button"
            onClick={() => setWindowMin(w.min)}
            className={[
              "rounded-lg border px-3 py-1.5 text-sm transition",
              windowMin === w.min
                ? "border-orange-400/50 bg-orange-400/15 text-orange-300"
                : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white",
            ].join(" ")}
          >
            {w.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-white/60">
        {now ? (
          trainCount > 0 ? (
            <>
              You can hit <span className="font-semibold text-orange-300">{trainCount}</span> world
              {trainCount === 1 ? " boss" : " bosses"} in this window. Bosses in your train are
              highlighted; greyed-out spawns overlap one you&apos;re already attending.
            </>
          ) : (
            "No world bosses spawn in this window. Try a longer one."
          )
        ) : (
          "Loading schedule…"
        )}
      </p>

      <ol className="mt-4 space-y-2">
        {candidates.map((c, i) => {
          const msUntil = c.start - now!.getTime();
          const active = msUntil <= 0;
          return (
            <li
              key={`${c.id}-${c.start}-${i}`}
              className={[
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                c.inTrain
                  ? "border-orange-400/30 bg-orange-400/[0.06]"
                  : "border-white/10 bg-white/[0.02] opacity-50",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  c.inTrain ? "bg-orange-500 text-black" : "bg-white/10 text-white/40",
                ].join(" ")}
              >
                {c.inTrain ? <Icon path={P.check} className="h-4 w-4" /> : <Icon path={P.close} className="h-3.5 w-3.5" />}
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/gw2/boss/${c.id}`}
                  className="truncate font-medium text-white/90 transition hover:text-orange-400"
                >
                  {c.name}
                </Link>
                <p className="truncate text-xs text-white/45">
                  {c.zone}
                  {c.hardcore && <span className="ml-1.5 text-purple-300/80">· squad recommended</span>}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-semibold text-white">
                  {new Date(c.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className={["text-xs", active ? "text-green-400" : "text-white/45"].join(" ")}>
                  {active ? "active now" : `in ${formatCountdown(msUntil)}`}
                </p>
              </div>

              {c.waypoint && c.inTrain && <CopyWaypoint code={c.waypoint} compact />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
