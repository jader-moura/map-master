import Link from "next/link";
import { itemSlug, rarityColor } from "@/lib/gw2/items";

// Compact item link used in the item database hub and the "used in" / ingredient
// lists on item pages. The left border carries the in-game rarity colour.
export function ItemCard({
  id,
  name,
  icon,
  rarity,
  cost,
}: {
  id: number;
  name: string;
  icon?: string;
  rarity?: string;
  /** Optional price/cost shown on the right (e.g. a vendor's price for this item). */
  cost?: string | null;
}) {
  return (
    <Link
      href={`/gw2/item/${itemSlug(id, name)}`}
      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:border-orange-400/30 hover:bg-white/[0.06] hover:text-white"
      style={{ borderLeft: `3px solid ${rarityColor(rarity ?? "Basic")}` }}
    >
      {icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded" />
      )}
      <div className="min-w-0 flex-1">
        <span className="block truncate">{name}</span>
        {cost && <span className="mt-0.5 block truncate text-xs text-orange-300/80">{cost}</span>}
      </div>
    </Link>
  );
}
