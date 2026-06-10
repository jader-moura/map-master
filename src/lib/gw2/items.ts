// Presentation helpers for the per-item codex pages. Pure functions only, so
// they can be used from server components and (later) client search alike.

// Item pages live at /gw2/item/{id}-{name-slug}. The official GW2 API has no
// name search, so the id is the source of truth; the trailing slug is purely
// for readable, keyword-rich URLs (and SEO). We parse the leading id and ignore
// the rest, so a stale name slug still resolves to the right item.
export function itemSlug(id: number, name: string): string {
  const kebab = name
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return kebab ? `${id}-${kebab}` : `${id}`;
}

export function parseItemId(slug: string): number | null {
  const m = slug.match(/^(\d+)/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

// In-game rarity colours, used for the name and the icon frame.
export const RARITY_COLORS: Record<string, string> = {
  Junk: "#aaaaaa",
  Basic: "#ffffff",
  Fine: "#62a4da",
  Masterwork: "#1a9306",
  Rare: "#fcd00b",
  Exotic: "#ffa405",
  Ascended: "#fb3e8d",
  Legendary: "#4c139d",
};

export function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? "#ffffff";
}

// Map the item `flags` array to a single human binding label, matching the
// wording the game uses in tooltips.
export function bindingLabel(flags: string[]): string | null {
  if (flags.includes("AccountBound")) return "Account Bound on Acquire";
  if (flags.includes("AccountBindOnUse")) return "Account Bound on Use";
  if (flags.includes("SoulbindOnAcquire")) return "Soulbound on Acquire";
  if (flags.includes("SoulBindOnUse")) return "Soulbound on Use";
  return null;
}

// GW2 item descriptions are wrapped in pseudo-HTML colour tags such as
// <c=@flavor>...</c> plus <br> line breaks. Strip the markup to plain text.
export function cleanDescription(desc?: string): string {
  if (!desc) return "";
  return desc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
