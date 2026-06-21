"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { MATERIAL_CATEGORIES, type MatItem } from "@/lib/gw2/materials";
import { GATHERING_NODES } from "@/lib/gw2/gatheringNodes";
import type { GatherZone } from "@/app/api/maps/route";

// Keep the rendered node count bounded (a plant selection matches every plant
// spot across the covered maps).
const MAX_NODES = 500;

// The TGMP node kind leaf for an ore/wood material ("Mithril Ore" -> "mithril",
// "Elder Wood Log" -> "elder"). Plants are matched by category, not kind.
function nodeKind(item: MatItem, cat: "ore" | "wood" | "plant"): string | null {
  if (cat === "ore") return item.name.toLowerCase().replace(" ore", "").trim();
  if (cat === "wood") return item.name.toLowerCase().replace(" wood log", "").replace(" log", "").trim();
  return null;
}

// category ("ore" | "wood" | "plant") -> icon, for the mixed nodes of a picked map.
const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  MATERIAL_CATEGORIES.map((c) => [c.key, c.icon]),
);

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
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
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
  const selectedCat = useMemo(
    () => (selectedItem ? MATERIAL_CATEGORIES.find((c) => c.items.includes(selectedItem))?.key ?? null : null),
    [selectedItem],
  );
  const isPlant = selectedCat === "plant";

  // Exact node spots for the selection (covered maps only); plants match by
  // category since the in-game harvest plant rarely matches the item one-to-one.
  const selectedNodes = useMemo(() => {
    if (!selectedItem || !selectedCat) return [];
    const matched =
      selectedCat === "plant"
        ? GATHERING_NODES.filter((n) => n.cat === "plant")
        : GATHERING_NODES.filter((n) => n.cat === selectedCat && n.kind === nodeKind(selectedItem, selectedCat));
    return matched.slice(0, MAX_NODES);
  }, [selectedItem, selectedCat]);

  // All gathering nodes in a clicked map (every category).
  const zoneNodes = useMemo(
    () => (selectedZone ? GATHERING_NODES.filter((n) => n.map === selectedZone).slice(0, MAX_NODES) : []),
    [selectedZone],
  );

  // Material mode pins that material's spots; map mode pins everything in the map.
  const displayNodes = selectedId != null ? selectedNodes : zoneNodes;
  const materialIcon = selectedId != null ? metaById.get(selectedId)?.icon : undefined;

  // Material and map selection are alternate modes; picking one clears the other.
  const toggle = (id: number) => {
    setSelectedZone(null);
    setSelectedId((p) => (p === id ? null : id));
  };
  const pickZone = (name: string) => {
    setSelectedId(null);
    setSelectedZone((p) => (p === name ? null : name));
  };
  const clearAll = () => {
    setSelectedId(null);
    setSelectedZone(null);
  };

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
        {(selectedName || selectedZone) && (
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <span className="text-xs font-semibold text-emerald-300">
              {selectedName
                ? `${selectedName} · Lvl ${selectedLevels?.[0]}–${selectedLevels?.[1]} · ${matchCount} zones${selectedNodes.length > 0 ? ` · ${selectedNodes.length} node spots` : ""}`
                : `${selectedZone} · ${zoneNodes.length} node spots`}
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
                Pick a material to map its spots, or click a map to see every node in it.
              </p>
            </div>
            {(selectedId != null || selectedZone) && (
              <button
                onClick={clearAll}
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
            <GatherMap
              zones={zones}
              selected={selectedLevels}
              selectedZone={selectedZone}
              onSelectZone={pickZone}
              nodes={displayNodes}
              materialIcon={materialIcon}
              categoryIcons={CATEGORY_ICONS}
            />
          )}
          {!selectedId && !selectedZone && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0d0d14]/90 px-3 py-1.5 text-xs text-white/60 shadow-lg backdrop-blur">
              Select a material, or click a map to see its gathering nodes
            </div>
          )}
          {displayNodes.length > 0 && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-amber-400/25 bg-[#0d0d14]/90 px-3 py-1.5 text-xs text-amber-200/80 shadow-lg backdrop-blur">
              {displayNodes.length} node spots pinned · zoom in to use them
            </div>
          )}
          {((selectedId != null && selectedNodes.length === 0) ||
            (selectedZone != null && zoneNodes.length === 0)) && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0d0d14]/90 px-3 py-1.5 text-xs text-white/55 shadow-lg backdrop-blur">
              No node spots mapped here yet
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
