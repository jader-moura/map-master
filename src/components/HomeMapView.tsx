"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { usePersistentState } from "@/lib/usePersistentState";
import {
  POI_KINDS,
  POI_META,
  type PoiData,
  type PoiKind,
} from "@/lib/gw2/pois";

const HomeMap = dynamic(() => import("@/components/HomeMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-white/40">Loading map…</div>
  ),
});

const DEFAULT_VISIBLE = Object.fromEntries(
  POI_KINDS.map((k) => [k, POI_META[k].defaultOn]),
) as Record<PoiKind, boolean>;

export default function HomeMapView() {
  const { data, isLoading, isError } = useQuery<PoiData>({
    queryKey: ["pois"],
    queryFn: async () => {
      const res = await fetch("/api/pois");
      if (!res.ok) throw new Error("Failed to load map data");
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [stored, setVisible] = usePersistentState<Record<PoiKind, boolean>>(
    "buildop:poiVisible",
    DEFAULT_VISIBLE,
  );
  // Merge over defaults so POI kinds added after a user's prefs were saved
  // (e.g. "travel") still honor their defaultOn instead of reading undefined.
  const visible = useMemo(
    () => ({ ...DEFAULT_VISIBLE, ...stored }),
    [stored],
  );
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const counts = useMemo(() => {
    const c = {} as Record<PoiKind, number>;
    for (const k of POI_KINDS) c[k] = data?.[k]?.length ?? 0;
    return c;
  }, [data]);

  const total = POI_KINDS.reduce(
    (n, k) => n + (visible[k] ? counts[k] : 0),
    0,
  );

  const setAll = (v: boolean) =>
    setVisible(Object.fromEntries(POI_KINDS.map((k) => [k, v])) as Record<PoiKind, boolean>);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0f] text-white">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d0d14] px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">buildop</span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            Tyria Map
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <Icon path={P.layers} className="h-4 w-4 text-white/50" />
            <span className="text-xs font-semibold text-white">
              {total.toLocaleString()} shown
            </span>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <IconRail onToggleActive={() => setSidebarOpen((o) => !o)} />

        {/* sidebar — mobile full-height overlay beside the rail; desktop column */}
        <aside
          className={[
            "flex-col bg-[#0b0b11]",
            "absolute inset-y-0 left-14 right-0 z-[1200] border-l border-white/10 shadow-2xl",
            "lg:static lg:inset-auto lg:left-auto lg:right-auto lg:z-auto lg:w-[300px] lg:shrink-0 lg:border-l-0 lg:border-r lg:shadow-none",
            sidebarOpen ? "flex" : "hidden",
          ].join(" ")}
        >
          <div className="shrink-0 space-y-3 p-3">
            <div>
              <h1 className="text-sm font-bold text-white">Guild Wars 2 Map</h1>
              <p className="text-[11px] text-white/45">
                Tyria waypoints, vistas, hearts &amp; more — toggle layers below
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
              <Icon path={P.search} className="h-4 w-4 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name (e.g. waypoint)…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAll(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
              >
                <Icon path={P.eye} className="h-4 w-4" /> Show All
              </button>
              <button
                onClick={() => setAll(false)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
              >
                <Icon path={P.eyeOff} className="h-4 w-4" /> Hide All
              </button>
            </div>
          </div>

          <div className="scroll-themed min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <div className="px-1 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              Map Layers
            </div>
            {POI_KINDS.map((kind) => {
              const meta = POI_META[kind];
              const on = visible[kind];
              return (
                <button
                  key={kind}
                  onClick={() =>
                    setVisible((v) => {
                      const merged = { ...DEFAULT_VISIBLE, ...v };
                      return { ...merged, [kind]: !merged[kind] };
                    })
                  }
                  className={[
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition",
                    on ? "hover:bg-white/5" : "opacity-45 hover:bg-white/5",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={meta.iconUrl}
                    alt=""
                    className="h-5 w-5 shrink-0"
                    style={{ imageRendering: "crisp-edges" }}
                  />
                  <span className="flex-1 text-sm font-medium text-white">{meta.label}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white/70">
                    {isLoading ? "…" : counts[kind].toLocaleString()}
                  </span>
                  <Icon path={on ? P.eye : P.eyeOff} className="h-4 w-4 text-white/40" />
                </button>
              );
            })}
            {isError && (
              <p className="px-3 py-6 text-center text-sm text-red-400">
                Couldn’t load map data. Try refreshing.
              </p>
            )}
          </div>
        </aside>

        {/* map */}
        <main className="relative min-w-0 flex-1">
          {isLoading || !data ? (
            <div className="grid h-full place-items-center text-white/40">
              {isError ? "Failed to load map data." : "Loading Tyria map data…"}
            </div>
          ) : (
            <HomeMap data={data} visible={visible} query={query} />
          )}
        </main>
      </div>
    </div>
  );
}
