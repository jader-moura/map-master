"use client";

import { useState } from "react";
import { Coins } from "@/components/Coins";
import { GemIcon } from "@/components/GemIcon";
import { Icon, P } from "@/components/icons";

const GOLD_ICON = "https://wiki.guildwars2.com/images/d/d1/Gold_coin.png";

function GoldIcon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={GOLD_ICON} alt="gold" className="h-[18px] w-[18px] shrink-0" />;
}

function StepButton({ onClick, label, icon }: { onClick: () => void; label: string; icon: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-9 shrink-0 place-items-center text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      <Icon path={icon} className="h-4 w-4" />
    </button>
  );
}

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

  const stepGold = (d: number) => setGold((v) => String(Math.max(0, Math.round((parseFloat(v) || 0) + d))));
  const stepGems = (d: number) => setGems((v) => String(Math.max(0, Math.floor(parseFloat(v) || 0) + d)));

  const goldNum = Math.max(0, parseFloat(gold) || 0);
  const gemsNum = Math.max(0, Math.floor(parseFloat(gems) || 0));

  const gemsFromGold = buyCoinsPerGem > 0 ? Math.floor((goldNum * 10000) / buyCoinsPerGem) : 0;
  const coinsFromGems = Math.round(gemsNum * sellCoinsPerGem);

  const inputCls =
    "w-20 bg-transparent py-2 text-center text-sm text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Gold -> Gems */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-sm font-medium uppercase tracking-wide text-white/40">Gold → Gems</p>
        <div className="mt-3 flex items-center gap-2">
          <GoldIcon />
          <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] focus-within:border-orange-400/40">
            <StepButton label="Decrease gold" icon={P.minus} onClick={() => stepGold(-10)} />
            <input
              type="number"
              min={0}
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              className={inputCls}
              aria-label="Gold amount"
            />
            <StepButton label="Increase gold" icon={P.plus} onClick={() => stepGold(10)} />
          </div>
          <span className="text-sm text-white/55">gold</span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-2xl font-bold tabular-nums text-orange-300">
          {gemsFromGold.toLocaleString()}
          <GemIcon />
          <span className="text-base font-medium text-white/60">gems</span>
        </p>
      </div>

      {/* Gems -> Gold */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-sm font-medium uppercase tracking-wide text-white/40">Gems → Gold</p>
        <div className="mt-3 flex items-center gap-2">
          <GemIcon />
          <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] focus-within:border-orange-400/40">
            <StepButton label="Decrease gems" icon={P.minus} onClick={() => stepGems(-100)} />
            <input
              type="number"
              min={0}
              value={gems}
              onChange={(e) => setGems(e.target.value)}
              className={inputCls}
              aria-label="Gem amount"
            />
            <StepButton label="Increase gems" icon={P.plus} onClick={() => stepGems(100)} />
          </div>
          <span className="text-sm text-white/55">gems</span>
        </div>
        <p className="mt-4 text-2xl font-bold">
          <Coins value={coinsFromGems} />
        </p>
      </div>
    </div>
  );
}
