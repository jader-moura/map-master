import type { Metadata } from "next";
import GatherView from "@/components/GatherView";
import { SeoModal } from "@/components/seo/SeoModal";
import { Icon, P } from "@/components/icons";
import { MATERIAL_CATEGORIES } from "@/lib/gw2/materials";
import { GATHERING_NODES, GATHERING_NODE_MAPS } from "@/lib/gw2/gatheringNodes";

export const metadata: Metadata = {
  title: "GW2 Gathering Map | Where to Farm Wood, Ore & Plants",
  description:
    "Interactive Guild Wars 2 gathering map: pick a material, copper to orichalcum ore, green to ancient wood, and see which Tyria maps to farm it in, with exact node spots pinned on core maps.",
  alternates: { canonical: "/gw2-gathering-map" },
  openGraph: {
    title: "GW2 Gathering Map | Where to Farm Wood, Ore & Plants",
    description:
      "Pick a gathering material and the Guild Wars 2 maps where you gather it light up, with exact node spots on core maps.",
    url: "https://buildop.app/gw2-gathering-map",
  },
};

const totalMaterials = MATERIAL_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
const totalNodes = GATHERING_NODES.length;
const coveredMaps = GATHERING_NODE_MAPS.length;

const STEPS: { icon: string; title: string; body: string }[] = [
  {
    icon: P.pickaxe,
    title: "Use the right tool",
    body: "A logging axe for wood, a mining pick for ore, a harvesting sickle for plants. Higher tiers need the matching tool tier or an unlimited gathering tool.",
  },
  {
    icon: P.layers,
    title: "Tier follows zone level",
    body: "Gathering tiers are gated by map level: low zones give copper ore and green wood, level 80 zones give orichalcum ore and ancient wood.",
  },
  {
    icon: P.map,
    title: "Pick a material to map it",
    body: "Selecting a material lights up every open-world zone that produces it. On covered core maps, the exact ore, wood and plant spots pin too.",
  },
  {
    icon: P.star,
    title: "Chase rich nodes",
    body: "Rich veins and orchards yield extra and reset daily. Where mapped, they show as gold pins so you can build an efficient daily route.",
  },
];

const FAQS = [
  {
    q: "Where do I farm mithril ore in Guild Wars 2?",
    a: "Mithril ore nodes appear in level 70–80 open-world zones such as Frostgorge Sound, Mount Maelstrom and Straits of Devastation. Select Mithril Ore on the map above to highlight every matching zone, and on covered maps the exact vein spots pin too.",
  },
  {
    q: "What level zones have orichalcum ore and ancient wood?",
    a: "Orichalcum ore and ancient wood are end-game tiers found in level 75–80 areas, including Orr (Cursed Shore, Malchor's Leap) and many expansion maps. Pick the material to see them light up.",
  },
  {
    q: "Can you pin exact gathering node locations?",
    a: `Yes, where mapped. Node spawn points in core Tyria are largely fixed, so this map pins ${totalNodes.toLocaleString()} exact ore, wood and plant spots across ${coveredMaps} core maps when you select a material. Which spots are active each instance and the daily rich nodes vary, and many expansion maps aren't pinned yet, so everywhere else the map highlights whole zones by the node tier their level produces.`,
  },
  {
    q: "What gathering tool do I need?",
    a: "A logging axe for wood, a mining pick for ore, and a harvesting sickle for plants. Higher tiers need the matching tool tier or an unlimited gathering tool.",
  },
];

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}

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
              On {coveredMaps} core-Tyria maps the map goes further and pins the{" "}
              <strong className="text-white/80">exact node spots</strong> for your selected material,
              so you can see precisely where each ore vein, tree and plant sits. Everywhere else it
              falls back to highlighting whole zones by tier.
            </p>
          </>
        }
        faqs={FAQS}
      >
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatChip value={String(totalMaterials)} label="Materials" />
          <StatChip value="3" label="Gathering types" />
          <StatChip value={totalNodes.toLocaleString()} label="Node spots pinned" />
          <StatChip value={String(coveredMaps)} label="Core maps mapped" />
        </div>

        <section className="mt-10">
          <h3 className="text-base font-semibold text-white">How gathering works</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                  <Icon path={s.icon} className="h-5 w-5" />
                </span>
                <h4 className="mt-3 text-sm font-semibold text-white">{s.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-base font-semibold text-white">Material tiers by zone level</h3>
          <div className="mt-4 grid gap-8 sm:grid-cols-3">
            {MATERIAL_CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <h4 className="text-sm font-semibold text-white">{cat.label}</h4>
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
        </section>

        <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">
          Map and material data from the official Guild Wars 2 API. Exact node spots from the{" "}
          <a
            href="https://github.com/kriana/Tyrian-Gathering-Marker-Project"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:text-white/60"
          >
            Tyrian Gathering Marker Project
          </a>{" "}
          by kriana, released under{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:text-white/60"
          >
            CC0 1.0
          </a>
          .
        </p>
      </SeoModal>
    </>
  );
}
