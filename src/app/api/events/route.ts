import { NextResponse } from "next/server";
import { getEvents } from "@/lib/gw2/eventsData";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load events" },
      { status: 502 },
    );
  }
}
