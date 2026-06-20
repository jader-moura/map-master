import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { Icon, P } from "@/components/icons";
import FishingTable from "@/components/FishingTable";
import FishingRegionExplorer from "@/components/FishingRegionExplorer";
import { FISHING_REGIONS, FISHING_REGION_LIST } from "@/lib/gw2/fishing";
import { FISHING_REGION_MAPS } from "@/lib/gw2/fishingMaps";
import { FISHING_REGION_HOLES } from "@/lib/gw2/fishingHoles";
import { rarityBreakdown } from "@/lib/gw2/fishingDisplay";
import { rarityColor } from "@/lib/gw2/items";

const SITE_URL = "https://buildop.app";

export function generateStaticParams() {
  return FISHING_REGION_LIST.map((r) => ({ slug: r.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const region = FISHING_REGIONS[slug];
  if (!region) return { title: "Fishing region not found" };

  const title = `${region.name} Fishing Guide | All ${region.fish.length} Fish, Bait & Times`;
  const description = `Every fish you can catch in ${region.name} waters in Guild Wars 2: fishing hole, favored bait, time of day and rarity for all ${region.fish.length} fish. Complete the ${region.name} Fisher and Avid Fisher collections.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/gw2/fishing/${slug}` },
    openGraph: { title, description: description.slice(0, 160), url: `${SITE_URL}/gw2/fishing/${slug}` },
  };
}

export default async function FishingRegionPage({ params }: Params) {
  const { slug } = await params;
  const region = FISHING_REGIONS[slug];
  if (!region) notFound();

  const breakdown = rarityBreakdown(region.fish);
  const others = FISHING_REGION_LIST.filter((r) => r.slug !== slug);
  const regionMaps = FISHING_REGION_MAPS[slug] ?? [];
  const regionHoles = FISHING_REGION_HOLES[slug] ?? [];
  const hasMap = regionMaps.length > 0;

  return (
    <PageShell
      title={`${region.name} Fishing`}
      seo={{
        heading: `${region.name} fishing guide`,
        intro: (
          <>
            <p>
              There are {region.fish.length} fish to catch in {region.name} waters. Each one below
              lists the fishing hole it bites at, the favored bait, the time of day it appears and its
              rarity, so you can finish the {region.name} Fisher and Avid {region.name} Fisher
              collections efficiently.
            </p>
            <p>
              Remember that caught fish are account-bound, fishing rewards come from completing the
              collections. Dusk and dawn count as both day and night at the same time.
            </p>
          </>
        ),
        faqs: [
          {
            q: `How many fish are there in ${region.name}?`,
            a: `There are ${region.fish.length} catchable fish across the ${region.name} fishing collections. This page lists each one with its fishing hole, bait and time of day.`,
          },
          {
            q: `What bait do I need for ${region.name} fish?`,
            a: `Bait varies per fish. Many accept any bait, while some need a specific bait shown next to them below. Bait and lures are sold by Fishing Supply vendors.`,
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Fishing Guide", path: "/gw2-fishing" },
          { name: region.name, path: `/gw2/fishing/${slug}` },
        ],
      }}
      headerRight={
        <Link href="/gw2-fishing" className="text-sm text-white/55 transition hover:text-white">
          All regions
        </Link>
      }
    >
      <article className="mx-auto max-w-6xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <Link href="/gw2-fishing" className="transition hover:text-orange-400">Fishing Guide</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">{region.name}</span>
        </nav>

        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500/30 to-cyan-500/20 text-sky-300">
            <Icon path={P.fish} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold">{region.name} Fishing Guide</h1>
            <p className="mt-0.5 text-sm text-white/50">{region.fish.length} fish to catch</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {breakdown.map((b) => (
            <span
              key={b.rarity}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/65"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: rarityColor(b.rarity) }} />
              {b.count} {b.rarity}
            </span>
          ))}
        </div>

        <section className="mt-8">
          {hasMap ? (
            <FishingRegionExplorer
              regionName={region.name}
              fish={region.fish}
              maps={regionMaps}
              holes={regionHoles}
            />
          ) : (
            <FishingTable fish={region.fish} />
          )}
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold text-white">Other fishing regions</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((r) => (
              <Link
                key={r.slug}
                href={`/gw2/fishing/${r.slug}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 transition hover:border-sky-400/40 hover:text-white"
              >
                {r.name} <span className="text-white/35">({r.fish.length})</span>
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          Fishing data and icons from the official Guild Wars 2 API. Caught fish are account-bound.
          {regionHoles.length > 0 && (
            <>
              {" "}Fishing hole locations from the{" "}
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
            </>
          )}
        </p>
      </article>

      <Footer />
    </PageShell>
  );
}
