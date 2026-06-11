import type { MetadataRoute } from "next";
import { getSql } from "@/lib/db";

const SITE_URL = "https://buildop.app";
const CHUNK = 40000; // keep in sync with sitemap.ts

export const revalidate = 86400;

// `generateSitemaps` splits the sitemap into /sitemap/0.xml, /sitemap/1.xml, …
// (chunk 0 = static + vendors + achievements; 1..N = items) and does not emit a
// single /sitemap.xml index, so we list every chunk here for crawlers.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const sql = getSql();
  let itemChunks = 2;
  try {
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int n from items where name is not null and name <> ''
    `;
    itemChunks = Math.max(1, Math.ceil(n / CHUNK));
  } catch {
    // fall back to a sane default if the DB is briefly unreachable at build
  }
  const sitemap = Array.from({ length: itemChunks + 1 }, (_, i) => `${SITE_URL}/sitemap/${i}.xml`);

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap,
    host: SITE_URL,
  };
}
