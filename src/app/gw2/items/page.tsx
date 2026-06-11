import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import IconRail from "@/components/IconRail";
import { ItemCard } from "@/components/ItemCard";
import ItemSearch from "@/components/ItemSearch";
import { Icon, P } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { getItemsFull, type Gw2ItemFull } from "@/lib/gw2/api";
import { ALL_GROUPS, INDEX_ITEM_IDS } from "@/lib/gw2/itemIndex";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seo";

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
    <div className="flex h-[100dvh] bg-[#0a0a0f] text-white">
      <IconRail showInfo={false} />

      <main className="scroll-themed min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0d0d14]/95 px-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
              <Icon path={P.bolt} className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight">buildop</span>
          </Link>
          <Link href="/" className="ml-auto text-sm text-white/55 transition hover:text-white">
            Back to map
          </Link>
        </header>

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
      </main>

      <JsonLd data={breadcrumbJsonLd(BREADCRUMB)} />
      <JsonLd data={itemListLd} />
    </div>
  );
}
