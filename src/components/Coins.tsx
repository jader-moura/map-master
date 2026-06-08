// Gold/silver/copper coin display, shared across the Trading Post and Materials
// pages. A GW2 coin value is copper; 100 copper = 1 silver, 10000 = 1 gold.

const COIN = {
  gold: "https://wiki.guildwars2.com/images/d/d1/Gold_coin.png",
  silver: "https://wiki.guildwars2.com/images/3/3c/Silver_coin.png",
  copper: "https://wiki.guildwars2.com/images/e/eb/Copper_coin.png",
};

function CoinIcon({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="h-[14px] w-[14px]" />;
}

export function Coins({ value }: { value: number }) {
  if (!value) return <span className="font-mono text-white/30">-</span>;
  const g = Math.floor(value / 10000);
  const s = Math.floor((value % 10000) / 100);
  const c = value % 100;
  return (
    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-white">
      {g > 0 && (
        <span className="inline-flex items-center gap-0.5">
          {g}
          <CoinIcon src={COIN.gold} alt="gold" />
        </span>
      )}
      {(g > 0 || s > 0) && (
        <span className="inline-flex items-center gap-0.5">
          {s}
          <CoinIcon src={COIN.silver} alt="silver" />
        </span>
      )}
      <span className="inline-flex items-center gap-0.5">
        {c}
        <CoinIcon src={COIN.copper} alt="copper" />
      </span>
    </span>
  );
}
