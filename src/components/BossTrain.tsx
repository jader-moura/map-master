"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import CopyWaypoint from "@/components/CopyWaypoint";
import { Icon, P } from "@/components/icons";
import type { VendorMapLocation } from "@/components/VendorMap";
import { BOSSES, BOSS_WAYPOINTS, BOSS_LEVELS, formatCountdown } from "@/lib/gw2/bosses";
import { BOSS_DETAILS } from "@/lib/gw2/bossDetails";

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
  times: string[];
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
            times: b.times,
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
  const [openStops, setOpenStops] = useState<Set<string>>(new Set());

  const toggleStop = (k: string) =>
    setOpenStops((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

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
  // coordinates (and therefore the map view) only change when the route does,
  // not when a marker is highlighted or turns active.
  const mapLocations = useMemo<VendorMapLocation[]>(() => {
    if (!active) return [];
    const seen = new Set<string>();
    const locs: VendorMapLocation[] = [];
    active.stops.forEach((s, idx) => {
      if (seen.has(s.id)) return;
      seen.add(s.id);
      locs.push({ id: s.id, label: String(idx + 1), area: s.name, zone: s.zone, coord: s.coord });
    });
    return locs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key]);

  // Which boss markers to highlight (expanded cards) and colour green (live now).
  const nowMs = now?.getTime() ?? 0;
  const highlightIds = active
    ? active.stops.filter((s) => openStops.has(`${s.id}-${s.start}`)).map((s) => s.id)
    : [];
  const activeIds = active
    ? active.stops.filter((s) => s.start <= nowMs && s.end > nowMs).map((s) => s.id)
    : [];

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
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span
                  className="mr-0.5 text-[11px] uppercase tracking-wide text-white/35"
                  title="Standard bosses never overlap; taking a hardcore boss means giving up the standard one at that time."
                >
                  Route
                </span>
                {routes.map((r) => {
                  const sel = r.key === active.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRouteKeySel(r.key)}
                      className={[
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                        sel
                          ? "border-orange-400/50 bg-orange-400/15 text-orange-200"
                          : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white",
                      ].join(" ")}
                    >
                      {r.hardcore && <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                      <span>{r.name}</span>
                      <span className={sel ? "text-orange-300/70" : "text-white/35"}>{r.stops.length}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-xs text-white/45">
                One route, no conflicts, all{" "}
                <span className="font-semibold text-orange-300">{active.stops.length}</span> bosses.
              </p>
            )}

            <ol className="mt-4 space-y-2">
              {active.stops.map((c, i) => {
                const msUntil = c.start - now.getTime();
                const isActive = msUntil <= 0;
                const stopKey = `${c.id}-${c.start}`;
                const open = openStops.has(stopKey);
                const detail = BOSS_DETAILS[c.id];
                return (
                  <li
                    key={stopKey}
                    className={[
                      "overflow-hidden rounded-xl border",
                      isActive
                        ? "border-green-400/40 bg-green-400/[0.07]"
                        : "border-orange-400/25 bg-orange-400/[0.05]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 p-2.5">
                      <button
                        type="button"
                        onClick={() => toggleStop(stopKey)}
                        aria-expanded={open}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={[
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-black",
                            isActive ? "bg-green-500" : "bg-orange-500",
                          ].join(" ")}
                        >
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
                          <p className="truncate font-medium text-white/90">{c.name}</p>
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

                        <Icon
                          path={P.chevron}
                          className={["h-4 w-4 shrink-0 text-white/40 transition-transform", open ? "rotate-180" : ""].join(" ")}
                        />
                      </button>

                      {c.waypoint && <CopyWaypoint code={c.waypoint} compact />}
                    </div>

                    {open && (
                      <div className={["border-t bg-black/20 px-3 py-3 text-sm", isActive ? "border-green-400/15" : "border-orange-400/15"].join(" ")}>
                        <p className="text-white/55">
                          <span className="text-white/40">Location: </span>
                          {c.area}, {c.zone}
                        </p>

                        <div className="mt-2.5">
                          <p className="text-[11px] uppercase tracking-wide text-white/35">Daily spawns (UTC)</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {c.times.map((t) => (
                              <span key={t} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] tabular-nums text-white/60">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {detail?.howToStart && (
                          <p className="mt-2.5 leading-relaxed text-white/60">
                            <span className="text-white/40">How to start: </span>
                            {detail.howToStart}
                          </p>
                        )}
                        {detail?.tips && (
                          <p className="mt-2 leading-relaxed text-white/55">
                            <span className="font-medium text-white/75">Tip: </span>
                            {detail.tips}
                          </p>
                        )}

                        <Link
                          href={`/gw2/boss/${c.id}`}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-orange-400/40 hover:text-white"
                        >
                          Open boss page
                          <Icon path={P.chevron} className="h-3.5 w-3.5 -rotate-90" />
                        </Link>
                      </div>
                    )}

                    {isActive && (
                      <div className="px-2.5 pb-2.5">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-green-300/90">
                          <span>Active now</span>
                          <span className="tabular-nums">ends in {formatCountdown(c.end - now.getTime())}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-green-400 transition-[width] duration-1000 ease-linear"
                            style={{
                              width: `${Math.min(100, Math.max(0, ((now.getTime() - c.start) / (c.end - c.start)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
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
            {mapLocations.length ? (
              <RouteMap locations={mapLocations} highlightIds={highlightIds} activeIds={activeIds} />
            ) : (
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
