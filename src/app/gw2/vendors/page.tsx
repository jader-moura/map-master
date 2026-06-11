import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import VendorDirectory from "@/components/VendorDirectory";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/seo";
import { listVendors, type VendorListing } from "@/lib/gw2/itemsDb";

export const metadata: Metadata = {
  title: "GW2 Vendors | Who Sells What in Guild Wars 2",
  description:
    "Browse every Guild Wars 2 vendor and what they sell. Open a vendor to see its full item list with costs, or jump to any item to see where to buy it. Vendor data from the Guild Wars 2 Wiki.",
  alternates: { canonical: "/gw2/vendors" },
  openGraph: {
    title: "GW2 Vendors | Who Sells What in Guild Wars 2",
    description:
      "Every Guild Wars 2 vendor and the items they sell, with costs and live item links.",
    url: `${SITE_URL}/gw2/vendors`,
  },
};

const BREADCRUMB = [
  { name: "Home", path: "/" },
  { name: "Vendors", path: "/gw2/vendors" },
];

export default async function VendorsHubPage() {
  const vendors = await listVendors().catch(() => [] as VendorListing[]);

  const vendorListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "GW2 Vendors",
    url: `${SITE_URL}/gw2/vendors`,
    isPartOf: { "@type": "WebSite", name: "buildop", url: SITE_URL },
  };

  return (
    <PageShell
      title="Vendors"
      seo={{
        heading: "GW2 Vendors",
        intro: (
          <>
            <p>
              Browse every Guild Wars 2 vendor we have a sales list for. Each vendor page shows the
              items it sells with their costs, its location on the Tyria map, and a copy-ready
              waypoint chat code so you can travel straight there.
            </p>
            <p>Vendor data is mirrored from the Guild Wars 2 Wiki; item icons and prices come from the official Guild Wars 2 API.</p>
          </>
        ),
        faqs: [
          {
            q: "How do I get to a vendor?",
            a: "Open a vendor to see its location and a copy waypoint button; paste the chat code into the in-game chat to open the map at the nearest waypoint.",
          },
          {
            q: "Can I see what a vendor sells?",
            a: "Yes, each vendor page lists every item it sells along with the cost in coin, karma or tokens.",
          },
        ],
        breadcrumb: BREADCRUMB,
      }}
      headerRight={
        <Link href="/gw2/items" className="text-sm text-white/55 transition hover:text-white">
          Item database
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-white/40">
            <Link href="/" className="transition hover:text-orange-400">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <Link href="/gw2/items" className="transition hover:text-orange-400">
              Item Database
            </Link>
            <span className="px-1.5">/</span>
            <span className="text-white/60">Vendors</span>
          </nav>

          <h1 className="text-3xl font-bold">GW2 Vendors</h1>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
            Every Guild Wars 2 vendor we have a sales list for. Open a vendor to see the items it
            sells and their costs, or search the{" "}
            <Link href="/gw2/items" className="text-orange-400 hover:underline">
              item database
            </Link>{" "}
            to find where any single item is sold. Vendor data is sourced from the Guild Wars 2 Wiki.
          </p>

          <div className="mt-6">
            <VendorDirectory vendors={vendors} />
          </div>
        </article>

      <Footer />

      <JsonLd data={vendorListLd} />
    </PageShell>
  );
}
