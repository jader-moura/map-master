"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { CRS, DomEvent, Icon as LeafletIcon, type LatLng } from "leaflet";
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from "react-leaflet";
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
            Tyria, full map
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

// While searching we drop the zoom gate + viewport cull so you can locate things
// anywhere, but cap the rendered count to keep the DOM bounded on broad queries.
const SEARCH_CAP = 500;

// Declutter grid: collapse markers of the same kind that land within this many
// screen pixels of each other into a single representative. Because we project at
// the *current* zoom, the same world cell covers fewer real markers as you zoom
// in — so points fan out gradually instead of appearing all at once.
const DECLUTTER_PX = 52;
// Only thin at very low zoom; once zoomed in past this the viewport is small
// enough that culling alone keeps it light, so we show every marker.
const DECLUTTER_MAX_ZOOM = 3;

// Renders only the markers that should be visible *right now*: gated by zoom per
// kind and culled to the current viewport. Lives inside MapContainer so it can
// react to pan/zoom via the live map instance — this is what keeps the map fast
// even though the full dataset is thousands of points.
function PoiMarkers({
  data,
  visible,
  query,
  icons,
}: {
  data: PoiData;
  visible: Record<PoiKind, boolean>;
  query: string;
  icons: Record<PoiKind, LeafletIcon>;
}) {
  const map = useMap();
  // Force a re-render on every relevant map event. We read zoom/bounds *fresh* at
  // render time, so a plain version counter is enough — and unlike storing the
  // zoom value, it re-renders even when the zoom number is unchanged (e.g. a pan,
  // or the very first layout pass once the container has a real size).
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useMapEvents({
    zoomend: bump,
    moveend: bump, // pan → refresh the viewport cull
    resize: bump, // container got its real size
  });
  // On mount the map may not be measured yet (it's a dynamic, client-only import),
  // so getBounds() can be empty and cull everything. Re-render once it's ready.
  useEffect(() => {
    map.whenReady(() => bump());
  }, [map]);

  const zoom = map.getZoom();

  // Precompute leaflet positions once per dataset (unproject is a pure fn).
  const prepared = useMemo(
    () =>
      Object.fromEntries(
        POI_KINDS.map((kind) => [
          kind,
          data[kind].map((m) => ({ m, pos: unproject(m.coord) as LatLng })),
        ]),
      ) as Record<PoiKind, { m: PoiData[PoiKind][number]; pos: LatLng }[]>,
    [data],
  );

  const q = query.trim().toLowerCase();
  const bounds = map.getBounds().pad(0.25); // small margin so edges don't pop
  const declutter = !q && zoom <= DECLUTTER_MAX_ZOOM;

  const out: ReactNode[] = [];
  let searchCount = 0;
  for (const kind of POI_KINDS) {
    if (!visible[kind]) continue;
    if (!q && zoom < POI_META[kind].minZoom) continue;
    const label = POI_META[kind].label.replace(/s$/, "");
    const list = prepared[kind];
    // One declutter grid per kind so layers thin independently of each other.
    const occupied = declutter ? new Set<string>() : null;
    for (let i = 0; i < list.length; i++) {
      const { m, pos } = list[i];
      if (q) {
        if (!m.name.toLowerCase().includes(q)) continue;
        if (searchCount >= SEARCH_CAP) break;
        searchCount++;
      } else {
        if (!bounds.contains(pos)) continue;
        if (occupied) {
          // Project to pixel space at the current zoom, keep one marker per cell.
          const p = map.project(pos, zoom);
          const cell = `${Math.floor(p.x / DECLUTTER_PX)}:${Math.floor(p.y / DECLUTTER_PX)}`;
          if (occupied.has(cell)) continue;
          occupied.add(cell);
        }
      }
      out.push(
        <Marker key={`${kind}-${i}`} position={pos} icon={icons[kind]}>
          <Tooltip direction="top">
            <span className="font-semibold">{m.name}</span>
            <br />
            <span className="opacity-60">{label}</span>
          </Tooltip>
        </Marker>,
      );
    }
  }
  return <>{out}</>;
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
      <PoiMarkers data={data} visible={visible} query={query} icons={icons} />
      <RegionJump />
    </MapContainer>
  );
}
