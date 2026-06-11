import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { ItemCard } from "@/components/ItemCard";
import CopyWaypoint from "@/components/CopyWaypoint";
import VendorMapView from "@/components/VendorMapView";
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

  // Locations that have map coordinates, for the small map.
  const mapLocations = vendor.locations
    .filter((l) => Array.isArray(l.coord) && l.coord.length === 2)
    .map((l) => ({ area: l.area, zone: l.zone, coord: l.coord as [number, number] }));

  return (
    <PageShell
      title={vendor.name}
      headerRight={
        <Link href="/gw2/items" className="text-sm text-white/55 transition hover:text-white">
          Item database
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
            <Link href="/" className="transition hover:text-orange-400">Home</Link>
            <span className="px-1.5">/</span>
            <Link href="/gw2/items" className="transition hover:text-orange-400">Item Database</Link>
            <span className="px-1.5">/</span>
            <span className="text-white/60">{vendor.name}</span>
          </nav>

          <div className="flex items-start gap-5">
            {vendor.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.icon}
                alt={vendor.name}
                width={153}
                height={300}
                className="h-[300px] w-[153px] shrink-0 rounded-xl border border-white/10 object-cover"
              />
            ) : (
              <span className="grid h-[300px] w-[153px] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/30">
                <Icon path={P.store} className="h-16 w-16" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl font-bold">{vendor.name}</h1>
              <p className="mt-2 text-sm text-white/45">
                Guild Wars 2 vendor. {sales.length > 0 ? `Sells ${sales.length} item${sales.length === 1 ? "" : "s"}.` : ""}
              </p>
            </div>
          </div>

          {vendor.locations.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                <h2 className="text-lg font-semibold text-white">Locations</h2>
                <span className="text-xs text-white/40">
                  {vendor.locations.length} location{vendor.locations.length === 1 ? "" : "s"}
                </span>
              </div>
              {mapLocations.length > 0 && (
                <div className="mb-3">
                  <VendorMapView locations={mapLocations} />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {vendor.locations.map((loc, i) => (
                  <div
                    key={`${loc.area}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/85">{loc.area}</p>
                      {(loc.zone || loc.waypoint) && (
                        <p className="truncate text-xs text-white/40">
                          {[loc.zone, loc.waypoint].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    {loc.chat && <CopyWaypoint code={loc.chat} />}
                  </div>
                ))}
              </div>
            </section>
          )}

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
                    <ItemCard
                      key={s.item_name}
                      id={it.id}
                      name={it.name}
                      icon={it.icon ?? undefined}
                      rarity={it.rarity ?? undefined}
                      cost={s.cost}
                    />
                  ) : (
                    <span
                      key={s.item_name}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60"
                    >
                      <span className="min-w-0 flex-1 truncate">{s.item_name}</span>
                      {s.cost && <span className="shrink-0 text-xs text-orange-300/80">{s.cost}</span>}
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

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Item Database", path: "/gw2/items" },
          { name: vendor.name, path: `/gw2/vendor/${slug}` },
        ])}
      />
    </PageShell>
  );
}
