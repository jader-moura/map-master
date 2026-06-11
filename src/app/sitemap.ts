import type { MetadataRoute } from "next";
import { getSql } from "@/lib/db";
import { itemSlug } from "@/lib/gw2/items";

const SITE_URL = "https://buildop.app";
// Google caps a single sitemap file at 50k URLs; keep chunks well under that.
const CHUNK = 40000;

// Regenerate daily — item/vendor/achievement sets change as syncs run.
export const revalidate = 86400;

// Static + vendors + achievements live in chunk 0 (a few thousand URLs); items
// are split across chunks 1..N because there are ~74k of them.
export async function generateSitemaps() {
  const sql = getSql();
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int n from items where name is not null and name <> ''
  `;
  const itemChunks = Math.max(1, Math.ceil(n / CHUNK));
  return Array.from({ length: itemChunks + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const sql = getSql();
  const lastModified = new Date();
  const chunk = parseInt(String(id), 10) || 0; // Next passes `id` like "1" or "1.xml"

  if (chunk === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}/gw2-world-boss-timer`, lastModified, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE_URL}/gw2-event-timer`, lastModified, changeFrequency: "daily", priority: 0.8 },
      { url: `${SITE_URL}/gw2-gathering-map`, lastModified, changeFrequency: "weekly", priority: 0.7 },
      { url: `${SITE_URL}/gw2-trading-post`, lastModified, changeFrequency: "hourly", priority: 0.7 },
      { url: `${SITE_URL}/gw2/items`, lastModified, changeFrequency: "weekly", priority: 0.7 },
      { url: `${SITE_URL}/gw2/vendors`, lastModified, changeFrequency: "weekly", priority: 0.7 },
      { url: `${SITE_URL}/about`, lastModified, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    ];

    const vendors = await sql<{ slug: string }[]>`select slug from vendors order by slug`;
    const vendorUrls: MetadataRoute.Sitemap = vendors.map((v) => ({
      url: `${SITE_URL}/gw2/vendor/${v.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    // Only achievements that have item content (collections + reward lists);
    // the rest render a thin page.
    const achs = await sql<{ id: number; name: string }[]>`
      select distinct a.id, a.name
      from achievements a
      join achievement_items ai on ai.achievement_id = a.id
      where a.name is not null and a.name <> ''
      order by a.id
    `;
    const achUrls: MetadataRoute.Sitemap = achs.map((a) => ({
      url: `${SITE_URL}/gw2/achievement/${itemSlug(a.id, a.name)}`,
      changeFrequency: "monthly",
      priority: 0.4,
    }));

    return [...staticPages, ...vendorUrls, ...achUrls];
  }

  // Item chunk (id 1..N).
  const offset = (chunk - 1) * CHUNK;
  const items = await sql<{ id: number; name: string }[]>`
    select id, name from items
    where name is not null and name <> ''
    order by id
    limit ${CHUNK} offset ${offset}
  `;
  return items.map((it) => ({
    url: `${SITE_URL}/gw2/item/${itemSlug(it.id, it.name)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}
