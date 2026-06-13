"use client";

import { useEffect } from "react";
import { CRS, latLngBounds } from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";

export type VendorMapLocation = {
  /** Optional stable id, used to highlight or flag a marker as active. */
  id?: string;
  area: string;
  zone: string | null;
  coord: [number, number];
};

// Centre on the single location, or fit all of them in view. Keyed on the
// coordinates themselves (not array identity) so re-rendering with the same
// places, e.g. to restyle a highlighted marker, never re-zooms the map.
function FitToLocations({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const key = coords.map((c) => c.join(",")).join("|");
  useEffect(() => {
    if (coords.length === 1) {
      map.setView(unproject(coords[0]), 5);
    } else if (coords.length > 1) {
      map.fitBounds(latLngBounds(coords.map(unproject)), { padding: [28, 28], maxZoom: 5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function VendorMap({
  locations,
  highlightIds,
  activeIds,
}: {
  locations: VendorMapLocation[];
  /** Marker ids to emphasise (e.g. the expanded boss card). */
  highlightIds?: string[];
  /** Marker ids to colour green (e.g. a boss active right now). */
  activeIds?: string[];
}) {
  const coords = locations.map((l) => l.coord);
  const center = coords.length ? unproject(coords[0]) : unproject([49404, 31170]);
  const hi = new Set(highlightIds ?? []);
  const ac = new Set(activeIds ?? []);

  return (
    <MapContainer
      crs={CRS.Simple}
      center={center}
      zoom={4}
      minZoom={2}
      maxZoom={MAX_ZOOM}
      className="h-full w-full"
      maxBounds={TYRIA_BOUNDS}
    >
      <TileLayer url={TILE_URL} noWrap minZoom={1} maxZoom={MAX_ZOOM} />
      {locations.map((l, i) => {
        const isActive = l.id ? ac.has(l.id) : false;
        const isHi = l.id ? hi.has(l.id) : false;
        return (
          <CircleMarker
            key={l.id ?? `${l.area}-${i}`}
            center={unproject(l.coord)}
            radius={isHi ? 11 : 8}
            pathOptions={{
              color: isHi ? "#fb923c" : "#ffffff",
              weight: isHi ? 3 : 2,
              fillColor: isActive ? "#22c55e" : "#f59e0b",
              fillOpacity: isHi ? 1 : 0.9,
            }}
          >
            <Tooltip direction="top">
              <span className="font-semibold">{l.area}</span>
              {l.zone && (
                <>
                  <br />
                  {l.zone}
                </>
              )}
            </Tooltip>
          </CircleMarker>
        );
      })}
      <FitToLocations coords={coords} />
    </MapContainer>
  );
}
