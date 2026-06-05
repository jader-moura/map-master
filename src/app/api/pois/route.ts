import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import type { PoiData } from "@/lib/gw2/pois";

const FLOOR_URL = "https://api.guildwars2.com/v2/continents/1/floors/1";

type RawPoi = { name?: string; type: string; coord: [number, number] };
type RawTask = { objective?: string; coord: [number, number] };
type RawHero = { coord: [number, number] };
type RawMap = {
  points_of_interest?: Record<string, RawPoi>;
  tasks?: Record<string, RawTask>;
  skill_challenges?: RawHero[];
};
type RawFloor = { regions: Record<string, { maps: Record<string, RawMap> }> };

// Fetch the (large, ~8MB) floor once and slim it to a compact marker list.
// unstable_cache stores the *slimmed* result, so we only pull the big payload
// on a cache miss (weekly).
const getPois = unstable_cache(
  async (): Promise<PoiData> => {
    const res = await fetch(FLOOR_URL, {
      headers: { "User-Agent": "gw2-map MapMaster" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`floor fetch failed: ${res.status}`);
    const floor = (await res.json()) as RawFloor;

    const data: PoiData = { waypoint: [], landmark: [], vista: [], heart: [], hero: [] };

    for (const region of Object.values(floor.regions ?? {})) {
      for (const map of Object.values(region.maps ?? {})) {
        for (const poi of Object.values(map.points_of_interest ?? {})) {
          if (poi.type === "waypoint") data.waypoint.push({ name: poi.name ?? "Waypoint", coord: poi.coord });
          else if (poi.type === "landmark") data.landmark.push({ name: poi.name ?? "Point of Interest", coord: poi.coord });
          else if (poi.type === "vista") data.vista.push({ name: poi.name ?? "Vista", coord: poi.coord });
        }
        for (const task of Object.values(map.tasks ?? {})) {
          data.heart.push({ name: task.objective ?? "Renown Heart", coord: task.coord });
        }
        for (const hero of map.skill_challenges ?? []) {
          if (hero.coord) data.hero.push({ name: "Hero Challenge", coord: hero.coord });
        }
      }
    }
    return data;
  },
  ["gw2-pois-c1-f1"],
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
