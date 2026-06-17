"use client";

import { useState } from "react";
import FishingTable, { type FishRow } from "@/components/FishingTable";
import FishingRegionMap from "@/components/FishingRegionMap";
import type { Fish } from "@/lib/gw2/fishing";
import type { FishingMap } from "@/lib/gw2/fishingMaps";

// Two-column region view: the fish table on the left drives the map on the
// right. Clicking a fish reveals every fishing spot in the region as a fish
// symbol; clicking an area on the map focuses just that area.
export default function FishingRegionExplorer({
  regionName,
  fish,
  maps,
}: {
  regionName: string;
  fish: Fish[];
  maps: FishingMap[];
}) {
  const [selected, setSelected] = useState<Fish | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0">
        <FishingTable
          fish={fish}
          selectedId={selected?.id ?? null}
          onSelect={(f: FishRow) => setSelected((cur) => (cur?.id === f.id ? null : f))}
        />
      </div>
      <div>
        <h2 className="mb-3 border-b border-white/10 pb-2 text-lg font-semibold text-white">
          Where to fish
        </h2>
        <FishingRegionMap
          regionName={regionName}
          maps={maps}
          selectedFish={selected}
          onClearFish={() => setSelected(null)}
        />
      </div>
    </div>
  );
}
