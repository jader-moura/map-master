import type { Metadata } from "next";
import BuildopApp from "@/components/BuildopApp";

export const metadata: Metadata = {
  title: "GW2 World Boss Timer — Live Spawn Times & Map",
  description:
    "Live Guild Wars 2 world boss timer: countdowns to every world boss spawn in your local time, each boss's location on the Tyria map, full daily schedules, and optional spawn alerts.",
  alternates: { canonical: "/bosses" },
  openGraph: {
    title: "GW2 World Boss Timer — Live Spawn Times & Map",
    description:
      "Countdowns to every Guild Wars 2 world boss, with map locations and spawn alerts.",
    url: "https://buildop.app/bosses",
  },
};

export default function BossesPage() {
  return <BuildopApp />;
}
