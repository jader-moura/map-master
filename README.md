# buildop

A **Guild Wars 2** companion app (buildop.app), built on the official
[GW2 API](https://wiki.guildwars2.com/wiki/API:Main). It pairs a **live world
boss timer** with an interactive Tyria map showing each boss's in-game location
plus waypoints, vistas, renown hearts, hero challenges and portals.

## Features

- ⏱️ **Live timers** — every world boss, sorted by "active now" then soonest
  spawn, ticking every second against the current UTC time.
- 🗺️ **Official GW2 map** — Leaflet map served from `tiles.guildwars2.com`,
  auto-centred on the selected boss. Markers are colour-coded (green = active,
  amber = standard, purple = hardcore).
- 🔌 **Cached API layer** — `/api/prices` proxies the Trading Post through
  Next.js fetch caching so the browser never hits the ~600 req/min rate limit.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **TanStack Query** (client-side data caching, wired up in `QueryProvider`)
- **Leaflet** + **react-leaflet** (map, loaded client-only via `next/dynamic`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the build
```

## How it works

| Path | Purpose |
| --- | --- |
| `src/lib/gw2/bosses.ts` | Boss schedule data (UTC times, zones, in-game coords) + the `getBossStatuses()` logic that computes active/upcoming spawns. |
| `src/lib/gw2/api.ts` | Cached wrapper around the GW2 API (`gw2Fetch`, `getPrices`, `getItems`). |
| `src/app/api/prices/route.ts` | Example cached proxy endpoint. |
| `src/components/BuildopApp.tsx` | Boss-timer view: ticking list + map state. |
| `src/components/Gw2Map.tsx` | Leaflet map using the Tyria continent tiling. |

The boss schedule was generated from the [GW2 Wiki](https://wiki.guildwars2.com/wiki/World_boss)
and the coordinates from `https://api.guildwars2.com/v2/maps`. To refresh it,
re-scrape the wiki table and the maps API.

## Roadmap ideas

- Trading Post tracker page (the `/api/prices` proxy + `getItems` are ready).
- Item / recipe database with crafting trees.
- Browser notifications a few minutes before a chosen boss spawns.
- Meta-event timers (Dragon's Stand, Drizzlewood, etc.) beyond core world bosses.

---

Fan project. Guild Wars 2 and all related assets are © ArenaNet, LLC.
