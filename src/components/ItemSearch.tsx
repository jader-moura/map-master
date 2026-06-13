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

// Seed the query from `?q=` so deep links and the sitelinks search box work.
function initialQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

// A select styled with a leading icon.
function FilterSelect({
  icon,
  value,
  onChange,
  children,
}: {
  icon: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        path={icon}
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-8 text-sm text-white/80 [color-scheme:dark] focus:border-orange-400/40 focus:outline-none"
      >
        {children}
      </select>
      <Icon
        path={P.chevron}
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
      />
    </div>
  );
}

export default function ItemSearch() {
  const [q, setQ] = useState(initialQuery);
  const [rarity, setRarity] = useState("");
  const [type, setType] = useState("");
  const [lvlMin, setLvlMin] = useState("");
  const [lvlMax, setLvlMax] = useState("");
  const [tradable, setTradable] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const pageRef = useRef(0);
  const reqRef = useRef(0); // guards against out-of-order responses

  // Only search once the user has actually entered a query or chosen a filter.
  const active = Boolean(q.trim() || rarity || type || lvlMin || lvlMax || tradable);

  const buildParams = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (rarity) params.set("rarity", rarity);
      if (type) params.set("type", type);
      if (lvlMin) params.set("lvlMin", lvlMin);
      if (lvlMax) params.set("lvlMax", lvlMax);
      if (tradable) params.set("tradable", "1");
      params.set("page", String(page));
      return params;
    },
    [q, rarity, type, lvlMin, lvlMax, tradable],
  );

  const fetchPage = useCallback(
    async (page: number, replace: boolean) => {
      const reqId = ++reqRef.current;
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/items/search?${buildParams(page)}`);
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (reqId !== reqRef.current) return; // a newer request superseded this one
        setTotal(data.total ?? 0);
        setRows((prev) => {
          const merged: Row[] = replace ? data.items : [...prev, ...data.items];
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
    [buildParams],
  );

  // Debounced reload whenever the query or a filter changes. When nothing is
  // active, clear results so the page stays empty until the user searches. The
  // work runs inside the timeout (not synchronously in the effect body).
  useEffect(() => {
    const t = setTimeout(() => {
      if (active) {
        fetchPage(0, true);
      } else {
        reqRef.current++; // cancel any in-flight response
        setRows([]);
        setTotal(0);
        setError(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [active, fetchPage]);

  const hasMore = rows.length < total;

  const clearAll = () => {
    setQ("");
    setRarity("");
    setType("");
    setLvlMin("");
    setLvlMax("");
    setTradable(false);
  };

  return (
    <div>
      {/* Search box */}
      <div className="relative">
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

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterSelect icon={P.star} value={rarity} onChange={setRarity}>
          <option value="" className="bg-[#0d0d14] text-white">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r} className="bg-[#0d0d14] text-white">{r}</option>
          ))}
        </FilterSelect>

        <FilterSelect icon={P.layers} value={type} onChange={setType}>
          <option value="" className="bg-[#0d0d14] text-white">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-[#0d0d14] text-white">{t}</option>
          ))}
        </FilterSelect>

        {/* Level range */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white/70 h-10">
          <Icon path={P.bolt} className="h-4 w-4 text-white/35" />
          <input
            type="number"
            min={0}
            max={80}
            value={lvlMin}
            onChange={(e) => setLvlMin(e.target.value)}
            placeholder="min"
            aria-label="Minimum level"
            className="w-12 bg-transparent text-center text-white placeholder:text-white/30 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/30">–</span>
          <input
            type="number"
            min={0}
            max={80}
            value={lvlMax}
            onChange={(e) => setLvlMax(e.target.value)}
            placeholder="max"
            aria-label="Maximum level"
            className="w-12 bg-transparent text-center text-white placeholder:text-white/30 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pr-0.5 text-xs text-white/35">lvl</span>
        </div>

        {/* Tradable toggle */}
        <button
          type="button"
          onClick={() => setTradable((v) => !v)}
          aria-pressed={tradable}
          className={[
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition",
            tradable
              ? "border-orange-400/40 bg-orange-400/15 text-orange-300"
              : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white",
          ].join(" ")}
        >
          <Icon path={P.coins} className="h-4 w-4" />
          Tradable
        </button>

        {active && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/50 transition hover:text-white"
          >
            <Icon path={P.close} className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Status */}
      {active && (
        <p className="mt-3 text-xs text-white/40">
          {error
            ? "Search failed. Try again in a moment."
            : total > 0
              ? `${total.toLocaleString()} item${total === 1 ? "" : "s"}`
              : loading
                ? "Searching…"
                : "No items match those filters."}
        </p>
      )}

      {/* Results — only rendered once the user has searched or filtered. */}
      {active && (
        <>
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
        </>
      )}
    </div>
  );
}
