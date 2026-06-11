// Best-effort achievement location: parse the requirement text for a place name
// and match it to the GW2 map (area -> map -> region priority). Stores
// { kind, name, zone, waypoint, chat, coord } on achievements.location. All
// matching is local (one floor fetch), so this is fast.
// Usage: npm run sync:achievement-locations
import postgres from "postgres";

const UA = { "User-Agent": "buildop (buildop.app)" };
const FLOORS = [1, 49];

const rectCenter = (r) =>
  Array.isArray(r) && r.length === 2 ? [(r[0][0] + r[1][0]) / 2, (r[0][1] + r[1][1]) / 2] : null;
const nearest = (pts, c) => {
  let best = null;
  let bd = Infinity;
  for (const p of pts) {
    const d = (p.coord[0] - c[0]) ** 2 + (p.coord[1] - c[1]) ** 2;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
};

async function buildIndexes() {
  const sectors = new Map(); // name -> { coord, zone, waypoint, chat }
  const maps = new Map(); // name -> { coord, region, waypoint, chat }
  const regions = new Map(); // name -> { coord }
  for (const f of FLOORS) {
    const r = await fetch(`https://api.guildwars2.com/v2/continents/1/floors/${f}`, { headers: UA });
    if (!r.ok) throw new Error(`floor ${f}: ${r.status}`);
    const floor = await r.json();
    for (const region of Object.values(floor.regions ?? {})) {
      const rc = region.label_coord ?? rectCenter(region.continent_rect);
      if (region.name && rc && !regions.has(region.name)) regions.set(region.name, { coord: rc });
      for (const map of Object.values(region.maps ?? {})) {
        const wps = [];
        for (const p of Object.values(map.points_of_interest ?? {})) {
          if (p.type === "waypoint" && p.name && p.chat_link) wps.push(p);
        }
        const mc = map.label_coord ?? rectCenter(map.continent_rect);
        const mapWp = mc && wps.length ? nearest(wps, mc) : null;
        if (map.name && mc && !maps.has(map.name)) {
          maps.set(map.name, { coord: mc, region: region.name ?? null, waypoint: mapWp?.name ?? null, chat: mapWp?.chat_link ?? null });
        }
        for (const s of Object.values(map.sectors ?? {})) {
          if (!s.name || !s.coord || sectors.has(s.name)) continue;
          const best = wps.length ? nearest(wps, s.coord) : null;
          sectors.set(s.name, { coord: s.coord, zone: map.name ?? null, waypoint: best?.name ?? null, chat: best?.chat_link ?? null });
        }
      }
    }
  }
  return { sectors, maps, regions };
}

// Place candidates from a requirement, most specific first.
function placeCandidates(req) {
  if (!req) return [];
  let s = req.replace(/\.\s*$/, "").trim();
  s = s.replace(/\bon the\b/gi, "in").replace(/\bon\b/gi, "in"); // unify with "in"
  const parts = s.split(/\bin\b/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return [];
  return parts
    .slice(1) // drop the leading verb phrase
    .map((p) => p.replace(/^the\s+/i, "").replace(/\s+region$/i, "").replace(/[.,]+$/, "").trim())
    .filter(Boolean);
}

function resolve(req, { sectors, maps, regions }) {
  const cands = placeCandidates(req);
  for (const c of cands) {
    const hit = sectors.get(c);
    if (hit?.coord) return { kind: "area", name: c, zone: hit.zone, waypoint: hit.waypoint, chat: hit.chat, coord: hit.coord };
  }
  for (const c of cands) {
    const hit = maps.get(c);
    if (hit?.coord) return { kind: "map", name: c, zone: null, waypoint: hit.waypoint, chat: hit.chat, coord: hit.coord };
  }
  for (const c of cands) {
    const hit = regions.get(c);
    if (hit?.coord) return { kind: "region", name: c, zone: null, waypoint: null, chat: null, coord: hit.coord };
  }
  return null;
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
try {
  const idx = await buildIndexes();
  console.log(`Indexed ${idx.sectors.size} areas, ${idx.maps.size} maps, ${idx.regions.size} regions.`);

  const achievements = await sql`select id, requirement from achievements where requirement is not null and requirement <> ''`;
  let resolved = 0;
  for (let i = 0; i < achievements.length; i++) {
    const loc = resolve(achievements[i].requirement, idx);
    if (loc) {
      await sql`update achievements set location = ${sql.json(loc)}, updated_at = now() where id = ${achievements[i].id}`;
      resolved++;
    }
    if ((i + 1) % 1000 === 0 || i === achievements.length - 1) {
      console.log(`  ${i + 1}/${achievements.length} scanned, ${resolved} located`);
    }
  }
  console.log(`Done: ${resolved}/${achievements.length} achievements located.`);
} finally {
  await sql.end();
}
