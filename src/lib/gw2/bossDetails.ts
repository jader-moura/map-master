// Curated, per-boss enrichment for the /gw2/boss/[slug] pages.
//
// `drops` are item NAMES resolved against our item DB at render time (unknown
// names are silently skipped), so each links to its item page with a live
// Trading Post price. `achievements` are achievement IDs hand-picked from the DB
// (excluding same-named but unrelated bosses, e.g. the Death-Branded Shatterer).
// `howToStart` / `tips` are short curated blurbs from the GW2 wiki.

export type BossDetail = {
  drops: string[];
  achievements: number[];
  howToStart?: string;
  tips?: string;
};

const DRAGONITE = "Dragonite Ore";

export const BOSS_DETAILS: Record<string, BossDetail> = {
  taidha: {
    drops: ["Assassinate Taidha Covington", DRAGONITE],
    achievements: [],
    howToStart:
      "A short pre-event chain to assault the pirate fleet leads into the fight with Admiral Taidha Covington on Laughing Gull Island in Bloodtide Coast.",
    tips: "Spread out to avoid her cannon barrages and burst her down when the break bar appears.",
  },
  svanir: {
    drops: ["Ancient Svanir Relic", "Mini Svanir", DRAGONITE],
    achievements: [],
    howToStart:
      "Clear the pre-events around Hunter's Lake in Wayfarer Foothills, then the Svanir Shaman Chief freezes the lake and can be engaged.",
    tips: "A quick open-tag event, good for low-level characters.",
  },
  megadestroyer: {
    drops: ["Heart of the Megadestroyer", DRAGONITE],
    achievements: [1935],
    howToStart:
      "Pre-events heat up Maelstrom's Bile in Mount Maelstrom until the Megadestroyer erupts from the lava.",
    tips: "Stack on the boss and watch for the lava-field attacks.",
  },
  "fire-elemental": {
    drops: ["Heart of a Fire Elemental", "Fire Elemental Powder", DRAGONITE],
    achievements: [1930, 6732],
    howToStart:
      "Complete the Inquest experiment pre-event at the Thaumanova Reactor in Metrica Province to spawn the Greater Fire Elemental.",
    tips: "An easy starter boss, fully soloable on a populated map.",
  },
  shatterer: {
    drops: ["The Shatterer's Crystal", "Bottle of Shatterer Energy", DRAGONITE],
    achievements: [1983, 6714, 2802],
    howToStart:
      "Defend the Lowland Burns in Blazeridge Steppes through the pre-events, then the Branded dragon champion The Shatterer lands.",
    tips: "Ranged damage helps during the fly phases; break the bar to skip its hardest attacks.",
  },
  "jungle-wurm": {
    drops: ["Mini Amber Great Jungle Wurm", "Mini Crimson Great Jungle Wurm", DRAGONITE],
    achievements: [1933, 6740],
    howToStart:
      "The Great Jungle Wurm surfaces in Wychmire Swamp, Caledon Forest with no real prep needed, just show up before the timer.",
    tips: "A fast, simple tag, not to be confused with the hardcore Triple Trouble version in Bloodtide Coast.",
  },
  modniir: {
    drops: ["Assassinate Modniir Ulgoth", "Modniir Battle Hymn", DRAGONITE],
    achievements: [],
    howToStart:
      "Push through the centaur pre-events in Modniir Gorge, Harathi Hinterlands to bring out the warband leader Modniir Ulgoth.",
    tips: "Clear the adds he summons so the squad can focus him down.",
  },
  "shadow-behemoth": {
    drops: [DRAGONITE],
    achievements: [2025, 6737],
    howToStart:
      "Destroy the three portals in the Greatheart Weald, Eldvin Monastery and Taminn Foothills around Godslost Swamp in Queensdale, then close the portals that spawn in the swamp to summon the Shadow Behemoth.",
    tips: "It goes invulnerable periodically, destroy the new portals fast to make it vulnerable again.",
  },
  "golem-mark-ii": {
    drops: ["Bottle of Inquest Golem Mark II Energy", DRAGONITE],
    achievements: [1934],
    howToStart:
      "Finish the Inquest pre-events at the Whitland Flats in Mount Maelstrom to activate the Inquest Golem Mark II.",
    tips: "Move out of the laser sweeps and break the bar when it overcharges.",
  },
  "claw-of-jormag": {
    drops: ["Claw of Jormag's Scale", "Dream of Jormag", DRAGONITE],
    achievements: [2026, 6739],
    howToStart:
      "Hold the line through the Frostwalk Tundra pre-events in Frostgorge Sound until the icebrood dragon champion Claw of Jormag arrives.",
    tips: "Break the ice phase quickly and clear the icebrood adds during the downed phases.",
  },
  tequatl: {
    drops: ["Mini Tequatl the Sunless", "Fang of Tequatl", "Bone Fragments of Tequatl", DRAGONITE],
    achievements: [910],
    howToStart:
      "Tequatl the Sunless rises on a fixed schedule at the Splintered Coast in Sparkfly Fen. Join a populated or organised map a few minutes early.",
    tips: "A hardcore meta: man the turrets, stack for the burn phases and handle the megalaser, a commander makes it much easier.",
  },
  "triple-trouble": {
    drops: ["Mini Cobalt Great Jungle Wurm Head", "Element of the Wurm", DRAGONITE],
    achievements: [1342],
    howToStart:
      "Three wurm heads (Cobalt, Amber and Crimson) emerge at the Firth of Revanion in Bloodtide Coast and must be defeated within seconds of each other.",
    tips: "One of the hardest world events: it needs three coordinated squads on comms, look for an organised map.",
  },
  "karka-queen": {
    drops: ["Ancient Karka Shell", "Karka Helm Skin", "Endless Karka Tonic", DRAGONITE],
    achievements: [617, 2202],
    howToStart:
      "Pre-events at Driftglass Springs in Southsun Cove draw out the Karka Queen, who burrows and spawns waves of young karka.",
    tips: "Ranged damage is safest; destroy the eggs she lays before they hatch.",
  },
};
