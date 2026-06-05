// Points of interest for the Tyria map (continent 1, floor 1), sourced from
// https://api.guildwars2.com/v2/continents/1/floors/1
//
// Icons are the official in-game map icons from https://api.guildwars2.com/v2/files
// (ids map_waypoint, map_poi, map_vista, map_heart_full, map_heropoint,
// map_dungeon) served via render.guildwars2.com.

export type PoiKind = "waypoint" | "portal" | "vista" | "heart" | "hero" | "landmark";

export type PoiMarker = {
  name: string;
  coord: [number, number]; // GW2 continent coordinates
};

export type PoiData = Record<PoiKind, PoiMarker[]>;

// Render order in the sidebar. Landmarks are last + off by default (2675 of them).
export const POI_KINDS: PoiKind[] = ["waypoint", "portal", "vista", "heart", "hero", "landmark"];

const R = "https://render.guildwars2.com/file";

export const POI_META: Record<
  PoiKind,
  { label: string; iconUrl: string; size: number; defaultOn: boolean }
> = {
  waypoint: { label: "Waypoints", iconUrl: `${R}/32633AF8ADEA696A1EF56D3AE32D617B10D3AC57/157353.png`, size: 22, defaultOn: true },
  portal: { label: "Portals & Dungeons", iconUrl: `${R}/943538394A94A491C8632FBEF6203C2013443555/102478.png`, size: 22, defaultOn: true },
  vista: { label: "Vistas", iconUrl: `${R}/A2C16AF497BA3A0903A0499FFBAF531477566F10/358415.png`, size: 20, defaultOn: true },
  heart: { label: "Renown Hearts", iconUrl: `${R}/B3DEEC72BBEF0C6FC6FEF835A0E275FCB1151BB7/102439.png`, size: 20, defaultOn: true },
  hero: { label: "Hero Challenges", iconUrl: `${R}/B4EC6BB3FDBC42557C3CAE0CAA9E57EBF9E462E3/156626.png`, size: 20, defaultOn: true },
  landmark: { label: "Points of Interest", iconUrl: `${R}/25B230711176AB5728E86F5FC5F0BFAE48B32F6E/97461.png`, size: 18, defaultOn: false },
};
