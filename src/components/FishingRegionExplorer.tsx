"use client";

import { useState } from "react";
import FishingFishList from "@/components/FishingFishList";
import FishingRegionMap from "@/components/FishingRegionMap";
import type { Fish } from "@/lib/gw2/fishing";
import type { FishingMap } from "@/lib/gw2/fishingMaps";
import type { FishingHole } from "@/lib/gw2/fishingHoles";

// Region fishing view: an "All fish" list in the sidebar drives a large map that
// fills the rest. The area/position filter floats as an overlay on the map.
// Selecting a fish (sidebar or hole overlay) lights up its holes; clicking a
// hole lists the fish that bite there.
export default function FishingRegionExplorer({
  regionName,
  fish,
  maps,
  holes,
}: {
  regionName: string;
  fish: Fish[];
  maps: FishingMap[];
  holes?: FishingHole[];
}) {
  const [selected, setSelected] = useState<Fish | null>(null);

  return (
    <div>
      <h2 className="mb-3 border-b border-white/10 pb-2 text-lg font-semibold text-white">
        Where to fish
      </h2>
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 lg:h-[620px] lg:flex-row">
        <aside className="flex max-h-[340px] min-h-0 flex-col border-b border-white/10 bg-[#0b0b11] lg:max-h-none lg:w-[20rem] lg:shrink-0 lg:border-b-0 lg:border-r">
          <FishingFishList
            fish={fish}
            selectedId={selected?.id ?? null}
            onSelect={(f) => setSelected((cur) => (cur?.id === f.id ? null : f))}
          />
        </aside>
        <div className="relative min-h-[440px] flex-1 lg:min-h-0">
          <FishingRegionMap
            regionName={regionName}
            fish={fish}
            maps={maps}
            holes={holes}
            selectedFish={selected}
            onClearFish={() => setSelected(null)}
            onSelectFish={(f) => setSelected(f)}
          />
        </div>
      </div>
    </div>
  );
}
