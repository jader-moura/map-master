// Gathering materials grouped by profession (Logging / Mining / Harvesting),
// ordered by tier. Item ids verified against the GW2 API (/v2/items). Prices
// are fetched live per id via /api/materials. Node icons are the official
// gathering map icons from /v2/files.

export type MatCategoryKey = "wood" | "ore" | "plant";

export type MatItem = { id: number; tier: string };

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
    label: "Wood — Logging",
    blurb: "Logs harvested from trees with a logging axe.",
    icon: `${R}/FC01BB452D5327A0E5B2E4A3F5EFDF03F8264A7B/157333.png`,
    items: [
      { id: 19723, tier: "T1" }, // Green Wood Log
      { id: 19726, tier: "T2" }, // Soft Wood Log
      { id: 19727, tier: "T3" }, // Seasoned Wood Log
      { id: 19724, tier: "T4" }, // Hard Wood Log
      { id: 19722, tier: "T5" }, // Elder Wood Log
      { id: 19725, tier: "T6" }, // Ancient Wood Log
    ],
  },
  {
    key: "ore",
    label: "Ore & Metal — Mining",
    blurb: "Ore mined from veins with a mining pick.",
    icon: `${R}/A89EB66C39C7C006A4A6CBEDA28061F16847E9BC/157334.png`,
    items: [
      { id: 19697, tier: "T1" }, // Copper Ore
      { id: 19699, tier: "T2" }, // Iron Ore
      { id: 19703, tier: "T3" }, // Silver Ore
      { id: 19698, tier: "T3" }, // Gold Ore
      { id: 19702, tier: "T4" }, // Platinum Ore
      { id: 19700, tier: "T5" }, // Mithril Ore
      { id: 19701, tier: "T6" }, // Orichalcum Ore
    ],
  },
  {
    key: "plant",
    label: "Plants & Vegetables — Harvesting",
    blurb: "Vegetables, herbs and produce foraged from plants with a sickle.",
    icon: `${R}/995534EBE5D26804AE605E205E50539821C0CBCB/157332.png`,
    items: [
      { id: 12134, tier: "Veg" }, // Carrot
      { id: 12135, tier: "Veg" }, // Potato
      { id: 12238, tier: "Veg" }, // Head of Lettuce
      { id: 12142, tier: "Veg" }, // Onion
      { id: 12163, tier: "Veg" }, // Head of Garlic
      { id: 12332, tier: "Veg" }, // Head of Cabbage
      { id: 12241, tier: "Veg" }, // Spinach Leaf
      { id: 12505, tier: "Veg" }, // Asparagus Spear
      { id: 12508, tier: "Veg" }, // Leek
      { id: 12334, tier: "Veg" }, // Portobello Mushroom
      { id: 12328, tier: "Herb" }, // Ginger Root
      { id: 12243, tier: "Herb" }, // Sage Leaf
      { id: 12248, tier: "Herb" }, // Thyme Leaf
      { id: 12246, tier: "Herb" }, // Parsley Leaf
      { id: 12536, tier: "Herb" }, // Mint Leaf
      { id: 73113, tier: "Veg" }, // Cassava Root
    ],
  },
];

// Flat list of every id we price, for the API route.
export const MATERIAL_IDS: number[] = MATERIAL_CATEGORIES.flatMap((c) =>
  c.items.map((i) => i.id),
);
