import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { type MetaEvent } from "@/lib/gw2/events";

const WIKI_API =
  "https://wiki.guildwars2.com/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&titles=" +
  encodeURIComponent("Widget:Event timer/data.json");

type RawData = {
  events: Record<
    string,
    {
      category?: string;
      name?: string;
      link?: string;
      segments?: Record<string, { name?: string; link?: string; bg?: unknown }>;
      sequences?: { partial?: unknown[]; pattern?: unknown[] };
    }
  >;
};

// Fetch the wiki's event-timer JSON, slim it to the located meta events, and
// cache the result weekly. Retries because the wiki occasionally serves an
// HTML error page instead of JSON.
const getEvents = unstable_cache(
  async (): Promise<MetaEvent[]> => {
    let data: RawData | null = null;
    for (let attempt = 0; attempt < 4 && !data; attempt++) {
      const res = await fetch(WIKI_API, {
        headers: { "User-Agent": "buildop (buildop.app)", Accept: "application/json" },
        cache: "no-store",
      });
      const text = await res.text();
      if (text.trimStart().startsWith("{")) {
        const pages = JSON.parse(text).query?.pages ?? {};
        const page = Object.values(pages)[0] as
          | { revisions?: { slots?: { main?: { ["*"]?: string } } }[] }
          | undefined;
        const content = page?.revisions?.[0]?.slots?.main?.["*"];
        if (content) data = JSON.parse(content) as RawData;
      }
      if (!data) await new Promise((r) => setTimeout(r, 1200));
    }
    if (!data) throw new Error("wiki event data unavailable");

    const out: MetaEvent[] = [];
    for (const [id, e] of Object.entries(data.events)) {
      if (id === "t" || !e.name) continue; // skip the template entry
      out.push({
        id,
        category: e.category ?? "",
        name: e.name ?? id,
        link: e.link,
        segments: (e.segments ?? {}) as MetaEvent["segments"],
        sequences: (e.sequences ?? { partial: [], pattern: [] }) as MetaEvent["sequences"],
      });
    }
    return out;
  },
  ["gw2-events-v1"],
  { revalidate: 60 * 60 * 24 * 7 },
);

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
