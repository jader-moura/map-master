"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, P } from "@/components/icons";
import { itemSlug } from "@/lib/gw2/items";
import { usePersistentState } from "@/lib/usePersistentState";
import {
  matchBoss,
  getBossStatuses,
  formatCountdown,
  BOSS_WAYPOINTS,
  BOSS_LEVELS,
} from "@/lib/gw2/bosses";
import CopyWaypoint from "@/components/CopyWaypoint";
import VendorMapView from "@/components/VendorMapView";
import { resolveEventMaps } from "@/lib/gw2/achievementMaps";
import type { RewardAchievement } from "@/lib/gw2/itemsDb";

// Official in-game waypoint map icon, used as a visual badge when an achievement
// resolves to a travel point (these achievements have no icon of their own).
const WAYPOINT_ICON = "https://render.guildwars2.com/file/32633AF8ADEA696A1EF56D3AE32D617B10D3AC57/157353.png";

// An achievement that rewards the item. Collapsed it shows a badge + name +
// requirement + a location hint, plus a copy-waypoint button. Expanded it shows
// the map and links; for world-boss kills it also shows a big boss image, the
// boss's level/type/location, a live next-spawn countdown and its schedule.
export default function AchievementRewardCard({ achievement: a }: { achievement: RewardAchievement }) {
  const [open, setOpen] = useState(false);
  const req = a.requirement?.replace(/\s{2,}/g, " ").trim();
  const toggle = () => setOpen((v) => !v);

  const boss = matchBoss(`${a.name} ${a.requirement ?? ""}`);
  // Prefer the boss's canonical location + waypoint over the parsed one.
  const loc = boss
    ? {
        kind: "area" as const,
        name: boss.area,
        zone: boss.zone,
        waypoint: null,
        chat: BOSS_WAYPOINTS[boss.id] ?? null,
        coord: boss.coord,
      }
    : a.location;

  const href = `/gw2/achievement/${itemSlug(a.id, a.name)}`;

  // Event achievements that span a region / several maps have no single
  // waypoint, so resolve the maps named in the requirement to per-map waypoints.
  const isEventAch = !boss && /\bevents?\b/i.test(`${a.name} ${a.requirement ?? ""}`);
  const eventMaps =
    isEventAch && !loc?.chat ? resolveEventMaps(`${a.name} ${a.requirement ?? ""}`) : [];

  // Show the precise location if we have one, otherwise plot the event maps.
  const mapLocs = loc?.coord
    ? [{ area: loc.name, zone: loc.zone, coord: loc.coord }]
    : eventMaps.map((m) => ({ area: m.map, zone: null, coord: m.coord }));

  // Boss favourites share the same store as the world boss timer, so starring a
  // boss here makes it show up (and alert) there too.
  const [favList, setFavList] = usePersistentState<string[]>("buildop:favorites", []);
  const isFav = boss ? favList.includes(boss.id) : false;
  const toggleFav = () => {
    if (!boss) return;
    setFavList((list) => (list.includes(boss.id) ? list.filter((x) => x !== boss.id) : [...list, boss.id]));
  };

  // Event-completion achievements: how many events are needed lives in the
  // achievement's tiers (the API blanks the count out of the requirement text),
  // so fetch it lazily from the GW2 API the first time the card is expanded.
  const [eventCount, setEventCount] = useState<number | null>(null);
  useEffect(() => {
    if (!open || !isEventAch || eventCount !== null) return;
    let cancelled = false;
    fetch(`https://api.guildwars2.com/v2/achievements/${a.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { tiers?: { count: number }[] } | null) => {
        if (!cancelled && d?.tiers?.length) {
          setEventCount(Math.max(...d.tiers.map((t) => t.count)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, isEventAch, a.id, eventCount]);

  // Live clock for the boss spawn countdown — only ticks while expanded.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!open || !boss) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open, boss]);
  const status = boss && now ? getBossStatuses(now).find((s) => s.boss.id === boss.id) : null;

  const badge = boss ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={boss.image} alt="" width={36} height={36} className="mt-0.5 h-9 w-9 shrink-0 rounded object-cover" />
  ) : a.icon ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.icon} alt="" width={36} height={36} className="mt-0.5 h-9 w-9 shrink-0 rounded" />
  ) : (
    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded bg-white/5 text-white/40">
      {loc?.chat ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={WAYPOINT_ICON} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
      ) : (
        <Icon path={loc ? P.pin : P.star} className="h-5 w-5" />
      )}
    </span>
  );

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] transition hover:border-white/20">
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left"
        >
          {badge}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white/85">{a.name}</p>
            {req && <p className="mt-0.5 text-xs leading-relaxed text-white/45">{req}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {loc && (
                <span className="inline-flex items-center gap-1 text-xs text-white/40">
                  <Icon path={P.pin} className="h-3 w-3" />
                  {[loc.name, loc.zone].filter(Boolean).join(", ")}
                </span>
              )}
              {isEventAch && eventCount != null && (
                <span className="inline-flex items-center gap-1 text-xs text-white/40">
                  <Icon path={P.check} className="h-3 w-3" />
                  {eventCount} events
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 pr-2">
          {boss && (
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={isFav}
              title={isFav ? "Remove from favorites" : "Add boss to favorites"}
              aria-label={isFav ? "Remove boss from favorites" : "Add boss to favorites"}
              className={[
                "grid h-8 w-7 place-items-center transition",
                isFav ? "text-amber-400" : "text-white/30 hover:text-white/70",
              ].join(" ")}
            >
              <Icon path={P.star} className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
          {loc?.chat && <CopyWaypoint code={loc.chat} compact />}
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? "Collapse" : "Expand"}
            className="grid h-8 w-7 place-items-center text-white/40 transition hover:text-white"
          >
            <Icon path={P.chevron} className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 p-3">
          {isEventAch && eventCount != null && (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-white/75">
              <Icon path={P.check} className="h-4 w-4 text-orange-300" />
              Complete <span className="font-semibold text-white">{eventCount}</span> events to earn this
            </p>
          )}
          {boss && (
            <div className="mb-3 flex flex-col overflow-hidden rounded-xl border border-white/10 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={boss.image}
                alt={boss.name}
                className="h-44 w-full object-cover sm:h-auto sm:w-1/2 sm:self-stretch"
              />
              <div className="bg-white/[0.03] p-3 sm:w-1/2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
                  <span className="font-semibold text-white/85">{boss.name}</span>
                  <span className="text-white/30">·</span>
                  <span>Level {BOSS_LEVELS[boss.id] ?? "?"}</span>
                  <span className="text-white/30">·</span>
                  <span>{boss.hardcore ? "Hardcore meta" : "World boss"}</span>
                  <span className="text-white/30">·</span>
                  <span>{boss.area}, {boss.zone}</span>
                </div>
                {status && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
                    <Icon path={P.clock} className="h-4 w-4 text-orange-300" />
                    {status.active ? (
                      <span className="font-semibold text-green-400">
                        Active now · {formatCountdown(status.msActiveLeft)} left
                      </span>
                    ) : (
                      <span className="text-white/80">
                        Next spawn in <span className="font-semibold text-orange-300">{formatCountdown(status.msUntilSpawn)}</span>
                        <span className="text-white/45">
                          {" "}({status.spawn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </span>
                      </span>
                    )}
                  </p>
                )}
                <p className="mt-2 text-xs text-white/40">
                  <span className="text-white/50">Daily spawns (UTC):</span> {boss.times.join(", ")}
                </p>
              </div>
            </div>
          )}

          {mapLocs.length > 0 ? (
            <VendorMapView locations={mapLocs} areas={eventMaps.map((m) => m.rect)} />
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/40">
              No precise map location for this achievement.
            </p>
          )}

          {eventMaps.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs uppercase tracking-wide text-white/35">
                Waypoints to event maps
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {eventMaps.map((m) => (
                  <div
                    key={m.map}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5"
                  >
                    <span className="min-w-0 truncate text-xs text-white/70" title={m.name}>
                      {m.map}
                    </span>
                    <CopyWaypoint code={m.chat} compact />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {loc?.chat && (
              <CopyWaypoint code={loc.chat} label={loc.waypoint ? `Copy ${loc.waypoint}` : "Copy waypoint"} />
            )}
            {boss && (
              <button
                type="button"
                onClick={toggleFav}
                aria-pressed={isFav}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                  isFav
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                    : "border-white/15 bg-white/5 text-white/75 hover:border-amber-400/40 hover:text-white",
                ].join(" ")}
              >
                <Icon path={P.star} className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
                {isFav ? "Favorited" : "Favorite boss"}
              </button>
            )}
            {boss && (
              <Link
                href={`/gw2-world-boss-timer?boss=${boss.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/30 bg-orange-400/10 px-2.5 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-400/20"
              >
                <Icon path={P.swords} className="h-3.5 w-3.5" />
                View {boss.name} on boss timer
              </Link>
            )}
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/75 transition hover:border-orange-400/40 hover:text-white"
            >
              View achievement
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
