import { NextResponse } from "next/server";

const BASE = "https://api.guildwars2.com/v2";
const UA = { "User-Agent": "buildop (buildop.app)" };

// Curated, recognizable items for a market snapshot (read-only display).
const ITEM_IDS = [
  19721, // Glob of Ectoplasm
  19976, // Mystic Coin
  24295, // Vial of Powerful Blood
  24283, // Powerful Venom Sac
  24300, // Elaborate Totem
  24277, // Pile of Crystalline Dust
  24358, // Ancient Bone
  24289, // Armored Scale
  24351, // Vicious Claw
  24357, // Vicious Fang
];

type Price = { id: number; buys: { unit_price: number }; sells: { unit_price: number } };
type ItemMeta = { id: number; name: string; icon: string };
type Exchange = { quantity: number; coins_per_gem: number };

async function gw2<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { headers: UA, next: { revalidate } });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function GET() {
  try {
    const ids = ITEM_IDS.join(",");
    const [gemsToCoins, coinsToGems, prices, items] = await Promise.all([
      gw2<Exchange>("commerce/exchange/gems?quantity=100", 120), // 100 gems -> coins
      // The coins exchange has a minimum quantity, so request a large amount and
      // derive the per-gold rate from coins_per_gem (gems bought with 1 gold).
      gw2<Exchange>("commerce/exchange/coins?quantity=10000000", 120),
      gw2<Price[]>(`commerce/prices?ids=${ids}`, 120),
      gw2<ItemMeta[]>(`items?ids=${ids}`, 60 * 60 * 24),
    ]);
    // Both directions expressed per 100 gems (the conventional gem-store view).
    const buy100Gems = coinsToGems.coins_per_gem * 100; // coins to buy 100 gems
    const sell100Gems = gemsToCoins.quantity; // coins from selling 100 gems

    const byId = new Map(items.map((i) => [i.id, i]));
    const merged = ITEM_IDS.map((id) => {
      const p = prices.find((x) => x.id === id);
      const m = byId.get(id);
      return {
        id,
        name: m?.name ?? `Item ${id}`,
        icon: m?.icon ?? "",
        buy: p?.buys.unit_price ?? 0,
        sell: p?.sells.unit_price ?? 0,
      };
    });

    return NextResponse.json(
      {
        exchange: { buy100Gems, sell100Gems },
        items: merged,
        updated: Date.now(),
      },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Market unavailable" },
      { status: 502 },
    );
  }
}
