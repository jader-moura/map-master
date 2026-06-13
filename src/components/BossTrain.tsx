"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import CopyWaypoint from "@/components/CopyWaypoint";
import { Icon, P } from "@/components/icons";
import type { VendorMapLocation } from "@/components/VendorMap";
import { BOSSES, BOSS_WAYPOINTS, BOSS_LEVELS, formatCountdown } from "@/lib/gw2/bosses";

// Leaflet touches `window`, so the map is client-only.
const RouteMap = dynamic(() => import("@/components/VendorMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

// "Boss train" planner. Because waypoint travel in GW2 is instant, the only
// constraint on chaining bosses is overlapping active windows. The standard
// bosses are phased so they never collide, so routes only fork around the
// hardcore bosses (Tequatl, Triple Trouble, Karka Queen). We generate a "most
// bosses" route plus one built around each hardcore boss, and show the chosen
// route's stops on the map so you can see where you're heading.

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
  area: string;
  hardcore: boolean;
  level: number;
  durationMin: number;
  image: string;
  coord: [number, number];
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
          out.push({
            id: b.id,
            name: b.name,
            zone: b.zone,
            area: b.area,
            hardcore: b.hardcore,
            level: BOSS_LEVELS[b.id] ?? 0,
            durationMin: b.durationMin,
            image: b.image,
            coord: b.coord,
            waypoint: BOSS_WAYPOINTS[b.id],
            start,
            end,
          });
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

  const seen = new Set<string>();
  for (const c of cands) {
    if (!c.hardcore || seen.has(c.id)) continue;
    seen.add(c.id);
    const stops = fill(cands, c);
    const key = routeKey(stops);
    if (routes.some((r) => r.key === key)) continue;
    routes.push({ key, name: `${c.name} run`, hardcore: true, stops });
  }

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

  // The schedule only changes when a spawn enters or leaves the window, so
  // recompute routes per minute, not per second. Countdowns below still tick
  // every second off `now` without rebuilding routes (or remounting the map).
  const tick = now ? Math.floor(now.getTime() / 60_000) : 0;
  const routes = useMemo(
    () => (now ? buildRoutes(buildCandidates(now, windowMin)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, windowMin],
  );

  const active = routes.find((r) => r.key === routeKeySel) ?? routes[0];

  // Unique boss locations for the chosen route. Memoised on the route key so the
  // map only refits when the route actually changes, not on every clock tick.
  const mapLocations = useMemo<VendorMapLocation[]>(() => {
    if (!active) return [];
    const seen = new Set<string>();
    const locs: VendorMapLocation[] = [];
    for (const s of active.stops) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      locs.push({ area: s.name, zone: s.zone, coord: s.coord });
    }
    return locs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key]);

  const mapEl = useMemo(
    () => (mapLocations.length ? <RouteMap locations={mapLocations} /> : null),
    [mapLocations],
  );

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      {/* Left: controls + itinerary */}
      <div className="min-w-0">
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
            {routes.length > 1 ? (
              <div className="mt-5">
                <p className="mb-2 text-sm text-white/50">
                  {routes.length} routes in this window. Taking a hardcore boss means giving up a
                  standard one at the same time:
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

            <ol className="mt-4 space-y-2">
              {active.stops.map((c, i) => {
                const msUntil = c.start - now.getTime();
                const isActive = msUntil <= 0;
                return (
                  <li
                    key={`${c.id}-${c.start}`}
                    className="flex items-center gap-3 rounded-xl border border-orange-400/25 bg-orange-400/[0.05] p-2.5"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-black">
                      {i + 1}
                    </span>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image}
                      alt={c.name}
                      width={72}
                      height={48}
                      className="h-12 w-[72px] shrink-0 rounded-md border border-white/10 object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/gw2/boss/${c.id}`}
                        className="block truncate font-medium text-white/90 transition hover:text-orange-400"
                      >
                        {c.name}
                      </Link>
                      <p className="truncate text-xs text-white/45">{c.zone}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-white/40">
                        <span>{c.hardcore ? "Hardcore" : "World boss"}</span>
                        {c.level > 0 && <span>· Lvl {c.level}</span>}
                        <span>· {c.durationMin}m</span>
                        {c.hardcore && <span className="text-purple-300/80">· squad</span>}
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

      {/* Right: route map */}
      <div className="mt-6 lg:mt-0">
        <div className="overflow-hidden rounded-xl border border-white/10 lg:sticky lg:top-6">
          <div className="h-[360px] lg:h-[calc(100vh-9rem)]">
            {mapEl ?? (
              <div className="grid h-full place-items-center text-sm text-white/35">
                Pick a window to see the route on the map.
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-white/35">
          Every stop on your selected route, mapped across Tyria. Hover a marker for the boss.
        </p>
      </div>
    </div>
  );
}
