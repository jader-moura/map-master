import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import IconRail from "@/components/IconRail";
import { ItemCard } from "@/components/ItemCard";
import { Icon, P } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { itemsByNames, vendorBySlug, vendorSales, type DbItem } from "@/lib/gw2/itemsDb";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await vendorBySlug(slug).catch(() => null);
  if (!vendor) return { title: "Vendor not found" };
  const title = `${vendor.name} | GW2 Vendor`;
  const description = `What ${vendor.name} sells in Guild Wars 2, with item icons and live links. Vendor data from the Guild Wars 2 Wiki.`;
  return {
    title,
    description,
    alternates: { canonical: `/gw2/vendor/${slug}` },
    openGraph: { title, description, url: `https://buildop.app/gw2/vendor/${slug}` },
  };
}

export default async function VendorPage({ params }: Params) {
  const { slug } = await params;
  const vendor = await vendorBySlug(slug).catch(() => null);
  if (!vendor) notFound();

  const sales = await vendorSales(slug).catch(() => []);
  const dbItems = sales.length
    ? await itemsByNames(sales.map((s) => s.item_name)).catch(() => [])
    : [];
  const dbByName = new Map<string, DbItem>(dbItems.map((i) => [i.name, i]));

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
          <Link href="/gw2/items" className="ml-auto text-sm text-white/55 transition hover:text-white">
            Item database
          </Link>
        </header>

        <article className="mx-auto max-w-4xl px-5 py-10">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
            <Link href="/" className="transition hover:text-orange-400">Home</Link>
            <span className="px-1.5">/</span>
            <Link href="/gw2/items" className="transition hover:text-orange-400">Item Database</Link>
            <span className="px-1.5">/</span>
            <span className="text-white/60">{vendor.name}</span>
          </nav>

          <h1 className="text-3xl font-bold">{vendor.name}</h1>
          <p className="mt-2 text-sm text-white/45">
            Guild Wars 2 vendor. {sales.length > 0 ? `Sells ${sales.length} item${sales.length === 1 ? "" : "s"}.` : ""}
          </p>

          {sales.length > 0 ? (
            <section className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                <h2 className="text-lg font-semibold text-white">Sells</h2>
                <span className="text-xs text-white/40">{sales.length} items</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sales.map((s) => {
                  const it = dbByName.get(s.item_name);
                  return it ? (
                    <ItemCard key={s.item_name} id={it.id} name={it.name} icon={it.icon ?? undefined} rarity={it.rarity ?? undefined} />
                  ) : (
                    <span
                      key={s.item_name}
                      className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60"
                    >
                      <span className="truncate">{s.item_name}</span>
                    </span>
                  );
                })}
              </div>
            </section>
          ) : (
            <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
              We do not have a sales list for this vendor yet.
            </p>
          )}

          <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
            Vendor data from the Guild Wars 2 Wiki; item data from the official Guild Wars 2 API.
          </p>
        </article>

        <Footer />
      </main>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Item Database", path: "/gw2/items" },
          { name: vendor.name, path: `/gw2/vendor/${slug}` },
        ])}
      />
    </div>
  );
}
