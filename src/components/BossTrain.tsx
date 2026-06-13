"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CopyWaypoint from "@/components/CopyWaypoint";
import { Icon, P } from "@/components/icons";
import { BOSSES, BOSS_WAYPOINTS, formatCountdown } from "@/lib/gw2/bosses";

// "Boss train" planner. Given the next N minutes, work out which world bosses
// you can chain. Because waypoint travel in GW2 is instant, the only constraint
// is that you can't be at two bosses whose active windows overlap.
//
// The standard world bosses are phased so they never collide, so the routes
// only really diverge around the hardcore bosses (Tequatl, Triple Trouble,
// Karka Queen), whose spawns land on top of standard ones and force an
// either/or choice. We surface that by generating one "most bosses" route plus
// a route built around each hardcore boss in the window, then let you switch.

const DAY_MS = 86_400_000;
const WINDOWS = [
  { label: "1 hour", min: 60 },
  { label: "2 hours", min: 120 },
  { label: "4 hours", min: 240 },
];

type Cand = {
  id: string;
  name: string;
  zone: string;
  hardcore: boolean;
  waypoint?: string;
  start: number; // ms epoch
  end: number; // ms epoch
};

type Route = { key: string; name: string; hardcore: boolean; stops: Cand[] };

const overlaps = (a: Cand, b: Cand) => a.start < b.end && b.start < a.end;
const routeKey = (stops: Cand[]) =>
  stops.map((c) => `${c.id}@${c.start}`).sort().join("|");

// Maximal non-overlapping set (greedy by earliest finish). An optional `forced`
// stop is locked in first, so the result is the best route that includes it.
function fill(cands: Cand[], forced?: Cand): Cand[] {
  const byFinish = [...cands].sort((a, b) => a.end - b.end || a.start - b.start);
  const sel: Cand[] = [];
  const take = (c: Cand) => {
    if (!sel.some((s) => overlaps(s, c))) sel.push(c);
  };
  if (forced) take(forced);
  for (const c of byFinish) take(c);
  return sel.sort((a, b) => a.start - b.start);
}

function buildCandidates(now: Date, windowMin: number): Cand[] {
  const nowMs = now.getTime();
  const horizon = nowMs + windowMin * 60_000;
  const out: Cand[] = [];
  for (const b of BOSSES) {
    const durMs = b.durationMin * 60_000;
    for (const t of b.times) {
      const [h, m] = t.split(":").map(Number);
      const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m);
      for (const start of [today - DAY_MS, today, today + DAY_MS]) {
        const end = start + durMs;
        if (end > nowMs && start < horizon) {
          out.push({ id: b.id, name: b.name, zone: b.zone, hardcore: b.hardcore, waypoint: BOSS_WAYPOINTS[b.id], start, end });
        }
      }
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

function buildRoutes(cands: Cand[]): Route[] {
  if (!cands.length) return [];
  const base = fill(cands);
  const routes: Route[] = [
    { key: routeKey(base), name: "Most bosses", hardcore: false, stops: base },
  ];

  // Soonest occurrence of each hardcore boss in the window → one route each.
  const seen = new Set<string>();
  for (const c of cands) {
    if (!c.hardcore || seen.has(c.id)) continue;
    seen.add(c.id);
    const stops = fill(cands, c);
    const key = routeKey(stops);
    if (routes.some((r) => r.key === key)) continue; // identical to an existing route
    routes.push({ key, name: `${c.name} run`, hardcore: true, stops });
  }

  // Most stops first, but keep "Most bosses" pinned at the front.
  const [first, ...rest] = routes;
  rest.sort((a, b) => b.stops.length - a.stops.length);
  return [first, ...rest];
}

export default function BossTrain() {
  const [now, setNow] = useState<Date | null>(null);
  const [windowMin, setWindowMin] = useState(120);
  const [routeKeySel, setRouteKeySel] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const routes = useMemo(
    () => (now ? buildRoutes(buildCandidates(now, windowMin)) : []),
    [now, windowMin],
  );

  // Keep the chosen route valid as the window/schedule changes.
  const active = routes.find((r) => r.key === routeKeySel) ?? routes[0];

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

      {!now ? (
        <p className="mt-4 text-sm text-white/60">Loading schedule…</p>
      ) : !active ? (
        <p className="mt-4 text-sm text-white/60">
          No world bosses spawn in this window. Try a longer one.
        </p>
      ) : (
        <>
          {/* Route picker — only meaningful when there's more than one option. */}
          {routes.length > 1 ? (
            <div className="mt-5">
              <p className="mb-2 text-sm text-white/50">
                {routes.length} routes in this window. Taking a hardcore boss means giving up a
                standard one at the same time, pick the run you want:
              </p>
              <div className="flex flex-wrap gap-2">
                {routes.map((r) => {
                  const sel = r.key === active.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRouteKeySel(r.key)}
                      className={[
                        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition",
                        sel
                          ? "border-orange-400/50 bg-orange-400/15 text-orange-200"
                          : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white",
                      ].join(" ")}
                    >
                      {r.hardcore && <span className="h-2 w-2 rounded-full bg-purple-400" />}
                      <span>{r.name}</span>
                      <span className={sel ? "text-orange-300/70" : "text-white/35"}>· {r.stops.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/55">
              One optimal route in this window, no timing conflicts. You can hit all{" "}
              <span className="font-semibold text-orange-300">{active.stops.length}</span> bosses.
            </p>
          )}

          {/* Selected route itinerary */}
          <ol className="mt-4 space-y-2">
            {active.stops.map((c, i) => {
              const msUntil = c.start - now.getTime();
              const isActive = msUntil <= 0;
              return (
                <li
                  key={`${c.id}-${c.start}`}
                  className="flex items-center gap-3 rounded-xl border border-orange-400/25 bg-orange-400/[0.05] px-4 py-3"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-black">
                    {i + 1}
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
                    <p className={["text-xs", isActive ? "text-green-400" : "text-white/45"].join(" ")}>
                      {isActive ? "active now" : `in ${formatCountdown(msUntil)}`}
                    </p>
                  </div>

                  {c.waypoint && <CopyWaypoint code={c.waypoint} compact />}
                </li>
              );
            })}
          </ol>

          {active.hardcore && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-white/40">
              <Icon path={P.info} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Hardcore bosses need an organised squad, join a populated map a few minutes early.
            </p>
          )}
        </>
      )}
    </div>
  );
}
