// Thin, cached wrapper around the official Guild Wars 2 API.
//
// The GW2 API allows ~600 requests/min per IP, so we lean on Next.js fetch
// caching: static data (items, maps, recipes) is cached for a long time,
// volatile data (Trading Post prices) for a short time. Calls go through the
// server so the browser never hits the upstream rate limit directly.

const BASE = "https://api.guildwars2.com/v2";

type Gw2FetchOptions = {
  /** Seconds before the cached response is revalidated. */
  revalidate?: number;
  lang?: "en" | "es" | "de" | "fr";
};

export async function gw2Fetch<T>(
  endpoint: string,
  { revalidate = 60 * 60, lang }: Gw2FetchOptions = {},
): Promise<T> {
  const url = new URL(`${BASE}/${endpoint.replace(/^\//, "")}`);
  if (lang) url.searchParams.set("lang", lang);

  const res = await fetch(url, {
    headers: { "User-Agent": "gw2-map MapMaster" },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`GW2 API ${endpoint} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// --- Trading Post: volatile, cache briefly. ---
export type TpPrice = {
  id: number;
  buys: { unit_price: number; quantity: number };
  sells: { unit_price: number; quantity: number };
};

export function getPrices(ids: number[]) {
  return gw2Fetch<TpPrice[]>(`commerce/prices?ids=${ids.join(",")}`, {
    revalidate: 120,
  });
}

// --- Items: static, cache for a day. ---
export type Gw2Item = {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  type: string;
};

export function getItems(ids: number[], lang?: Gw2FetchOptions["lang"]) {
  return gw2Fetch<Gw2Item[]>(`items?ids=${ids.join(",")}`, {
    revalidate: 60 * 60 * 24,
    lang,
  });
}
