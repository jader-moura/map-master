// Map meta events (Heart of Thorns, Path of Fire, Living World, End of Dragons,
// SotO, Janthir, Visions of Eternity, …).
//
// Schedule data comes from the official GW2 wiki "Widget:Event timer/data.json"
// (the same source as the in-game /wiki et timer), fetched + cached by
// /api/events. Each event is a daily timeline of phases ("segments"). In-game
// map locations are resolved from /v2/maps and baked into EVENT_LOCATIONS below.

export type MetaSegment = {
  name: string;
  link?: string;
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
  name: string;
  category: string;
  map: string;
  coord: [number, number];
  /** Current phase name, or null during downtime/gaps. */
  currentPhase: string | null;
  /** ms until the current phase ends / next phase change. */
  msUntilChange: number;
  /** Next upcoming named phase. */
  nextPhase: string;
  /** Absolute time of the next phase change. */
  nextChange: Date;
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

const DAY_MIN = 1440;

type Interval = { r: number; start: number; end: number };

/** Expand a day's timeline (minutes from 00:00 UTC) from partial + repeating pattern. */
function dayIntervals(seq: MetaEvent["sequences"]): Interval[] {
  const out: Interval[] = [];
  let t = 0;
  for (const e of seq.partial) {
    out.push({ r: e.r, start: t, end: t + e.d });
    t += e.d;
  }
  if (seq.pattern.length === 0) return out;
  let i = 0;
  // Guard against zero-length patterns causing an infinite loop.
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
  if (!s || !s.name) return null; // r:0 / unnamed = downtime
  return s.name;
}

/** Compute the current + next phase for a meta event at `now`. */
export function getMetaStatus(event: MetaEvent, now: Date): MetaStatus | null {
  const loc = EVENT_LOCATIONS[event.id];
  if (!loc) return null;

  const nowMin =
    now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  const intervals = dayIntervals(event.sequences);

  const current = intervals.find((x) => nowMin >= x.start && nowMin < x.end);
  const currentPhase = current ? segName(event, current.r) : null;

  // Next phase change (the boundary at/after `now`).
  const nextBoundaryMin = current ? current.end : DAY_MIN;
  // Find the next *named* phase to display as "up next".
  let nextNamed: Interval | undefined = intervals.find(
    (x) => x.start >= (current ? current.end : nowMin) && segName(event, x.r),
  );
  if (!nextNamed) nextNamed = intervals.find((x) => segName(event, x.r)); // wrap to next day

  const msPerMin = 60_000;
  const msUntilChange = (nextBoundaryMin - nowMin) * msPerMin;

  const nextChange = new Date(now.getTime() + msUntilChange);

  return {
    id: event.id,
    name: event.name,
    category: event.category,
    map: loc.map,
    coord: loc.coord,
    currentPhase,
    msUntilChange: Math.max(0, msUntilChange),
    nextPhase: nextNamed ? segName(event, nextNamed.r) ?? "—" : "—",
    nextChange,
  };
}

export function getAllMetaStatuses(events: MetaEvent[], now: Date): MetaStatus[] {
  return events
    .map((e) => getMetaStatus(e, now))
    .filter((s): s is MetaStatus => s !== null);
}

/** Upcoming named phase changes for a meta event, with absolute times. */
export function getUpcomingPhases(
  event: MetaEvent,
  now: Date,
  count = 6,
): { name: string; at: Date }[] {
  const intervals = dayIntervals(event.sequences);
  const nowMin =
    now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const res: { name: string; at: Date }[] = [];
  for (const dayOffset of [0, 1]) {
    for (const x of intervals) {
      const name = segName(event, x.r);
      if (!name) continue;
      const startMin = x.start + dayOffset * DAY_MIN;
      if (startMin <= nowMin) continue;
      res.push({ name, at: new Date(base + startMin * 60_000) });
      if (res.length >= count) return res;
    }
  }
  return res;
}
