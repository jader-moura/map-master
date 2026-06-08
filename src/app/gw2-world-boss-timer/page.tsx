import type { Metadata } from "next";
import BuildopApp from "@/components/BuildopApp";
import { SeoModal } from "@/components/seo/SeoModal";
import { BOSSES } from "@/lib/gw2/bosses";

export const metadata: Metadata = {
  title: "GW2 World Boss Timer | Live Spawn Times & Map",
  description:
    "Live Guild Wars 2 world boss timer: countdowns to every world boss spawn in your local time, each boss's location on the Tyria map, full daily schedules, and optional spawn alerts.",
  alternates: { canonical: "/gw2-world-boss-timer" },
  openGraph: {
    title: "GW2 World Boss Timer | Live Spawn Times & Map",
    description:
      "Countdowns to every Guild Wars 2 world boss, with map locations and spawn alerts.",
    url: "https://buildop.app/gw2-world-boss-timer",
  },
};

const FAQS = [
  {
    q: "What time do world bosses spawn in Guild Wars 2?",
    a: "World bosses follow a fixed daily UTC schedule that repeats every day. The timer above converts each spawn to your local time and counts down to the next one, so you never have to do the math.",
  },
  {
    q: "Are the spawn times shown in my local time?",
    a: "Yes. The schedule is stored in UTC (the same times the game uses) and the timer automatically displays countdowns and clock times in your browser's local timezone.",
  },
  {
    q: "When does Tequatl the Sunless spawn?",
    a: "Tequatl spawns at 00:00, 03:00, 07:00, 11:30, 16:00 and 19:00 UTC each day in Sparkfly Fen. It's a hardcore meta boss, so arrive a few minutes early on a populated map.",
  },
  {
    q: "What's the difference between world bosses and hardcore meta bosses?",
    a: "Standard world bosses (Shadow Behemoth, The Shatterer, etc.) are quick, open-tag events. Hardcore bosses like Tequatl, Triple Trouble and the Karka Queen need an organised squad and reward bonus chests.",
  },
];

export default function BossesPage() {
  return (
    <>
      <BuildopApp />
      <SeoModal
        heading="Guild Wars 2 world boss schedule"
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "World Boss Timer", path: "/gw2-world-boss-timer" },
        ]}
        intro={
          <>
            <p>
              Guild Wars 2 world bosses spawn on a fixed daily rotation. This timer tracks
              all {BOSSES.length} core-Tyria bosses, from Shadow Behemoth in Queensdale to
              Tequatl the Sunless in Sparkfly Fen, counting down to the next spawn in your
              local time, with optional browser alerts for the ones you favourite.
            </p>
            <p>
              Click any boss to fly the Tyria map to its location and copy the nearest
              waypoint chat code. Below is the full daily schedule (all times in UTC).
            </p>
          </>
        }
        faqs={FAQS}
      >
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-white/50">
                <th className="py-2 pr-4 font-medium">Boss</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 font-medium">Daily spawns (UTC)</th>
              </tr>
            </thead>
            <tbody className="text-white/75">
              {BOSSES.map((b) => (
                <tr key={b.id} className="border-b border-white/5 align-top">
                  <td className="py-2 pr-4 font-medium text-white/90">{b.name}</td>
                  <td className="py-2 pr-4 text-white/60">{b.zone}</td>
                  <td className="py-2 pr-4 text-white/60">
                    {b.hardcore ? "Hardcore meta" : "World boss"}
                  </td>
                  <td className="py-2 text-white/60">{b.times.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeoModal>
    </>
  );
}
