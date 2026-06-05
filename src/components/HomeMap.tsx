"use client";

import { CRS } from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
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

  return (
    <MapContainer
      preferCanvas
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
        const meta = POI_META[kind];
        const markers = q
          ? data[kind].filter((m) => m.name.toLowerCase().includes(q))
          : data[kind];
        return markers.map((m, i) => (
          <CircleMarker
            key={`${kind}-${i}`}
            center={unproject(m.coord)}
            radius={meta.radius}
            pathOptions={{
              color: meta.color,
              weight: 1,
              fillColor: meta.color,
              fillOpacity: 0.85,
            }}
          >
            <Tooltip direction="top">
              <span className="font-semibold">{m.name}</span>
              <br />
              <span className="opacity-60">{meta.label.replace(/s$/, "")}</span>
            </Tooltip>
          </CircleMarker>
        ));
      })}
    </MapContainer>
  );
}
