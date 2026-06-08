import type { Metadata } from "next";
import GatherView from "@/components/GatherView";
import { SeoModal } from "@/components/seo/SeoModal";
import { MATERIAL_CATEGORIES } from "@/lib/gw2/materials";

export const metadata: Metadata = {
  title: "GW2 Gathering Map | Where to Farm Wood, Ore & Plants",
  description:
    "Interactive Guild Wars 2 gathering map: pick a material, copper to orichalcum ore, green to ancient wood, and see exactly which Tyria maps to farm it in, by zone level.",
  alternates: { canonical: "/gw2-gathering-map" },
  openGraph: {
    title: "GW2 Gathering Map | Where to Farm Wood, Ore & Plants",
    description:
      "Pick a gathering material and the Guild Wars 2 maps where you gather it light up on the Tyria map.",
    url: "https://buildop.app/gw2-gathering-map",
  },
};

const FAQS = [
  {
    q: "Where do I farm mithril ore in Guild Wars 2?",
    a: "Mithril ore nodes appear in level 70–80 open-world zones such as Frostgorge Sound, Mount Maelstrom and Straits of Devastation. Select Mithril Ore on the map above to highlight every matching zone.",
  },
  {
    q: "What level zones have orichalcum ore and ancient wood?",
    a: "Orichalcum ore and ancient wood are end-game tiers found in level 75–80 areas, including Orr (Cursed Shore, Malchor's Leap) and many expansion maps. Pick the material to see them light up.",
  },
  {
    q: "Are gathering node locations fixed?",
    a: "No, individual nodes are randomly placed within each zone and reshuffle per map instance, so they can't be pinned exactly. What is fixed is the tier of node a zone produces, which is set by the zone's level. That's why this tool highlights whole zones by level rather than single nodes.",
  },
  {
    q: "What gathering tool do I need?",
    a: "A logging axe for wood, a mining pick for ore, and a harvesting sickle for plants. Higher tiers need the matching tool tier or an unlimited gathering tool.",
  },
];

export default function GatherPage() {
  return (
    <>
      <GatherView />
      <SeoModal
        heading="Where to gather every material in Guild Wars 2"
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Gathering Map", path: "/gw2-gathering-map" },
        ]}
        intro={
          <>
            <p>
              Gathering tiers in Guild Wars 2 are gated by zone level: low-level maps yield
              copper ore and green wood, while level 80 zones produce orichalcum ore and ancient
              wood. Pick a material on the map above and every open-world zone that produces it
              lights up, so you can plan the fastest farming route.
            </p>
            <p>
              The tables below list each material tier and the zone level range where it&apos;s
              gathered.
            </p>
          </>
        }
        faqs={FAQS}
      >
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {MATERIAL_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <h3 className="text-base font-semibold text-white">{cat.label}</h3>
              <table className="mt-3 w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/15 text-white/50">
                    <th className="py-1.5 pr-3 font-medium">Material</th>
                    <th className="py-1.5 font-medium">Zone level</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {cat.items.map((it) => (
                    <tr key={it.id} className="border-b border-white/5">
                      <td className="py-1.5 pr-3 text-white/85">{it.name}</td>
                      <td className="py-1.5 text-white/55">
                        {it.levels[0]}–{it.levels[1]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </SeoModal>
    </>
  );
}
