import type { Metadata } from "next";
import MarketView from "@/components/MarketView";

export const metadata: Metadata = {
  title: "GW2 Trading Post Prices — Gems, Ectos & Gathering Materials",
  description:
    "Live Guild Wars 2 Trading Post prices: gem-to-gold exchange rate, key items like Glob of Ectoplasm and Mystic Coins, plus gathering materials — every wood, ore and plant tier.",
  alternates: { canonical: "/gw2-trading-post" },
  openGraph: {
    title: "GW2 Trading Post Prices — Gems, Ectos & Gathering Materials",
    description:
      "Live gem exchange rate, key item prices and gathering material prices for Guild Wars 2.",
    url: "https://buildop.app/gw2-trading-post",
  },
};

export default function MarketPage() {
  return <MarketView />;
}
