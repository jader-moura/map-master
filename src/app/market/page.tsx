import type { Metadata } from "next";
import MarketView from "@/components/MarketView";

export const metadata: Metadata = {
  title: "GW2 Trading Post Prices — Gems, Ectos & T6 Materials",
  description:
    "Live Guild Wars 2 Trading Post prices: gem-to-gold exchange rate plus current buy/sell prices for Glob of Ectoplasm, Mystic Coins and T6 crafting materials.",
  alternates: { canonical: "/market" },
  openGraph: {
    title: "GW2 Trading Post Prices — Gems, Ectos & T6 Materials",
    description: "Live gem exchange rate and key Guild Wars 2 item prices.",
    url: "https://buildop.app/market",
  },
};

export default function MarketPage() {
  return <MarketView />;
}
