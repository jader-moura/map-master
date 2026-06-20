// Presentation helpers for the fishing guide pages. Kept out of fishing.ts,
// which is auto-generated and overwritten by scripts/sync-fishing.mjs.

import { FISHING_REGION_LIST, type Fish } from "@/lib/gw2/fishing";

/** Where a given fish item can be caught: its region plus its catch details. */
export type FishCatch = { region: { name: string; slug: string }; fish: Fish };

// Item id -> the region(s) it's caught in, built once. A fish item usually
// belongs to a single region, but the index keeps every match just in case.
let catchIndex: Map<number, FishCatch[]> | null = null;
function fishIndex(): Map<number, FishCatch[]> {
  if (catchIndex) return catchIndex;
  const index = new Map<number, FishCatch[]>();
  for (const r of FISHING_REGION_LIST) {
    for (const fish of r.fish) {
      const entry = { region: { name: r.name, slug: r.slug }, fish };
      const list = index.get(fish.id);
      if (list) list.push(entry);
      else index.set(fish.id, [entry]);
    }
  }
  catchIndex = index;
  return index;
}

/** The fishing region(s) an item is caught in, or [] if it isn't a fish. */
export function fishingForItem(itemId: number): FishCatch[] {
  return fishIndex().get(itemId) ?? [];
}

/** Tailwind classes for a time-of-day chip, tinted by the part of day. */
export function timeChipClass(time: string): string {
  const t = time.toLowerCase();
  if (t.includes("night")) return "border-indigo-400/30 bg-indigo-400/10 text-indigo-200";
  if (t.includes("dusk") || t.includes("dawn")) return "border-purple-400/30 bg-purple-400/10 text-purple-200";
  if (t.includes("day")) return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-white/10 bg-white/5 text-white/55";
}

/** Count of distinct fish per rarity, in ascending rarity order. */
const RARITY_ORDER = ["Junk", "Basic", "Fine", "Masterwork", "Rare", "Exotic", "Ascended", "Legendary"];
export function rarityBreakdown(fish: Fish[]): { rarity: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const f of fish) counts.set(f.rarity, (counts.get(f.rarity) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => RARITY_ORDER.indexOf(a[0]) - RARITY_ORDER.indexOf(b[0]))
    .map(([rarity, count]) => ({ rarity, count }));
}

export type Breakdown = { label: string; count: number };

// Which broad time window a fish is gated to. A fish whose time starts with
// "Any" / "None" bites at any time (a trailing "Night (Higher Chance)" is just a
// bonus), so it counts as "Any time".
function timeBucket(time: string): "Any time" | "Daytime" | "Nighttime" | "Dusk/Dawn" {
  const t = time.toLowerCase();
  if (!(t.startsWith("any") || t.startsWith("none"))) {
    if (t.includes("dusk") || t.includes("dawn")) return "Dusk/Dawn";
    if (t.includes("night")) return "Nighttime";
    if (t.includes("day")) return "Daytime";
  }
  return "Any time";
}

/** Fish counts per time-of-day window, in a fixed display order. */
export function timeBreakdown(fish: Fish[]): Breakdown[] {
  const order = ["Any time", "Daytime", "Nighttime", "Dusk/Dawn"] as const;
  const counts = new Map<string, number>();
  for (const f of fish) {
    const b = timeBucket(f.time);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return order.map((label) => ({ label, count: counts.get(label) ?? 0 })).filter((b) => b.count > 0);
}

/** Specific favored baits (excluding "Any") with the count of fish that want them. */
export function baitBreakdown(fish: Fish[]): Breakdown[] {
  const counts = new Map<string, number>();
  for (const f of fish) {
    if (!f.bait || f.bait === "Any") continue;
    counts.set(f.bait, (counts.get(f.bait) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}
