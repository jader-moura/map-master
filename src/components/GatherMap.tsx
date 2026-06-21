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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// A node marker as its material/category icon image (like the home map's POI
// markers), with a gold ring for rich nodes. Cached per icon+rich.
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

export default function GatherMap({
  zones,
  selected,
  selectedZone = null,
  onSelectZone,
  nodes = [],
  materialIcon,
  categoryIcons = {},
}: {
  zones: GatherZone[];
  /** Level range of the selected material, or null when nothing is picked. */
  selected: [number, number] | null;
  /** Name of the map the user clicked (shows all its nodes). */
  selectedZone?: string | null;
  /** Click a zone rectangle to select that map. */
  onSelectZone?: (name: string) => void;
  /** Node spots to pin (a material's matches, or every node in the picked map). */
  nodes?: GatherNode[];
  /** Icon for the selected material; falls back to per-category icons. */
  materialIcon?: string;
  /** category ("ore" | "wood" | "plant") -> icon url, for mixed-node map views. */
  categoryIcons?: Record<string, string>;
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
        const isPicked = z.name === selectedZone;
        const matches = selected ? overlaps(z.levels, selected) : false;
        // No filled background — only the outline carries state. Picked map gets
        // a bright border; material matches get an emerald outline; the rest a
        // faint hairline that dims further while something is selected.
        const dimmed = (selected || selectedZone) && !isPicked && !matches;
        const style = {
          color: isPicked ? "#34d399" : matches ? "#34d399" : "#ffffff",
          weight: isPicked ? 3 : matches ? 1.75 : 1,
          opacity: isPicked ? 1 : matches ? 0.7 : dimmed ? 0.1 : 0.32,
          fill: true, // keep a transparent fill so the whole rect is clickable
          fillColor: "#ffffff",
          fillOpacity: 0,
        };
        return (
          <Rectangle
            key={`${z.id}-${isPicked}-${matches}`}
            bounds={latLngBounds(unproject(z.rect[0]), unproject(z.rect[1]))}
            pathOptions={style}
            eventHandlers={onSelectZone ? { click: () => onSelectZone(z.name) } : undefined}
          >
            <Tooltip direction="center" sticky>
              <span className="font-semibold">{z.name}</span>
              <br />
              <span className="opacity-70">
                Level {z.levels[0]}–{z.levels[1]}
              </span>
            </Tooltip>
          </Rectangle>
        );
      })}

      {/* Node spots, drawn as icon images on top of the zones. */}
      {nodes.map((n, i) => {
        const url = materialIcon ?? categoryIcons[n.cat];
        if (!url) return null;
        return (
          <Marker
            key={`node-${i}`}
            position={unproject(n.coord)}
            icon={nodeMarkerIcon(url, n.rich)}
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
        );
      })}
    </MapContainer>
  );
}
