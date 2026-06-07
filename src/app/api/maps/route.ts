import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const BASE = "https://api.guildwars2.com/v2";
const UA = { "User-Agent": "buildop (buildop.app)" };

export type GatherZone = {
  id: number;
  name: string;
  levels: [number, number]; // [min_level, max_level]
  rect: [[number, number], [number, number]]; // continent_rect
  region: string;
};

type RawMap = {
  id: number;
  name?: string;
  type?: string;
  continent_id?: number;
  region_name?: string;
  min_level?: number;
  max_level?: number;
  continent_rect?: [[number, number], [number, number]];
};

// Instanced "Public" maps that are festival/strike/meta/raid/guild-hall/hub
// rather than explorable gathering zones. min_level === 0 already drops cities.
const EXCLUDE =
  /\((Public|Private)\)|Pavilion|Labyrinthine Cliffs|Celestial Challenge|Spirit Vale|Convergence|Marionette|Dragonstorm|Dragon Arena|Battle For Lion's Arch|Memory of Old|Aerodrome|Arborstone|Wizard's Tower|Windswept Haven|Gilded Hollow|Lost Precipice|Isle of Reflection|\(Heart of Thorns\)/;

async function gw2<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

// Build the slim gathering-zone list. Cached weekly so the ~6 upstream calls
// only happen on a cache miss.
const getGatherZones = unstable_cache(
  async (): Promise<GatherZone[]> => {
    const ids = await gw2<number[]>("maps");
    const out: GatherZone[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200).join(",");
      const objs = await gw2<RawMap[]>(`maps?ids=${chunk}`);
      for (const m of objs) {
        if (
          m.continent_id !== 1 ||
          m.type !== "Public" ||
          !m.name ||
          !m.continent_rect ||
          (m.min_level ?? 0) < 1 ||
          (m.max_level ?? 0) < 1 ||
          EXCLUDE.test(m.name) ||
          seen.has(m.name)
        ) {
          continue;
        }
        seen.add(m.name);
        out.push({
          id: m.id,
          name: m.name,
          levels: [m.min_level as number, m.max_level as number],
          rect: m.continent_rect,
          region: m.region_name ?? "",
        });
      }
    }
    out.sort((a, b) => a.levels[0] - b.levels[0] || a.levels[1] - b.levels[1]);
    return out;
  },
  ["gw2-gather-maps-c1-v1"],
  { revalidate: 60 * 60 * 24 * 7 },
);

export async function GET() {
  try {
    const maps = await getGatherZones();
    return NextResponse.json(
      { maps, updated: Date.now() },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load maps" },
      { status: 502 },
    );
  }
}
