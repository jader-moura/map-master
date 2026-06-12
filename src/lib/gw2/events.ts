// Map meta events (Heart of Thorns, Path of Fire, Living World, End of Dragons,
// SotO, Janthir, Visions of Eternity, …).
//
// Schedule data comes from the official GW2 wiki "Widget:Event timer/data.json"
// (the same source as the in-game /wiki et timer), fetched + cached by
// /api/events. Each event is a daily timeline of phases ("segments"). We surface
// each map's *main* event(s) (MAIN_SEGMENTS) and treat it like a boss spawn:
// "Active now" while it runs, otherwise a countdown to its next start.

export type MetaSegment = {
  name: string;
  link?: string;
  chatlink?: string;
  bg?: number[] | number[][] | string;
};

export type MetaEvent = {
  id: string;
  category: string;
  name: string;
  link?: string;
  segments: Record<string, MetaSegment>;
  sequences: {
    partial: { r: number; d: number }[];
    pattern: { r: number; d: number }[];
  };
};

export type MetaStatus = {
  id: string;
  /** The main event's name (current one if active, else the next one). */
  eventName: string;
  /** Map/zone name. */
  map: string;
  category: string;
  coord: [number, number];
  active: boolean;
  /** Active: ms left in the event. Otherwise: ms until it next starts. */
  msUntil: number;
  /** Active: end time. Otherwise: next start time. */
  at: Date;
  /** Waypoint chat code for the relevant main event, if any. */
  waypoint?: string;
};

// id -> in-game location (all on continent 1). coord = continent coordinates.
export const EVENT_LOCATIONS: Record<string, { map: string; coord: [number, number] }> = {
  "lws2-dt": { map: "Dry Top", coord: [37632, 32256] },
  "hot-vb": { map: "Verdant Brink", coord: [35008, 31744] },
  "hot-ab": { map: "Auric Basin", coord: [34304, 33920] },
  "hot-td": { map: "Tangled Depths", coord: [36992, 34944] },
  "hot-ds": { map: "Dragon's Stand", coord: [35584, 37440] },
  "lws3-ld": { map: "Lake Doric", coord: [45568, 26752] },
  "pof-co": { map: "Crystal Oasis", coord: [59816, 43584] },
  "pof-dh": { map: "Desert Highlands", coord: [59816, 41024] },
  "pof-er": { map: "Elon Riverlands", coord: [60032, 46464] },
  "pof-td": { map: "The Desolation", coord: [60032, 50752] },
  "pof-dv": { map: "Domain of Vabbi", coord: [66048, 53952] },
  "lws4-di": { map: "Domain of Istan", coord: [57238, 61836] },
  "lws4-jb": { map: "Jahai Bluffs", coord: [65364, 57976] },
  "lws4-tp": { map: "Thunderhead Peaks", coord: [57484, 36792] },
  "lws5-gv": { map: "Grothmar Valley", coord: [60992, 18784] },
  "lws5-bm": { map: "Bjora Marches", coord: [57151, 18060] },
  "eod-sp": { map: "Seitung Province", coord: [23079, 101801] },
  "eod-nkc": { map: "New Kaineng City", coord: [26920, 99380] },
  "eod-ew": { map: "The Echovald Wilds", coord: [31105, 102170] },
  "eod-de": { map: "Dragon's End", coord: [34214, 103694] },
  "soto-sa": { map: "Skywatch Archipelago", coord: [25446, 23738] },
  "soto-wt": { map: "Wizard's Tower", coord: [22600, 21800] },
  "soto-am": { map: "Amnytas", coord: [24086, 20410] },
  "jw-js": { map: "Janthir Syntri", coord: [39894, 15618] },
  "jw-bn": { map: "Bava Nisos", coord: [37000, 11624] },
  "voe-ss": { map: "Shipwreck Strand", coord: [10810, 58985] },
  "voe-sw": { map: "Starlit Weald", coord: [7930, 58665] },
  "voe-eg": { map: "Eternity's Garden", coord: [4410, 61545] },
  "public-eotn": { map: "Eye of the North", coord: [57984, 21888] },
};

// Which segment(s) are the "main" event(s) of each map — the boss/meta fight,
// not prep/downtime. Maps that rotate several distinct metas list them all.
const MAIN_SEGMENTS: Record<string, number[]> = {
  "lws2-dt": [2], // Sandstorm
  "hot-vb": [3], // Night Bosses
  "hot-ab": [3], // Octovine
  "hot-td": [3], // Chak Gerent
  "hot-ds": [1], // Advance on the Blighting Towers
  "lws3-ld": [1, 2, 3],
  "pof-co": [1], // Casino Blitz
  "pof-dh": [1], // Buried Treasure
  "pof-er": [2], // Doppelganger
  "pof-td": [1], // Maws of Torment
  "pof-dv": [1], // Serpents' Ire
  "lws4-di": [1], // Palawadan
  "lws4-jb": [2], // Death-Branded Shatterer
  "lws4-tp": [1], // Thunderhead Keep
  "lws5-gv": [1, 2, 3, 4],
  "lws5-bm": [1, 2, 3, 4],
  "eod-sp": [1], // Aetherblade Assault
  "eod-nkc": [1], // Kaineng Blackout
  "eod-ew": [1, 2], // Gang War / Aspenwood
  "eod-de": [3], // The Battle for the Jade Sea
  "soto-sa": [1], // Unlocking the Wizard's Tower
  "soto-wt": [1, 2, 3],
  "soto-am": [1], // Defense of Amnytas
  "jw-js": [1],
  "jw-bn": [1],
  "voe-ss": [1],
  "voe-sw": [1],
  "voe-eg": [1],
  "public-eotn": [1, 2, 3, 4],
};

const DAY_MIN = 1440;

type Interval = { r: number; start: number; end: number };

function dayIntervals(seq: MetaEvent["sequences"]): Interval[] {
  const out: Interval[] = [];
  let t = 0;
  for (const e of seq.partial) {
    out.push({ r: e.r, start: t, end: t + e.d });
    t += e.d;
  }
  if (seq.pattern.length === 0) return out;
  let i = 0;
  let guard = 0;
  while (t < DAY_MIN && guard++ < 10000) {
    const e = seq.pattern[i % seq.pattern.length];
    out.push({ r: e.r, start: t, end: t + e.d });
    t += e.d;
    i++;
  }
  return out;
}

function segName(event: MetaEvent, r: number): string | null {
  const s = event.segments[String(r)];
  return s && s.name ? s.name : null;
}

function segChatlink(event: MetaEvent, r: number): string | undefined {
  return event.segments[String(r)]?.chatlink;
}

function nowMinutes(now: Date): number {
  return now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
}

/** Status of a meta event's main phase: active, or counting down to next start. */
export function getMetaStatus(event: MetaEvent, now: Date): MetaStatus | null {
  const loc = EVENT_LOCATIONS[event.id];
  if (!loc) return null;
  const main = new Set(MAIN_SEGMENTS[event.id] ?? []);
  const intervals = dayIntervals(event.sequences);
  const nm = nowMinutes(now);
  const base = {
    id: event.id,
    map: loc.map,
    category: event.category,
    coord: loc.coord,
  };

  const current = intervals.find((x) => nm >= x.start && nm < x.end);
  if (current && main.has(current.r)) {
    const msUntil = (current.end - nm) * 60_000;
    return {
      ...base,
      eventName: segName(event, current.r) ?? event.name,
      active: true,
      msUntil: Math.max(0, msUntil),
      at: new Date(now.getTime() + msUntil),
      waypoint: segChatlink(event, current.r),
    };
  }

  // Next main-segment start (today's remainder, then tomorrow).
  let next: { start: number; r: number } | undefined;
  for (const off of [0, DAY_MIN]) {
    for (const x of intervals) {
      if (!main.has(x.r)) continue;
      const start = x.start + off;
      if (start > nm) {
        next = { start, r: x.r };
        break;
      }
    }
    if (next) break;
  }
  const msUntil = next ? (next.start - nm) * 60_000 : 0;
  return {
    ...base,
    eventName: next ? segName(event, next.r) ?? event.name : event.name,
    active: false,
    msUntil: Math.max(0, msUntil),
    at: new Date(now.getTime() + msUntil),
    waypoint: next ? segChatlink(event, next.r) : undefined,
  };
}

export function getAllMetaStatuses(events: MetaEvent[], now: Date): MetaStatus[] {
  return events
    .map((e) => getMetaStatus(e, now))
    .filter((s): s is MetaStatus => s !== null);
}

export type WindowSegment = {
  name: string | null;
  color: string;
  startMs: number;
  endMs: number;
};

function rgb(c: number[]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function segColor(event: MetaEvent, r: number): string {
  const bg = event.segments[String(r)]?.bg;
  if (!bg || bg === "transparent") return "rgba(255,255,255,0.04)";
  if (Array.isArray(bg)) {
    // number[][] = gradient (use first stop); number[] = single colour.
    if (Array.isArray(bg[0])) return rgb(bg[0] as number[]);
    return rgb(bg as number[]);
  }
  return "rgba(255,255,255,0.04)";
}

/** All phase segments of an event overlapping [startMs, endMs], as absolute times. */
export function getWindowSegments(
  event: MetaEvent,
  startMs: number,
  endMs: number,
): WindowSegment[] {
  const intervals = dayIntervals(event.sequences);
  const dayMs = 86_400_000;
  const d = new Date(startMs);
  const firstDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const out: WindowSegment[] = [];
  for (let day = firstDay - dayMs; day <= endMs; day += dayMs) {
    for (const iv of intervals) {
      const s = day + iv.start * 60_000;
      const e = day + iv.end * 60_000;
      if (e <= startMs || s >= endMs) continue;
      out.push({ name: segName(event, iv.r), color: segColor(event, iv.r), startMs: s, endMs: e });
    }
  }
  return out;
}

function fmtUtc(minutes: number): string {
  const total = ((Math.round(minutes) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Static daily schedule of a meta's main event(s) as UTC times, independent of
 * "now" (so it can be server-rendered for SEO). Deduplicated and sorted.
 */
export function getMainEventTimes(event: MetaEvent): { name: string; time: string }[] {
  const main = new Set(MAIN_SEGMENTS[event.id] ?? []);
  const intervals = dayIntervals(event.sequences);
  const seen = new Set<string>();
  const out: { name: string; time: string }[] = [];
  for (const x of intervals) {
    if (!main.has(x.r)) continue;
    const time = fmtUtc(x.start);
    const name = segName(event, x.r) ?? event.name;
    const key = `${name}@${time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, time });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** Distinct main-event names for a meta (some maps rotate several metas). */
export function getMainEventNames(event: MetaEvent): string[] {
  const main = MAIN_SEGMENTS[event.id] ?? [];
  const names = main.map((r) => segName(event, r)).filter((n): n is string => Boolean(n));
  return [...new Set(names)];
}

/** Waypoint chat code of the meta's first main segment, if any. */
export function getMainWaypoint(event: MetaEvent): string | undefined {
  const main = MAIN_SEGMENTS[event.id] ?? [];
  for (const r of main) {
    const wp = segChatlink(event, r);
    if (wp) return wp;
  }
  return undefined;
}

/** Upcoming main-event start times for a meta event (for the info panel). */
export function getUpcomingMainEvents(
  event: MetaEvent,
  now: Date,
  count = 6,
): { name: string; at: Date }[] {
  const main = new Set(MAIN_SEGMENTS[event.id] ?? []);
  const intervals = dayIntervals(event.sequences);
  const nm = nowMinutes(now);
  const dayBase = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const res: { name: string; at: Date }[] = [];
  for (const off of [0, DAY_MIN]) {
    for (const x of intervals) {
      if (!main.has(x.r)) continue;
      const start = x.start + off;
      if (start <= nm) continue;
      res.push({ name: segName(event, x.r) ?? event.name, at: new Date(dayBase + start * 60_000) });
      if (res.length >= count) return res;
    }
  }
  return res;
}
