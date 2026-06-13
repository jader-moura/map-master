import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import { Coins } from "@/components/Coins";
import { GemIcon } from "@/components/GemIcon";
import GemCalculator from "@/components/GemCalculator";
import { getGoldToGems, getGemsToGold, type GemExchange } from "@/lib/gw2/api";

const SITE_URL = "https://buildop.app";

// Exchange rates are volatile; refresh the page every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "GW2 Gem to Gold Calculator | Live Gem Exchange Rate",
  description:
    "Live Guild Wars 2 gem exchange rate with a two-way gem to gold and gold to gems calculator. See how much gold your gems are worth and how many gems your gold will buy, straight from the official GW2 API.",
  alternates: { canonical: "/gw2-gems" },
  openGraph: {
    title: "GW2 Gem to Gold Calculator | Live Gem Exchange Rate",
    description: "Live gem to gold and gold to gems rates with a calculator.",
    url: `${SITE_URL}/gw2-gems`,
  },
};

export default async function GemsPage() {
  // 100 gold buying gems, and 100 gems selling for gold.
  const [goldToGems, gemsToGold] = await Promise.all([
    getGoldToGems(1_000_000).catch(() => null as GemExchange | null),
    getGemsToGold(100).catch(() => null as GemExchange | null),
  ]);

  const buyCoinsPerGem = goldToGems?.coins_per_gem ?? 0;
  const sellCoinsPerGem = gemsToGold?.coins_per_gem ?? 0;
  const gemsPer100Gold = goldToGems?.quantity ?? 0;
  const goldPer100Gems = gemsToGold?.quantity ?? 0;
  const haveRates = buyCoinsPerGem > 0 && sellCoinsPerGem > 0;

  return (
    <PageShell
      title="Gem Calculator"
      seo={{
        heading: "GW2 Gem to Gold Calculator",
        intro: (
          <>
            <p>
              The Guild Wars 2 gem exchange lets you convert gold to gems and gems to gold at a
              floating market rate. This page shows the live rate from the official Guild Wars 2 API
              and a two-way calculator so you can quickly check what your gold or gems are worth.
            </p>
            <p>
              Buying gems with gold and selling gems for gold use slightly different rates (a market
              spread), so the calculator uses each direction&apos;s current rate. Rates also move a
              little with the amount exchanged.
            </p>
          </>
        ),
        faqs: [
          {
            q: "How much gold is 800 gems in GW2?",
            a: "It depends on the live exchange rate, which floats with the market. Use the Gems to Gold side of the calculator on this page to convert any gem amount to gold at the current rate.",
          },
          {
            q: "Is it better to buy gems with gold or buy gold with gems?",
            a: "The exchange has a spread, so you always lose a little converting either way. Check both directions here: convert only when the rate is favourable for what you actually need.",
          },
          {
            q: "Where does the gem exchange rate come from?",
            a: "Directly from the official Guild Wars 2 commerce API, the same rate you see on the in-game gem exchange. This page refreshes it every few minutes.",
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Gem Calculator", path: "/gw2-gems" },
        ],
      }}
      headerRight={
        <Link href="/gw2-trading-post" className="text-sm text-white/55 transition hover:text-white">
          Trading Post
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">Gem Calculator</span>
        </nav>

        <h1 className="text-3xl font-bold">GW2 Gem to Gold Calculator</h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
          The live Guild Wars 2 gem exchange rate, with a two-way gem to gold and gold to gems
          calculator. Rates come straight from the official GW2 API and refresh every few minutes.
        </p>

        {haveRates ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
                <p className="text-sm font-medium uppercase tracking-wide text-white/40">Buy gems</p>
                <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-white">
                  100 gold → {gemsPer100Gold.toLocaleString()} <GemIcon className="h-4 w-4" /> gems
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/50">
                  About <Coins value={Math.round(buyCoinsPerGem)} /> per <GemIcon className="h-3.5 w-3.5" /> gem.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
                <p className="text-sm font-medium uppercase tracking-wide text-white/40">Sell gems</p>
                <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-white">
                  100 <GemIcon className="h-4 w-4" /> gems → <Coins value={goldPer100Gems} />
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/50">
                  About <Coins value={Math.round(sellCoinsPerGem)} /> per <GemIcon className="h-3.5 w-3.5" /> gem.
                </p>
              </div>
            </div>

            <h2 className="mt-10 border-t border-white/10 pt-8 text-xl font-bold">Calculator</h2>
            <div className="mt-4">
              <GemCalculator buyCoinsPerGem={buyCoinsPerGem} sellCoinsPerGem={sellCoinsPerGem} />
            </div>
          </>
        ) : (
          <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
            The live gem exchange rate is temporarily unavailable. Please check back in a few minutes.
          </p>
        )}

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          Exchange rates from the official Guild Wars 2 API. Rates float with the market and are for
          reference only.
        </p>
      </article>

      <Footer />
    </PageShell>
  );
}
