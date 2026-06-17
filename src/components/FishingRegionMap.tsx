"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import CopyWaypoint from "@/components/CopyWaypoint";
import { Icon, P } from "@/components/icons";
import type { VendorMapLocation } from "@/components/VendorMap";
import type { Fish } from "@/lib/gw2/fishing";
import type { FishingMap } from "@/lib/gw2/fishingMaps";

// Leaflet touches `window`, so the map is client-only.
const VendorMap = dynamic(() => import("@/components/VendorMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

// The API tags a fish only with a water *type* ("Lake Fish", "Coastal Fish",
// …), never a coordinate. We map that type to the categories baked onto each
// sector (see scripts/sync-fishing-maps.mjs) so picking a fish lights up
// type-appropriate spots. Returns null for "Any" / "Open Water" / unknown
// expansion water types, meaning "show every spot".
function allowedTypes(hole: string): Set<string> | null {
  const h = hole.toLowerCase();
  const set = new Set<string>();
  if (/lake/.test(h)) set.add("lake");
  if (/river|channel/.test(h)) set.add("river");
  if (/coast|shore|offshore|salt/.test(h)) set.add("coast");
  if (/fresh|brackish/.test(h)) ["lake", "river"].forEach((t) => set.add(t));
  if (/marsh|swamp|noxious|\bbog\b/.test(h)) set.add("marsh");
  if (/desert|oasis/.test(h)) ["oasis", "coast", "lake"].forEach((t) => set.add(t));
  if (/boreal/.test(h)) ["lake", "river", "coast"].forEach((t) => set.add(t));
  return set.size ? set : null;
}

// Bounds covering a set of continent points, padded a touch so markers aren't
// flush against the map edge.
function boundsOf(
  coords: [number, number][],
): [[number, number], [number, number]] | null {
  if (!coords.length) return null;
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const pad = 600;
  return [
    [Math.min(...xs) - pad, Math.min(...ys) - pad],
    [Math.max(...xs) + pad, Math.max(...ys) + pad],
  ];
}

// The map for a fishing region. Each map in the region is shaded and pinned;
// selecting one flies the map into that area, highlights it, and reveals its
// fishing spots (waypoints) as markers you can port to. Selecting a fish in the
// table (via `selectedFish`) reveals every fishing spot in the region.
export default function FishingRegionMap({
  regionName,
  maps,
  selectedFish = null,
  onClearFish,
}: {
  regionName: string;
  maps: FishingMap[];
  /** When set, the map shows every fishing spot in the region as a fish symbol. */
  selectedFish?: Fish | null;
  /** Clear the table's fish selection (when the user picks an area instead). */
  onClearFish?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // Picking a fish overrides the per-area view: show every spot in the region.
  const showAllSpots = selectedFish != null;

  // When a fish is picked, drop any area focus (adjust state during render, the
  // React-recommended alternative to a setState-in-effect).
  const [prevFish, setPrevFish] = useState(selectedFish);
  if (selectedFish !== prevFish) {
    setPrevFish(selectedFish);
    if (selectedFish) setSelected(null);
  }

  const selectedMap = showAllSpots ? null : maps.find((m) => m.name === selected) ?? null;

  const pickArea = (name: string | null) => {
    onClearFish?.();
    setSelected(name);
  };

  // The spots to draw, each tagged with its map. For a selected fish that's
  // every spot in the region matching its water type (generic "water" sectors
  // always show); if nothing matches we fall back to all spots so the map is
  // never blank. For a selected area it's that area's spots.
  const visibleSpots = useMemo(() => {
    const spotMaps = showAllSpots ? maps : selectedMap ? [selectedMap] : [];
    const all = spotMaps.flatMap((m) => m.spots.map((s) => ({ map: m, spot: s })));
    if (showAllSpots && selectedFish) {
      const allowed = allowedTypes(selectedFish.hole);
      if (allowed) {
        const matched = all.filter(({ spot }) => spot.type === "water" || allowed.has(spot.type));
        if (matched.length) return matched;
      }
    }
    return all;
  }, [maps, selectedMap, showAllSpots, selectedFish]);

  const locations: VendorMapLocation[] = useMemo(() => {
    const spotPins: VendorMapLocation[] = visibleSpots.map(({ map, spot }, i) => ({
      id: `spot-${i}`,
      kind: "fish" as const,
      area: spot.name,
      zone: map.name,
      coord: spot.coord,
    }));
    // Numbered area pins for the overview; hidden once we're showing fish spots.
    const areaPins: VendorMapLocation[] = showAllSpots
      ? []
      : maps.map((m, i) => ({
          id: m.name,
          label: String(i + 1),
          area: m.name,
          zone: regionName,
          coord: m.center,
        }));
    return [...areaPins, ...spotPins];
  }, [maps, regionName, showAllSpots, visibleSpots]);

  const areas = useMemo(() => maps.map((m) => m.rect), [maps]);

  // Fish selected: fit to the matching spots. Area selected: fly into that area.
  const focusBounds = useMemo(() => {
    if (showAllSpots) return boundsOf(visibleSpots.map(({ spot }) => spot.coord));
    return selectedMap ? selectedMap.rect : null;
  }, [showAllSpots, selectedMap, visibleSpots]);

  if (!maps.length) return null;

  return (
    <div className="lg:sticky lg:top-4">
      <div className="h-[340px] w-full overflow-hidden rounded-xl border border-white/10">
        <VendorMap
          locations={locations}
          areas={areas}
          highlightIds={selectedMap ? [selectedMap.name] : []}
          focusBounds={focusBounds}
        />
      </div>

      {showAllSpots && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1.5 text-xs">
          <span className="min-w-0 truncate text-sky-100/90">
            <span className="font-semibold">{selectedFish?.name}</span>
            {selectedFish?.hole ? ` · ${selectedFish.hole}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onClearFish?.()}
            className="shrink-0 text-sky-300/80 transition hover:text-sky-300"
          >
            Clear
          </button>
        </div>
      )}

      {selectedMap && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-3 text-xs text-sky-300/80 transition hover:text-sky-300"
        >
          ← Back to region overview
        </button>
      )}

      <ul className="mt-3 space-y-1.5">
        {maps.map((m, i) => {
          const active = selected === m.name;
          return (
            <li key={m.name}>
              <button
                type="button"
                onClick={() => pickArea(active ? null : m.name)}
                aria-pressed={active}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition ${
                  active
                    ? "border-sky-400/50 bg-sky-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    active ? "bg-sky-400 text-black" : "bg-white/10 text-white/70"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${active ? "text-white" : "text-white/80"}`}>
                  {m.name}
                </span>
                <span className="shrink-0 text-[11px] text-white/35">
                  {m.spots.length ? `${m.spots.length} fishing ${m.spots.length === 1 ? "spot" : "spots"}` : "map"}
                </span>
              </button>

              {active && (
                <div className="mb-1 ml-8 mt-1.5 space-y-2">
                  {m.spots.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {m.spots.map((s) => (
                        <li
                          key={s.name}
                          className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[11px] text-sky-100/90"
                        >
                          <Icon path={P.fish} className="h-3 w-3 text-sky-300" />
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.waypoints.length > 0 && (
                    <ul className="space-y-1">
                      {m.waypoints.map((w) => (
                        <li key={w.chat} className="flex items-center gap-2">
                          <CopyWaypoint code={w.chat} mini />
                          <span className="min-w-0 flex-1 truncate text-xs text-white/55">{w.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
