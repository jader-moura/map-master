"use client";

import dynamic from "next/dynamic";
import type { VendorMapLocation } from "@/components/VendorMap";

// Leaflet touches `window`, so the map is client-only (ssr:false).
const VendorMap = dynamic(() => import("@/components/VendorMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

export default function VendorMapView({ locations }: { locations: VendorMapLocation[] }) {
  if (!locations.length) return null;
  return (
    <div className="h-[300px] w-full overflow-hidden rounded-xl border border-white/10">
      <VendorMap locations={locations} />
    </div>
  );
}
