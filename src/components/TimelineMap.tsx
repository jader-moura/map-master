"use client";

import { useEffect } from "react";
import { CRS, latLngBounds } from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Rectangle,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";
import type { Rect } from "@/lib/gw2/mapBounds";

export type MapMarker = {
  id: string;
  coord: [number, number];
  color: string;
  label: string;
  sub?: string;
};

function rectBounds(rect: Rect) {
  return latLngBounds(unproject(rect[0]), unproject(rect[1]));
}

function Recenter({ coord }: { coord: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(unproject(coord), Math.max(map.getZoom(), 5), { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coord[0], coord[1], map]);
  return null;
}

// Fit/fly the view to a selected map's rectangle.
function FitRect({ rect }: { rect: Rect }) {
  const map = useMap();
  useEffect(() => {
    map.flyToBounds(rectBounds(rect), { padding: [48, 48], maxZoom: 6, duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect[0][0], rect[0][1], rect[1][0], rect[1][1], map]);
  return null;
}

export default function TimelineMap({
  markers,
  selectedId,
  highlight,
  onSelect,
}: {
  markers: MapMarker[];
  selectedId: string;
  highlight?: Rect | null;
  onSelect: (id: string) => void;
}) {
  const selected = markers.find((m) => m.id === selectedId);
  const center = selected ? unproject(selected.coord) : unproject([49404, 31170]);

  return (
    <MapContainer
      crs={CRS.Simple}
      center={center}
      zoom={4}
      minZoom={2}
      maxZoom={MAX_ZOOM}
      maxBounds={TYRIA_BOUNDS}
      className="h-full min-h-[360px] w-full"
    >
      <TileLayer url={TILE_URL} noWrap minZoom={1} maxZoom={MAX_ZOOM} />
      {markers.map((m) => {
        const isSel = m.id === selectedId;
        return (
          <CircleMarker
            key={m.id}
            center={unproject(m.coord)}
            radius={isSel ? 10 : 6}
            pathOptions={{
              color: isSel ? "#ffffff" : m.color,
              weight: isSel ? 3 : 1.5,
              fillColor: m.color,
              fillOpacity: 0.85,
            }}
            eventHandlers={{ click: () => onSelect(m.id) }}
          >
            <Tooltip direction="top">
              <span className="font-semibold">{m.label}</span>
              {m.sub ? (
                <>
                  <br />
                  <span className="opacity-70">{m.sub}</span>
                </>
              ) : null}
            </Tooltip>
          </CircleMarker>
        );
      })}
      {highlight && (
        <Rectangle
          bounds={rectBounds(highlight)}
          pathOptions={{ color: "#f59e0b", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.06 }}
        />
      )}
      {highlight ? (
        <FitRect rect={highlight} />
      ) : (
        selected && <Recenter coord={selected.coord} />
      )}
    </MapContainer>
  );
}
