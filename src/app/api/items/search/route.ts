import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";

// Server-side item search over the Supabase mirror. The browser never downloads
// the 70k-row index; it calls this with a query + filters and gets one page back.
export const runtime = "nodejs"; // the pg client needs Node, not Edge
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const rarity = sp.get("rarity") ?? "";
  const type = sp.get("type") ?? "";
  const tradable = sp.get("tradable") === "1";
  const page = Math.max(0, Math.floor(Number(sp.get("page") ?? 0)) || 0);

  const lvlMinRaw = sp.get("lvlMin");
  const lvlMaxRaw = sp.get("lvlMax");
  const lvlMin = lvlMinRaw ? Math.floor(Number(lvlMinRaw)) : null;
  const lvlMax = lvlMaxRaw ? Math.floor(Number(lvlMaxRaw)) : null;

  const sql = getSql();
  // Fuzzy name ranking when searching; alphabetical otherwise.
  const orderBy = q
    ? sql`order by similarity(name, ${q}) desc, length(name) asc, name asc`
    : sql`order by name asc`;

  try {
    const rows = await sql`
      select id, name, rarity, type, level, icon, count(*) over () as total
      from items
      where true
        ${q ? sql`and name ilike ${"%" + q + "%"}` : sql``}
        ${rarity ? sql`and rarity = ${rarity}` : sql``}
        ${type ? sql`and type = ${type}` : sql``}
        ${tradable ? sql`and tradable = true` : sql``}
        ${lvlMin != null && Number.isFinite(lvlMin) ? sql`and level >= ${lvlMin}` : sql``}
        ${lvlMax != null && Number.isFinite(lvlMax) ? sql`and level <= ${lvlMax}` : sql``}
      ${orderBy}
      limit ${PAGE_SIZE} offset ${page * PAGE_SIZE}
    `;

    const total = rows.length ? Number(rows[0].total) : 0;
    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      rarity: r.rarity,
      type: r.type,
      level: r.level,
      icon: r.icon,
    }));

    return NextResponse.json(
      { items, total, page, pageSize: PAGE_SIZE },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
    );
  } catch (err) {
    console.error("item search failed", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
