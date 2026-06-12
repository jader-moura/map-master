import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { ItemCard } from "@/components/ItemCard";
import ItemSearch from "@/components/ItemSearch";
import { JsonLd } from "@/components/seo/JsonLd";
import { getItemsFull, type Gw2ItemFull } from "@/lib/gw2/api";
import { ALL_GROUPS, INDEX_ITEM_IDS } from "@/lib/gw2/itemIndex";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "GW2 Item Database | Recipes, Prices & How to Get Items",
  description:
    "Browse the Guild Wars 2 item database: crafting materials, economy staples and ascended components. Open any item to see its recipes, what it is used in and the live Trading Post price.",
  alternates: { canonical: "/gw2/items" },
  openGraph: {
    title: "GW2 Item Database | Recipes, Prices & How to Get Items",
    description:
      "Crafting materials, economy staples and ascended components, each with recipes, used-in lists and live Trading Post prices.",
    url: `${SITE_URL}/gw2/items`,
  },
};

const BREADCRUMB = [
  { name: "Home", path: "/" },
  { name: "Item Database", path: "/gw2/items" },
];

export default async function ItemsHubPage() {
  // One batched lookup for every icon/rarity on the page (cached daily).
  const items = await getItemsFull(INDEX_ITEM_IDS).catch(() => [] as Gw2ItemFull[]);
  const byId = new Map(items.map((i) => [i.id, i]));

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "GW2 Item Database",
    url: `${SITE_URL}/gw2/items`,
    isPartOf: { "@type": "WebSite", name: "buildop", url: SITE_URL },
  };

  return (
    <PageShell
      title="Item Database"
      seo={{
        heading: "GW2 Item Database",
        intro: (
          <>
            <p>
              Search the full Guild Wars 2 item database by name and filter by rarity or type. Every
              item links to a page showing how to get it (vendors, salvage, achievement rewards and
              collections), its crafting recipes, what it is used in, and its live Trading Post buy
              and sell price.
            </p>
            <p>
              Item metadata comes from the official Guild Wars 2 API; acquisition, salvage and
              collection data is mirrored from the Guild Wars 2 Wiki.
            </p>
          </>
        ),
        faqs: [
          {
            q: "How do I find where to get an item?",
            a: 'Open any item and check the Acquisition and "Sold by" sections, which list the vendors, containers, salvage sources and achievements that grant it.',
          },
          {
            q: "Are the Trading Post prices live?",
            a: "Yes. Buy and sell prices are pulled live from the official Guild Wars 2 Trading Post API each time you open an item.",
          },
        ],
        breadcrumb: BREADCRUMB,
      }}
      headerRight={
        <Link href="/" className="text-sm text-white/55 transition hover:text-white">
          Back to map
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-white/40">
            <Link href="/" className="transition hover:text-orange-400">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <span className="text-white/60">Item Database</span>
          </nav>

          <h1 className="text-3xl font-bold">GW2 Item Database</h1>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
            Search every Guild Wars 2 item by name and filter by rarity or type. Open any item to see
            how to craft it, the recipes it is used in, and its live Trading Post buy and sell price,
            all sourced from the official Guild Wars 2 API. Looking for material prices? See the{" "}
            <Link href="/gw2-trading-post" className="text-orange-400 hover:underline">
              Trading Post
            </Link>
            , the{" "}
            <Link href="/gw2-gathering-map" className="text-orange-400 hover:underline">
              gathering map
            </Link>{" "}
            and the{" "}
            <Link href="/gw2/vendors" className="text-orange-400 hover:underline">
              vendor directory
            </Link>
            .
          </p>

          <div className="mt-6">
            <ItemSearch />
          </div>

          <p className="mt-5 text-sm text-white/55">
            Prefer to browse?{" "}
            <Link href="/gw2/items/all/1" className="text-orange-400 hover:underline">
              See the full A–Z index of every item
            </Link>
            .
          </p>

          <h2 className="mt-12 border-t border-white/10 pt-8 text-xl font-bold">
            Browse by category
          </h2>

          {ALL_GROUPS.map((group) => (
            <section key={group.label} className="mt-9">
              <h2 className="text-lg font-semibold text-white">{group.label}</h2>
              <p className="mt-1 text-sm text-white/45">{group.blurb}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((it) => {
                  const full = byId.get(it.id);
                  return (
                    <ItemCard
                      key={it.id}
                      id={it.id}
                      name={full?.name ?? it.name}
                      icon={full?.icon}
                      rarity={full?.rarity}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </article>

      <Footer />

      <JsonLd data={itemListLd} />
    </PageShell>
  );
}
