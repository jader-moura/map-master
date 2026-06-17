// Builds src/lib/gw2/fishingMaps.ts: for each fishing region, the Tyria maps it
// covers with their continent rectangle, centre, waypoints, and water "fishing
// spots" (sectors named after water bodies, e.g. "Bay of Elon").
//
// The GW2 API has no fishing-hole coordinates, so we approximate fishing spots
// with map sectors whose name looks like a body of water. A sector centre is not
// guaranteed to sit on water, but for bays/lakes/rivers it usually does.
//
// Sources: /v2/maps (rect + which floors a map lives on) and
// /v2/continents/1/floors/{floor}/regions/{region}/maps/{map} (waypoints +
// sectors). Run: node scripts/sync-fishing-maps.mjs

import { writeFile } from "node:fs/promises";

const API = "https://api.guildwars2.com/v2";
const OUT = new URL("../src/lib/gw2/fishingMaps.ts", import.meta.url);
const UA = { "User-Agent": "buildop sync (buildop.app)" };

// Fetch JSON with retries; returns null on a non-OK status (so we can probe
// several floors for one that actually serves a map).
async function gw2(path) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(`${API}/${path}`, { headers: UA });
      if (r.ok) return r.json();
      if (r.status === 404 || r.status === 400) return null;
    } catch {
      /* network blip, retry */
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return null;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const round = (n) => Math.round(n);

// Sector names that look like fishable water (with a few desert false positives
// excluded, e.g. the "Sand Sea" in Crystal Oasis).
const WATER =
  /\b(bay|lake|river|sea|cove|lagoon|strait|channel|pool|delta|marsh|sound|falls|cascade|shore|coast|waters?|pond|creek|basin|gulf|inlet|fjord|rapids|springs?|mere|loch|brook|estuary|tide|depths|spillway|swamp|fen|bog|mire|oasis|stream|reef|harbou?r|wharf|bayou|wash|drift|flood|sunken|deeps?)\b/i;
const NOT_WATER = /sand\s*sea/i;
const isWater = (name) => WATER.test(name) && !NOT_WATER.test(name);

// Classify a water sector by the kind of water its name suggests, so the page
// can match a fish (which the API tags only with a water *type*, e.g. "Lake
// Fish") to type-appropriate sectors. "water" is the generic catch-all that
// shows for any fish. First match wins.
function spotType(name) {
  if (/\b(river|stream|creek|brook|rapids|delta|spillway|cascade|falls|estuary|flow|run)\b/i.test(name)) return "river";
  if (/\b(lake|pond|mere|loch|reservoir|basin|pool)\b/i.test(name)) return "lake";
  if (/\b(marsh|swamp|fen|bog|mire|bayou|moor|wallow)\b/i.test(name)) return "marsh";
  if (/\b(oasis|springs?|well)\b/i.test(name)) return "oasis";
  if (/\b(sea|bay|cove|lagoon|gulf|sound|strait|shore|coast|harbou?r|wharf|pier|inlet|fjord|reef|tide|tidal)\b/i.test(name)) return "coast";
  return "water";
}

// Fishing region slug -> the Tyria maps that make up that fishing area. Names
// must match /v2/maps. Saltwater and World Class span every coast, so they have
// no single area and are omitted (the page hides the map for them).
const REGION_MAP_NAMES = {
  ascalonian: ["Plains of Ashford", "Diessa Plateau", "Fields of Ruin", "Blazeridge Steppes", "Iron Marches", "Fireheart Rise", "Black Citadel"],
  krytan: ["Queensdale", "Kessex Hills", "Gendarran Fields", "Harathi Hinterlands", "Bloodtide Coast", "Lake Doric", "Divinity's Reach", "Lion's Arch"],
  orrian: ["Straits of Devastation", "Malchor's Leap", "Cursed Shore", "Siren's Landing"],
  shiverpeaks: ["Wayfarer Foothills", "Snowden Drifts", "Lornar's Pass", "Dredgehaunt Cliffs", "Timberline Falls", "Frostgorge Sound", "Bitterfrost Frontier", "Bjora Marches", "Hoelbrak"],
  maguuma: ["Caledon Forest", "Metrica Province", "Brisban Wildlands", "Sparkfly Fen", "Mount Maelstrom", "Dry Top", "The Silverwastes"],
  desert: ["Crystal Oasis", "Desert Highlands", "Elon Riverlands", "The Desolation", "Domain of Vabbi", "Jahai Bluffs", "Thunderhead Peaks"],
  "desert-isles": ["Domain of Istan", "Sandswept Isles", "Domain of Kourna"],
  "ring-of-fire": ["Ember Bay", "Draconis Mons"],
  kaineng: ["New Kaineng City"],
  "seitung-province": ["Seitung Province"],
  "echovald-wilds": ["The Echovald Wilds"],
  "dragons-end": ["Dragon's End"],
  janthir: ["Lowland Shore", "Janthir Syntri", "Bava Nisos"],
  "horn-of-maguuma": ["Skywatch Archipelago", "Amnytas", "Inner Nayos", "The Wizard's Tower"],
  castora: ["Eternity's Garden", "Shipwreck Strand", "Starlit Weald"],
  "mistburned-barrens": ["Mistburned Barrens"],
};

console.log("Fetching map list…");
const maps = await gw2("maps?ids=all");
const metaByName = new Map();
for (const m of maps) {
  if (m.continent_id === 1 && m.continent_rect && !metaByName.has(m.name)) metaByName.set(m.name, m);
}

// Fetch a map's full floor data (waypoints + sectors), trying each floor it lists
// until one serves it (default_floor is sometimes wrong for expansion maps).
async function mapData(meta) {
  const floors = [meta.default_floor, ...(meta.floors ?? [])].filter((f, i, a) => a.indexOf(f) === i);
  for (const f of floors) {
    const data = await gw2(`continents/1/floors/${f}/regions/${meta.region_id}/maps/${meta.id}`);
    if (data && (data.points_of_interest || data.sectors)) return data;
  }
  return null;
}

const out = {};
const unresolved = [];
for (const [slug, names] of Object.entries(REGION_MAP_NAMES)) {
  const entries = [];
  for (const name of names) {
    const meta = metaByName.get(name);
    if (!meta) {
      unresolved.push(`${slug}: ${name} (no map)`);
      continue;
    }
    const cr = meta.continent_rect;
    const center = [round((cr[0][0] + cr[1][0]) / 2), round((cr[0][1] + cr[1][1]) / 2)];
    const data = await mapData(meta);

    const waypoints = data
      ? Object.values(data.points_of_interest ?? {})
          .filter((p) => p.type === "waypoint" && p.chat_link && Array.isArray(p.coord))
          .sort((a, b) => dist(a.coord, center) - dist(b.coord, center))
          .map((p) => ({ name: p.name || `${name} Waypoint`, chat: p.chat_link, coord: [round(p.coord[0]), round(p.coord[1])] }))
      : [];

    const spots = data
      ? Object.values(data.sectors ?? {})
          .filter((s) => s.name && Array.isArray(s.coord) && isWater(s.name))
          .map((s) => ({ name: s.name, type: spotType(s.name), coord: [round(s.coord[0]), round(s.coord[1])] }))
          .slice(0, 20)
      : [];

    entries.push({
      name,
      center,
      rect: [[round(cr[0][0]), round(cr[0][1])], [round(cr[1][0]), round(cr[1][1])]],
      waypoints,
      spots,
    });
    console.log(`  ${slug}/${name}: ${waypoints.length} wps, ${spots.length} spots`);
  }
  out[slug] = entries;
}

const ts = `// AUTO-GENERATED by scripts/sync-fishing-maps.mjs — do not edit by hand.
// Per fishing-region map geometry: the Tyria maps each region covers, with their
// continent rectangle, centre, waypoints, and water "fishing spots" (sectors
// named after a body of water). Sources: GW2 API /v2/maps + floor sector data.

export type FishingSpot = {
  /** Sector / water-body name, e.g. "Bay of Elon". */
  name: string;
  /** Water category from the name: river | lake | marsh | oasis | coast | water. */
  type: string;
  /** Approximate position in continent coordinates (the sector centre). */
  coord: [number, number];
};

export type FishingWaypoint = {
  name: string;
  /** Copy-ready waypoint chat code. */
  chat: string;
  coord: [number, number];
};

export type FishingMap = {
  name: string;
  /** Centre point in continent coordinates. */
  center: [number, number];
  /** Bounding rectangle [[x0,y0],[x1,y1]] in continent coordinates. */
  rect: [[number, number], [number, number]];
  /** Waypoints inside the map (to travel to before fishing). */
  waypoints: FishingWaypoint[];
  /** Approximate water fishing spots (sector centres). */
  spots: FishingSpot[];
};

export const FISHING_REGION_MAPS: Record<string, FishingMap[]> = ${JSON.stringify(out, null, 2)};
`;

await writeFile(OUT, ts, "utf8");
const total = Object.values(out).reduce((n, a) => n + a.length, 0);
const withSpots = Object.values(out).reduce((n, a) => n + a.filter((e) => e.spots.length).length, 0);
console.log(`\nWrote ${Object.keys(out).length} regions, ${total} maps (${withSpots} with water spots).`);
if (unresolved.length) console.log("Unresolved:\n  " + unresolved.join("\n  "));
