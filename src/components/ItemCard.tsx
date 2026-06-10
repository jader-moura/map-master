import Link from "next/link";
import { itemSlug, rarityColor } from "@/lib/gw2/items";

// Compact item link used in the item database hub and the "used in" / ingredient
// lists on item pages. The left border carries the in-game rarity colour.
export function ItemCard({
  id,
  name,
  icon,
  rarity,
}: {
  id: number;
  name: string;
  icon?: string;
  rarity?: string;
}) {
  return (
    <Link
      href={`/gw2/item/${itemSlug(id, name)}`}
      className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:border-orange-400/30 hover:bg-white/[0.06] hover:text-white"
      style={{ borderLeft: `3px solid ${rarityColor(rarity ?? "Basic")}` }}
    >
      {icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded" />
      )}
      <span className="truncate">{name}</span>
    </Link>
  );
}
