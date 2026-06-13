import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import ResetTimers from "@/components/ResetTimers";

const SITE_URL = "https://buildop.app";

export const metadata: Metadata = {
  title: "GW2 Reset Timer | Daily, Weekly & WvW Reset Countdown",
  description:
    "Live Guild Wars 2 reset timer: countdowns to the daily reset (00:00 UTC), the weekly reset (Monday 07:30 UTC) and the NA and EU WvW matchup resets, with each time shown in your local timezone.",
  alternates: { canonical: "/gw2-reset-timer" },
  openGraph: {
    title: "GW2 Reset Timer | Daily, Weekly & WvW Reset Countdown",
    description:
      "Countdowns to the GW2 daily, weekly and WvW resets in your local time.",
    url: `${SITE_URL}/gw2-reset-timer`,
  },
};

export default function ResetTimerPage() {
  return (
    <PageShell
      title="Reset Timer"
      seo={{
        heading: "GW2 Reset Timer",
        intro: (
          <>
            <p>
              Guild Wars 2 runs on a fixed reset schedule. The daily reset happens every day at
              00:00 UTC and the weekly reset at Monday 07:30 UTC; World vs World matchups reset on
              Friday (EU) and Saturday (NA). This page counts down to each one in your local time.
            </p>
            <p>
              The daily reset is also when your Wizard&apos;s Vault daily objectives refresh, and the
              weekly reset refreshes its weekly objectives along with raid, strike and fractal clears.
            </p>
          </>
        ),
        faqs: [
          {
            q: "What time is the daily reset in Guild Wars 2?",
            a: "The daily reset is at 00:00 UTC every day. It refreshes daily achievements, Wizard's Vault daily objectives, the daily login reward and daily fractals. The timer above shows it in your local time.",
          },
          {
            q: "When is the weekly reset?",
            a: "The weekly reset is Monday at 07:30 UTC. It refreshes Wizard's Vault weekly objectives and weekly raid, strike and fractal rewards.",
          },
          {
            q: "When does World vs World reset?",
            a: "WvW weekly matchups reset on Friday 18:00 UTC for EU servers and Saturday 02:00 UTC for NA servers.",
          },
          {
            q: "When does the Wizard's Vault reset?",
            a: "Wizard's Vault daily objectives reset with the daily reset (00:00 UTC) and weekly objectives reset with the weekly reset (Monday 07:30 UTC).",
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Reset Timer", path: "/gw2-reset-timer" },
        ],
      }}
      headerRight={
        <Link href="/gw2-world-boss-timer" className="text-sm text-white/55 transition hover:text-white">
          Boss timer
        </Link>
      }
    >
      <article className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">Reset Timer</span>
        </nav>

        <h1 className="text-3xl font-bold">GW2 Reset Timer</h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
          Live countdowns to every Guild Wars 2 reset in your local time. Daily reset at 00:00 UTC,
          weekly reset Monday 07:30 UTC, and the NA and EU World vs World matchup resets. Looking for
          spawn times instead? See the{" "}
          <Link href="/gw2-world-boss-timer" className="text-orange-400 hover:underline">world boss timer</Link>{" "}
          and the{" "}
          <Link href="/gw2-event-timer" className="text-orange-400 hover:underline">event timer</Link>.
        </p>

        <div className="mt-6">
          <ResetTimers />
        </div>
      </article>

      <Footer />
    </PageShell>
  );
}
