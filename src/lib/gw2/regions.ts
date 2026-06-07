// Continent-1 regions for the map "jump to region" control, mirroring the
// in-game world map navigator. Names + label coordinates come straight from
// https://api.guildwars2.com/v2/continents/1/floors/1/regions (label_coord is
// the region's labelled centre). Grouped core Tyria vs. expansion content.

export type Region = {
  name: string;
  coord: [number, number]; // GW2 continent coordinates (region label centre)
  zoom?: number; // target zoom on jump (defaults handled by the control)
};

export const REGION_GROUPS: { label: string; regions: Region[] }[] = [
  {
    label: "Central Tyria",
    regions: [
      { name: "Kryta", coord: [46208, 30080] },
      { name: "Ascalon", coord: [59648, 28928] },
      { name: "Shiverpeak Mountains", coord: [52608, 29952] },
      { name: "Steamspur Mountains", coord: [51072, 37624] },
      { name: "Maguuma Wastes", coord: [36568, 28384] },
      { name: "Tarnished Coast", coord: [41216, 37344] },
      { name: "Ruins of Orr", coord: [46368, 42112] },
      { name: "Ring of Fire", coord: [37968, 42384] },
    ],
  },
  {
    label: "Expansions & Beyond",
    regions: [
      { name: "Heart of Maguuma", coord: [35868, 34484] },
      { name: "Crystal Desert", coord: [55118, 62384], zoom: 4 },
      { name: "Cantha", coord: [28750, 101100], zoom: 4 },
      { name: "Horn of Maguuma", coord: [26250, 22275] },
      { name: "Janthir", coord: [34440, 16252] },
      { name: "Castora", coord: [7803, 60940] },
    ],
  },
];
