"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, P } from "@/components/icons";
import type { Fish } from "@/lib/gw2/fishing";
import { timeChipClass } from "@/lib/gw2/fishingDisplay";
import { itemSlug, rarityColor } from "@/lib/gw2/items";

// Compact, searchable, selectable fish list for the region map sidebar. Picking
// a fish drives the map (highlights every hole matching its water type). The
// name links to the item page; the rest of the row toggles the selection.
export default function FishingFishList({
  fish,
  selectedId,
  onSelect,
}: {
  fish: Fish[];
  selectedId: number | null;
  onSelect: (fish: Fish) => void;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fish;
    return fish.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.hole.toLowerCase().includes(q) ||
        f.bait.toLowerCase().includes(q) ||
        f.time.toLowerCase().includes(q),
    );
  }, [fish, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 p-2.5">
        <div className="relative">
          <Icon
            path={P.search}
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter fish, hole, bait…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/40 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 px-0.5 text-[11px] text-white/35">{rows.length} fish</p>
      </div>

      <ul className="scroll-themed min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
        {rows.map((f) => {
          const on = f.id === selectedId;
          return (
            <li key={f.id}>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => onSelect(f)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(f);
                  }
                }}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition ${
                  on ? "bg-sky-400/15" : "hover:bg-white/5"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: rarityColor(f.rarity) }}
                  title={f.rarity}
                />
                {f.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded" />
                )}
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/gw2/item/${itemSlug(f.id, f.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block truncate text-sm text-white/85 transition hover:text-sky-300"
                  >
                    {f.name}
                  </Link>
                  <span className="block truncate text-[11px] text-white/45">
                    {f.hole}
                    {f.bait !== "Any" ? ` · ${f.bait}` : ""}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded border px-1 py-0.5 text-[10px] font-medium ${timeChipClass(f.time)}`}
                >
                  {f.time}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
