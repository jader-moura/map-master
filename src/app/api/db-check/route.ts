import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSql } from "@/lib/db";

// TEMP diagnostic: reports whether the DB connection works in this environment,
// and what host/port/user it's using. The PASSWORD is never read or returned,
// nor are any keys/tokens. Gated behind a key so it isn't world-readable.
// Delete this file once the production connection is verified.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "gw2-diag-7f3a9c2e";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = process.env.DATABASE_URL;
  const info: Record<string, unknown> = { hasUrl: Boolean(url) };

  if (url) {
    try {
      const u = new URL(url);
      info.host = u.hostname;
      info.port = u.port;
      info.user = u.username; // not secret (e.g. "postgres" or "postgres.<ref>")
      info.isPooler = u.hostname.includes("pooler");
    } catch {
      info.parseError = true;
    }
  }

  try {
    const sql = getSql();
    const rows = await sql`select count(*)::int as n from items`;
    info.dbOk = true;
    info.itemCount = rows[0]?.n ?? null;
  } catch (e) {
    info.dbOk = false;
    info.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info, { headers: { "Cache-Control": "no-store" } });
}
