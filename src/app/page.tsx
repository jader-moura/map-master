import type { Metadata } from "next";
import HomeMapView from "@/components/HomeMapView";

export const metadata: Metadata = {
  title: "Guild Wars 2 Interactive Map (GW2 Map)",
  description:
    "Explore the full Guild Wars 2 world map. Find every waypoint, vista, point of interest, renown heart, hero challenge and dungeon portal across Tyria — toggle layers and search by name.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Guild Wars 2 Interactive Map (GW2 Map)",
    description:
      "The full Tyria map: waypoints, vistas, hearts, hero challenges and portals — all toggleable.",
    url: "https://buildop.app/",
  },
};

export default function Home() {
  return <HomeMapView />;
}
