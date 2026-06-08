import type { Metadata } from "next";
import Link from "next/link";
import MarketView from "@/components/MarketView";
import { SeoModal } from "@/components/seo/SeoModal";

export const metadata: Metadata = {
  title: "GW2 Trading Post Prices | Gems, Ectos & Gathering Materials",
  description:
    "Live Guild Wars 2 Trading Post prices: gem-to-gold exchange rate, key items like Glob of Ectoplasm and Mystic Coins, plus gathering materials, every wood, ore and plant tier.",
  alternates: { canonical: "/gw2-trading-post" },
  openGraph: {
    title: "GW2 Trading Post Prices | Gems, Ectos & Gathering Materials",
    description:
      "Live gem exchange rate, key item prices and gathering material prices for Guild Wars 2.",
    url: "https://buildop.app/gw2-trading-post",
  },
};

const FAQS = [
  {
    q: "What is the gem to gold exchange rate in GW2?",
    a: "The gem exchange panel above shows the current rate both ways, how much gold 100 gems costs, and how much gold you get for 100 gems, pulled live from the official Guild Wars 2 exchange API.",
  },
  {
    q: "How often do the Trading Post prices update?",
    a: "Prices are fetched live from the Guild Wars 2 commerce API and cached for about two minutes, so they stay current without hammering the API.",
  },
  {
    q: "What is a Glob of Ectoplasm worth?",
    a: "Ectoplasm is one of the staple currencies of the GW2 economy; its live buy and sell price is listed in the items table above alongside Mystic Coins and the T1–T6 crafting materials.",
  },
  {
    q: "Which gathering materials are priced here?",
    a: "Every gatherable tier, Copper to Orichalcum ore, Green to Ancient wood, and the foraged vegetables and herbs, with live buy and sell orders on the Materials tab.",
  },
];

export default function MarketPage() {
  return (
    <>
      <MarketView />
      <SeoModal
        heading="Live Guild Wars 2 Trading Post prices"
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Trading Post", path: "/gw2-trading-post" },
        ]}
        intro={
          <>
            <p>
              Track the Guild Wars 2 economy at a glance: the live gem-to-gold exchange rate, the
              prices of staple items like Globs of Ectoplasm and Mystic Coins, and buy/sell orders
              for every gathering material tier. All figures come straight from the official
              Guild Wars 2 Trading Post API.
            </p>
            <p>
              Use the Materials tab to compare wood, ore and plant prices when deciding what to
              gather, then jump to the{" "}
              <Link href="/gw2-gathering-map" className="text-orange-400 hover:underline">
                gathering map
              </Link>{" "}
              to find where to farm it.
            </p>
          </>
        }
        faqs={FAQS}
      />
    </>
  );
}
