"use client";

import { useMemo } from "react";
import { CRS, Icon as LeafletIcon } from "leaflet";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";
import { POI_META, POI_KINDS, type PoiData, type PoiKind } from "@/lib/gw2/pois";

const CENTER = unproject([49404, 31170]); // ~ Lion's Arch, central Tyria

export default function HomeMap({
  data,
  visible,
  query,
}: {
  data: PoiData;
  visible: Record<PoiKind, boolean>;
  query: string;
}) {
  const q = query.trim().toLowerCase();

  // Build one Leaflet icon per kind, reused across all of its markers.
  const icons = useMemo(
    () =>
      Object.fromEntries(
        POI_KINDS.map((kind) => {
          const m = POI_META[kind];
          return [
            kind,
            new LeafletIcon({
              iconUrl: m.iconUrl,
              iconSize: [m.size, m.size],
              iconAnchor: [m.size / 2, m.size / 2],
              tooltipAnchor: [0, -m.size / 2],
              className: "gw2-poi-icon",
            }),
          ];
        }),
      ) as Record<PoiKind, LeafletIcon>,
    [],
  );

  return (
    <MapContainer
      crs={CRS.Simple}
      center={CENTER}
      zoom={4}
      minZoom={2}
      maxZoom={MAX_ZOOM}
      maxBounds={TYRIA_BOUNDS}
      className="h-full min-h-[360px] w-full"
    >
      <TileLayer url={TILE_URL} noWrap minZoom={1} maxZoom={MAX_ZOOM} />
      {POI_KINDS.map((kind) => {
        if (!visible[kind]) return null;
        const markers = q
          ? data[kind].filter((m) => m.name.toLowerCase().includes(q))
          : data[kind];
        return markers.map((m, i) => (
          <Marker key={`${kind}-${i}`} position={unproject(m.coord)} icon={icons[kind]}>
            <Tooltip direction="top">
              <span className="font-semibold">{m.name}</span>
              <br />
              <span className="opacity-60">{POI_META[kind].label.replace(/s$/, "")}</span>
            </Tooltip>
          </Marker>
        ));
      })}
    </MapContainer>
  );
}
