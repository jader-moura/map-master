import { NextRequest, NextResponse } from "next/server";
import { getPrices } from "@/lib/gw2/api";

// Example cached proxy endpoint: /api/prices?ids=19684,19685
// Demonstrates the server-side caching layer for the volatile Trading Post.
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ?ids=" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) {
    return NextResponse.json({ error: "No valid item ids" }, { status: 400 });
  }

  try {
    const prices = await getPrices(ids);
    return NextResponse.json(prices, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream error" },
      { status: 502 },
    );
  }
}
