"use client";

import { CRS, latLngBounds, divIcon, type DivIcon } from "leaflet";
import { MapContainer, TileLayer, Rectangle, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";
import type { GatherZone } from "@/app/api/maps/route";
import type { GatherNode } from "@/lib/gw2/gatheringNodes";

const CENTER = unproject([49404, 31170]); // central Tyria

const overlaps = (z: [number, number], sel: [number, number]) =>
  z[0] <= sel[1] && z[1] >= sel[0];

// A node marker as the material's icon image (like the home map's POI markers),
// with a gold ring for rich nodes. Cached per icon+rich so each is built once.
const nodeIconCache = new Map<string, DivIcon>();
function nodeMarkerIcon(url: string, rich: boolean): DivIcon {
  const key = `${rich ? "r" : "n"}|${url}`;
  let ic = nodeIconCache.get(key);
  if (!ic) {
    const size = rich ? 28 : 22;
    const ring = rich
      ? "box-shadow:0 0 0 2px #fbbf24,0 1px 4px rgba(0,0,0,.6);"
      : "box-shadow:0 1px 3px rgba(0,0,0,.6);";
    ic = divIcon({
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      tooltipAnchor: [0, -size / 2],
      html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;background:#0d0d14;${ring}"><img src="${url}" width="${size}" height="${size}" style="display:block;width:100%;height:100%" alt=""/></div>`,
    });
    nodeIconCache.set(key, ic);
  }
  return ic;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function GatherMap({
  zones,
  selected,
  nodes = [],
  nodeIcon,
}: {
  zones: GatherZone[];
  /** Level range of the selected material, or null when nothing is picked. */
  selected: [number, number] | null;
  /** Exact node spots to pin for the selected material (where data exists). */
  nodes?: GatherNode[];
  /** Icon image for the selected material, drawn on each node marker. */
  nodeIcon?: string;
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

      {/* Exact node spots for the selected material (covered maps only), drawn as
          the material's icon image — last, so the pins sit above the zones. */}
      {nodeIcon &&
        nodes.map((n, i) => (
          <Marker
            key={`node-${i}`}
            position={unproject(n.coord)}
            icon={nodeMarkerIcon(nodeIcon, n.rich)}
            zIndexOffset={n.rich ? 600 : 500}
          >
            <Tooltip direction="top">
              <span className="font-semibold">
                {n.rich ? "Rich " : ""}
                {cap(n.kind)}
              </span>
              <br />
              <span className="opacity-70">{n.map}</span>
            </Tooltip>
          </Marker>
        ))}
    </MapContainer>
  );
}
