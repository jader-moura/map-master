// Gathering materials grouped by profession (Logging / Mining / Harvesting),
// ordered by tier. Item ids verified against the GW2 API (/v2/items). Prices
// are fetched live per id via /api/materials. Node icons are the official
// gathering map icons from /v2/files.
//
// `levels` is the area (map) level range where that tier is gathered, taken
// from the GW2 wiki node pages (e.g. Mithril Ore node = "level 70-80 areas").
// The /gw2-gathering-map highlights open-world maps whose level range overlaps this.
// Foraged plants aren't strictly level-gated, so their ranges are approximate.

export type MatCategoryKey = "wood" | "ore" | "plant";

export type MatItem = { id: number; name: string; tier: string; levels: [number, number] };

export type MatCategory = {
  key: MatCategoryKey;
  label: string;
  blurb: string;
  icon: string;
  items: MatItem[];
};

const R = "https://render.guildwars2.com/file";

export const MATERIAL_CATEGORIES: MatCategory[] = [
  {
    key: "wood",
    label: "Wood, Logging",
    blurb: "Logs harvested from trees with a logging axe.",
    icon: `${R}/FC01BB452D5327A0E5B2E4A3F5EFDF03F8264A7B/157333.png`,
    items: [
      { id: 19723, name: "Green Wood Log", tier: "T1", levels: [1, 15] },
      { id: 19726, name: "Soft Wood Log", tier: "T2", levels: [15, 45] },
      { id: 19727, name: "Seasoned Wood Log", tier: "T3", levels: [30, 60] },
      { id: 19724, name: "Hard Wood Log", tier: "T4", levels: [45, 70] },
      { id: 19722, name: "Elder Wood Log", tier: "T5", levels: [70, 80] },
      { id: 19725, name: "Ancient Wood Log", tier: "T6", levels: [75, 80] },
    ],
  },
  {
    key: "ore",
    label: "Ore & Metal, Mining",
    blurb: "Ore mined from veins with a mining pick.",
    icon: `${R}/A89EB66C39C7C006A4A6CBEDA28061F16847E9BC/157334.png`,
    items: [
      { id: 19697, name: "Copper Ore", tier: "T1", levels: [1, 15] },
      { id: 19699, name: "Iron Ore", tier: "T2", levels: [15, 50] },
      { id: 19703, name: "Silver Ore", tier: "T3", levels: [15, 40] },
      { id: 19698, name: "Gold Ore", tier: "T3", levels: [40, 55] },
      { id: 19702, name: "Platinum Ore", tier: "T4", levels: [45, 70] },
      { id: 19700, name: "Mithril Ore", tier: "T5", levels: [70, 80] },
      { id: 19701, name: "Orichalcum Ore", tier: "T6", levels: [75, 80] },
    ],
  },
  {
    key: "plant",
    label: "Plants & Vegetables, Harvesting",
    blurb: "Vegetables, herbs and produce foraged from plants with a sickle.",
    icon: `${R}/995534EBE5D26804AE605E205E50539821C0CBCB/157332.png`,
    items: [
      { id: 12134, name: "Carrot", tier: "Veg", levels: [1, 25] },
      { id: 12135, name: "Potato", tier: "Veg", levels: [1, 25] },
      { id: 12238, name: "Head of Lettuce", tier: "Veg", levels: [1, 25] },
      { id: 12142, name: "Onion", tier: "Veg", levels: [1, 25] },
      { id: 12163, name: "Head of Garlic", tier: "Veg", levels: [1, 25] },
      { id: 12332, name: "Head of Cabbage", tier: "Veg", levels: [15, 40] },
      { id: 12241, name: "Spinach Leaf", tier: "Veg", levels: [15, 40] },
      { id: 12505, name: "Asparagus Spear", tier: "Veg", levels: [25, 50] },
      { id: 12508, name: "Leek", tier: "Veg", levels: [25, 50] },
      { id: 12334, name: "Portobello Mushroom", tier: "Veg", levels: [15, 40] },
      { id: 12328, name: "Ginger Root", tier: "Herb", levels: [1, 25] },
      { id: 12243, name: "Sage Leaf", tier: "Herb", levels: [15, 40] },
      { id: 12248, name: "Thyme Leaf", tier: "Herb", levels: [25, 50] },
      { id: 12246, name: "Parsley Leaf", tier: "Herb", levels: [15, 40] },
      { id: 12536, name: "Mint Leaf", tier: "Herb", levels: [40, 70] },
      { id: 73113, name: "Cassava Root", tier: "Veg", levels: [80, 80] },
    ],
  },
];

// Flat list of every id we price, for the API route.
export const MATERIAL_IDS: number[] = MATERIAL_CATEGORIES.flatMap((c) =>
  c.items.map((i) => i.id),
);
