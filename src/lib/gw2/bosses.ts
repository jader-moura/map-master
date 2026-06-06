// World boss schedule for Guild Wars 2.
//
// Spawn times, zones and in-game coordinates were generated from the official
// GW2 wiki (https://wiki.guildwars2.com/wiki/World_boss) and cross-referenced
// with the GW2 Maps API (https://api.guildwars2.com/v2/maps) for the
// `coord` values (continent coordinates, used to place map markers).
//
// All `times` are UTC "HH:MM" and repeat every day.

export type Boss = {
  id: string;
  name: string;
  /** Map / zone the boss spawns in. */
  zone: string;
  /** Specific area within the zone. */
  area: string;
  /** Hardcore bosses are higher-difficulty meta events (Tequatl, etc.). */
  hardcore: boolean;
  /** Daily UTC spawn times, "HH:MM". */
  times: string[];
  /** How long the encounter stays "active" after spawn, in minutes. */
  durationMin: number;
  /** GW2 continent coordinates [x, y] for the map marker. */
  coord: [number, number];
  /** Representative image (GW2 wiki). */
  image: string;
};

// Tyria continent tiling, used by the Leaflet map (see Gw2Map.tsx).
export const CONTINENT_ID = 1;
export const FLOOR_ID = 1;
// Continent 1 (Tyria) is taller than it is wide — the extra height covers
// Cantha (End of Dragons) in the far south. Max served tile zoom is 7.
export const CONTINENT_DIMS: [number, number] = [81920, 114688];
export const MAX_ZOOM = 7;

export const BOSSES: Boss[] = [
  { id: "taidha", name: "Admiral Taidha Covington", zone: "Bloodtide Coast", area: "Laughing Gull Island", hardcore: false, durationMin: 15, coord: [49216, 33856],
    image: "https://wiki.guildwars2.com/images/8/8d/Admiral_Taidha_Covington.jpg",
    times: ["00:00","03:00","06:00","09:00","12:00","15:00","18:00","21:00"] },
  { id: "svanir", name: "Svanir Shaman Chief", zone: "Wayfarer Foothills", area: "Hunter's Lake", hardcore: false, durationMin: 15, coord: [55424, 29952],
    image: "https://wiki.guildwars2.com/images/thumb/5/54/Champion_Svanir_Shaman_Chief.jpg/360px-Champion_Svanir_Shaman_Chief.jpg",
    times: ["00:15","02:15","04:15","06:15","08:15","10:15","12:15","14:15","16:15","18:15","20:15","22:15"] },
  { id: "megadestroyer", name: "Megadestroyer", zone: "Mount Maelstrom", area: "Maelstrom's Bile", hardcore: false, durationMin: 15, coord: [52480, 38976],
    image: "https://wiki.guildwars2.com/images/thumb/d/dc/Destroyer_Emberknight.jpg/360px-Destroyer_Emberknight.jpg",
    times: ["00:30","03:30","06:30","09:30","12:30","15:30","18:30","21:30"] },
  { id: "fire-elemental", name: "Fire Elemental", zone: "Metrica Province", area: "Thaumanova Reactor", hardcore: false, durationMin: 15, coord: [41024, 35200],
    image: "https://wiki.guildwars2.com/images/thumb/8/89/Greater_Fire_Elemental.jpg/360px-Greater_Fire_Elemental.jpg",
    times: ["00:45","02:45","04:45","06:45","08:45","10:45","12:45","14:45","16:45","18:45","20:45","22:45"] },
  { id: "shatterer", name: "The Shatterer", zone: "Blazeridge Steppes", area: "Lowland Burns", hardcore: false, durationMin: 15, coord: [62976, 30592],
    image: "https://wiki.guildwars2.com/images/thumb/d/dd/The_Shatterer.jpg/360px-The_Shatterer.jpg",
    times: ["01:00","04:00","07:00","10:00","13:00","16:00","19:00","22:00"] },
  { id: "jungle-wurm", name: "Great Jungle Wurm", zone: "Caledon Forest", area: "Wychmire Swamp", hardcore: false, durationMin: 15, coord: [43072, 34496],
    image: "https://wiki.guildwars2.com/images/thumb/d/d6/Great_Jungle_Wurm.jpg/360px-Great_Jungle_Wurm.jpg",
    times: ["01:15","03:15","05:15","07:15","09:15","11:15","13:15","15:15","17:15","19:15","21:15","23:15"] },
  { id: "modniir", name: "Modniir Ulgoth", zone: "Harathi Hinterlands", area: "Modniir Gorge", hardcore: false, durationMin: 15, coord: [47808, 27264],
    image: "https://wiki.guildwars2.com/images/thumb/f/ff/Modniir_Sage.jpg/360px-Modniir_Sage.jpg",
    times: ["01:30","04:30","07:30","10:30","13:30","16:30","19:30","22:30"] },
  { id: "shadow-behemoth", name: "Shadow Behemoth", zone: "Queensdale", area: "Godslost Swamp", hardcore: false, durationMin: 15, coord: [44416, 29248],
    image: "https://wiki.guildwars2.com/images/thumb/d/da/Shadow_Behemoth.jpg/360px-Shadow_Behemoth.jpg",
    times: ["01:45","03:45","05:45","07:45","09:45","11:45","13:45","15:45","17:45","19:45","21:45","23:45"] },
  { id: "golem-mark-ii", name: "Golem Mark II", zone: "Mount Maelstrom", area: "Whitland Flats", hardcore: false, durationMin: 15, coord: [52480, 38976],
    image: "https://wiki.guildwars2.com/images/thumb/4/4f/Inquest_Golem_Mark_II.jpg/360px-Inquest_Golem_Mark_II.jpg",
    times: ["02:00","05:00","08:00","11:00","14:00","17:00","20:00","23:00"] },
  { id: "claw-of-jormag", name: "Claw of Jormag", zone: "Frostgorge Sound", area: "Frostwalk Tundra", hardcore: false, durationMin: 15, coord: [55040, 26112],
    image: "https://wiki.guildwars2.com/images/thumb/1/15/Claw_of_Jormag.jpg/360px-Claw_of_Jormag.jpg",
    times: ["02:30","05:30","08:30","11:30","14:30","17:30","20:30","23:30"] },
  { id: "tequatl", name: "Tequatl the Sunless", zone: "Sparkfly Fen", area: "Splintered Coast", hardcore: true, durationMin: 30, coord: [49280, 37120],
    image: "https://wiki.guildwars2.com/images/thumb/c/c2/Tequatl_the_Sunless_render.jpg/360px-Tequatl_the_Sunless_render.jpg",
    times: ["00:00","03:00","07:00","11:30","16:00","19:00"] },
  { id: "triple-trouble", name: "Evolved Jungle Wurm (Triple Trouble)", zone: "Bloodtide Coast", area: "Firth of Revanion", hardcore: true, durationMin: 20, coord: [49216, 33856],
    image: "https://wiki.guildwars2.com/images/thumb/d/d6/Great_Jungle_Wurm.jpg/360px-Great_Jungle_Wurm.jpg",
    times: ["01:00","04:00","08:00","12:30","17:00","20:00"] },
  { id: "karka-queen", name: "Karka Queen", zone: "Southsun Cove", area: "Driftglass Springs", hardcore: true, durationMin: 15, coord: [45632, 36224],
    image: "https://wiki.guildwars2.com/images/thumb/9/9e/Legendary_Karka_Queen.jpg/360px-Legendary_Karka_Queen.jpg",
    times: ["02:00","06:00","10:30","15:00","18:00","23:00"] },
];

// Nearest-waypoint chat codes (paste in-game chat to teleport). Type-4 map links
// from the GW2 wiki event-timer data.
export const BOSS_WAYPOINTS: Record<string, string> = {
  taidha: "[&BKgBAAA=]",
  svanir: "[&BMIDAAA=]",
  megadestroyer: "[&BM0CAAA=]",
  "fire-elemental": "[&BEcAAAA=]",
  shatterer: "[&BE4DAAA=]",
  "jungle-wurm": "[&BEEFAAA=]",
  modniir: "[&BLAAAAA=]",
  "shadow-behemoth": "[&BPcAAAA=]",
  "claw-of-jormag": "[&BHoCAAA=]",
  "golem-mark-ii": "[&BNQCAAA=]",
  tequatl: "[&BNABAAA=]",
  "triple-trouble": "[&BKoBAAA=]",
  "karka-queen": "[&BNUGAAA=]",
};

// Boss/creature levels (from the GW2 wiki infoboxes).
export const BOSS_LEVELS: Record<string, number> = {
  taidha: 50,
  svanir: 10,
  megadestroyer: 66,
  "fire-elemental": 15,
  shatterer: 50,
  "jungle-wurm": 22,
  modniir: 43,
  "shadow-behemoth": 15,
  "golem-mark-ii": 68,
  "claw-of-jormag": 80,
  tequatl: 65,
  "triple-trouble": 80,
  "karka-queen": 80,
};

export type BossStatus = {
  boss: Boss;
  /** Next (or current) spawn as a Date. */
  spawn: Date;
  /** True if the encounter is happening right now. */
  active: boolean;
  /** ms until spawn (0 if active). */
  msUntilSpawn: number;
  /** ms left in the active window (0 if not active). */
  msActiveLeft: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute every boss's current status relative to `now`, sorted so that
 * active bosses come first, then the soonest upcoming spawns.
 */
export function getBossStatuses(now: Date = new Date()): BossStatus[] {
  const statuses = BOSSES.map((boss) => computeStatus(boss, now));
  return statuses.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.active && b.active) return a.msActiveLeft - b.msActiveLeft;
    return a.msUntilSpawn - b.msUntilSpawn;
  });
}

function computeStatus(boss: Boss, now: Date): BossStatus {
  const nowMs = now.getTime();
  const durationMs = boss.durationMin * 60 * 1000;

  let bestSpawnMs = Infinity;
  let active = false;
  let activeSpawnMs = 0;

  for (const time of boss.times) {
    const [h, m] = time.split(":").map(Number);
    // Today's occurrence of this time, in UTC.
    const today = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      h,
      m,
      0,
      0,
    );
    // Check yesterday/today/tomorrow so we catch wrap-around at midnight.
    for (const spawnMs of [today - DAY_MS, today, today + DAY_MS]) {
      // Currently active?
      if (nowMs >= spawnMs && nowMs < spawnMs + durationMs) {
        active = true;
        activeSpawnMs = spawnMs;
      }
      // Soonest upcoming (or just-started) spawn.
      if (spawnMs + durationMs > nowMs && spawnMs < bestSpawnMs) {
        bestSpawnMs = spawnMs;
      }
    }
  }

  const spawnMs = active ? activeSpawnMs : bestSpawnMs;
  return {
    boss,
    spawn: new Date(spawnMs),
    active,
    msUntilSpawn: active ? 0 : Math.max(0, spawnMs - nowMs),
    msActiveLeft: active ? Math.max(0, activeSpawnMs + durationMs - nowMs) : 0,
  };
}

/** Format a millisecond duration as "1h 23m 45s" / "12m 30s" / "45s". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}
