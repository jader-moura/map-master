"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Icon, P } from "@/components/icons";

type Row = { id: number; name: string; rarity?: string; type?: string; level?: number; icon?: string };

// Fixed GW2 enums — cheaper and steadier than querying distinct values.
const RARITIES = ["Junk", "Basic", "Fine", "Masterwork", "Rare", "Exotic", "Ascended", "Legendary"];
const TYPES = [
  "Armor", "Weapon", "Trinket", "Back", "UpgradeComponent", "Consumable",
  "Container", "CraftingMaterial", "Gathering", "Gizmo", "Trophy", "MiniPet",
  "Bag", "Tool", "Key",
];

export default function ItemSearch() {
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState("");
  const [type, setType] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const pageRef = useRef(0);
  const reqRef = useRef(0); // guards against out-of-order responses

  const fetchPage = useCallback(
    async (page: number, replace: boolean) => {
      const reqId = ++reqRef.current;
      setLoading(true);
      setError(false);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (rarity) params.set("rarity", rarity);
      if (type) params.set("type", type);
      params.set("page", String(page));
      try {
        const res = await fetch(`/api/items/search?${params}`);
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (reqId !== reqRef.current) return; // a newer request superseded this one
        setTotal(data.total ?? 0);
        setRows((prev) => {
          const merged: Row[] = replace ? data.items : [...prev, ...data.items];
          // Offset pagination over a table that's being updated (e.g. mid-sync)
          // can overlap pages, so drop any duplicate ids to keep React keys unique.
          const seen = new Set<number>();
          return merged.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
        });
        pageRef.current = page;
      } catch {
        if (reqId === reqRef.current) setError(true);
      } finally {
        if (reqId === reqRef.current) setLoading(false);
      }
    },
    [q, rarity, type],
  );

  // Debounced reload whenever the query or a filter changes.
  useEffect(() => {
    const t = setTimeout(() => fetchPage(0, true), 250);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const hasMore = rows.length < total;

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon
            path={P.search}
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items by name, e.g. ectoplasm, mithril, berserker"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-orange-400/40 focus:outline-none"
          />
        </div>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 [color-scheme:dark] focus:border-orange-400/40 focus:outline-none"
        >
          <option value="" className="bg-[#0d0d14] text-white">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r} className="bg-[#0d0d14] text-white">{r}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 [color-scheme:dark] focus:border-orange-400/40 focus:outline-none"
        >
          <option value="" className="bg-[#0d0d14] text-white">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-[#0d0d14] text-white">{t}</option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="mt-3 text-xs text-white/40">
        {error
          ? "Search failed. Try again in a moment."
          : total > 0
            ? `${total.toLocaleString()} item${total === 1 ? "" : "s"}`
            : loading
              ? "Searching…"
              : "No items match those filters."}
      </p>

      {/* Results */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((it) => (
          <ItemCard key={it.id} id={it.id} name={it.name} icon={it.icon} rarity={it.rarity} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchPage(pageRef.current + 1, false)}
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-orange-400/40 hover:text-white disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
