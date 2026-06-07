"use client";

import { CRS, latLngBounds } from "leaflet";
import { MapContainer, TileLayer, Rectangle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";
import type { GatherZone } from "@/app/api/maps/route";

const CENTER = unproject([49404, 31170]); // central Tyria

const overlaps = (z: [number, number], sel: [number, number]) =>
  z[0] <= sel[1] && z[1] >= sel[0];

export default function GatherMap({
  zones,
  selected,
}: {
  zones: GatherZone[];
  /** Level range of the selected material, or null when nothing is picked. */
  selected: [number, number] | null;
}) {
  return (
    <MapContainer
      crs={CRS.Simple}
      center={CENTER}
      zoom={3}
      minZoom={2}
      maxZoom={MAX_ZOOM}
      maxBounds={TYRIA_BOUNDS}
      className="h-full min-h-[360px] w-full"
    >
      <TileLayer url={TILE_URL} noWrap minZoom={1} maxZoom={MAX_ZOOM} />
      {zones.map((z) => {
        const hit = selected ? overlaps(z.levels, selected) : false;
        // Specify the *full* style in every branch — leaflet's setStyle merges,
        // so omitting a key (e.g. `fill`) would leave a stale value behind.
        const style = hit
          ? {
              color: "#34d399",
              weight: 2,
              opacity: 1,
              fill: true,
              fillColor: "#22c55e",
              fillOpacity: 0.4,
            }
          : {
              color: "#ffffff",
              weight: 1,
              opacity: selected ? 0.08 : 0.35,
              fill: false,
              fillColor: "#ffffff",
              fillOpacity: 0,
            };
        return (
          <Rectangle
            // Key by hit state so the layer remounts with a clean style on select.
            key={`${z.id}-${hit}`}
            bounds={latLngBounds(unproject(z.rect[0]), unproject(z.rect[1]))}
            pathOptions={style}
          >
            {hit && (
              <Tooltip direction="center" sticky>
                <span className="font-semibold">{z.name}</span>
                <br />
                <span className="opacity-70">
                  Level {z.levels[0]}–{z.levels[1]}
                </span>
              </Tooltip>
            )}
          </Rectangle>
        );
      })}
    </MapContainer>
  );
}
