import type { Metadata } from "next";
import GatherView from "@/components/GatherView";

export const metadata: Metadata = {
  title: "GW2 Gathering Map — Where to Farm Wood, Ore & Plants",
  description:
    "Interactive Guild Wars 2 gathering map: pick a material — copper to orichalcum ore, green to ancient wood — and see exactly which Tyria maps to farm it in, by zone level.",
  alternates: { canonical: "/gw2-gathering-map" },
  openGraph: {
    title: "GW2 Gathering Map — Where to Farm Wood, Ore & Plants",
    description:
      "Pick a gathering material and the Guild Wars 2 maps where you gather it light up on the Tyria map.",
    url: "https://buildop.app/gw2-gathering-map",
  },
};

export default function GatherPage() {
  return <GatherView />;
}
