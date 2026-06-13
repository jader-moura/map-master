import { MAP_WAYPOINTS, REGION_MAPS, type MapWaypoint } from "@/lib/gw2/mapWaypoints";

export type ResolvedMap = { map: string } & MapWaypoint;

// Region adjectives/words used in achievement requirements -> API region name.
const REGION_ALIASES: Record<string, string> = {
  ascalon: "Ascalon",
  ascalonian: "Ascalon",
  krytan: "Kryta",
  kryta: "Kryta",
  shiverpeak: "Shiverpeak Mountains",
  shiverpeaks: "Shiverpeak Mountains",
  orrian: "Ruins of Orr",
};

// City / hub maps that have no open-world events, excluded from region expansion.
const NO_EVENT_MAPS = new Set([
  "Divinity's Reach",
  "Lion's Arch",
  "Black Citadel",
  "Hoelbrak",
  "The Grove",
  "Rata Sum",
  "Eye of the North",
  "Mistlock Sanctuary",
]);

const ALL_MAP_NAMES = Object.keys(MAP_WAYPOINTS);

function pack(names: Iterable<string>): ResolvedMap[] {
  const out: ResolvedMap[] = [];
  const seen = new Set<string>();
  for (const map of names) {
    if (seen.has(map) || !MAP_WAYPOINTS[map]) continue;
    seen.add(map);
    out.push({ map, ...MAP_WAYPOINTS[map] });
  }
  return out;
}

/**
 * Resolve the maps an event-completion achievement refers to, into per-map
 * waypoints. Tries, in order: an explicit "...maps: A, B, and C" list, a named
 * region ("the Ascalon region"), then any map named directly in the text.
 */
export function resolveEventMaps(text: string | null | undefined): ResolvedMap[] {
  if (!text) return [];
  const lower = text.toLowerCase();

  // 1. Explicit list after "maps:".
  const at = lower.indexOf("maps:");
  if (at !== -1) {
    const after = text.slice(at + 5);
    const named = after
      .split(/,|\band\b/i)
      .map((s) => s.replace(/[.;]/g, "").trim())
      .filter((s) => MAP_WAYPOINTS[s]);
    if (named.length) return pack(named);
  }

  // 2. Named region.
  for (const [word, region] of Object.entries(REGION_ALIASES)) {
    if (new RegExp(`\\b${word}\\b`).test(lower) && REGION_MAPS[region]) {
      const maps = REGION_MAPS[region].filter((m) => !NO_EVENT_MAPS.has(m));
      if (maps.length) return pack(maps);
    }
  }

  // 3. Any map named directly in the text.
  return pack(ALL_MAP_NAMES.filter((m) => text.includes(m)));
}
