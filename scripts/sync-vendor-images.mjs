// Mirror each vendor's GW2 Wiki page lead image into vendors.icon, via the
// MediaWiki pageimages API (batched 50 titles/request). Vendor names are the
// wiki page titles, so we look them up directly.
// Usage: npm run sync:vendor-images
import postgres from "postgres";

const WIKI = "https://wiki.guildwars2.com/api.php";
const UA = { "User-Agent": "buildop (buildop.app)" };
const THUMB = 320; // px; wiki returns a sized thumbnail (large enough to render crisp)
const BATCH = 50; // pageimages caps titles per request

const sleep = (ms) => new Promise((s) => setTimeout(s, ms));

async function fetchImages(titles, tries = 6) {
  const url =
    `${WIKI}?action=query&format=json&prop=pageimages&piprop=thumbnail` +
    `&pithumbsize=${THUMB}&pilimit=${BATCH}&titles=${encodeURIComponent(titles.join("|"))}`;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 403 || r.status === 429 || r.status >= 500) throw new Error(`transient ${r.status}`);
      if (!r.ok) throw new Error(`http ${r.status}`);
      return (await r.json())?.query ?? {};
    } catch (e) {
      if (a < tries - 1) await sleep(Math.min(2000 * (a + 1), 15000));
      else throw e;
    }
  }
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
try {
  const vendors = await sql`select slug, name from vendors order by name`;
  let updated = 0;

  for (let i = 0; i < vendors.length; i += BATCH) {
    const batch = vendors.slice(i, i + BATCH);
    const q = await fetchImages(batch.map((v) => v.name));

    // MediaWiki may normalize requested titles; map original -> normalized.
    const norm = {};
    for (const n of q.normalized ?? []) norm[n.from] = n.to;
    const titleToThumb = {};
    for (const p of Object.values(q.pages ?? {})) {
      if (p.thumbnail?.source) titleToThumb[p.title] = p.thumbnail.source;
    }

    for (const v of batch) {
      const thumb = titleToThumb[norm[v.name] ?? v.name];
      if (thumb) {
        await sql`update vendors set icon = ${thumb}, updated_at = now() where slug = ${v.slug}`;
        updated++;
      }
    }
    console.log(`  ${Math.min(i + BATCH, vendors.length)}/${vendors.length} scanned, ${updated} images set`);
    await sleep(500); // be polite to the wiki
  }

  console.log(`Done: ${updated} of ${vendors.length} vendors have an image.`);
} finally {
  await sql.end();
}
