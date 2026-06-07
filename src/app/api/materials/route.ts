import { NextResponse } from "next/server";
import { MATERIAL_IDS } from "@/lib/gw2/materials";

const BASE = "https://api.guildwars2.com/v2";
const UA = { "User-Agent": "buildop (buildop.app)" };

type Price = { id: number; buys: { unit_price: number }; sells: { unit_price: number } };
type ItemMeta = { id: number; name: string; icon: string; rarity?: string };

async function gw2<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { headers: UA, next: { revalidate } });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function GET() {
  try {
    const ids = MATERIAL_IDS.join(",");
    const [prices, items] = await Promise.all([
      gw2<Price[]>(`commerce/prices?ids=${ids}`, 120),
      gw2<ItemMeta[]>(`items?ids=${ids}`, 60 * 60 * 24),
    ]);

    const byId = new Map(items.map((i) => [i.id, i]));
    const priceById = new Map(prices.map((p) => [p.id, p]));
    const merged = MATERIAL_IDS.map((id) => {
      const m = byId.get(id);
      const p = priceById.get(id);
      return {
        id,
        name: m?.name ?? `Item ${id}`,
        icon: m?.icon ?? "",
        rarity: m?.rarity ?? "Basic",
        buy: p?.buys.unit_price ?? 0,
        sell: p?.sells.unit_price ?? 0,
      };
    });

    return NextResponse.json(
      { items: merged, updated: Date.now() },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Materials unavailable" },
      { status: 502 },
    );
  }
}
