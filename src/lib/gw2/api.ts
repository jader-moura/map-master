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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function gw2Fetch<T>(
  endpoint: string,
  { revalidate = 60 * 60, lang }: Gw2FetchOptions = {},
): Promise<T> {
  const url = new URL(`${BASE}/${endpoint.replace(/^\//, "")}`);
  if (lang) url.searchParams.set("lang", lang);

  // The upstream API is occasionally flaky (timeouts, 429s, transient 5xx). Retry
  // a couple of times with backoff so a single hiccup doesn't surface as missing
  // data (e.g. a blank "used in" list). 4xx (other than 429) fail fast.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "buildop (buildop.app)" },
        next: { revalidate },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`GW2 API ${endpoint} transient ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(`GW2 API ${endpoint} failed: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : "";
      // Don't retry a definitive client error (bad id, not found, ...).
      if (/failed: 4\d\d/.test(msg)) break;
      if (attempt < 2) await sleep(300 * (attempt + 1));
    }
  }
  throw lastErr;
}

// --- Gem exchange: volatile, cache briefly. ---
export type GemExchange = {
  /** Copper per gem at this quantity. */
  coins_per_gem: number;
  /** Amount received (gems for the coins endpoint, coins for the gems endpoint). */
  quantity: number;
};

/** Exchange coins (copper) for gems: returns gems received + cost per gem. */
export function getGoldToGems(coins: number) {
  return gw2Fetch<GemExchange>(`commerce/exchange/coins?quantity=${coins}`, { revalidate: 300 });
}

/** Exchange gems for coins (copper): returns coins received + value per gem. */
export function getGemsToGold(gems: number) {
  return gw2Fetch<GemExchange>(`commerce/exchange/gems?quantity=${gems}`, { revalidate: 300 });
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

// Full item payload, used by the per-item codex page. `details` is item-type
// specific (weapon stats, consumable effects, ...) so we keep it loose.
export type Gw2ItemFull = {
  id: number;
  name: string;
  description?: string;
  type: string;
  level: number;
  rarity: string;
  vendor_value: number;
  flags: string[];
  restrictions: string[];
  chat_link: string;
  icon: string;
  details?: Record<string, unknown> & { type?: string };
};

export function getItem(id: number, lang?: Gw2FetchOptions["lang"]) {
  return gw2Fetch<Gw2ItemFull>(`items/${id}`, { revalidate: 60 * 60 * 24, lang });
}

// Batch fetch full items (e.g. every ingredient in a recipe) in one request.
export function getItemsFull(ids: number[], lang?: Gw2FetchOptions["lang"]) {
  if (!ids.length) return Promise.resolve<Gw2ItemFull[]>([]);
  return gw2Fetch<Gw2ItemFull[]>(`items?ids=${ids.join(",")}`, {
    revalidate: 60 * 60 * 24,
    lang,
  });
}

// --- Recipes: static, cache for a day. ---
export type Gw2Recipe = {
  id: number;
  type: string;
  output_item_id: number;
  output_item_count: number;
  time_to_craft_ms: number;
  disciplines: string[];
  min_rating: number;
  flags: string[];
  ingredients: { item_id: number; count: number }[];
  chat_link: string;
};

/** Recipe ids that produce (`output`) or consume (`input`) the given item. */
export function searchRecipes(kind: "output" | "input", itemId: number) {
  return gw2Fetch<number[]>(`recipes/search?${kind}=${itemId}`, {
    revalidate: 60 * 60 * 24,
  });
}

export function getRecipes(ids: number[]) {
  if (!ids.length) return Promise.resolve<Gw2Recipe[]>([]);
  return gw2Fetch<Gw2Recipe[]>(`recipes?ids=${ids.join(",")}`, {
    revalidate: 60 * 60 * 24,
  });
}

// Single Trading Post price. Returns null for account-bound / untradeable items
// (the endpoint 404s for those) so callers can branch without try/catch.
export async function getPrice(id: number): Promise<TpPrice | null> {
  const url = new URL(`${BASE}/commerce/prices/${id}`);
  const res = await fetch(url, {
    headers: { "User-Agent": "buildop (buildop.app)" },
    next: { revalidate: 120 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GW2 API price ${id} failed: ${res.status}`);
  return res.json() as Promise<TpPrice>;
}
