import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import BossTrain from "@/components/BossTrain";

const SITE_URL = "https://buildop.app";

export const metadata: Metadata = {
  title: "GW2 Boss Train Planner | Chain World Bosses Back-to-Back",
  description:
    "Plan your Guild Wars 2 world boss train: pick a time window and see exactly which bosses you can chain back-to-back without overlaps, in order, with waypoint codes ready to copy.",
  alternates: { canonical: "/gw2-boss-train" },
  openGraph: {
    title: "GW2 Boss Train Planner | Chain World Bosses Back-to-Back",
    description:
      "See which Guild Wars 2 world bosses you can hit back-to-back in the next hour or two, with waypoints.",
    url: `${SITE_URL}/gw2-boss-train`,
  },
};

export default function BossTrainPage() {
  return (
    <PageShell
      title="Boss Train"
      seo={{
        heading: "GW2 Boss Train Planner",
        intro: (
          <>
            <p>
              A world boss train is a run where you hop between bosses back-to-back, looting each
              one before moving on. Because waypoint travel in Guild Wars 2 is instant, the only
              thing stopping you attending a boss is another boss happening at the same time. This
              planner takes the upcoming schedule and works out the largest set of bosses you can
              actually chain in your chosen window.
            </p>
            <p>
              Pick a time window, then follow the highlighted itinerary in order. Each stop links to
              the boss page and offers its nearest waypoint chat code, so you can paste it straight
              into game chat and teleport. Greyed-out spawns are ones that overlap a boss already in
              your train.
            </p>
          </>
        ),
        faqs: [
          {
            q: "What is a world boss train in Guild Wars 2?",
            a: "A boss train is a route where players hit a sequence of world bosses one after another, waypointing between them to loot each boss's reward chest. Since travel is instant, you can attend any boss whose timing doesn't overlap with another.",
          },
          {
            q: "How does the boss train planner decide the order?",
            a: "It lists every spawn in your chosen window and greedily picks the boss that finishes earliest at each step. That's the optimal strategy for attending the maximum number of bosses without time conflicts.",
          },
          {
            q: "Can I really attend that many bosses in a row?",
            a: "Yes, as long as their active windows don't overlap. Standard bosses stay up for about 15 minutes and hardcore bosses a little longer, and waypoint travel is instant, so a well-timed train can chain several bosses in an hour.",
          },
        ],
        breadcrumb: [
          { name: "Home", path: "/" },
          { name: "Boss Train", path: "/gw2-boss-train" },
        ],
      }}
      headerRight={
        <Link href="/gw2-world-boss-timer" className="text-sm text-white/55 transition hover:text-white">
          Boss timer
        </Link>
      }
    >
      <article className="mx-auto max-w-3xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/40">
          <Link href="/" className="transition hover:text-orange-400">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-white/60">Boss Train</span>
        </nav>

        <h1 className="text-3xl font-bold">GW2 Boss Train Planner</h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-white/65">
          Pick a window and chain as many world bosses as the schedule allows, back-to-back, with
          waypoints ready to copy. See the whole day on the{" "}
          <Link href="/gw2-world-boss-timeline" className="text-orange-400 hover:underline">boss timeline</Link>{" "}
          or just what&apos;s next on the{" "}
          <Link href="/gw2-world-boss-timer" className="text-orange-400 hover:underline">world boss timer</Link>.
        </p>

        <div className="mt-6">
          <BossTrain />
        </div>
      </article>

      <Footer />
    </PageShell>
  );
}
