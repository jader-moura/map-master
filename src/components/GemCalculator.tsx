"use client";

import { useState } from "react";
import { Coins } from "@/components/Coins";

// Two-way gem/gold calculator. Uses the current per-gem rates fetched on the
// server (buy = coins spent per gem, sell = coins received per gem); the math is
// linear client-side so it updates instantly without extra API calls.
export default function GemCalculator({
  buyCoinsPerGem,
  sellCoinsPerGem,
}: {
  buyCoinsPerGem: number;
  sellCoinsPerGem: number;
}) {
  const [gold, setGold] = useState("100");
  const [gems, setGems] = useState("800");

  const goldNum = Math.max(0, parseFloat(gold) || 0);
  const gemsNum = Math.max(0, Math.floor(parseFloat(gems) || 0));

  const gemsFromGold = buyCoinsPerGem > 0 ? Math.floor((goldNum * 10000) / buyCoinsPerGem) : 0;
  const coinsFromGems = Math.round(gemsNum * sellCoinsPerGem);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Gold -> Gems */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-sm font-medium uppercase tracking-wide text-white/40">Gold → Gems</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={gold}
            onChange={(e) => setGold(e.target.value)}
            className="w-32 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-400/40 focus:outline-none"
          />
          <span className="text-sm text-white/55">gold buys</span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-orange-300">
          {gemsFromGold.toLocaleString()} <span className="text-base font-medium text-white/60">gems</span>
        </p>
      </div>

      {/* Gems -> Gold */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-sm font-medium uppercase tracking-wide text-white/40">Gems → Gold</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={gems}
            onChange={(e) => setGems(e.target.value)}
            className="w-32 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-400/40 focus:outline-none"
          />
          <span className="text-sm text-white/55">gems give</span>
        </div>
        <p className="mt-3 text-2xl font-bold">
          <Coins value={coinsFromGems} />
        </p>
      </div>
    </div>
  );
}
