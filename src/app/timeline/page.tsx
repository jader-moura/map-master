import type { Metadata } from "next";
import TimelineView from "@/components/TimelineView";

export const metadata: Metadata = {
  title: "GW2 Event Timers — Live Meta Event Timeline",
  description:
    "A live Guild Wars 2 event-timer timeline: world bosses and map meta events (Heart of Thorns, Path of Fire, Living World, End of Dragons, SotO and more) shown as phase bars with a now indicator.",
  alternates: { canonical: "/timeline" },
  openGraph: {
    title: "GW2 Event Timers — Live Meta Event Timeline",
    description: "World bosses and map metas as a live phase-bar timeline.",
    url: "https://buildop.app/timeline",
  },
};

export default function TimelinePage() {
  return <TimelineView />;
}
