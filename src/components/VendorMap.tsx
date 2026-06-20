"use client";

import { useEffect } from "react";
import { CRS, latLngBounds, divIcon } from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Marker, Rectangle, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";

export type VendorMapLocation = {
  /** Optional stable id, used to highlight or flag a marker as active. */
  id?: string;
  /** Optional short label drawn inside the marker (e.g. a route step number). */
  label?: string;
  /** Optional marker style: "fish" draws a fish symbol (e.g. a fishing spot). */
  kind?: "fish";
  /** Fishing-hole water category, carried so a click can resolve its fish. */
  holeType?: string;
  area: string;
  zone: string | null;
  coord: [number, number];
};

// A fish symbol as a Leaflet div-icon, for fishing spots on the water.
const FISH_PATH = "M3 12c3-5 9-5 12 0-3 5-9 5-12 0M15 12l6-4v8l-6-4M7 11h.01";
function fishIcon(isHi: boolean) {
  const size = isHi ? 34 : 26;
  const inner = isHi ? 22 : 16;
  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#0ea5e9;border:${isHi ? 3 : 2}px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.55)"><svg viewBox="0 0 24 24" width="${inner}" height="${inner}" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${FISH_PATH}"/></svg></div>`,
  });
}

// A round, numbered pin as a Leaflet div-icon. Colour follows the same scheme as
// the plain markers: green when active, amber otherwise, orange ring + larger
// when highlighted.
function numberedIcon(label: string, fill: string, isHi: boolean) {
  const size = isHi ? 30 : 24;
  const border = isHi ? "#fb923c" : "rgba(255,255,255,0.85)";
  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:${isHi ? 3 : 2}px solid ${border};color:#0a0a0f;font-weight:700;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.5)">${label}</div>`,
  });
}

// Centre on the single location, or fit all of them in view. Keyed on the
// coordinates themselves (not array identity) so re-rendering with the same
// places, e.g. to restyle a highlighted marker, never re-zooms the map. When
// `focus` bounds are supplied the map flies to them instead; clearing focus
// flies back to the full fit.
function FitToLocations({
  coords,
  focus,
}: {
  coords: [number, number][];
  focus?: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  const key = coords.map((c) => c.join(",")).join("|");
  const focusKey = focus ? focus.flat().join(",") : "";
  useEffect(() => {
    if (focus) {
      map.flyToBounds(latLngBounds(unproject(focus[0]), unproject(focus[1])), {
        padding: [24, 24],
        maxZoom: 6,
        duration: 0.6,
      });
    } else if (coords.length === 1) {
      map.setView(unproject(coords[0]), 5);
    } else if (coords.length > 1) {
      map.fitBounds(latLngBounds(coords.map(unproject)), { padding: [28, 28], maxZoom: 5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, focusKey, map]);
  return null;
}

export default function VendorMap({
  locations,
  highlightIds,
  activeIds,
  areas,
  focusBounds,
  onSelect,
}: {
  locations: VendorMapLocation[];
  /** Marker ids to emphasise (e.g. the expanded boss card). */
  highlightIds?: string[];
  /** Marker ids to colour green (e.g. a boss active right now). */
  activeIds?: string[];
  /** Map rectangles to shade [[x0,y0],[x1,y1]] (e.g. the maps an achievement covers). */
  areas?: [[number, number], [number, number]][];
  /** When set, fly to and zoom into these bounds; clearing returns to full fit. */
  focusBounds?: [[number, number], [number, number]] | null;
  /** Called when a marker is clicked, with its location. */
  onSelect?: (loc: VendorMapLocation) => void;
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
      {areas?.map((r, i) => (
        <Rectangle
          key={`area-${i}`}
          bounds={latLngBounds(unproject(r[0]), unproject(r[1]))}
          pathOptions={{ color: "#f59e0b", weight: 1.5, fillColor: "#f59e0b", fillOpacity: 0.12 }}
        />
      ))}
      {locations.map((l, i) => {
        const isActive = l.id ? ac.has(l.id) : false;
        const isHi = l.id ? hi.has(l.id) : false;
        const fill = isActive ? "#22c55e" : "#f59e0b";
        const key = l.id ?? `${l.area}-${i}`;
        const tip = (
          <Tooltip direction="top">
            <span className="font-semibold">{l.area}</span>
            {l.zone && (
              <>
                <br />
                {l.zone}
              </>
            )}
          </Tooltip>
        );

        const handlers = onSelect ? { click: () => onSelect(l) } : undefined;

        if (l.kind === "fish") {
          return (
            <Marker
              key={key}
              position={unproject(l.coord)}
              icon={fishIcon(isHi)}
              zIndexOffset={isHi ? 1000 : 500}
              eventHandlers={handlers}
            >
              {tip}
            </Marker>
          );
        }

        if (l.label) {
          return (
            <Marker
              key={key}
              position={unproject(l.coord)}
              icon={numberedIcon(l.label, fill, isHi)}
              zIndexOffset={isHi ? 1000 : 0}
              eventHandlers={handlers}
            >
              {tip}
            </Marker>
          );
        }

        return (
          <CircleMarker
            key={key}
            center={unproject(l.coord)}
            radius={isHi ? 11 : 8}
            pathOptions={{
              color: isHi ? "#fb923c" : "#ffffff",
              weight: isHi ? 3 : 2,
              fillColor: fill,
              fillOpacity: isHi ? 1 : 0.9,
            }}
            eventHandlers={handlers}
          >
            {tip}
          </CircleMarker>
        );
      })}
      <FitToLocations coords={[...coords, ...(areas?.flat() ?? [])]} focus={focusBounds} />
    </MapContainer>
  );
}
