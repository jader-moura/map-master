"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CRS, DomEvent, Icon as LeafletIcon } from "leaflet";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { unproject, TILE_URL, TYRIA_BOUNDS, MAX_ZOOM } from "@/lib/gw2/mapTiles";
import { POI_META, POI_KINDS, type PoiData, type PoiKind } from "@/lib/gw2/pois";
import { REGION_GROUPS } from "@/lib/gw2/regions";
import { Icon, P } from "@/components/icons";

const CENTER = unproject([49404, 31170]); // ~ Lion's Arch, central Tyria

// In-game-style region navigator, bottom-right. Flies the map to a region's
// centre. Rendered inside MapContainer so it can use the live map instance.
function RegionJump() {
  const map = useMap();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Keep clicks/scrolls inside the panel from panning/zooming the map.
  useEffect(() => {
    if (!ref.current) return;
    DomEvent.disableClickPropagation(ref.current);
    DomEvent.disableScrollPropagation(ref.current);
  }, []);

  const jump = (coord: [number, number], zoom = 5) => {
    map.flyTo(unproject(coord), zoom, { duration: 0.8 });
    setOpen(false);
  };

  return (
    <div ref={ref} className="absolute bottom-3 right-3 z-[1000] flex flex-col items-end">
      {open && (
        <div className="scroll-themed mb-2 max-h-[60vh] w-56 overflow-y-auto rounded-lg border border-white/10 bg-[#0d0d14]/95 p-1.5 shadow-2xl backdrop-blur">
          <button
            onClick={() => {
              map.flyToBounds(TYRIA_BOUNDS, { duration: 0.8 });
              setOpen(false);
            }}
            className="mb-1 block w-full rounded px-2.5 py-1.5 text-left text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Tyria — full map
          </button>
          {REGION_GROUPS.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="px-2.5 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                {group.label}
              </div>
              {group.regions.map((r) => (
                <button
                  key={r.name}
                  onClick={() => jump(r.coord, r.zoom)}
                  className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {r.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Jump to region"
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d0d14]/95 px-3 py-2 text-sm font-medium text-white shadow-2xl backdrop-blur transition hover:bg-white/10"
      >
        <Icon path={P.map} className="h-4 w-4 text-orange-400" />
        Regions
        <Icon path={P.chevron} className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

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
      <RegionJump />
    </MapContainer>
  );
}
