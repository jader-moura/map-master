// Mirror the GW2 Wiki's acquisition edges into the `item_sources` table, then
// derive the `vendors` table. Bulk-paginates each SMW relation (a few hundred
// requests total) instead of querying per item. Resumable + retry-on-throttle,
// like sync-items. Usage: npm run sync:wiki   (resume or start fresh)
import postgres from "postgres";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const WIKI_API = "https://wiki.guildwars2.com/api.php";
const UA = { "User-Agent": "buildop (buildop.app)" };
const LIMIT = 500;
// Optional CLI args: relation types to run, in the given order, e.g.
//   node scripts/sync-wiki.mjs salvaged_from
// With no args, runs all relations. A subset run uses its own progress file so
// it never collides with the full-run progress.
const ONLY = process.argv.slice(2).filter(Boolean);
const PROGRESS_FILE = ONLY.length
  ? `scripts/.sync-wiki-progress-${ONLY.join("-")}.json`
  : "scripts/.sync-wiki-progress.json";

const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const slugify = (s) =>
  s.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const pageOf = (key) => key.split("#")[0].trim();

// Pull the first usable value of a printout (handles {fulltext} | string | {value}).
function pf(printouts, prop) {
  const a = printouts?.[prop];
  if (!Array.isArray(a) || !a.length) return null;
  const v = a[0];
  if (typeof v === "string") return v.trim() || null;
  if (v && typeof v === "object") return (v.fulltext ?? (v.value != null ? String(v.value) : null))?.trim() || null;
  return null;
}

// "Has item cost" is a record list, each {Has item value, Has item currency}.
// Render as e.g. "5 Candy Corn Cob"; multiple alternatives joined with " / ".
function parseCost(printouts) {
  const a = printouts?.["Has item cost"];
  if (!Array.isArray(a) || !a.length) return null;
  const parts = a
    .map((c) => {
      const value = c?.["Has item value"]?.item?.[0];
      const currency = c?.["Has item currency"]?.item?.[0];
      if (value && currency) return `${value} ${currency}`;
      return value ?? currency ?? null;
    })
    .filter(Boolean);
  return parts.length ? [...new Set(parts)].join(" / ") : null;
}

// The same item can be sold by the same vendor for several alternative currencies,
// stored as SEPARATE sub-objects. Our (item, vendor) dedup must union their costs
// rather than overwrite (e.g. "1 Gibbering Skull / 1 High-Quality Plastic Fangs").
function mergeCosts(a, b) {
  const parts = new Set(
    [...(a?.split(" / ") ?? []), ...(b?.split(" / ") ?? [])].map((s) => s.trim()).filter(Boolean),
  );
  return parts.size ? [...parts].join(" / ") : null;
}

// Wiki page titles carry anchors ("Axe#item1") and disambiguators ("Axe (item)",
// "Aetherblade Blindfold (heavy)") that the official API names never use, so a
// raw title won't match our `items` table. Resolve to the canonical API name by
// trying progressively cleaner forms against the known item-name set; only
// rewrite when a form actually matches a real item (otherwise keep it cleaned).
function canonicalItem(name, itemNames) {
  if (!name) return name;
  if (itemNames.has(name)) return name;
  const noAnchor = name.split("#")[0].trim();
  if (itemNames.has(noAnchor)) return noAnchor;
  const noParen = noAnchor.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (itemNames.has(noParen)) return noParen;
  return noAnchor; // at least drop the anchor reference
}

// Each relation: the SMW query, and how to read item / source / cost from a row.
const RELATIONS = [
  {
    type: "sold_by",
    query: "[[Sells item::+]]|?Sells item|?Has vendor|?Has item cost",
    item: (po) => pf(po, "Sells item"),
    source: (po, subj) => pf(po, "Has vendor") ?? subj,
    cost: (po) => parseCost(po),
  },
  {
    type: "contained_in",
    query: "[[Contains item::+]]|?Contains item",
    item: (po) => pf(po, "Contains item"),
    source: (_po, subj) => subj,
    cost: () => null,
    sourceIsItem: true, // the container is itself an item
  },
  {
    type: "salvaged_from",
    query: "[[Salvages into::+]]|?Salvages into",
    item: (po) => pf(po, "Salvages into"),
    source: (_po, subj) => subj,
    cost: () => null,
    sourceIsItem: true, // the salvaged item is itself an item
  },
  {
    type: "rewarded_by",
    query: "[[Rewards item::+]]|?Rewards item|?Rewarded by",
    item: (po) => pf(po, "Rewards item"),
    source: (po, subj) => pf(po, "Rewarded by") ?? subj,
    cost: () => null,
  },
  {
    // Forward property on the item page: item -> collection it belongs to.
    type: "collection",
    query: "[[Is part of collection::+]]|?Is part of collection",
    item: (_po, subj) => subj,
    source: (po) => pf(po, "Is part of collection"),
    cost: () => null,
  },
];

// Relations to actually run this invocation (all, or the CLI-selected subset
// in the requested order).
const PLAN = ONLY.length
  ? ONLY.map((t) => RELATIONS.find((r) => r.type === t)).filter(Boolean)
  : RELATIONS;

// The wiki rate-limits expensive SMW `ask` queries aggressively. We throttle
// ourselves (PAGE_DELAY between pages) and, on a 403 cooldown, back off long.
const PAGE_DELAY = 1200;

async function askPage(query, offset, tries = 12) {
  // A stable sort (by subject/page title) is REQUIRED: without it, offset-based
  // pagination over these million-row SMW relations overlaps and skips rows, so
  // a full scan never completes and many sources are missed.
  const url = `${WIKI_API}?action=ask&format=json&query=${encodeURIComponent(`${query}|sort=|order=asc|limit=${LIMIT}|offset=${offset}`)}`;
  let lastErr;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 403 || r.status === 429 || r.status >= 500) throw new Error(`transient ${r.status}`);
      if (!r.ok) throw new Error(`http ${r.status}`);
      const json = await r.json();
      return json?.query?.results ?? {};
    } catch (e) {
      lastErr = e;
      const cooldown = /403|429/.test(e.message ?? "");
      if (a < tries - 1) {
        await sleep(cooldown ? Math.min(10000 * (a + 1), 60000) : Math.min(1500 * (a + 1), 15000));
      }
    }
  }
  throw lastErr;
}

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) return { relIndex: 0, offset: 0 };
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return { relIndex: 0, offset: 0 };
  }
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });

try {
  let { relIndex, offset } = loadProgress();
  let total = 0;

  // Preload every known API item name so we can map wiki titles onto them.
  const itemNames = new Set((await sql`select name from items`).map((r) => r.name));
  console.log(`Loaded ${itemNames.size} item names for canonicalization.`);

  for (; relIndex < PLAN.length; relIndex++, offset = 0) {
    const rel = PLAN[relIndex];
    console.log(`Relation ${rel.type} (from offset ${offset})`);

    while (true) {
      let results;
      try {
        results = await askPage(rel.query, offset);
      } catch (e) {
        writeFileSync(PROGRESS_FILE, JSON.stringify({ relIndex, offset }));
        console.error(`Failed at ${rel.type} offset ${offset}: ${e.message}. Re-run to resume.`);
        process.exit(1);
      }

      const keys = Object.keys(results);
      if (!keys.length) break;

      // Dedupe within the batch — ON CONFLICT can't hit the same key twice.
      const byKey = new Map();
      for (const key of keys) {
        const po = results[key].printouts ?? {};
        const subj = pageOf(key);
        const itemName = canonicalItem(rel.item(po, subj), itemNames);
        const rawSource = rel.source(po, subj);
        const sourceName = rel.sourceIsItem ? canonicalItem(rawSource, itemNames) : rawSource;
        if (!itemName || !sourceName) continue;
        const k = `${itemName}|${sourceName}`;
        const cost = rel.cost(po);
        const existing = byKey.get(k);
        if (existing) {
          existing.cost = mergeCosts(existing.cost, cost); // union alternative prices
        } else {
          byKey.set(k, {
            item_name: itemName,
            source_type: rel.type,
            source_name: sourceName,
            source_slug: slugify(sourceName),
            cost,
          });
        }
      }

      const rows = [...byKey.values()];
      if (rows.length) {
        await sql`
          insert into item_sources ${sql(rows, "item_name", "source_type", "source_name", "source_slug", "cost")}
          on conflict (item_name, source_type, source_name) do update set
            source_slug = excluded.source_slug,
            cost = (
              select nullif(string_agg(distinct trim(p), ' / '), '')
              from unnest(string_to_array(
                concat_ws(' / ', nullif(item_sources.cost, ''), nullif(excluded.cost, '')), ' / '
              )) as p
              where trim(p) <> ''
            ),
            updated_at = now()
        `;
        total += rows.length;
      }

      offset += keys.length;
      writeFileSync(PROGRESS_FILE, JSON.stringify({ relIndex, offset }));
      if (offset % 5000 === 0 || keys.length < LIMIT) {
        console.log(`  ${rel.type}: ${offset} rows scanned, ${total} edges upserted total`);
      }
      if (keys.length < LIMIT) break;
      await sleep(PAGE_DELAY); // be polite to the wiki between pages
    }
  }

  // Derive vendors from the sold_by edges.
  console.log("Building vendors table...");
  await sql`
    insert into vendors (slug, name)
    select distinct on (source_slug) source_slug, source_name
    from item_sources
    where source_type = 'sold_by' and source_slug is not null and source_slug <> ''
    order by source_slug, source_name
    on conflict (slug) do update set name = excluded.name, updated_at = now()
  `;
  const [{ v }] = await sql`select count(*)::int v from vendors`;
  const [{ e }] = await sql`select count(*)::int e from item_sources`;

  if (existsSync(PROGRESS_FILE)) rmSync(PROGRESS_FILE);
  console.log(`Done: ${e} acquisition edges, ${v} vendors.`);
} finally {
  await sql.end();
}
