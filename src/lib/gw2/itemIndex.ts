// Curated index of notable Guild Wars 2 items, grouped for the /gw2/items hub.
// The hub is the SEO entry point that links to every per-item page, so crawlers
// (and players) have a browseable path into the item database.
//
// We hand-pick well-known items rather than dumping all ~70k API items: a
// focused, fast page beats an unusable wall of links, and every id here is
// verified against /v2/items so no link 404s. Icons + rarity are fetched live
// on the page by id, so this list only needs id + name.

import { MATERIAL_CATEGORIES } from "./materials";

export type IndexItem = { id: number; name: string };
export type IndexGroup = { label: string; blurb: string; items: IndexItem[] };

export const ITEM_GROUPS: IndexGroup[] = [
  {
    label: "Economy staples",
    blurb:
      "The high-volume items the Guild Wars 2 economy revolves around, used in countless recipes and the Mystic Forge.",
    items: [
      { id: 19721, name: "Glob of Ectoplasm" },
      { id: 19976, name: "Mystic Coin" },
      { id: 19675, name: "Mystic Clover" },
      { id: 24277, name: "Pile of Crystalline Dust" },
      { id: 20796, name: "Philosopher's Stone" },
    ],
  },
  {
    label: "Refined materials",
    blurb: "Ingots and planks refined at a crafting station from raw ore and logs.",
    items: [
      { id: 19687, name: "Silver Ingot" },
      { id: 19688, name: "Steel Ingot" },
      { id: 19686, name: "Platinum Ingot" },
      { id: 19684, name: "Mithril Ingot" },
      { id: 19685, name: "Orichalcum Ingot" },
      { id: 19713, name: "Soft Wood Plank" },
      { id: 19712, name: "Ancient Wood Plank" },
    ],
  },
  {
    label: "Ascended materials",
    blurb: "Time-gated, daily-crafted components used to make ascended gear.",
    items: [
      { id: 46742, name: "Lump of Mithrillium" },
      { id: 46744, name: "Glob of Elder Spirit Residue" },
      { id: 46740, name: "Spool of Silk Weaving Thread" },
      { id: 46745, name: "Spool of Thick Elonian Cord" },
    ],
  },
  {
    label: "Fine crafting materials",
    blurb: "Tier 6 trophy materials salvaged from level 80 foes, central to high-end crafting.",
    items: [
      { id: 24295, name: "Vial of Powerful Blood" },
      { id: 24358, name: "Ancient Bone" },
      { id: 24351, name: "Vicious Claw" },
      { id: 24357, name: "Vicious Fang" },
      { id: 24289, name: "Armored Scale" },
      { id: 24300, name: "Elaborate Totem" },
      { id: 24283, name: "Powerful Venom Sac" },
    ],
  },
  {
    label: "Quartz",
    blurb: "Quartz Crystals charged daily at a place of power into Charged Quartz Crystals.",
    items: [
      { id: 43773, name: "Quartz Crystal" },
      { id: 43772, name: "Charged Quartz Crystal" },
    ],
  },
];

// Gathering materials reuse the verified list that drives the gathering map and
// material prices, exposed here in the hub's group shape.
export const GATHERING_GROUPS: IndexGroup[] = MATERIAL_CATEGORIES.map((c) => ({
  label: c.label,
  blurb: c.blurb,
  items: c.items.map((i) => ({ id: i.id, name: i.name })),
}));

export const ALL_GROUPS: IndexGroup[] = [...ITEM_GROUPS, ...GATHERING_GROUPS];

// Every id on the hub, for a single batched icon/rarity lookup.
export const INDEX_ITEM_IDS: number[] = [
  ...new Set(ALL_GROUPS.flatMap((g) => g.items.map((i) => i.id))),
];
