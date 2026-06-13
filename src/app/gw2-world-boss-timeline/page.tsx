import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import BossTimeline from "@/components/BossTimeline";

const SITE_URL = "https://buildop.app";

export const metadata: Metadata = {
  title: "GW2 World Boss Timeline | Full-Day Spawn Schedule",
  description:
    "The complete Guild Wars 2 world boss schedule on one timeline: every boss's spawn windows across the full UTC day with a live now-marker. Hover any spawn to see it in your local time.",
  alternates: { canonical: "/gw2-world-boss-timeline" },
  openGraph: {
    title: "GW2 World Boss Timeline | Full-Day Spawn Schedule",
    description:
      "Every Guild Wars 2 world boss spawn window on a single full-day timeline with a live now-marker.",
    url: `${SITE_URL}/gw2-world-boss-timeline`,
  },
};

export default function BossTimelinePage() {
  return (
    <PageShell
      title="Boss Timeline"
      seo={{
        heading: "GW2 World Boss Timeline",
        intro: (
          <>
            <p>
              This is the full Guild Wars 2 world boss schedule on a single timeline. Each row is one
              boss and each block is one of its spawn windows across the 24-hour UTC day; the orange
              line marks the current time and sweeps across as the day goes on.
            </p>
            <p>
              Standard world bosses spawn on a fixed daily rotation, while the harder bosses (Tequatl
              the Sunless, the Triple Trouble wurm, the Karka Queen) run on their own less frequent
              schedule. Hover any spawn block to see that time in your local timezone, or open a boss
              to see its loot, achievements and waypoint.
            </p>
          </>
        ),
        faqs: [
          {
            q: "What time do world bosses spawn in Guild Wars 2?",
            a: "World bosses spawn on a fixed daily schedule defined in UTC. Standard bosses such as the Shadow Behemoth and Fire Elemental rotate every couple of hours, while hardcore bosses like Tequatl run six times a day. The timeline above shows every spawn window with a live current-time marker.",
          },
          {
            q: "How is the boss timeline different from the boss timer?",
            a: "The timeline shows the whole day at once so you can plan ahead and see overlaps, while the world boss timer focuses on what is active now and counting down next. They use the same schedule data.",
          },
          {
            q: "Are the times shown in my local timezone?",
            a: "The axis is labelled in UTC because the schedule is defined in UTC, but hovering any spawn block shows that time converted to your local timezone, and the now-marker tracks the current time.",
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Boss Timeline", path: "/gw2-world-boss-timeline" },
        ],
      }}
      headerRight={
        <Link href="/gw2-world-boss-timer" className="text-sm text-white/55 transition hover:text-white">
          Boss timer
        </Link>
      }
    >
      <article className="mx-auto max-w-6xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">Boss Timeline</span>
        </nav>

        <h1 className="text-3xl font-bold">GW2 World Boss Timeline</h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
          The entire world boss schedule on one full-day timeline, with a live current-time marker.
          Want just what&apos;s up now and next? Use the{" "}
          <Link href="/gw2-world-boss-timer" className="text-orange-400 hover:underline">world boss timer</Link>{" "}
          and its live map, or check the{" "}
          <Link href="/gw2-reset-timer" className="text-orange-400 hover:underline">reset timer</Link>.
        </p>

        <div className="mt-6">
          <BossTimeline />
        </div>
      </article>

      <Footer />
    </PageShell>
  );
}
