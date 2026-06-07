"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon, P } from "@/components/icons";
import { Coins } from "@/components/Coins";
import { MATERIAL_CATEGORIES, type MatCategoryKey } from "@/lib/gw2/materials";

type PricedItem = {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  buy: number;
  sell: number;
};
type MaterialsData = { items: PricedItem[]; updated: number };

const FILTERS: { key: MatCategoryKey | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wood", label: "Wood" },
  { key: "ore", label: "Ore & Metal" },
  { key: "plant", label: "Plants" },
];

export default function MaterialsSection() {
  const { data, isLoading, isError } = useQuery<MaterialsData>({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetch("/api/materials");
      if (!res.ok) throw new Error("Failed to load materials");
      return res.json();
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  const [filter, setFilter] = useState<MatCategoryKey | "all">("all");
  const [query, setQuery] = useState("");

  const priceById = useMemo(
    () => new Map((data?.items ?? []).map((it) => [it.id, it])),
    [data],
  );

  const q = query.trim().toLowerCase();
  const categories = MATERIAL_CATEGORIES.filter(
    (c) => filter === "all" || c.key === filter,
  );

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                filter === f.key
                  ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 sm:w-56">
          <Icon path={P.search} className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name…"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </div>

      {isError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Couldn’t load material prices right now. Try again shortly.
        </p>
      )}

      {categories.map((cat) => {
        const rows = cat.items.filter((it) => {
          if (!q) return true;
          const m = priceById.get(it.id);
          return (m?.name ?? "").toLowerCase().includes(q);
        });
        if (rows.length === 0) return null;

        return (
          <section key={cat.key} className="mb-7">
            <div className="mb-2 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.icon} alt="" className="h-6 w-6" />
              <div>
                <h2 className="text-sm font-bold text-white">{cat.label}</h2>
                <p className="text-[11px] text-white/40">{cat.blurb}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-[1fr_3.5rem_6.5rem_6.5rem] gap-x-4 border-b border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                <span>Item</span>
                <span className="text-center">Tier</span>
                <span className="text-right">Buy</span>
                <span className="text-right">Sell</span>
              </div>
              {rows.map((it) => {
                const m = priceById.get(it.id);
                return (
                  <div
                    key={it.id}
                    className="grid grid-cols-[1fr_3.5rem_6.5rem_6.5rem] items-center gap-x-4 border-t border-white/5 px-4 py-2.5 first:border-t-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {isLoading || !m ? (
                        <span className="h-7 w-7 shrink-0 animate-pulse rounded bg-white/10" />
                      ) : (
                        m.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.icon} alt="" className="h-7 w-7 shrink-0 rounded" />
                        )
                      )}
                      <span className="truncate text-sm text-white">
                        {isLoading || !m ? (
                          <span className="inline-block h-4 w-32 animate-pulse rounded bg-white/10" />
                        ) : (
                          m.name
                        )}
                      </span>
                    </span>
                    <span className="justify-self-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
                      {it.tier}
                    </span>
                    <span className="justify-self-end text-sm">
                      {isLoading || !m ? "…" : <Coins value={m.buy} />}
                    </span>
                    <span className="justify-self-end text-sm">
                      {isLoading || !m ? "…" : <Coins value={m.sell} />}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
