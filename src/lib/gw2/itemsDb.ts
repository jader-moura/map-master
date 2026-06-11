import { getSql } from "@/lib/db";

// Lookups against our Supabase mirror (items + acquisition edges + vendors).
export type DbItem = { id: number; name: string; icon: string | null; rarity: string | null };

export async function itemsByNames(names: string[]): Promise<DbItem[]> {
  if (!names.length) return [];
  const sql = getSql();
  // distinct on (name): GW2 has many same-named items; keep the lowest id.
  return sql<DbItem[]>`
    select distinct on (name) id, name, icon, rarity
    from items
    where name in ${sql(names)}
    order by name, id
  `;
}

export async function itemsByIds(ids: number[]): Promise<DbItem[]> {
  if (!ids.length) return [];
  const sql = getSql();
  return sql<DbItem[]>`select id, name, icon, rarity from items where id in ${sql(ids)}`;
}

// --- Acquisition (from the wiki sync) ---------------------------------------
export type SourceRow = {
  source_type: string;
  source_name: string;
  source_slug: string | null;
  cost: string | null;
};

/** All acquisition edges for an item (sold_by / contained_in / salvaged_from / rewarded_by). */
export async function itemSources(itemName: string): Promise<SourceRow[]> {
  const sql = getSql();
  return sql<SourceRow[]>`
    select source_type, source_name, source_slug, cost
    from item_sources
    where item_name = ${itemName}
    order by source_type, source_name
  `;
}

/** What this item salvages into (reverse of the salvaged_from edge). */
export async function salvagesInto(itemName: string): Promise<string[]> {
  const sql = getSql();
  const rows = await sql<{ item_name: string }[]>`
    select distinct item_name from item_sources
    where source_type = 'salvaged_from' and source_name = ${itemName}
    order by item_name
  `;
  return rows.map((r) => r.item_name);
}

// --- Vendors ----------------------------------------------------------------
export type VendorLocation = {
  area: string;
  zone: string | null;
  waypoint: string | null;
  chat: string | null;
  coord: [number, number] | null;
};
export type Vendor = {
  slug: string;
  name: string;
  icon: string | null;
  locations: VendorLocation[];
};

export async function vendorBySlug(slug: string): Promise<Vendor | null> {
  const sql = getSql();
  const rows = await sql<Vendor[]>`
    select slug, name, icon, locations from vendors where slug = ${slug} limit 1
  `;
  return rows[0] ?? null;
}

export type VendorListing = {
  slug: string;
  name: string;
  icon: string | null;
  location: string | null;
  waypoint: string | null;
  item_count: number;
};

/** Every vendor with its primary location and how many distinct items it sells. */
export async function listVendors(): Promise<VendorListing[]> {
  const sql = getSql();
  return sql<VendorListing[]>`
    select v.slug, v.name, v.icon,
           coalesce(v.locations->0->>'zone', v.locations->0->>'area') as location,
           v.locations->0->>'chat' as waypoint,
           count(distinct s.item_name)::int as item_count
    from vendors v
    left join item_sources s
      on s.source_type = 'sold_by' and s.source_slug = v.slug
    group by v.slug, v.name, v.icon, v.locations
    order by v.name
  `;
}

/** Vendor listings for a set of slugs (used by the item "Sold by" list). */
export async function vendorsBySlugs(slugs: string[]): Promise<VendorListing[]> {
  if (!slugs.length) return [];
  const sql = getSql();
  return sql<VendorListing[]>`
    select v.slug, v.name, v.icon,
           coalesce(v.locations->0->>'zone', v.locations->0->>'area') as location,
           v.locations->0->>'chat' as waypoint,
           count(distinct s.item_name)::int as item_count
    from vendors v
    left join item_sources s
      on s.source_type = 'sold_by' and s.source_slug = v.slug
    where v.slug in ${sql(slugs)}
    group by v.slug, v.name, v.icon, v.locations
  `;
}

export type VendorSale = { item_name: string; cost: string | null };

/** Items a vendor sells (deduped by item name). */
export async function vendorSales(slug: string): Promise<VendorSale[]> {
  const sql = getSql();
  return sql<VendorSale[]>`
    select distinct on (item_name) item_name, cost
    from item_sources
    where source_type = 'sold_by' and source_slug = ${slug}
    order by item_name
  `;
}

// --- Achievements / collections ---------------------------------------------
export type DbAchievement = {
  id: number;
  name: string;
  description: string | null;
  requirement: string | null;
  type: string | null;
  point_cap: number | null;
  icon: string | null;
};

export async function achievementById(id: number): Promise<DbAchievement | null> {
  const sql = getSql();
  const rows = await sql<DbAchievement[]>`
    select id, name, description, requirement, type, point_cap, icon
    from achievements where id = ${id} limit 1
  `;
  return rows[0] ?? null;
}

/** Item ids tied to an achievement, by role ('collect' | 'reward'). */
export async function achievementItemIds(id: number, role: string): Promise<number[]> {
  const sql = getSql();
  const rows = await sql<{ item_id: number }[]>`
    select item_id from achievement_items where achievement_id = ${id} and role = ${role}
  `;
  return rows.map((r) => r.item_id);
}

export type AchievementLocation = {
  kind: "area" | "map" | "region";
  name: string;
  zone: string | null;
  waypoint: string | null;
  chat: string | null;
  coord: [number, number] | null;
};
export type RewardAchievement = {
  id: number;
  name: string;
  requirement: string | null;
  point_cap: number | null;
  icon: string | null;
  location: AchievementLocation | null;
};

/** Achievements that reward this item (achievement_items role = 'reward'). */
export async function achievementsRewardingItem(itemId: number): Promise<RewardAchievement[]> {
  const sql = getSql();
  return sql<RewardAchievement[]>`
    select a.id, a.name, a.requirement, a.point_cap, a.icon, a.location
    from achievement_items ai
    join achievements a on a.id = ai.achievement_id
    where ai.role = 'reward' and ai.item_id = ${itemId}
    order by a.name
  `;
}

/** Map achievement names -> {id, name}, for turning source names into links. */
export async function achievementsByNames(names: string[]): Promise<{ id: number; name: string }[]> {
  if (!names.length) return [];
  const sql = getSql();
  return sql<{ id: number; name: string }[]>`
    select distinct on (name) id, name from achievements
    where name in ${sql(names)} order by name, id
  `;
}
