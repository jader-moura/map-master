import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import {
  TRAVEL_PORTALS,
  MASTERY_ICONS,
  MASTERY_ICON_FALLBACK,
  type PoiData,
  type PoiKind,
} from "@/lib/gw2/pois";

// Continent 1 spreads its maps across many floors. Floor 1 is the base floor and
// covers central Tyria + Heart of Maguuma + Cantha + Janthir + Horn of Maguuma +
// Castora, but the Crystal Desert / Path of Fire maps come back EMPTY on it — their
// POIs only populate on floor 49. We fetch both and merge so every map gets layers.
const FLOORS = [1, 49];
const floorUrl = (f: number) =>
  `https://api.guildwars2.com/v2/continents/1/floors/${f}`;

type RawPoi = { name?: string; type: string; coord: [number, number] };
type RawTask = { objective?: string; coord: [number, number] };
type RawHero = { coord: [number, number] };
type RawMastery = { coord: [number, number]; region?: string };
type RawMap = {
  points_of_interest?: Record<string, RawPoi>;
  tasks?: Record<string, RawTask>;
  skill_challenges?: RawHero[];
  mastery_points?: RawMastery[];
};
type RawFloor = { regions: Record<string, { maps: Record<string, RawMap> }> };

// Fetch the (large, ~8MB) floor once and slim it to a compact marker list.
// unstable_cache stores the *slimmed* result, so we only pull the big payload
// on a cache miss (weekly).
const getPois = unstable_cache(
  async (): Promise<PoiData> => {
    const data: PoiData = { waypoint: [], travel: TRAVEL_PORTALS, portal: [], vista: [], heart: [], hero: [], mastery: [], landmark: [] };

    // Dedup markers by rounded coordinate — a map can appear (populated) on more
    // than one floor, and distinct POIs never share the same coordinate.
    const seen = new Set<string>();
    const add = (
      bucket: PoiData[PoiKind],
      name: string,
      coord: [number, number],
      icon?: string,
    ) => {
      const key = `${Math.round(coord[0])},${Math.round(coord[1])}`;
      if (seen.has(key)) return;
      seen.add(key);
      bucket.push(icon ? { name, coord, icon } : { name, coord });
    };

    for (const f of FLOORS) {
      const res = await fetch(floorUrl(f), {
        headers: { "User-Agent": "buildop (buildop.app)" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`floor ${f} fetch failed: ${res.status}`);
      const floor = (await res.json()) as RawFloor;

      for (const region of Object.values(floor.regions ?? {})) {
        for (const map of Object.values(region.maps ?? {})) {
          for (const poi of Object.values(map.points_of_interest ?? {})) {
            if (poi.type === "waypoint") add(data.waypoint, poi.name ?? "Waypoint", poi.coord);
            else if (poi.type === "landmark") add(data.landmark, poi.name ?? "Point of Interest", poi.coord);
            else if (poi.type === "vista") add(data.vista, poi.name ?? "Vista", poi.coord);
            // "unlock" POIs are dungeon/instance portals; the game renders them with the dungeon icon.
            else if (poi.type === "unlock") add(data.portal, poi.name ?? "Portal", poi.coord);
          }
          for (const task of Object.values(map.tasks ?? {})) {
            add(data.heart, task.objective ?? "Renown Heart", task.coord);
          }
          for (const hero of map.skill_challenges ?? []) {
            if (hero.coord) add(data.hero, "Hero Challenge", hero.coord);
          }
          for (const mp of map.mastery_points ?? []) {
            if (mp.coord)
              add(
                data.mastery,
                "Mastery Insight",
                mp.coord,
                (mp.region && MASTERY_ICONS[mp.region]) || MASTERY_ICON_FALLBACK,
              );
          }
        }
      }
    }
    return data;
  },
  ["gw2-pois-c1-v4"],
  { revalidate: 60 * 60 * 24 * 7 }, // refresh weekly
);

export async function GET() {
  try {
    const data = await getPois();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load POIs" },
      { status: 502 },
    );
  }
}
