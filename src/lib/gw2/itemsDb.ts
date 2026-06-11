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
export type Vendor = { slug: string; name: string };

export async function vendorBySlug(slug: string): Promise<Vendor | null> {
  const sql = getSql();
  const rows = await sql<Vendor[]>`select slug, name from vendors where slug = ${slug} limit 1`;
  return rows[0] ?? null;
}

export type VendorListing = { slug: string; name: string; item_count: number };

/** Every vendor with how many distinct items it sells, for the directory page. */
export async function listVendors(): Promise<VendorListing[]> {
  const sql = getSql();
  return sql<VendorListing[]>`
    select v.slug, v.name, count(distinct s.item_name)::int as item_count
    from vendors v
    left join item_sources s
      on s.source_type = 'sold_by' and s.source_slug = v.slug
    group by v.slug, v.name
    order by v.name
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

/** Map achievement names -> {id, name}, for turning source names into links. */
export async function achievementsByNames(names: string[]): Promise<{ id: number; name: string }[]> {
  if (!names.length) return [];
  const sql = getSql();
  return sql<{ id: number; name: string }[]>`
    select distinct on (name) id, name from achievements
    where name in ${sql(names)} order by name, id
  `;
}
