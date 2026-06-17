import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { Icon, P } from "@/components/icons";
import FishingTable, { type FishRow } from "@/components/FishingTable";
import { FISHING_REGION_LIST } from "@/lib/gw2/fishing";
import { rarityBreakdown } from "@/lib/gw2/fishingDisplay";
import { rarityColor } from "@/lib/gw2/items";

const SITE_URL = "https://buildop.app";

const totalFish = FISHING_REGION_LIST.reduce((n, r) => n + r.fish.length, 0);

// Every fish across all regions, each tagged with its region for the table.
const allFish: FishRow[] = FISHING_REGION_LIST.flatMap((r) =>
  r.fish.map((f) => ({ ...f, region: { name: r.name, slug: r.slug } })),
);

export const metadata: Metadata = {
  title: "GW2 Fishing Guide | Every Fish by Region, Hole, Bait & Time",
  description:
    "A complete Guild Wars 2 fishing guide: every catchable fish grouped by region, with its fishing hole, favored bait, time of day and rarity. Plan the Avid Fisher collection achievements across all of Tyria.",
  alternates: { canonical: "/gw2-fishing" },
  openGraph: {
    title: "GW2 Fishing Guide | Every Fish by Region",
    description: "Every catchable GW2 fish by region, hole, bait, time of day and rarity.",
    url: `${SITE_URL}/gw2-fishing`,
  },
};

const FAQS = [
  {
    q: "How does fishing work in Guild Wars 2?",
    a: "Fishing is an End of Dragons mastery. With a fishing rod equipped you cast in open water or at a named fishing hole. Which fish you catch depends on the region, the fishing hole, your equipped bait and the time of day. Catching the full set in a region completes its Fisher and Avid Fisher achievements.",
  },
  {
    q: "Do fished-up fish have any trading-post value?",
    a: "No. Caught fish are account-bound and cannot be sold on the Trading Post. Fishing is about completing the collection achievements (and their reward chests), so this guide focuses on exactly which fish you still need and how to catch each one.",
  },
  {
    q: "What does 'time of day' mean for fishing?",
    a: "Some fish only bite during Daytime, Nighttime, or Dusk/Dawn. Dusk and dawn count as both day and night at once. Each fish below shows the time window it can be caught in.",
  },
  {
    q: "Where does this fishing data come from?",
    a: "Directly from the official Guild Wars 2 API (the Fishing achievement collections), so the fish, rarities, fishing holes, bait and time windows match in-game exactly.",
  },
];

export default function FishingIndexPage() {
  return (
    <PageShell
      title="GW2 Fishing Guide"
      seo={{
        heading: "The Guild Wars 2 fishing guide",
        intro: (
          <>
            <p>
              Tyria is home to hundreds of fish, and which one bites depends on where you cast, the
              fishing hole, your bait and the time of day. This guide lists every catchable fish in
              Guild Wars 2 grouped by region, so you can complete the Fisher and Avid Fisher
              collection achievements without guesswork.
            </p>
            <p>
              Pick a region below to see its fish, each with its fishing hole, favored bait, time of
              day and rarity. Data comes straight from the official GW2 API, so it always matches the
              game.
            </p>
          </>
        ),
        faqs: FAQS,
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Fishing Guide", path: "/gw2-fishing" },
        ],
      }}
      headerRight={
        <Link href="/gw2-event-timer" className="text-sm text-white/55 transition hover:text-white">
          Event timers
        </Link>
      }
    >
      <article className="mx-auto max-w-5xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">Fishing Guide</span>
        </nav>

        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500/30 to-cyan-500/20 text-sky-300">
            <Icon path={P.fish} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold">GW2 Fishing Guide</h1>
            <p className="mt-0.5 text-sm text-white/50">
              {totalFish} fish across {FISHING_REGION_LIST.length} regions
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/60">
          Every catchable fish in Guild Wars 2, grouped by region with its fishing hole, favored
          bait, time of day and rarity. Choose a region to start ticking off the Avid Fisher
          collection.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FISHING_REGION_LIST.map((r) => {
            const breakdown = rarityBreakdown(r.fish);
            return (
              <Link
                key={r.slug}
                href={`/gw2/fishing/${r.slug}`}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-sky-400/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-white transition group-hover:text-sky-300">
                    {r.name} Fishing
                  </h2>
                  <span className="shrink-0 text-xs text-white/40">{r.fish.length} fish</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {breakdown.map((b) => (
                    <span
                      key={b.rarity}
                      title={`${b.count} ${b.rarity}`}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] tabular-nums text-white/60"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: rarityColor(b.rarity) }}
                      />
                      {b.count}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        <section className="mt-12">
          <h2 className="mb-1 text-xl font-bold text-white">All fish</h2>
          <p className="mb-4 text-sm text-white/50">
            Every catchable fish in one place. Sort or filter by name, region, fishing hole, bait or
            time of day.
          </p>
          <FishingTable fish={allFish} showRegion />
        </section>
      </article>

      <Footer />
    </PageShell>
  );
}
