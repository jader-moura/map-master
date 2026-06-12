import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { ItemCard } from "@/components/ItemCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { itemListJsonLd } from "@/lib/seo";
import { itemSlug, parseItemId } from "@/lib/gw2/items";
import {
  achievementById,
  achievementItemIds,
  itemsByIds,
  type DbAchievement,
  type DbItem,
} from "@/lib/gw2/itemsDb";

// Achievement pages have no live data, so cache aggressively (refresh daily).
export const revalidate = 86400;

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string): Promise<DbAchievement | null> {
  const id = parseItemId(slug);
  if (id === null) return null;
  return achievementById(id).catch(() => null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) return { title: "Achievement not found" };
  const kind = a.type === "ItemSet" ? "Collection" : "Achievement";
  const title = `${a.name} | GW2 ${kind}`;
  const description = (a.description || a.requirement || `The ${a.name} ${kind.toLowerCase()} in Guild Wars 2.`).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/gw2/achievement/${itemSlug(a.id, a.name)}` },
    openGraph: { title, description, url: `https://buildop.app/gw2/achievement/${itemSlug(a.id, a.name)}` },
  };
}

export default async function AchievementPage({ params }: Params) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) notFound();

  const [collectIds, rewardIds] = await Promise.all([
    achievementItemIds(a.id, "collect").catch(() => [] as number[]),
    achievementItemIds(a.id, "reward").catch(() => [] as number[]),
  ]);
  const items = await itemsByIds([...new Set([...collectIds, ...rewardIds])]).catch(() => []);
  const byId = new Map<number, DbItem>(items.map((i) => [i.id, i]));
  const collect = collectIds.map((id) => byId.get(id)).filter((x): x is DbItem => Boolean(x));
  const rewards = rewardIds.map((id) => byId.get(id)).filter((x): x is DbItem => Boolean(x));

  const isCollection = a.type === "ItemSet";
  const kind = isCollection ? "Collection" : "Achievement";

  return (
    <PageShell
      title={a.name}
      seo={{
        heading: a.name,
        intro: (
          <p>
            {a.name} is {isCollection ? "a collection" : "an achievement"} in Guild Wars 2.
            {a.requirement ? ` ${a.requirement}` : ""} This page lists the items it{" "}
            {isCollection ? "contains" : "rewards"}, sourced from the official Guild Wars 2 API.
          </p>
        ),
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Item Database", path: "/gw2/items" },
          { name: a.name, path: `/gw2/achievement/${itemSlug(a.id, a.name)}` },
        ],
      }}
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
            <span className="text-white/60">{a.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            {a.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.icon} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg border border-white/10" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/40">{kind}</p>
              <h1 className="mt-1 text-3xl font-bold">{a.name}</h1>
              {a.description && <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-white/65">{a.description}</p>}
              {a.requirement && <p className="mt-2 text-sm text-white/50">{a.requirement}</p>}
            </div>
          </div>

          {collect.length > 0 && (
            <Section title={isCollection ? "Items in this collection" : "Items"} hint={`${collect.length}`}>
              <Grid items={collect} />
            </Section>
          )}

          {rewards.length > 0 && (
            <Section title="Rewards" hint={`${rewards.length}`}>
              <Grid items={rewards} />
            </Section>
          )}

          {collect.length === 0 && rewards.length === 0 && (
            <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
              No item data is available for this {kind.toLowerCase()}.
            </p>
          )}

          <p className="mt-10 border-t border-white/10 pt-5 text-sm text-white/40">
            Achievement data from the official Guild Wars 2 API.
          </p>
        </article>

      <Footer />

      {(() => {
        const all = [...collect, ...rewards];
        return all.length > 0 ? (
          <JsonLd
            data={itemListJsonLd(
              a.name,
              `/gw2/achievement/${itemSlug(a.id, a.name)}`,
              all.map((it) => ({ name: it.name, path: `/gw2/item/${itemSlug(it.id, it.name)}` })),
            )}
          />
        ) : null;
      })()}
    </PageShell>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: DbItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <ItemCard key={it.id} id={it.id} name={it.name} icon={it.icon ?? undefined} rarity={it.rarity ?? undefined} />
      ))}
    </div>
  );
}
