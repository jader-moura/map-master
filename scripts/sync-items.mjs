// Mirror every item from the official GW2 API into the `items` table.
// Paginates /v2/items (200/page, ~370 pages), upserts each page.
//
// Resilient + RESUMABLE: it persists the next page to scripts/.sync-progress.json
// after every page, retries transient/network failures with long backoff, and on
// a sustained outage saves progress and exits so a plain re-run continues where it
// stopped (upserts are idempotent, so overlap is harmless).
//
// Usage:  npm run sync:items            (resume, or start fresh)
//         node ... scripts/sync-items.mjs --start=160   (force a start page)
import postgres from "postgres";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const UA = { "User-Agent": "buildop (buildop.app)" };
const PAGE_SIZE = 200;
const PROGRESS_FILE = "scripts/.sync-progress.json";
const UNTRADABLE = new Set([
  "AccountBound", "AccountBindOnUse", "SoulbindOnAcquire", "SoulBindOnUse",
  "MonsterOnly", "NoSell",
]);
const COLS = [
  "id", "name", "rarity", "type", "subtype", "level",
  "icon", "vendor_value", "flags", "chat_link", "tradable", "description",
];

const sleep = (ms) => new Promise((s) => setTimeout(s, ms));

function startPage() {
  const arg = Number((process.argv.find((a) => a.startsWith("--start=")) ?? "").split("=")[1]);
  let page = Number.isFinite(arg) ? arg : 0;
  if (existsSync(PROGRESS_FILE)) {
    try {
      const p = JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
      if (Number.isFinite(p.nextPage)) page = Math.max(page, p.nextPage);
    } catch {
      /* ignore a corrupt progress file */
    }
  }
  return page;
}

async function fetchPage(page, tries = 8) {
  const url = `https://api.guildwars2.com/v2/items?page=${page}&page_size=${PAGE_SIZE}&lang=en`;
  let lastErr;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 429 || r.status >= 500) throw new Error(`transient ${r.status}`);
      if (!r.ok) throw new Error(`http ${r.status}`);
      return { data: await r.json(), total: Number(r.headers.get("x-page-total")) || null };
    } catch (e) {
      lastErr = e;
      if (a < tries - 1) await sleep(Math.min(1500 * (a + 1), 15000));
    }
  }
  throw lastErr;
}

function toRow(it) {
  const flags = Array.isArray(it.flags) ? it.flags : [];
  return {
    id: it.id,
    name: it.name ?? "",
    rarity: it.rarity ?? null,
    type: it.type ?? null,
    subtype: it.details?.type ?? null,
    level: it.level ?? 0,
    icon: it.icon ?? null,
    vendor_value: it.vendor_value ?? 0,
    flags,
    chat_link: it.chat_link ?? null,
    tradable: !flags.some((f) => UNTRADABLE.has(f)),
    description: it.description ?? null,
  };
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });

try {
  let page = startPage();
  let total = null;
  let count = 0;
  const started = Date.now();
  if (page > 0) console.log(`Resuming from page ${page + 1}`);

  do {
    let res;
    try {
      res = await fetchPage(page);
    } catch (e) {
      writeFileSync(PROGRESS_FILE, JSON.stringify({ nextPage: page }));
      console.error(`Page ${page + 1} failed after retries: ${e.message}`);
      console.error(`Progress saved. Re-run "npm run sync:items" to resume from page ${page + 1}.`);
      process.exit(1);
    }

    if (total === null) total = res.total;
    const rows = res.data.filter((it) => it && it.id != null && it.name).map(toRow);

    if (rows.length) {
      await sql`
        insert into items ${sql(rows, ...COLS)}
        on conflict (id) do update set
          name = excluded.name, rarity = excluded.rarity, type = excluded.type,
          subtype = excluded.subtype, level = excluded.level, icon = excluded.icon,
          vendor_value = excluded.vendor_value, flags = excluded.flags,
          chat_link = excluded.chat_link, tradable = excluded.tradable,
          description = excluded.description, updated_at = now()
      `;
      count += rows.length;
    }

    page++;
    writeFileSync(PROGRESS_FILE, JSON.stringify({ nextPage: page }));
    if (page % 20 === 0 || page >= (total ?? 0)) {
      console.log(`page ${page}/${total ?? "?"} — ${count} items upserted this run`);
    }
  } while (total !== null && page < total);

  if (existsSync(PROGRESS_FILE)) rmSync(PROGRESS_FILE); // completed → clear resume state
  console.log(`Done: ${count} items this run in ${Math.round((Date.now() - started) / 1000)}s`);
} finally {
  await sql.end();
}
