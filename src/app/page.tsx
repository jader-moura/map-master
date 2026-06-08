import type { Metadata } from "next";
import HomeMapView from "@/components/HomeMapView";
import { SeoModal } from "@/components/seo/SeoModal";
import { REGION_GROUPS } from "@/lib/gw2/regions";

export const metadata: Metadata = {
  title: "Guild Wars 2 Interactive Map (GW2 Map)",
  description:
    "Explore the full Guild Wars 2 world map. Find every waypoint, vista, point of interest, renown heart, hero challenge and dungeon portal across Tyria, toggle layers and search by name.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Guild Wars 2 Interactive Map (GW2 Map)",
    description:
      "The full Tyria map: waypoints, vistas, hearts, hero challenges and portals, all toggleable.",
    url: "https://buildop.app/",
  },
};

const FAQS = [
  {
    q: "What does the Guild Wars 2 interactive map show?",
    a: "Every waypoint, point of interest, vista, renown heart, hero challenge, dungeon/fractal portal and map-travel portal across Tyria. Each layer can be toggled on or off, and you can search markers by name.",
  },
  {
    q: "Does the map include the expansions?",
    a: "Yes. The map covers core Tyria plus Heart of Maguuma, Crystal Desert (Path of Fire), the Cantha maps from End of Dragons, Secrets of the Obscure and Janthir Wilds.",
  },
  {
    q: "Why do some markers only appear when I zoom in?",
    a: "To keep the map fast and readable, dense layers like points of interest reveal as you zoom in, and nearby markers group together at low zoom, exactly like the in-game world map.",
  },
  {
    q: "How do I jump to a specific region?",
    a: "Use the region navigator at the bottom-right of the map to fly straight to Kryta, Ascalon, the Crystal Desert, Cantha and more.",
  },
];

const REGIONS = REGION_GROUPS.flatMap((g) => g.regions.map((r) => r.name));

export default function Home() {
  return (
    <>
      <HomeMapView />
      <SeoModal
        heading="The complete Guild Wars 2 world map"
        breadcrumb={[{ name: "Home", path: "/" }]}
        intro={
          <>
            <p>
              This interactive Guild Wars 2 map plots every navigation marker in Tyria on the
              official game tiles: waypoints for fast travel, points of interest, vistas, renown
              hearts, hero challenges, dungeon and fractal portals, and the asura-gate network
              that links the capital cities. Toggle any layer, search by name, and click the
              region navigator to fly anywhere on the continent.
            </p>
            <p>
              Coverage spans core Tyria and every expansion zone, including {REGIONS.join(", ")}.
            </p>
          </>
        }
        faqs={FAQS}
      />
    </>
  );
}
