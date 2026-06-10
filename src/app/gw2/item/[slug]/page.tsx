import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { Coins } from "@/components/Coins";
import { ItemCard } from "@/components/ItemCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import {
  getItem,
  getItemsFull,
  getPrice,
  getPrices,
  getRecipes,
  searchRecipes,
  type Gw2ItemFull,
  type Gw2Recipe,
  type TpPrice,
} from "@/lib/gw2/api";
import {
  bindingLabel,
  cleanDescription,
  itemSlug,
  parseItemId,
  rarityColor,
} from "@/lib/gw2/items";

// How many "used in" recipes to show (some staples feed hundreds of recipes).
const USED_IN_LIMIT = 18;

type Params = { params: Promise<{ slug: string }> };

async function loadItem(slug: string): Promise<Gw2ItemFull | null> {
  const id = parseItemId(slug);
  if (id === null) return null;
  try {
    return await getItem(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) return { title: "Item not found" };

  const desc =
    cleanDescription(item.description) ||
    `${item.rarity} ${item.type.toLowerCase()} in Guild Wars 2. See how to get ${item.name}, its crafting recipes, what it is used in and the live Trading Post price.`;
  const canonical = `/gw2/item/${itemSlug(item.id, item.name)}`;
  const title = `${item.name} | GW2 Item, Recipes & Price`;

  return {
    title,
    description: desc.slice(0, 160),
    alternates: { canonical },
    openGraph: { title, description: desc.slice(0, 160), url: `https://buildop.app${canonical}`, images: [item.icon] },
  };
}

export default async function ItemPage({ params }: Params) {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) notFound();

  // Recipes that PRODUCE and CONSUME this item (ids only), plus its own price.
  const [outIds, inIds, ownPrice] = await Promise.all([
    searchRecipes("output", item.id).catch(() => [] as number[]),
    searchRecipes("input", item.id).catch(() => [] as number[]),
    getPrice(item.id).catch(() => null),
  ]);

  const [craftRecipes, usedInRecipes] = await Promise.all([
    getRecipes(outIds).catch(() => [] as Gw2Recipe[]),
    getRecipes(inIds.slice(0, USED_IN_LIMIT)).catch(() => [] as Gw2Recipe[]),
  ]);

  // One batched lookup for every related item: ingredients of the craft recipes
  // and outputs of the used-in recipes. Then one batched price lookup.
  const relatedIds = new Set<number>();
  for (const r of craftRecipes) for (const ing of r.ingredients) relatedIds.add(ing.item_id);
  for (const r of usedInRecipes) relatedIds.add(r.output_item_id);
  const relatedList = [...relatedIds];

  const [relatedItems, relatedPrices] = await Promise.all([
    getItemsFull(relatedList).catch(() => [] as Gw2ItemFull[]),
    relatedList.length ? getPrices(relatedList).catch(() => [] as TpPrice[]) : Promise.resolve([] as TpPrice[]),
  ]);

  const itemById = new Map(relatedItems.map((i) => [i.id, i]));
  const priceById = new Map(relatedPrices.map((p) => [p.id, p]));

  const color = rarityColor(item.rarity);
  const binding = bindingLabel(item.flags);
  const description = cleanDescription(item.description);
  const subtype = typeof item.details?.type === "string" ? item.details.type : null;

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
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
            <Link href="/" className="transition hover:text-orange-400">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <Link href="/gw2/items" className="transition hover:text-orange-400">
              Item Database
            </Link>
            <span className="px-1.5">/</span>
            <span className="text-white/60">{item.name}</span>
          </nav>

          {/* Infobox: icon + identity */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div
              className="shrink-0 overflow-hidden rounded-xl border-2"
              style={{ borderColor: color }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.icon} alt={item.name} width={88} height={88} className="block h-[88px] w-[88px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                {[item.rarity, subtype ?? item.type, item.level ? `Level ${item.level}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h1 className="mt-1 text-3xl font-bold" style={{ color }}>
                {item.name}
              </h1>
              {description && (
                <p className="mt-2 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-white/65">
                  {description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/60">
                {binding && <span>{binding}</span>}
                {item.vendor_value > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    Vendor <Coins value={item.vendor_value} />
                  </span>
                )}
                {ownPrice && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      TP buy <Coins value={ownPrice.buys.unit_price} />
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      TP sell <Coins value={ownPrice.sells.unit_price} />
                    </span>
                  </>
                )}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-white/45">
                  {item.chat_link}
                </code>
              </div>
            </div>
          </div>

          {/* Acquisition: how to craft it */}
          {craftRecipes.length > 0 && (
            <Section title="How to craft" hint="Recipes that produce this item">
              <div className="flex flex-col gap-4">
                {craftRecipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    itemById={itemById}
                    priceById={priceById}
                    ownPrice={ownPrice}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Used in */}
          {usedInRecipes.length > 0 && (
            <Section
              title="Used in"
              hint={
                inIds.length > usedInRecipes.length
                  ? `${usedInRecipes.length} of ${inIds.length} recipes`
                  : `${usedInRecipes.length} recipe${usedInRecipes.length > 1 ? "s" : ""}`
              }
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {usedInRecipes.map((r) => {
                  const out = itemById.get(r.output_item_id);
                  if (!out) return null;
                  return <ItemCard key={r.id} id={out.id} name={out.name} icon={out.icon} rarity={out.rarity} />;
                })}
              </div>
            </Section>
          )}

          {craftRecipes.length === 0 && usedInRecipes.length === 0 && (
            <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
              No crafting recipes are associated with this item in the Guild Wars 2 API. It is
              typically obtained in-game from drops, vendors, achievements or rewards.
            </p>
          )}
        </article>

        <Footer />
      </main>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Item Database", path: "/gw2/items" },
          { name: item.name, path: `/gw2/item/${itemSlug(item.id, item.name)}` },
        ])}
      />
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function RecipeCard({
  recipe,
  itemById,
  priceById,
  ownPrice,
}: {
  recipe: Gw2Recipe;
  itemById: Map<number, Gw2ItemFull>;
  priceById: Map<number, TpPrice>;
  ownPrice: TpPrice | null;
}) {
  // Buy-now cost of all ingredients (lowest sell order each). Incomplete if any
  // ingredient is untradeable / has no listings.
  let cost = 0;
  let complete = true;
  for (const ing of recipe.ingredients) {
    const p = priceById.get(ing.item_id);
    if (p && p.sells.unit_price) cost += p.sells.unit_price * ing.count;
    else complete = false;
  }
  const revenue = ownPrice ? ownPrice.sells.unit_price * recipe.output_item_count : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {recipe.disciplines.map((d) => (
          <span
            key={d}
            className="rounded-full border border-orange-400/25 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-300"
          >
            {d}
          </span>
        ))}
        <span className="text-xs text-white/40">Rating {recipe.min_rating}</span>
        {recipe.output_item_count > 1 && (
          <span className="text-xs text-white/40">Makes {recipe.output_item_count}</span>
        )}
      </div>

      <ul className="flex flex-col gap-1.5">
        {recipe.ingredients.map((ing) => (
          <IngredientRow
            key={ing.item_id}
            count={ing.count}
            item={itemById.get(ing.item_id)}
            price={priceById.get(ing.item_id)}
          />
        ))}
      </ul>

      {(cost > 0 || revenue > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/10 pt-3 text-sm">
          {cost > 0 && (
            <span className="inline-flex items-center gap-1.5 text-white/60">
              Ingredient cost{!complete && <span className="text-white/30">(partial)</span>}
              <Coins value={cost} />
            </span>
          )}
          {revenue > 0 && (
            <span className="inline-flex items-center gap-1.5 text-white/60">
              Sells for <Coins value={revenue} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function IngredientRow({
  count,
  item,
  price,
}: {
  count: number;
  item?: Gw2ItemFull;
  price?: TpPrice;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className="w-6 shrink-0 text-right font-mono tabular-nums text-white/50">{count}×</span>
      {item ? (
        <Link
          href={`/gw2/item/${itemSlug(item.id, item.name)}`}
          className="flex min-w-0 items-center gap-2 text-white/85 transition hover:text-orange-400"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.icon} alt="" width={24} height={24} className="h-6 w-6 rounded" />
          <span className="truncate">{item.name}</span>
        </Link>
      ) : (
        <span className="text-white/50">Item #{count}</span>
      )}
      <span className="ml-auto shrink-0">
        {price ? <Coins value={price.sells.unit_price * count} /> : <span className="text-white/25">-</span>}
      </span>
    </li>
  );
}

