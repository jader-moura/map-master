// Populate vendors.locations: for each vendor, take its wiki Located_in areas
// and match each to the nearest GW2 API waypoint (same map), capturing the zone
// and the waypoint's chat code. Result is a jsonb array of { area, zone,
// waypoint, chat }. Usage: npm run sync:vendor-locations
import postgres from "postgres";

const WIKI = "https://wiki.guildwars2.com/api.php";
const UA = { "User-Agent": "buildop (buildop.app)" };
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));

// area name -> { zone, waypoint, chat }, from the official continents API.
async function buildSectorIndex() {
  const idx = new Map();
  for (const f of [1, 49]) {
    const r = await fetch(`https://api.guildwars2.com/v2/continents/1/floors/${f}`, { headers: UA });
    if (!r.ok) throw new Error(`floor ${f}: ${r.status}`);
    const floor = await r.json();
    for (const region of Object.values(floor.regions ?? {})) {
      for (const map of Object.values(region.maps ?? {})) {
        const wps = [];
        for (const p of Object.values(map.points_of_interest ?? {})) {
          if (p.type === "waypoint" && p.name && p.chat_link) wps.push(p);
        }
        if (!wps.length) continue;
        for (const s of Object.values(map.sectors ?? {})) {
          if (!s.name || !s.coord || idx.has(s.name)) continue;
          let best = null;
          let bd = Infinity;
          for (const w of wps) {
            const dx = w.coord[0] - s.coord[0];
            const dy = w.coord[1] - s.coord[1];
            const d = dx * dx + dy * dy;
            if (d < bd) { bd = d; best = w; }
          }
          idx.set(s.name, { zone: map.name ?? null, waypoint: best.name, chat: best.chat_link, coord: s.coord });
        }
      }
    }
  }
  return idx;
}

// The wiki area pages a vendor is Located_in (anchors/underscores stripped).
// Retries on the wiki's 403/429 cooldowns with a long backoff, like the other
// sync scripts; throws only after exhausting retries.
async function locatedIn(title, tries = 8) {
  const url = `${WIKI}?action=browsebysubject&format=json&subject=${encodeURIComponent(title.replace(/ /g, "_"))}`;
  let lastErr;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 403 || r.status === 429 || r.status >= 500) throw new Error(`transient ${r.status}`);
      if (!r.ok) throw new Error(`http ${r.status}`);
      const data = (await r.json())?.query?.data ?? [];
      const loc = data.find((x) => x.property === "Located_in");
      if (!loc?.dataitem) return [];
      return loc.dataitem.map((d) => String(d.item).split("#")[0].replace(/_/g, " ").trim()).filter(Boolean);
    } catch (e) {
      lastErr = e;
      const cooldown = /403|429/.test(e.message ?? "");
      if (a < tries - 1) await sleep(cooldown ? Math.min(8000 * (a + 1), 45000) : Math.min(1500 * (a + 1), 12000));
    }
  }
  throw lastErr;
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
try {
  const sectors = await buildSectorIndex();
  console.log(`Indexed ${sectors.size} areas with a nearest waypoint.`);

  const vendors = await sql`select slug, name from vendors order by name`;
  let withLoc = 0;
  let failed = 0;

  for (let i = 0; i < vendors.length; i++) {
    const v = vendors[i];
    let areas;
    try {
      areas = await locatedIn(v.name);
    } catch {
      failed++; // throttled out after retries; leave existing value and retry on a later run
      continue;
    }

    const seen = new Set();
    const locations = [];
    for (const area of areas) {
      const hit = sectors.get(area);
      if (hit && !seen.has(area)) {
        seen.add(area);
        locations.push({ area, zone: hit.zone, waypoint: hit.waypoint, chat: hit.chat, coord: hit.coord });
      }
    }

    await sql`update vendors set locations = ${sql.json(locations)}, updated_at = now() where slug = ${v.slug}`;
    if (locations.length) withLoc++;
    if ((i + 1) % 25 === 0 || i === vendors.length - 1) {
      console.log(`  ${i + 1}/${vendors.length} processed, ${withLoc} with a waypoint, ${failed} fetch failures`);
    }
    await sleep(350); // be polite to the wiki
  }

  console.log(`Done: ${withLoc}/${vendors.length} vendors have a located waypoint (${failed} fetch failures).`);
} finally {
  await sql.end();
}
