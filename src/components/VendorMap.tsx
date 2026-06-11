"use client";

import { useEffect } from "react";
import { CRS, latLngBounds } from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";

export type VendorMapLocation = {
  area: string;
  zone: string | null;
  coord: [number, number];
};

// Centre on the single location, or fit all of them in view.
function FitToLocations({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 1) {
      map.setView(unproject(coords[0]), 5);
    } else if (coords.length > 1) {
      map.fitBounds(latLngBounds(coords.map(unproject)), { padding: [28, 28], maxZoom: 5 });
    }
  }, [coords, map]);
  return null;
}

export default function VendorMap({ locations }: { locations: VendorMapLocation[] }) {
  const coords = locations.map((l) => l.coord);
  const center = coords.length ? unproject(coords[0]) : unproject([49404, 31170]);

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
      {locations.map((l, i) => (
        <CircleMarker
          key={`${l.area}-${i}`}
          center={unproject(l.coord)}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.9 }}
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
      ))}
      <FitToLocations coords={coords} />
    </MapContainer>
  );
}
