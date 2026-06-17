// Points of interest for the Tyria map (continent 1, floor 1), sourced from
// https://api.guildwars2.com/v2/continents/1/floors/1
//
// Icons are the official in-game map icons from https://api.guildwars2.com/v2/files
// (ids map_waypoint, map_poi, map_vista, map_heart_full, map_heropoint,
// map_dungeon) served via render.guildwars2.com.

export type PoiKind =
  | "waypoint"
  | "travel"
  | "portal"
  | "vista"
  | "heart"
  | "hero"
  | "masteryTyria"
  | "masteryMaguuma"
  | "masteryDesert"
  | "masteryTundra"
  | "masteryJade"
  | "masterySky"
  | "masteryWild"
  | "masteryMagic"
  | "landmark";

export type PoiMarker = {
  name: string;
  coord: [number, number]; // GW2 continent coordinates
  /** Per-marker icon override (used by mastery points, coloured by region). */
  icon?: string;
};

export type PoiData = Record<PoiKind, PoiMarker[]>;

const R = "https://render.guildwars2.com/file";
const W = "https://wiki.guildwars2.com/images";

// The mastery tracks, each its own toggleable map layer. `region` is the value
// the GW2 API puts on a map's mastery_points[].region; `kind` is our layer key;
// `icon` is the in-game-coloured Mastery Insight map icon for that track.
// "Magic" is the Castoran (Visions of Eternity) track.
export type MasteryTrack = { region: string; kind: PoiKind; label: string; icon: string };
export const MASTERY_TRACKS: MasteryTrack[] = [
  { region: "Tyria", kind: "masteryTyria", label: "Central Tyria", icon: `${W}/3/32/Mastery_insight_%28Central_Tyria%29_%28map_icon%29.png` },
  { region: "Maguuma", kind: "masteryMaguuma", label: "Heart of Thorns", icon: `${W}/4/45/Mastery_insight_%28Heart_of_Thorns%29_%28map_icon%29.png` },
  { region: "Desert", kind: "masteryDesert", label: "Path of Fire", icon: `${W}/9/9e/Mastery_insight_%28Path_of_Fire%29_%28map_icon%29.png` },
  { region: "Tundra", kind: "masteryTundra", label: "Icebrood Saga", icon: `${W}/d/df/Mastery_insight_%28Icebrood_Saga%29_%28map_icon%29.png` },
  { region: "Jade", kind: "masteryJade", label: "End of Dragons", icon: `${W}/5/5d/Mastery_insight_%28End_of_Dragons%29_%28map_icon%29.png` },
  { region: "Sky", kind: "masterySky", label: "Secrets of the Obscure", icon: `${W}/7/74/Mastery_insight_%28Secrets_of_the_Obscure%29_%28map_icon%29.png` },
  { region: "Wild", kind: "masteryWild", label: "Janthir Wilds", icon: `${W}/d/d4/Mastery_insight_%28Janthir_Wilds%29_%28map_icon%29.png` },
  { region: "Magic", kind: "masteryMagic", label: "Visions of Eternity", icon: `${W}/8/8a/Mastery_insight_%28Visions_of_Eternity%29_%28map_icon%29.png` },
];

/** API mastery region -> our layer kind, for bucketing mastery points. */
export const MASTERY_REGION_KIND: Record<string, PoiKind> = Object.fromEntries(
  MASTERY_TRACKS.map((t) => [t.region, t.kind]),
);
/** Fallback layer for an unrecognised mastery region (kept visible, not dropped). */
export const MASTERY_KIND_FALLBACK: PoiKind = "masteryTyria";

// Render order in the sidebar. Landmarks are last + off by default (2675 of them).
export const POI_KINDS: PoiKind[] = [
  "waypoint",
  "travel",
  "portal",
  "vista",
  "heart",
  "hero",
  ...MASTERY_TRACKS.map((t) => t.kind),
  "landmark",
];

// Generic green portal map icon (the swirl used in-game for story/event
// portals such as The Snaff Prize). The /v2/files API has no portal icon, so we
// use the wiki's hotlinkable copy — same source pattern as the boss images.
const GREEN_PORTAL_ICON =
  "https://wiki.guildwars2.com/images/1/1b/Personal_Story_Portal_%28map_icon%29.png";

// `minZoom` gates each kind to a zoom level, like the in-game map: far out you
// only see waypoints/portals; the denser, smaller icons reveal as you zoom in.
// This keeps the rendered marker count low at wide zoom. (map min 2, max 7)
type PoiMeta = { label: string; iconUrl: string; size: number; defaultOn: boolean; minZoom: number };
const POI_META_BASE: Partial<Record<PoiKind, PoiMeta>> = {
  waypoint: { label: "Waypoints", iconUrl: `${R}/32633AF8ADEA696A1EF56D3AE32D617B10D3AC57/157353.png`, size: 22, defaultOn: true, minZoom: 2 },
  travel: { label: "Map Portals", iconUrl: GREEN_PORTAL_ICON, size: 22, defaultOn: true, minZoom: 2 },
  portal: { label: "Dungeons & Fractals", iconUrl: `${R}/943538394A94A491C8632FBEF6203C2013443555/102478.png`, size: 22, defaultOn: true, minZoom: 3 },
  vista: { label: "Vistas", iconUrl: `${R}/A2C16AF497BA3A0903A0499FFBAF531477566F10/358415.png`, size: 20, defaultOn: true, minZoom: 3 },
  heart: { label: "Renown Hearts", iconUrl: `${R}/B3DEEC72BBEF0C6FC6FEF835A0E275FCB1151BB7/102439.png`, size: 20, defaultOn: true, minZoom: 3 },
  hero: { label: "Hero Challenges", iconUrl: `${R}/B4EC6BB3FDBC42557C3CAE0CAA9E57EBF9E462E3/156626.png`, size: 20, defaultOn: true, minZoom: 3 },
  landmark: { label: "Points of Interest", iconUrl: `${R}/25B230711176AB5728E86F5FC5F0BFAE48B32F6E/97461.png`, size: 18, defaultOn: false, minZoom: 3 },
};
// One layer per mastery track, coloured by its in-game insight icon.
for (const t of MASTERY_TRACKS) {
  POI_META_BASE[t.kind] = { label: t.label, iconUrl: t.icon, size: 20, defaultOn: true, minZoom: 3 };
}
export const POI_META = POI_META_BASE as Record<PoiKind, PoiMeta>;

// Curated green map-transition portals. These are NOT in the GW2 API, so the
// coordinates below are anchored to verified in-game POIs/waypoints from
// /v2/continents/1/floors/1. The asura gate network links the six capital
// cities through Lion's Arch's Gate Hub Plaza. Extend this list as needed.
export const TRAVEL_PORTALS: PoiMarker[] = [
  { name: "Gate Hub Plaza, asura gates to all capitals", coord: [49309.1, 31222.8] }, // Lion's Arch
  { name: "Mist Portals, Fractals & WvW", coord: [49399.2, 31822.6] }, // Lion's Arch
  { name: "Asura gate to Lion's Arch", coord: [44266.4, 26928.4] }, // Divinity's Reach
  { name: "Asura gate to Lion's Arch", coord: [53676.8, 30665.0] }, // Hoelbrak
  { name: "Asura gate to Lion's Arch", coord: [57089.0, 30642.5] }, // Black Citadel
  { name: "Asura gate to Lion's Arch", coord: [43213.5, 37448.8] }, // The Grove
  { name: "Asura gate to Lion's Arch", coord: [38742.8, 37098.1] }, // Rata Sum
];
