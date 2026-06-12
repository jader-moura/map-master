// Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver, ...) for near-instant
// indexing. Google does not consume IndexNow, but its sitemaps cover Google.
//
// Usage:
//   node --env-file=.env.local scripts/indexnow-submit.mjs            # static + vendors + achievements
//   node --env-file=.env.local scripts/indexnow-submit.mjs --items    # also every item page (~74k, batched)
//   node --env-file=.env.local scripts/indexnow-submit.mjs --dry-run  # print counts, submit nothing
//
// Requires INDEXNOW_KEY in the environment and a matching public/<KEY>.txt file
// served at https://buildop.app/<KEY>.txt (proof of ownership).

import postgres from "postgres";

const SITE_URL = "https://buildop.app";
const KEY = process.env.INDEXNOW_KEY;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10000; // IndexNow accepts up to 10k URLs per request

const args = new Set(process.argv.slice(2));
const includeItems = args.has("--items");
const dryRun = args.has("--dry-run");

if (!KEY) {
  console.error("Missing INDEXNOW_KEY. Add it to .env.local.");
  process.exit(1);
}

function itemSlug(id, name) {
  const kebab = String(name)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return kebab ? `${id}-${kebab}` : `${id}`;
}

async function submit(urls) {
  if (dryRun) return { ok: true, status: "dry-run" };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "buildop.app",
      key: KEY,
      keyLocation: `${SITE_URL}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  // 200 = accepted, 202 = accepted (validation pending). Both are fine.
  return { ok: res.ok, status: res.status };
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
  try {
    const urls = [
      `${SITE_URL}/`,
      `${SITE_URL}/gw2-world-boss-timer`,
      `${SITE_URL}/gw2-event-timer`,
      `${SITE_URL}/gw2-gathering-map`,
      `${SITE_URL}/gw2-trading-post`,
      `${SITE_URL}/gw2/items`,
      `${SITE_URL}/gw2/vendors`,
      `${SITE_URL}/about`,
      `${SITE_URL}/privacy`,
      `${SITE_URL}/terms`,
      `${SITE_URL}/contact`,
    ];

    const vendors = await sql`select slug from vendors order by slug`;
    for (const v of vendors) urls.push(`${SITE_URL}/gw2/vendor/${v.slug}`);

    const achs = await sql`
      select distinct a.id, a.name
      from achievements a
      join achievement_items ai on ai.achievement_id = a.id
      where a.name is not null and a.name <> ''
      order by a.id
    `;
    for (const a of achs) urls.push(`${SITE_URL}/gw2/achievement/${itemSlug(a.id, a.name)}`);

    if (includeItems) {
      const items = await sql`
        select id, name from items where name is not null and name <> '' order by id
      `;
      for (const it of items) urls.push(`${SITE_URL}/gw2/item/${itemSlug(it.id, it.name)}`);
    }

    console.log(
      `Prepared ${urls.length} URLs (vendors=${vendors.length}, achievements=${achs.length}, items=${includeItems ? "yes" : "no"}).`,
    );

    let sent = 0;
    for (let i = 0; i < urls.length; i += BATCH) {
      const batch = urls.slice(i, i + BATCH);
      const { ok, status } = await submit(batch);
      sent += batch.length;
      console.log(`  batch ${i / BATCH + 1}: ${batch.length} URLs -> ${ok ? "ok" : "FAILED"} (${status})`);
      if (!ok && !dryRun) {
        console.error("  IndexNow rejected the batch; stopping.");
        break;
      }
    }
    console.log(`Done. Submitted ${sent}/${urls.length} URLs${dryRun ? " (dry run)" : ""}.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
