import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import IconRail from "@/components/IconRail";
import VendorDirectory from "@/components/VendorDirectory";
import { Icon, P } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
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
      </main>

      <JsonLd data={breadcrumbJsonLd(BREADCRUMB)} />
      <JsonLd data={vendorListLd} />
    </div>
  );
}
