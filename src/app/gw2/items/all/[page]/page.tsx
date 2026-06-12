import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { itemSlug, rarityColor } from "@/lib/gw2/items";
import { countItems, listItemsPage } from "@/lib/gw2/itemsDb";

// Crawlable, paginated A–Z index of every item. This is what gives search
// engines (and users without JS) a real link path to all ~74k item pages; the
// main /gw2/items page is a client-side search box and exposes no item links.

export const revalidate = 86400;

const PAGE_SIZE = 300;
const SITE_URL = "https://buildop.app";

function parsePage(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  return n >= 1 ? n : null;
}

type Params = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params;
  const p = parsePage(page);
  if (!p) return { title: "Item index not found" };
  const total = await countItems().catch(() => 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const suffix = totalPages > 1 ? ` (page ${p} of ${totalPages})` : "";
  const title = `All GW2 Items A–Z${suffix}`;
  return {
    title,
    description: `Alphabetical index of every Guild Wars 2 item${suffix}. Browse all ${total.toLocaleString()} items and open any one for its recipes, acquisition and live Trading Post price.`,
    alternates: { canonical: `/gw2/items/all/${p}` },
    openGraph: { title, url: `${SITE_URL}/gw2/items/all/${p}` },
  };
}

export default async function ItemIndexPage({ params }: Params) {
  const { page } = await params;
  const p = parsePage(page);
  if (!p) notFound();

  const total = await countItems().catch(() => 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (p > totalPages) notFound();

  const items = await listItemsPage((p - 1) * PAGE_SIZE, PAGE_SIZE).catch(() => []);

  return (
    <PageShell
      title="All Items A–Z"
      seo={{
        heading: "All GW2 Items A–Z",
        intro: (
          <p>
            This is the full alphabetical index of every Guild Wars 2 item in the database. Use it to
            browse all {total.toLocaleString()} items page by page, or jump straight to the searchable{" "}
            item database. Each item links to its own page with recipes, acquisition and a live
            Trading Post price.
          </p>
        ),
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Item Database", path: "/gw2/items" },
          { name: "All items A–Z", path: "/gw2/items/all/1" },
          { name: `Page ${p}`, path: `/gw2/items/all/${p}` },
        ],
      }}
      headerRight={
        <Link href="/gw2/items" className="text-sm text-white/55 transition hover:text-white">
          Search items
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <Link href="/gw2/items" className="transition hover:text-orange-400">Item Database</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">All items A–Z</span>
        </nav>

        <h1 className="text-3xl font-bold">All GW2 Items A–Z</h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
          The complete alphabetical index of every Guild Wars 2 item. Prefer to search? Use the{" "}
          <Link href="/gw2/items" className="text-orange-400 hover:underline">item database</Link>. Page {p} of{" "}
          {totalPages.toLocaleString()}.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li key={it.id} className="truncate text-sm leading-snug">
              <Link
                href={`/gw2/item/${itemSlug(it.id, it.name)}`}
                className="transition hover:text-orange-400"
                style={{ color: rarityColor(it.rarity ?? "") }}
              >
                {it.name}
              </Link>
            </li>
          ))}
        </ul>

        <Pager page={p} totalPages={totalPages} />

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          Item data from the official Guild Wars 2 API.
        </p>
      </article>

      <Footer />
    </PageShell>
  );
}

// A windowed pager: first, a few around the current page, and last, so crawlers
// can walk the whole set within a couple of hops from any page.
function Pager({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const nums = new Set<number>([1, totalPages, page]);
  for (let d = 1; d <= 2; d++) {
    if (page - d >= 1) nums.add(page - d);
    if (page + d <= totalPages) nums.add(page + d);
  }
  const sorted = [...nums].sort((a, b) => a - b);

  const link = (n: number, label?: string, current = false) => (
    <Link
      key={`${label ?? n}-${n}`}
      href={`/gw2/items/all/${n}`}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "rounded-md border border-orange-400/50 bg-orange-400/10 px-3 py-1.5 text-sm font-medium text-orange-300"
          : "rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/65 transition hover:border-orange-400/40 hover:text-white"
      }
    >
      {label ?? n}
    </Link>
  );

  return (
    <nav aria-label="Item index pages" className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
      {page > 1 && link(page - 1, "‹ Prev")}
      {sorted.map((n, i) => {
        const prev = sorted[i - 1];
        const gap = prev !== undefined && n - prev > 1;
        return (
          <span key={n} className="flex items-center gap-2">
            {gap && <span className="px-1 text-white/30">…</span>}
            {link(n, undefined, n === page)}
          </span>
        );
      })}
      {page < totalPages && link(page + 1, "Next ›")}
    </nav>
  );
}
