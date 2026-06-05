"use client";

import { useEffect } from "react";
import { CRS, point, latLngBounds, type LatLngExpression } from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CONTINENT_ID,
  FLOOR_ID,
  CONTINENT_DIMS,
  MAX_ZOOM,
  type BossStatus,
} from "@/lib/gw2/bosses";

// Convert GW2 continent coordinates to Leaflet lat/lng using the Tyria tiling.
function unproject(coord: [number, number]): LatLngExpression {
  return CRS.Simple.pointToLatLng(point(coord[0], coord[1]), MAX_ZOOM);
}

// NB: host is "tiles" (plural). The "tile" singular host 404s every tile.
const TILE_URL = `https://tiles.guildwars2.com/${CONTINENT_ID}/${FLOOR_ID}/{z}/{x}/{y}.jpg`;

// Imperatively re-centre the map whenever the selected boss changes.
function Recenter({ coord }: { coord: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(unproject(coord), Math.max(map.getZoom(), 4), { duration: 0.6 });
  }, [coord, map]);
  return null;
}

export default function Gw2Map({
  statuses,
  selectedId,
  onSelect,
}: {
  statuses: BossStatus[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected =
    statuses.find((s) => s.boss.id === selectedId) ?? statuses[0];

  return (
    <MapContainer
      crs={CRS.Simple}
      center={unproject(selected.boss.coord)}
      zoom={4}
      minZoom={2}
      maxZoom={MAX_ZOOM}
      className="h-[480px] w-full rounded-xl border border-white/10"
      // Tyria is square; constrain panning to the continent bounds.
      maxBounds={latLngBounds(unproject([0, 0]), unproject(CONTINENT_DIMS))}
    >
      <TileLayer url={TILE_URL} noWrap minZoom={1} maxZoom={MAX_ZOOM} />
      {statuses.map((s) => {
        const isSelected = s.boss.id === selected.boss.id;
        const color = s.active ? "#22c55e" : s.boss.hardcore ? "#a855f7" : "#f59e0b";
        return (
          <CircleMarker
            key={s.boss.id}
            center={unproject(s.boss.coord)}
            radius={isSelected ? 11 : 7}
            pathOptions={{
              color: isSelected ? "#ffffff" : color,
              weight: isSelected ? 3 : 1.5,
              fillColor: color,
              fillOpacity: s.active ? 0.9 : 0.65,
            }}
            eventHandlers={{ click: () => onSelect(s.boss.id) }}
          >
            <Tooltip direction="top">
              <span className="font-semibold">{s.boss.name}</span>
              <br />
              {s.boss.area}, {s.boss.zone}
            </Tooltip>
          </CircleMarker>
        );
      })}
      <Recenter coord={selected.boss.coord} />
    </MapContainer>
  );
}
