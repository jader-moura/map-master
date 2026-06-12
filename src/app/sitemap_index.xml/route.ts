import { getSql } from "@/lib/db";

const SITE_URL = "https://buildop.app";
const CHUNK = 40000; // keep in sync with sitemap.ts

// Sitemap index pointing at every generated chunk (/sitemap/0.xml … N.xml).
// Next's generateSitemaps does not emit an index of its own, so we build one
// here, giving Search Console / Bing a single URL to submit.
export const revalidate = 86400;

export async function GET() {
  const sql = getSql();
  let itemChunks = 2;
  try {
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int n from items where name is not null and name <> ''
    `;
    itemChunks = Math.max(1, Math.ceil(n / CHUNK));
  } catch {
    // fall back to a sane default if the DB is briefly unreachable
  }

  const lastmod = new Date().toISOString();
  const entries = Array.from({ length: itemChunks + 1 }, (_, i) =>
    `  <sitemap><loc>${SITE_URL}/sitemap/${i}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
