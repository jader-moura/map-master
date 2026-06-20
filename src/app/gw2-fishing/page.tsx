import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { Icon, P } from "@/components/icons";
import FishingTable, { type FishRow } from "@/components/FishingTable";
import { FISHING_REGION_LIST } from "@/lib/gw2/fishing";
import { FISHING_REGION_HOLES } from "@/lib/gw2/fishingHoles";
import {
  rarityBreakdown,
  timeBreakdown,
  baitBreakdown,
  type Breakdown,
} from "@/lib/gw2/fishingDisplay";
import { rarityColor } from "@/lib/gw2/items";

const SITE_URL = "https://buildop.app";

const totalFish = FISHING_REGION_LIST.reduce((n, r) => n + r.fish.length, 0);

// Every fish across all regions, each tagged with its region for the table.
const allFish: FishRow[] = FISHING_REGION_LIST.flatMap((r) =>
  r.fish.map((f) => ({ ...f, region: { name: r.name, slug: r.slug } })),
);

const rarityRows = rarityBreakdown(allFish);
const timeRows = timeBreakdown(allFish);
const baitRows = baitBreakdown(allFish);
const totalHoles = Object.values(FISHING_REGION_HOLES).reduce((n, a) => n + a.length, 0);
const anyBaitCount = allFish.filter((f) => !f.bait || f.bait === "Any").length;
const specificBaitFish = totalFish - anyBaitCount;

export const metadata: Metadata = {
  title: "GW2 Fishing Guide | Every Fish by Region, Hole, Bait & Time",
  description:
    "A complete Guild Wars 2 fishing guide: every catchable fish grouped by region, with its fishing hole, favored bait, time of day and rarity. Mapped fishing-hole locations and Avid Fisher collection help across all of Tyria.",
  alternates: { canonical: "/gw2-fishing" },
  openGraph: {
    title: "GW2 Fishing Guide | Every Fish by Region",
    description: "Every catchable GW2 fish by region, hole, bait, time of day and rarity, with mapped fishing holes.",
    url: `${SITE_URL}/gw2-fishing`,
  },
};

const STEPS: { icon: string; title: string; body: string }[] = [
  {
    icon: P.fish,
    title: "Equip a fishing rod",
    body: "Fishing is an End of Dragons mastery. Grab a fishing rod, train the Fishing line, and you can cast anywhere there's water.",
  },
  {
    icon: P.map,
    title: "Cast at holes or open water",
    body: "Named fishing holes give type-specific catches and reset on a timer; open water bites anything. Every region page maps real hole locations.",
  },
  {
    icon: P.tag,
    title: "Match your bait",
    body: "Each fish has a favored bait that boosts your odds. Bait and lures are sold by Fishing Supplies vendors and gathered around Tyria.",
  },
  {
    icon: P.clock,
    title: "Mind the time of day",
    body: "Some fish only bite during day, night or dusk/dawn. Dusk and dawn count as both day and night at the same time.",
  },
];

const FAQS = [
  {
    q: "How does fishing work in Guild Wars 2?",
    a: "Fishing is an End of Dragons mastery. With a fishing rod equipped you cast in open water or at a named fishing hole. Which fish you catch depends on the region, the fishing hole, your equipped bait and the time of day. Catching the full set in a region completes its Fisher and Avid Fisher achievements.",
  },
  {
    q: "What bait should I use?",
    a: `Most fish (${anyBaitCount} of ${totalFish}) accept any bait, but ${specificBaitFish} have a favored bait that meaningfully raises your catch chance. Each fish below lists its favored bait; the Bait guide section groups them so you know what to stock before a session.`,
  },
  {
    q: "Where are the fishing holes?",
    a: `We map ${totalHoles.toLocaleString()} real fishing-hole locations across Tyria on the individual region pages, so you can see exactly where to cast for each water type. Hole locations come from the community Only Fish marker pack.`,
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
    a: "The fish, rarities, fishing holes, bait and time windows come from the official Guild Wars 2 API (the Fishing achievement collections), so they match in-game exactly. Mapped hole coordinates come from the community Only Fish marker pack.",
  },
];

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}

function StatPanel({
  title,
  rows,
  colorFor,
}: {
  title: string;
  rows: Breakdown[];
  colorFor?: (label: string) => string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white/85">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="text-xs">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-white/65">{r.label}</span>
              <span className="shrink-0 tabular-nums text-white/45">{r.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${(r.count / max) * 100}%`, backgroundColor: colorFor?.(r.label) ?? "#38bdf8" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
              Guild Wars 2 grouped by region, with mapped fishing-hole locations, so you can complete
              the Fisher and Avid Fisher collection achievements without guesswork.
            </p>
            <p>
              Pick a region below to see its fish and a map of every fishing hole, each fish with its
              favored bait, time of day and rarity. Data comes straight from the official GW2 API.
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

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatChip value={String(totalFish)} label="Catchable fish" />
          <StatChip value={String(FISHING_REGION_LIST.length)} label="Fishing regions" />
          <StatChip value={totalHoles.toLocaleString()} label="Holes mapped" />
          <StatChip value={String(baitRows.length)} label="Bait types" />
        </div>

        {/* How fishing works */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">How fishing works</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-300">
                  <Icon path={s.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* At a glance */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">All Tyria&apos;s fish at a glance</h2>
          <p className="mt-1 text-sm text-white/50">
            How the {totalFish} catchable fish break down by rarity, time window and favored bait.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatPanel title="By rarity" rows={rarityRows.map((r) => ({ label: r.rarity, count: r.count }))} colorFor={rarityColor} />
            <StatPanel title="By time of day" rows={timeRows} />
            <StatPanel title="Top favored bait" rows={baitRows.slice(0, 6)} />
          </div>
        </section>

        {/* Regions */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">Fish by region</h2>
          <p className="mt-1 text-sm text-white/50">
            Each region has its own Fisher and Avid Fisher collection. Open one for its fish list and
            a map of every fishing hole.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FISHING_REGION_LIST.map((r) => {
              const breakdown = rarityBreakdown(r.fish);
              const holeCount = FISHING_REGION_HOLES[r.slug]?.length ?? 0;
              return (
                <Link
                  key={r.slug}
                  href={`/gw2/fishing/${r.slug}`}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-sky-400/40 hover:bg-white/[0.06]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-white transition group-hover:text-sky-300">
                      {r.name} Fishing
                    </h3>
                    <span className="shrink-0 text-xs text-white/40">{r.fish.length} fish</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {breakdown.map((b) => (
                      <span
                        key={b.rarity}
                        title={`${b.count} ${b.rarity}`}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] tabular-nums text-white/60"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: rarityColor(b.rarity) }} />
                        {b.count}
                      </span>
                    ))}
                  </div>
                  {holeCount > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
                      <Icon path={P.map} className="h-3.5 w-3.5 text-sky-300/70" />
                      {holeCount} fishing holes mapped
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bait guide */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">Bait guide</h2>
          <p className="mt-1 text-sm text-white/50">
            {anyBaitCount} fish bite on any bait, but {specificBaitFish} have a favored bait worth
            stocking. Bait and lures are sold by Fishing Supplies vendors and gathered around Tyria.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {baitRows.map((b) => (
              <div
                key={b.label}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm text-white/80">{b.label}</span>
                <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] tabular-nums text-white/55">
                  {b.count} fish
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* All fish */}
        <section className="mt-12">
          <h2 className="mb-1 text-xl font-bold text-white">All fish</h2>
          <p className="mb-4 text-sm text-white/50">
            Every catchable fish in one place. Sort or filter by name, region, fishing hole, bait or
            time of day.
          </p>
          <FishingTable fish={allFish} showRegion />
        </section>

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          Fishing data and icons from the official Guild Wars 2 API. Fishing hole locations from the{" "}
          <a
            href="https://github.com/Metallis/Only-Fish-Marker-Pack"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:text-white/60"
          >
            Only Fish marker pack
          </a>{" "}
          by Metallis &amp; contributors, licensed{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:text-white/60"
          >
            CC BY-NC-SA 4.0
          </a>
          .
        </p>
      </article>

      <Footer />
    </PageShell>
  );
}
