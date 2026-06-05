// Shared Leaflet helpers for the Guild Wars 2 Tyria tiling.
// Only import this from client-only (ssr:false) map components — it pulls in
// Leaflet, which touches `window`.

import { CRS, point, latLngBounds, type LatLngExpression } from "leaflet";
import { CONTINENT_ID, FLOOR_ID, CONTINENT_DIMS, MAX_ZOOM } from "@/lib/gw2/bosses";

/** Convert GW2 continent coordinates to a Leaflet lat/lng. */
export function unproject(coord: [number, number]): LatLngExpression {
  return CRS.Simple.pointToLatLng(point(coord[0], coord[1]), MAX_ZOOM);
}

// NB: host is "tiles" (plural). The "tile" singular host 404s every tile.
export const TILE_URL = `https://tiles.guildwars2.com/${CONTINENT_ID}/${FLOOR_ID}/{z}/{x}/{y}.jpg`;

export const TYRIA_BOUNDS = latLngBounds(unproject([0, 0]), unproject(CONTINENT_DIMS));

export { MAX_ZOOM };
