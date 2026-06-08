"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { MATERIAL_CATEGORIES, type MatItem } from "@/lib/gw2/materials";
import type { GatherZone } from "@/app/api/maps/route";

const GatherMap = dynamic(() => import("@/components/GatherMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-white/40">Loading map…</div>
  ),
});

type MapsResp = { maps: GatherZone[] };
type MatMeta = { id: number; name: string; icon: string };
type MatResp = { items: MatMeta[] };

const overlaps = (z: [number, number], sel: [number, number]) =>
  z[0] <= sel[1] && z[1] >= sel[0];

export default function GatherView() {
  const { data: mapsData, isLoading: mapsLoading } = useQuery<MapsResp>({
    queryKey: ["gather-maps"],
    queryFn: async () => {
      const res = await fetch("/api/maps");
      if (!res.ok) throw new Error("Failed to load maps");
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: matData } = useQuery<MatResp>({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetch("/api/materials");
      if (!res.ok) throw new Error("Failed to load materials");
      return res.json();
    },
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const metaById = useMemo(
    () => new Map((matData?.items ?? []).map((i) => [i.id, i])),
    [matData],
  );

  const zones = mapsData?.maps ?? [];

  const selectedItem: MatItem | null = useMemo(() => {
    if (selectedId == null) return null;
    for (const c of MATERIAL_CATEGORIES)
      for (const it of c.items) if (it.id === selectedId) return it;
    return null;
  }, [selectedId]);

  const selectedLevels = selectedItem ? selectedItem.levels : null;
  const matchCount = selectedLevels
    ? zones.filter((z) => overlaps(z.levels, selectedLevels)).length
    : 0;
  const selectedName = selectedId != null ? metaById.get(selectedId)?.name : undefined;
  const isPlant =
    selectedItem != null &&
    MATERIAL_CATEGORIES.find((c) => c.items.includes(selectedItem))?.key === "plant";

  const toggle = (id: number) => setSelectedId((p) => (p === id ? null : id));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0f] text-white">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d0d14] px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">buildop</span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            Gathering Map
          </span>
        </div>
        {selectedName && (
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <span className="text-xs font-semibold text-emerald-300">
              {selectedName} · Lvl {selectedLevels?.[0]}–{selectedLevels?.[1]} · {matchCount} zones
            </span>
          </div>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1">
        <IconRail onToggleActive={() => setSidebarOpen((o) => !o)} />

        {/* sidebar — mobile overlay beside the rail; desktop column */}
        <aside
          className={[
            "flex-col bg-[#0b0b11]",
            "absolute inset-y-0 left-14 right-0 z-[1200] border-l border-white/10 shadow-2xl",
            "lg:static lg:inset-auto lg:left-auto lg:right-auto lg:z-auto lg:w-[320px] lg:shrink-0 lg:border-l-0 lg:border-r lg:shadow-none",
            sidebarOpen ? "flex" : "hidden",
          ].join(" ")}
        >
          <div className="shrink-0 space-y-2 p-3">
            <div>
              <h1 className="text-sm font-bold text-white">GW2 Gathering Map</h1>
              <p className="text-[11px] text-white/45">
                Pick a material, the maps where you gather it light up on Tyria.
              </p>
            </div>
            {selectedId != null && (
              <button
                onClick={() => setSelectedId(null)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
              >
                <Icon path={P.close} className="h-3.5 w-3.5" /> Clear selection
              </button>
            )}
          </div>

          <div className="scroll-themed min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {MATERIAL_CATEGORIES.map((cat) => (
              <div key={cat.key} className="mb-3">
                <div className="flex items-center gap-2 px-1 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.icon} alt="" className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    {cat.label}
                  </span>
                </div>
                {cat.items.map((it) => {
                  const meta = metaById.get(it.id);
                  const on = selectedId === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => toggle(it.id)}
                      className={[
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition",
                        on
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "text-white/80 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {meta?.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={meta.icon} alt="" className="h-6 w-6 shrink-0 rounded" />
                      ) : (
                        <span className="h-6 w-6 shrink-0 rounded bg-white/10" />
                      )}
                      <span className="flex-1 truncate text-sm">
                        {meta?.name ?? `Item ${it.id}`}
                      </span>
                      <span className="shrink-0 text-[11px] text-white/40">
                        {it.levels[0]}–{it.levels[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            {isPlant && (
              <p className="px-2 py-1 text-[11px] leading-snug text-amber-300/80">
                Note: foraged plants aren’t strictly level-gated, so plant ranges
                are approximate.
              </p>
            )}
          </div>
        </aside>

        {/* map */}
        <main className="relative min-w-0 flex-1">
          {mapsLoading ? (
            <div className="grid h-full place-items-center text-white/40">
              Loading Tyria map data…
            </div>
          ) : (
            <GatherMap zones={zones} selected={selectedLevels} />
          )}
          {!selectedId && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0d0d14]/90 px-3 py-1.5 text-xs text-white/60 shadow-lg backdrop-blur">
              Select a material to highlight its zones
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
