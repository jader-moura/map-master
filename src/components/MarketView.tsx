"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { Coins } from "@/components/Coins";
import MaterialsSection from "@/components/MaterialsSection";

type Market = {
  exchange: { buy100Gems: number; sell100Gems: number };
  items: { id: number; name: string; icon: string; buy: number; sell: number }[];
  updated: number;
};

const TABS = [
  { key: "post" as const, label: "Trading Post", icon: P.coins },
  { key: "materials" as const, label: "Materials", icon: P.pickaxe },
];

export default function MarketView() {
  const [tab, setTab] = useState<"post" | "materials">("post");

  const { data, isLoading, isError } = useQuery<Market>({
    queryKey: ["market"],
    queryFn: async () => {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to load market");
      return res.json();
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0f] text-white">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d0d14] px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">buildop</span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            Trading Post
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <IconRail />

        <main className="scroll-themed min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <header className="mb-5">
              <h1 className="text-2xl font-bold text-white">Guild Wars 2 Trading Post Prices</h1>
              <p className="mt-1 text-sm text-white/50">
                Live gem exchange, key items &amp; gathering materials · auto-updates every 2 minutes
              </p>
            </header>

            {/* Tabs */}
            <div className="mb-6 flex gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition",
                    tab === t.key
                      ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  <Icon path={t.icon} className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "materials" ? (
              <MaterialsSection />
            ) : (
              <>
                {isError && (
                  <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    Couldn’t load market data right now. Try again shortly.
                  </p>
                )}

                {/* Gem exchange */}
                <section className="mb-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0d0d14] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                  <Icon path={P.coins} className="h-4 w-4" /> Buy 100 gems
                </div>
                <div className="text-lg font-bold text-white">
                  {isLoading || !data ? "…" : <Coins value={data.exchange.buy100Gems} />}
                </div>
                <div className="text-xs text-white/45">gold cost to buy 100 gems</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0d0d14] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                  <Icon path={P.coins} className="h-4 w-4" /> Sell 100 gems
                </div>
                <div className="text-lg font-bold text-white">
                  {isLoading || !data ? "…" : <Coins value={data.exchange.sell100Gems} />}
                </div>
                <div className="text-xs text-white/45">gold from selling 100 gems</div>
              </div>
            </section>

            {/* Item prices */}
            <section className="overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-[1fr_7rem_7rem] gap-x-8 border-b border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                <span>Item</span>
                <span className="text-right">Buy</span>
                <span className="text-right">Sell</span>
              </div>
              {isLoading || !data
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[1fr_7rem_7rem] gap-x-8 px-4 py-3">
                      <span className="h-4 w-40 animate-pulse rounded bg-white/10" />
                      <span className="h-4 w-16 animate-pulse justify-self-end rounded bg-white/10" />
                      <span className="h-4 w-16 animate-pulse justify-self-end rounded bg-white/10" />
                    </div>
                  ))
                : data.items.map((it) => (
                    <div
                      key={it.id}
                      className="grid grid-cols-[1fr_7rem_7rem] items-center gap-x-8 border-t border-white/5 px-4 py-2.5 first:border-t-0"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {it.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.icon} alt="" className="h-7 w-7 shrink-0 rounded" />
                        )}
                        <span className="truncate text-sm text-white">{it.name}</span>
                      </span>
                      <span className="justify-self-end text-sm">
                        <Coins value={it.buy} />
                      </span>
                      <span className="justify-self-end text-sm">
                        <Coins value={it.sell} />
                      </span>
                    </div>
                  ))}
                </section>
              </>
            )}

            <p className="mt-6 text-xs text-white/35">
              Prices from the official Guild Wars 2 Trading Post API. For reference only.
              Guild Wars 2 © ArenaNet, LLC.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
