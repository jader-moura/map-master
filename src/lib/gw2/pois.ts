// Points of interest for the Tyria map (continent 1, floor 1), sourced from
// https://api.guildwars2.com/v2/continents/1/floors/1

export type PoiKind = "waypoint" | "landmark" | "vista" | "heart" | "hero";

export type PoiMarker = {
  name: string;
  coord: [number, number]; // GW2 continent coordinates
};

export type PoiData = Record<PoiKind, PoiMarker[]>;

export const POI_KINDS: PoiKind[] = ["waypoint", "landmark", "vista", "heart", "hero"];

export const POI_META: Record<
  PoiKind,
  { label: string; color: string; radius: number; defaultOn: boolean }
> = {
  waypoint: { label: "Waypoints", color: "#3b82f6", radius: 4, defaultOn: true },
  landmark: { label: "Points of Interest", color: "#e5e7eb", radius: 3, defaultOn: false },
  vista: { label: "Vistas", color: "#06b6d4", radius: 4, defaultOn: true },
  heart: { label: "Renown Hearts", color: "#f43f5e", radius: 4, defaultOn: true },
  hero: { label: "Hero Challenges", color: "#eab308", radius: 4, defaultOn: true },
};
