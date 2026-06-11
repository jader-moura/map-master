// Mirror /v2/achievements into the `achievements` + `achievement_items` tables.
// Paginates (200/page, ~30 pages), upserts. Resumable + retry, like sync-items.
// Usage: npm run sync:achievements
import postgres from "postgres";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const UA = { "User-Agent": "buildop (buildop.app)" };
const PAGE_SIZE = 200;
const PROGRESS_FILE = "scripts/.sync-ach-progress.json";

const sleep = (ms) => new Promise((s) => setTimeout(s, ms));

const ACH_COLS = ["id", "name", "description", "requirement", "type", "flags", "point_cap", "icon"];

function startPage() {
  if (!existsSync(PROGRESS_FILE)) return 0;
  try {
    const p = JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
    return Number.isFinite(p.nextPage) ? p.nextPage : 0;
  } catch {
    return 0;
  }
}

async function fetchPage(page, tries = 8) {
  const url = `https://api.guildwars2.com/v2/achievements?page=${page}&page_size=${PAGE_SIZE}&lang=en`;
  let lastErr;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 429 || r.status >= 500) throw new Error(`transient ${r.status}`);
      if (!r.ok) throw new Error(`http ${r.status}`);
      return { data: await r.json(), total: Number(r.headers.get("x-page-total")) || null };
    } catch (e) {
      lastErr = e;
      if (a < tries - 1) await sleep(Math.min(800 * (a + 1), 12000));
    }
  }
  throw lastErr;
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });

try {
  let page = startPage();
  let total = null;
  let count = 0;

  do {
    let res;
    try {
      res = await fetchPage(page);
    } catch (e) {
      writeFileSync(PROGRESS_FILE, JSON.stringify({ nextPage: page }));
      console.error(`Page ${page + 1} failed: ${e.message}. Re-run to resume.`);
      process.exit(1);
    }
    if (total === null) total = res.total;

    const achRows = [];
    const linkByKey = new Map();
    for (const a of res.data) {
      if (!a || a.id == null || !a.name) continue;
      achRows.push({
        id: a.id,
        name: a.name,
        description: a.description || null,
        requirement: a.requirement || null,
        type: a.type || null,
        flags: Array.isArray(a.flags) ? a.flags : [],
        point_cap: a.point_cap ?? null,
        icon: a.icon || null,
      });
      const add = (itemId, role) => {
        if (itemId == null) return;
        linkByKey.set(`${a.id}|${itemId}|${role}`, { achievement_id: a.id, item_id: itemId, role });
      };
      for (const b of a.bits ?? []) if (b?.type === "Item") add(b.id, "collect");
      for (const r of a.rewards ?? []) if (r?.type === "Item") add(r.id, "reward");
    }

    if (achRows.length) {
      await sql`
        insert into achievements ${sql(achRows, ...ACH_COLS)}
        on conflict (id) do update set
          name = excluded.name, description = excluded.description,
          requirement = excluded.requirement, type = excluded.type,
          flags = excluded.flags, point_cap = excluded.point_cap,
          icon = excluded.icon, updated_at = now()
      `;
      count += achRows.length;
    }
    const links = [...linkByKey.values()];
    if (links.length) {
      await sql`
        insert into achievement_items ${sql(links, "achievement_id", "item_id", "role")}
        on conflict (achievement_id, item_id, role) do nothing
      `;
    }

    page++;
    writeFileSync(PROGRESS_FILE, JSON.stringify({ nextPage: page }));
    if (page % 5 === 0 || page >= (total ?? 0)) {
      console.log(`page ${page}/${total ?? "?"} — ${count} achievements`);
    }
  } while (total !== null && page < total);

  if (existsSync(PROGRESS_FILE)) rmSync(PROGRESS_FILE);
  console.log(`Done: ${count} achievements.`);
} finally {
  await sql.end();
}
