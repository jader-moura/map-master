"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import CopyWaypoint from "@/components/CopyWaypoint";
import { Icon, P } from "@/components/icons";
import type { VendorMapLocation } from "@/components/VendorMap";
import type { Fish } from "@/lib/gw2/fishing";
import type { FishingMap } from "@/lib/gw2/fishingMaps";
import type { FishingHole } from "@/lib/gw2/fishingHoles";
import { timeChipClass } from "@/lib/gw2/fishingDisplay";
import { itemSlug, rarityColor } from "@/lib/gw2/items";

// Leaflet touches `window`, so the map is client-only.
const VendorMap = dynamic(() => import("@/components/VendorMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

// A region-wide view can gather hundreds of holes; beyond a few hundred markers
// the map is unreadable and Leaflet gets sluggish, so cap what we draw.
const MAX_MARKERS = 300;

// A normalised fishing spot, sourced either from real holes (Only Fish pack) or
// the sector-name heuristic fallback. `type` is matched against the selected
// fish's water type to highlight relevant spots.
type Spot = { name: string; type: string; coord: [number, number] };
type PlacedSpot = { map: FishingMap; spot: Spot };

// Readable label per Only Fish hole category leaf.
const HOLE_LABEL: Record<string, string> = {
  lake: "Lake", fraclake: "Lake", offshore: "Offshore", lowoffshore: "Offshore",
  coastal: "Coastal", shore: "Shore", lowshore: "Shore", desert: "Desert",
  fracdesert: "Desert", saltwater: "Saltwater", channel: "Channel",
  fracchannel: "Channel", boreal: "Boreal", freshwater: "Freshwater",
  fracfresh: "Freshwater", lowfresh: "Freshwater", freshj: "Freshwater",
  volcanic: "Volcanic", river: "River", noxious: "Noxious", polluted: "Polluted",
  cavern: "Cavern", quarry: "Quarry", grotto: "Grotto", lowbrackish: "Brackish",
  brackishj: "Brackish", ssj: "Brackish", osj: "Brackish", nayosian: "Nayosian",
  astral: "Astral", spire: "Spire", dream: "Dream", deep: "Deep",
  deeptower: "Deep", mysterious: "Mysterious", rare: "Rare", random: "Any",
};
const holeLabel = (type: string) => HOLE_LABEL[type] ?? "Fishing hole";

// Holes that bite anything; always included when matching by water type.
const UNIVERSAL_HOLES = new Set(["random", "mysterious", "rare"]);

// The API tags a fish only with a water *type* ("Lake Fish", "Coastal Fish",
// …), never a coordinate. Map that type to the Only Fish hole categories so
// picking a fish lights up type-appropriate holes (and a hole resolves to the
// fish that bite there). Returns null for "Any" / "Open Water" / unknown types,
// meaning the fish bites at any hole.
function allowedHoleCats(hole: string): Set<string> | null {
  const h = hole.toLowerCase();
  const set = new Set<string>();
  const add = (...xs: string[]) => xs.forEach((x) => set.add(x));
  if (/\blake\b/.test(h)) add("lake", "fraclake");
  if (/offshore/.test(h)) add("offshore", "lowoffshore");
  if (/coast/.test(h)) add("coastal");
  if (/\bshore\b/.test(h)) add("shore", "lowshore");
  if (/desert/.test(h)) add("desert", "fracdesert");
  if (/fresh|pond/.test(h)) add("freshwater", "fracfresh", "lowfresh", "freshj");
  if (/brackish/.test(h)) add("lowbrackish", "brackishj", "ssj", "osj");
  if (/salt/.test(h)) add("saltwater");
  if (/boreal/.test(h)) add("boreal");
  if (/channel/.test(h)) add("channel", "fracchannel");
  if (/river/.test(h)) add("river");
  if (/noxious/.test(h)) add("noxious", "polluted");
  if (/cavern/.test(h)) add("cavern");
  if (/quarry/.test(h)) add("quarry");
  if (/grotto/.test(h)) add("grotto");
  if (/volcanic/.test(h)) add("volcanic");
  if (/astral/.test(h)) add("astral");
  if (/spire/.test(h)) add("spire");
  if (/dream/.test(h)) add("dream");
  if (/nayosian/.test(h)) add("nayosian");
  return set.size ? set : null;
}

// Fallback (no hole data): match a fish to sector "spots" by coarse category.
function allowedSectorTypes(hole: string): Set<string> | null {
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

// Does a fish bite at a hole of this water category?
function fishBitesHole(fishHole: string, holeType: string): boolean {
  const allowed = allowedHoleCats(fishHole);
  return allowed == null || allowed.has(holeType) || UNIVERSAL_HOLES.has(holeType);
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

// The region map. It fills its (relative) parent; a floating card overlays the
// map with the position/area filter and context. Pick an area to fly in and
// reveal its holes; click a hole to see which fish bite there; pick a fish (in
// the sidebar or the hole card) to light up every matching hole.
export default function FishingRegionMap({
  regionName,
  fish,
  maps,
  holes = [],
  selectedFish = null,
  onClearFish,
  onSelectFish,
}: {
  regionName: string;
  /** All fish in the region, for the hole → fish lookup. */
  fish: Fish[];
  maps: FishingMap[];
  /** Real fishing-hole locations for the region (Only Fish pack). */
  holes?: FishingHole[];
  /** When set, the map shows every matching fishing hole as a fish symbol. */
  selectedFish?: Fish | null;
  /** Clear the fish selection (when the user picks an area instead). */
  onClearFish?: () => void;
  /** Select a fish (e.g. from the hole card), driving the sidebar + map. */
  onSelectFish?: (fish: Fish) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedHole, setSelectedHole] = useState<VendorMapLocation | null>(null);

  // Prefer real holes; fall back to the sector heuristic when a region has none.
  const usingHoles = holes.length > 0;

  // Every spot in the region, each tagged with its map, from whichever source.
  const spotSource = useMemo<PlacedSpot[]>(() => {
    if (usingHoles) {
      const byName = new Map(maps.map((m) => [m.name, m]));
      const out: PlacedSpot[] = [];
      for (const h of holes) {
        const map = byName.get(h.map);
        if (map) out.push({ map, spot: { name: holeLabel(h.type), type: h.type, coord: h.coord } });
      }
      return out;
    }
    return maps.flatMap((m) => m.spots.map((spot) => ({ map: m, spot })));
  }, [usingHoles, holes, maps]);

  // Picking a fish overrides the per-area view: show every matching hole.
  const showAllSpots = selectedFish != null;

  // When a fish is picked, drop area + hole focus (adjust state during render,
  // the React-recommended alternative to a setState-in-effect).
  const [prevFish, setPrevFish] = useState(selectedFish);
  if (selectedFish !== prevFish) {
    setPrevFish(selectedFish);
    if (selectedFish) {
      setSelected(null);
      setSelectedHole(null);
    }
  }

  const selectedMap = showAllSpots ? null : maps.find((m) => m.name === selected) ?? null;

  const pickArea = (name: string | null) => {
    onClearFish?.();
    setSelectedHole(null);
    setSelected(name);
  };

  // Marker clicked: a hole opens its fish list; an area pin focuses that area.
  const onMapSelect = (loc: VendorMapLocation) => {
    if (loc.kind === "fish") {
      if (!loc.holeType) return;
      setSelectedHole((cur) => (cur?.id === loc.id ? null : loc));
    } else {
      pickArea(selected === loc.area ? null : loc.area);
    }
  };

  // Holes per map name, for the list counts and per-area summary.
  const countByMap = useMemo(() => {
    const c = new Map<string, number>();
    for (const { map } of spotSource) c.set(map.name, (c.get(map.name) ?? 0) + 1);
    return c;
  }, [spotSource]);

  // The spots to draw. For a selected fish that's every spot in the region
  // matching its water type (universal holes always included); if nothing
  // matches we fall back to all so the map is never blank. For a selected area
  // it's that area's spots. Capped so the map stays readable.
  const visibleSpots = useMemo(() => {
    const inScope = showAllSpots
      ? spotSource
      : selectedMap
        ? spotSource.filter(({ map }) => map.name === selectedMap.name)
        : [];
    let result = inScope;
    if (showAllSpots && selectedFish) {
      const allowed = usingHoles
        ? allowedHoleCats(selectedFish.hole)
        : allowedSectorTypes(selectedFish.hole);
      if (allowed) {
        const matched = inScope.filter(({ spot }) =>
          usingHoles
            ? allowed.has(spot.type) || UNIVERSAL_HOLES.has(spot.type)
            : spot.type === "water" || allowed.has(spot.type),
        );
        if (matched.length) result = matched;
      }
    }
    return result.slice(0, MAX_MARKERS);
  }, [spotSource, selectedMap, showAllSpots, selectedFish, usingHoles]);

  const locations: VendorMapLocation[] = useMemo(() => {
    const spotPins: VendorMapLocation[] = visibleSpots.map(({ map, spot }, i) => ({
      id: `spot-${i}`,
      kind: "fish" as const,
      holeType: usingHoles ? spot.type : undefined,
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
  }, [maps, regionName, showAllSpots, visibleSpots, usingHoles]);

  const areas = useMemo(() => maps.map((m) => m.rect), [maps]);

  const highlightIds = useMemo(
    () => [selectedMap?.name, selectedHole?.id].filter((v): v is string => Boolean(v)),
    [selectedMap, selectedHole],
  );

  // Fish selected: fit to the matching spots. Area selected: fly into that area.
  const focusBounds = useMemo(() => {
    if (showAllSpots) return boundsOf(visibleSpots.map(({ spot }) => spot.coord));
    return selectedMap ? selectedMap.rect : null;
  }, [showAllSpots, selectedMap, visibleSpots]);

  // The fish that bite at the selected hole (region fish matching its category).
  const fishAtHole = useMemo(() => {
    const type = selectedHole?.holeType;
    if (!type) return [];
    return fish.filter((f) => fishBitesHole(f.hole, type));
  }, [selectedHole, fish]);

  // Distinct hole types (with counts) for the expanded area summary.
  const areaTypeChips = (mapName: string) => {
    const counts = new Map<string, number>();
    for (const { map, spot } of spotSource) {
      if (map.name !== mapName) continue;
      const label = holeLabel(spot.type);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  if (!maps.length) return null;

  const noun = usingHoles ? "hole" : "spot";
  const hint = selectedHole
    ? "Fish shown bite at this water type in the region. Pick one to map every matching hole."
    : showAllSpots
      ? "Highlighted holes match the selected fish. Click a hole to list its fish."
      : "Pick an area to reveal its fishing holes, then click a hole to see the fish there.";

  return (
    <>
      <div className="absolute inset-0">
        <VendorMap
          locations={locations}
          areas={areas}
          highlightIds={highlightIds}
          focusBounds={focusBounds}
          onSelect={onMapSelect}
        />
      </div>

      {/* Floating position/area filter + context card, overlaying the map. */}
      <div className="absolute left-3 top-3 z-[1000] flex max-h-[calc(100%-1.5rem)] w-[15.5rem] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0d14]/95 shadow-2xl backdrop-blur">
        {selectedFish && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-sky-400/10 px-2.5 py-1.5 text-xs">
            <span className="min-w-0 truncate text-sky-100/90">
              <span className="font-semibold">{selectedFish.name}</span>
              {selectedFish.hole ? ` · ${selectedFish.hole}` : ""}
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

        {selectedHole ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-2.5 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <Icon path={P.fish} className="h-4 w-4 text-sky-300" />
                  {holeLabel(selectedHole.holeType ?? "")} hole
                </div>
                <div className="truncate text-[11px] text-white/45">{selectedHole.zone}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHole(null)}
                className="shrink-0 text-xs text-sky-300/80 transition hover:text-sky-300"
              >
                Back
              </button>
            </div>
            <p className="shrink-0 px-2.5 pt-2 text-[11px] text-white/40">
              {fishAtHole.length} fish bite at {holeLabel(selectedHole.holeType ?? "").toLowerCase()} holes
            </p>
            <ul className="scroll-themed min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
              {fishAtHole.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFish?.(f)}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition hover:bg-white/5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: rarityColor(f.rarity) }}
                    />
                    {f.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.icon} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded" />
                    )}
                    <Link
                      href={`/gw2/item/${itemSlug(f.id, f.name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-0 flex-1 truncate text-xs text-white/85 transition hover:text-sky-300"
                    >
                      {f.name}
                    </Link>
                    <span className={`shrink-0 rounded border px-1 py-0.5 text-[10px] font-medium ${timeChipClass(f.time)}`}>
                      {f.time}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between px-2.5 pb-1 pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Areas
              </span>
              {selectedMap && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-[11px] text-sky-300/80 transition hover:text-sky-300"
                >
                  Reset
                </button>
              )}
            </div>
            <ul className="scroll-themed min-h-0 flex-1 space-y-1 overflow-y-auto px-1.5 pb-1.5">
              {maps.map((m, i) => {
                const active = selected === m.name;
                const count = countByMap.get(m.name) ?? 0;
                return (
                  <li key={m.name}>
                    <button
                      type="button"
                      onClick={() => pickArea(active ? null : m.name)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                        active
                          ? "border-sky-400/50 bg-sky-400/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                          active ? "bg-sky-400 text-black" : "bg-white/10 text-white/70"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-[13px] ${active ? "text-white" : "text-white/80"}`}>
                        {m.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-white/35">
                        {count ? `${count} ${count === 1 ? noun : `${noun}s`}` : "map"}
                      </span>
                    </button>

                    {active && (
                      <div className="mb-1 ml-7 mt-1.5 space-y-2">
                        {count > 0 && (
                          <ul className="flex flex-wrap gap-1">
                            {areaTypeChips(m.name).map(([label, n]) => (
                              <li
                                key={label}
                                className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-100/90"
                              >
                                <Icon path={P.fish} className="h-3 w-3 text-sky-300" />
                                {label}
                                {usingHoles && <span className="text-sky-300/60">×{n}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                        {m.waypoints.length > 0 && (
                          <ul className="space-y-1">
                            {m.waypoints.map((w) => (
                              <li key={w.chat} className="flex items-center gap-1.5">
                                <CopyWaypoint code={w.chat} mini />
                                <span className="min-w-0 flex-1 truncate text-[11px] text-white/55">{w.name}</span>
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
        )}

        <p className="shrink-0 border-t border-white/10 px-2.5 py-1.5 text-[11px] leading-snug text-white/35">
          {hint}
        </p>
      </div>
    </>
  );
}
