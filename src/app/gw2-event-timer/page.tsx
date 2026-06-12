import type { Metadata } from "next";
import Link from "next/link";
import TimelineView from "@/components/TimelineView";
import { SeoModal } from "@/components/seo/SeoModal";
import { EVENT_LOCATIONS } from "@/lib/gw2/events";

export const metadata: Metadata = {
  title: "GW2 Event Timers | Live Meta Event Timeline",
  description:
    "A live Guild Wars 2 event-timer timeline: world bosses and map meta events (Heart of Thorns, Path of Fire, Living World, End of Dragons, SotO and more) shown as phase bars with a now indicator.",
  alternates: { canonical: "/gw2-event-timer" },
  openGraph: {
    title: "GW2 Event Timers | Live Meta Event Timeline",
    description: "World bosses and map metas as a live phase-bar timeline.",
    url: "https://buildop.app/gw2-event-timer",
  },
};

const FAQS = [
  {
    q: "What is a meta event in Guild Wars 2?",
    a: "A meta event is a large, map-wide chain of events that runs on a fixed schedule and usually ends in a big boss fight or reward chest, for example Dragon's End in Cantha, Auric Basin's Octovine, or the Pinata in Dragonfall.",
  },
  {
    q: "Which expansions' meta events are included?",
    a: "The timeline covers core Tyria world bosses plus map metas from Heart of Thorns, Path of Fire, the Living World seasons, End of Dragons, Secrets of the Obscure and Janthir Wilds.",
  },
  {
    q: "How do I know when the next meta starts?",
    a: "Each event is drawn as a phase bar on a sliding timeline with a red 'now' line. Anything crossing the line is active; bars to the right are upcoming, so you can see at a glance what to do next.",
  },
  {
    q: "Are these the same times as the in-game event timer?",
    a: "Yes. The schedule is derived from the official Guild Wars 2 wiki event-timer data, the same source the in-game /wiki et timer uses, so the times match.",
  },
];

export default function TimelinePage() {
  return (
    <>
      <TimelineView />
      <SeoModal
        heading="The live Guild Wars 2 meta event timeline"
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Event Timer", path: "/gw2-event-timer" },
        ]}
        intro={
          <>
            <p>
              Guild Wars 2 packs dozens of timed meta events across every expansion, each on its
              own schedule. This event timer lays them all out as a wiki-style timeline of phase
              bars with a live &quot;now&quot; indicator, so you can plan farming routes and never
              miss a Tequatl, Dragonstorm, Auric Basin or Dragon&apos;s End run.
            </p>
            <p>
              Times come from the official GW2 wiki event-timer data and display in your local
              timezone. Use the{" "}
              <Link href="/gw2-world-boss-timer" className="text-orange-400 hover:underline">
                boss timer
              </Link>{" "}
              for a focused world-boss countdown, or this timeline for the full picture across
              the day.
            </p>
          </>
        }
        faqs={FAQS}
      >
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white">Meta events by map</h3>
          <p className="mt-1 text-sm text-white/50">
            Open any map for its meta event timer, daily schedule and waypoint.
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {Object.entries(EVENT_LOCATIONS).map(([id, loc]) => (
              <li key={id} className="truncate text-sm leading-snug">
                <Link href={`/gw2/meta/${id}`} className="text-white/75 transition hover:text-orange-400">
                  {loc.map}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SeoModal>
    </>
  );
}
