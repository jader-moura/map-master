"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, P } from "@/components/icons";
import type { Fish } from "@/lib/gw2/fishing";
import { timeChipClass } from "@/lib/gw2/fishingDisplay";
import { itemSlug, rarityColor } from "@/lib/gw2/items";

const RARITY_ORDER = ["Junk", "Basic", "Fine", "Masterwork", "Rare", "Exotic", "Ascended", "Legendary"];

/** A fish row, optionally tagged with its region (for the all-regions table). */
export type FishRow = Fish & { region?: { name: string; slug: string } };

type SortKey = "name" | "rarity" | "hole" | "bait" | "time" | "region";

// Dense, sortable, filterable table of catchable fish. Caught fish are
// account-bound (no Trading Post value), so the useful columns are the catch
// conditions: rarity, fishing hole, favored bait and time of day.
export default function FishingTable({
  fish,
  showRegion = false,
  selectedId = null,
  onSelect,
}: {
  fish: FishRow[];
  /** Show a Region column linking to each region page (for the index table). */
  showRegion?: boolean;
  /** Currently selected fish id (highlights the row). */
  selectedId?: number | null;
  /** Called when a row is clicked, to drive the region map. */
  onSelect?: (fish: FishRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: showRegion ? "name" : "hole",
    dir: 1,
  });

  const columns = useMemo(() => {
    const base: { key: SortKey; label: string }[] = [
      { key: "name", label: "Fish" },
      { key: "rarity", label: "Rarity" },
      { key: "hole", label: "Fishing hole" },
      { key: "bait", label: "Bait" },
      { key: "time", label: "Time of day" },
    ];
    if (showRegion) base.splice(2, 0, { key: "region", label: "Region" });
    return base;
  }, [showRegion]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? fish.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.hole.toLowerCase().includes(q) ||
            f.bait.toLowerCase().includes(q) ||
            f.time.toLowerCase().includes(q) ||
            (f.region?.name.toLowerCase().includes(q) ?? false),
        )
      : fish;
    const val = (f: FishRow, key: SortKey) => (key === "region" ? f.region?.name ?? "" : f[key]);
    const cmp = (a: FishRow, b: FishRow) => {
      let d = 0;
      if (sort.key === "rarity") d = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      else d = val(a, sort.key).localeCompare(val(b, sort.key));
      if (d === 0 && sort.key !== "name") d = a.name.localeCompare(b.name);
      return d * sort.dir;
    };
    return [...filtered].sort(cmp);
  }, [fish, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Icon path={P.search} className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={showRegion ? "Filter fish, region, hole, bait…" : "Filter fish, hole, bait…"}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/40 focus:outline-none"
          />
        </div>
        <span className="shrink-0 text-xs text-white/40">{rows.length} fish</span>
      </div>

      <div className="scroll-themed max-h-[70vh] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-white/10 bg-[#13131c] text-left text-xs uppercase tracking-wide text-white/45">
              {columns.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th key={c.key} scope="col" className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 transition hover:text-white ${active ? "text-white" : ""}`}
                    >
                      {c.label}
                      <span className={`text-[9px] ${active ? "opacity-80" : "opacity-25"}`}>
                        {active ? (sort.dir === 1 ? "▲" : "▼") : "▴"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const isSelected = onSelect != null && f.id === selectedId;
              return (
              <tr
                key={`${f.region?.slug ?? ""}-${f.id}`}
                onClick={onSelect ? () => onSelect(f) : undefined}
                aria-selected={onSelect ? isSelected : undefined}
                className={`border-b border-white/5 last:border-0 transition ${
                  onSelect ? "cursor-pointer" : ""
                } ${isSelected ? "bg-sky-400/10" : "hover:bg-white/[0.03]"}`}
              >
                <td className="px-3 py-2" style={{ borderLeft: `3px solid ${rarityColor(f.rarity)}` }}>
                  <Link
                    href={`/gw2/item/${itemSlug(f.id, f.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2.5 text-white/85 transition hover:text-sky-300"
                  >
                    {f.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded" />
                    )}
                    <span className="truncate">{f.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-white/65">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: rarityColor(f.rarity) }} />
                    {f.rarity}
                  </span>
                </td>
                {showRegion && (
                  <td className="px-3 py-2">
                    {f.region ? (
                      <Link href={`/gw2/fishing/${f.region.slug}`} className="text-white/70 transition hover:text-sky-300">
                        {f.region.name}
                      </Link>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                )}
                <td className="px-3 py-2 text-white/70">{f.hole}</td>
                <td className="px-3 py-2 text-white/60">{f.bait === "Any" ? <span className="text-white/35">Any</span> : f.bait}</td>
                <td className="px-3 py-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${timeChipClass(f.time)}`}>
                    {f.time}
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
