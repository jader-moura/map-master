"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  getBossStatuses,
  formatCountdown,
  type BossStatus,
} from "@/lib/gw2/bosses";
import {
  getAllMetaStatuses,
  getUpcomingMainEvents,
  type MetaEvent,
  type MetaStatus,
} from "@/lib/gw2/events";
import { usePersistentState } from "@/lib/usePersistentState";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import {
  fireSpawnAlert,
  requestNotifyPermission,
  notifyPermission,
  playBeep,
} from "@/lib/gw2/notify";
import type { MapMarker } from "@/components/TimelineMap";
import { MAP_BOUNDS } from "@/lib/gw2/mapBounds";

const TimelineMap = dynamic(() => import("@/components/TimelineMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-white/40">Loading map…</div>
  ),
});

const EPOCH = new Date(0);
const ACTIVE_COLOR = "#22c55e"; // green — happening now
const META_COLOR = "#38bdf8"; // sky — upcoming meta

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

type NotifSettings = { enabled: boolean; lead: number; sound: boolean };

/* --------------------------- unified list item --------------------------- */

type Item = {
  id: string;
  name: string;
  kind: "boss" | "meta";
  map: string;
  coord: [number, number];
  color: string;
  active: boolean;
  sortMs: number;
  /** Active: ms remaining. Otherwise: ms until it starts. */
  mainMs: number;
  /** Local start time when not active (empty while active). */
  atLabel: string;
  boss?: BossStatus;
  meta?: MetaStatus;
};

function bossColor(s: BossStatus) {
  if (s.active) return ACTIVE_COLOR;
  return s.boss.hardcore ? "#a855f7" : "#f59e0b";
}

function Row({
  item,
  selected,
  favorite,
  ready,
  onSelect,
  onToggleFavorite,
}: {
  item: Item;
  selected: boolean;
  favorite: boolean;
  ready: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={[
        "group flex w-full items-center gap-2 rounded-md border px-2 py-2 transition",
        selected ? "border-orange-400/60 bg-orange-400/10" : "border-transparent hover:bg-white/5",
      ].join(" ")}
    >
      <button
        onClick={onToggleFavorite}
        aria-label={favorite ? "Unfavorite" : "Favorite"}
        className={favorite ? "text-amber-400" : "text-white/25 hover:text-white/60"}
      >
        <Icon path={P.star} className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
      </button>

      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span
          className={["h-2 w-2 shrink-0 rounded-full", item.active ? "animate-pulse" : ""].join(" ")}
          style={{ backgroundColor: ready ? item.color : "#475569" }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{item.name}</span>
          <span className="block truncate text-[11px] text-white/45">{item.map}</span>
        </span>
        <span className="shrink-0 text-right">
          {!ready ? (
            <span className="block font-mono text-xs font-semibold text-white/25">·····</span>
          ) : item.active ? (
            <>
              <span className="block text-xs font-semibold text-green-400">Active</span>
              <span className="block text-[11px] text-white/45">{formatCountdown(item.mainMs)}</span>
            </>
          ) : (
            <>
              <span className="block font-mono text-xs font-semibold text-white">
                {formatCountdown(item.mainMs)}
              </span>
              <span className="block text-[11px] text-white/45">{item.atLabel}</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

/* --------------------------------- shell --------------------------------- */

export default function BuildopApp() {
  const now = useNow();
  const ready = now !== null;
  const clock = now ?? EPOCH;

  const { data: events } = useQuery<MetaEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const bossStatuses = useMemo(() => getBossStatuses(clock), [clock]);
  const metaStatuses = useMemo(
    () => (events ? getAllMetaStatuses(events, clock) : []),
    [events, clock],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mapFilter, setMapFilter] = useState("all");

  const [favList, setFavList] = usePersistentState<string[]>("buildop:favorites", []);
  const [favOnly, setFavOnly] = usePersistentState<boolean>("buildop:favOnly", false);
  const [showBosses, setShowBosses] = usePersistentState<boolean>("buildop:showBosses", true);
  const [showMetas, setShowMetas] = usePersistentState<boolean>("buildop:showMetas", true);
  const [notif, setNotif] = usePersistentState<NotifSettings>("buildop:notif", {
    enabled: false,
    lead: 5,
    sound: true,
  });

  const [notifOpen, setNotifOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => setPerm(notifyPermission()), []);

  const favorites = useMemo(() => new Set(favList), [favList]);
  const toggleFavorite = (id: string) =>
    setFavList((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  /* ------------------------- notification engine ------------------------- */
  const firedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!notif.enabled) return;
    const leadMs = notif.lead * 60_000;
    for (const s of bossStatuses) {
      if (s.active || !favorites.has(s.boss.id)) continue;
      const key = `${s.boss.id}@${s.spawn.toISOString()}`;
      if (s.msUntilSpawn > 0 && s.msUntilSpawn <= leadMs && !firedRef.current.has(key)) {
        firedRef.current.add(key);
        fireSpawnAlert(s, notif.sound);
      }
    }
    if (firedRef.current.size > 100) firedRef.current.clear();
  }, [bossStatuses, notif, favorites]);

  async function toggleNotifications() {
    if (!notif.enabled) setPerm(await requestNotifyPermission());
    setNotif((n) => ({ ...n, enabled: !n.enabled }));
  }

  /* ----------------------------- unified items --------------------------- */
  const items: Item[] = useMemo(() => {
    const list: Item[] = [];
    for (const s of bossStatuses) {
      list.push({
        id: s.boss.id,
        name: s.boss.name,
        kind: "boss",
        map: s.boss.zone,
        coord: s.boss.coord,
        color: bossColor(s),
        active: s.active,
        sortMs: s.active ? 0 : s.msUntilSpawn,
        mainMs: s.active ? s.msActiveLeft : s.msUntilSpawn,
        atLabel: s.active
          ? ""
          : s.spawn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        boss: s,
      });
    }
    for (const m of metaStatuses) {
      list.push({
        id: m.id,
        name: m.eventName,
        kind: "meta",
        map: m.map,
        coord: m.coord,
        color: m.active ? ACTIVE_COLOR : META_COLOR,
        active: m.active,
        sortMs: m.active ? 0 : m.msUntil,
        mainMs: m.msUntil,
        atLabel: m.active
          ? ""
          : m.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        meta: m,
      });
    }
    return list.sort((a, b) => a.sortMs - b.sortMs);
  }, [bossStatuses, metaStatuses]);

  // Map names for the filter dropdown.
  const mapOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.map));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  /* ------------------------------- filtering ----------------------------- */
  const q = query.trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (i.kind === "boss" ? !showBosses : !showMetas) return false;
    if (favOnly && !favorites.has(i.id)) return false;
    if (mapFilter !== "all" && i.map !== mapFilter) return false;
    if (!q) return true;
    return i.name.toLowerCase().includes(q) || i.map.toLowerCase().includes(q);
  });

  const selected = selectedId ? filtered.find((i) => i.id === selectedId) : undefined;

  // Auto-select the most imminent item once the clock is live.
  useEffect(() => {
    if (ready && selectedId === null && items.length) {
      const first = items.find((i) => i.active) ?? items[0];
      setSelectedId(first.id);
    }
  }, [ready, items, selectedId]);

  const markers: MapMarker[] = filtered.map((i) => ({
    id: i.id,
    coord: i.coord,
    color: i.color,
    label: i.name,
    sub: i.map,
  }));

  // When a specific map is chosen, highlight + fly to its rectangle.
  const highlight = mapFilter !== "all" ? MAP_BOUNDS[mapFilter] ?? null : null;

  /* ----------------------------- header data ----------------------------- */
  const activeCount = bossStatuses.filter((s) => s.active).length;
  const upcoming = bossStatuses.find((s) => !s.active);
  const local = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const utc = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : "--:--";

  // Selected meta's upcoming phase schedule (for the info panel).
  const selectedEvent =
    selected?.kind === "meta" ? events?.find((e) => e.id === selected.id) : undefined;
  const phaseSchedule =
    selectedEvent && now ? getUpcomingMainEvents(selectedEvent, now, 6) : [];

  // Selected boss's daily schedule (local).
  const bossSchedule =
    selected?.kind === "boss"
      ? selected.boss!.boss.times
          .map((tt) => {
            const [h, m] = tt.split(":").map(Number);
            const d = new Date(
              Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate(), h, m),
            );
            return { utc: tt, local: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ms: d.getTime() };
          })
          .sort((a, b) => a.ms - b.ms)
      : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0f] text-white">
      {/* ---------------------------- top bar ---------------------------- */}
      <header className="relative flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d0d14] px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">buildop</span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            Guild Wars 2
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {ready && upcoming && (
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 lg:flex">
              <span className="text-xs text-white/50">Next boss</span>
              <span className="text-xs font-medium text-white">{upcoming.boss.name}</span>
              <span className="font-mono text-xs font-semibold text-orange-400">
                {formatCountdown(upcoming.msUntilSpawn)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-semibold text-white">{ready ? activeCount : "—"} active</span>
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 sm:block">
            {local} <span className="text-white/40">{utc} UTC</span>
          </div>

          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={[
              "relative grid h-9 w-9 place-items-center rounded-lg border transition",
              notif.enabled
                ? "border-orange-400/50 bg-orange-400/15 text-orange-400"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white",
            ].join(" ")}
            aria-label="Notifications"
          >
            <Icon path={P.bell} />
            {notif.enabled && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#0d0d14]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-3 top-[60px] z-[2000] w-80 rounded-xl border border-white/10 bg-[#0d0d14] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Spawn notifications</h3>
                <button onClick={() => setNotifOpen(false)} className="text-white/40 hover:text-white">
                  <Icon path={P.close} className="h-4 w-4" />
                </button>
              </div>
              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-white/80">Enable alerts</span>
                <button
                  onClick={toggleNotifications}
                  className={["relative h-6 w-11 rounded-full transition", notif.enabled ? "bg-orange-500" : "bg-white/15"].join(" ")}
                  role="switch"
                  aria-checked={notif.enabled}
                >
                  <span className={["absolute top-0.5 h-5 w-5 rounded-full bg-white transition", notif.enabled ? "left-[22px]" : "left-0.5"].join(" ")} />
                </button>
              </label>
              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-white/80">Alert me</span>
                <select
                  value={notif.lead}
                  onChange={(e) => setNotif((n) => ({ ...n, lead: Number(e.target.value) }))}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white focus:outline-none"
                >
                  {[1, 5, 10, 15].map((m) => (
                    <option key={m} value={m} className="bg-[#0d0d14]">{m} min before</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-white/80">Play sound</span>
                <input
                  type="checkbox"
                  checked={notif.sound}
                  onChange={(e) => { const on = e.target.checked; setNotif((n) => ({ ...n, sound: on })); if (on) playBeep(); }}
                  className="h-4 w-4 accent-orange-500"
                />
              </label>
              <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-white/45">
                Alerts fire for your <span className="text-amber-400">★ favorited</span> world bosses.
                {perm === "denied" && <span className="mt-1 block text-red-400">Notifications are blocked in site settings (sound still works).</span>}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <IconRail />

        {/* --------------------------- sidebar --------------------------- */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b11]">
          <div className="shrink-0 space-y-3 p-3">
            <div>
              <h1 className="text-sm font-bold text-white">GW2 Event &amp; Boss Timer</h1>
              <p className="text-[11px] text-white/45">
                World bosses + map meta events · sorted by what&apos;s next
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                <Icon path={P.search} className="h-4 w-4 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events, maps…"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFavOnly((v) => !v)}
                title="Show favorites only"
                className={[
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition",
                  favOnly ? "border-amber-400/50 bg-amber-400/15 text-amber-400" : "border-white/10 bg-white/5 text-white/50 hover:text-white",
                ].join(" ")}
              >
                <Icon path={P.star} className="h-4 w-4" fill={favOnly ? "currentColor" : "none"} />
              </button>
            </div>

            {/* map filter */}
            <select
              value={mapFilter}
              onChange={(e) => setMapFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white focus:outline-none"
            >
              <option value="all" className="bg-[#0d0d14]">All maps ({items.length})</option>
              {mapOptions.map((m) => (
                <option key={m} value={m} className="bg-[#0d0d14]">{m}</option>
              ))}
            </select>

            {/* type toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowBosses((v) => !v)}
                className={["flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition", showBosses ? "border-white/15 bg-white/10 text-white" : "border-white/10 text-white/35"].join(" ")}
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" /> World Bosses
              </button>
              <button
                onClick={() => setShowMetas((v) => !v)}
                className={["flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition", showMetas ? "border-white/15 bg-white/10 text-white" : "border-white/10 text-white/35"].join(" ")}
              >
                <span className="h-2 w-2 rounded-full bg-sky-400" /> Meta Events
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <div className="flex flex-col gap-0.5">
              {filtered.map((i) => (
                <Row
                  key={i.id}
                  item={i}
                  selected={i.id === selected?.id}
                  favorite={favorites.has(i.id)}
                  ready={ready}
                  onSelect={() => setSelectedId(i.id)}
                  onToggleFavorite={() => toggleFavorite(i.id)}
                />
              ))}
            </div>
            {ready && filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-white/40">No events match your filters.</p>
            )}
          </div>
        </aside>

        {/* ----------------------------- map ----------------------------- */}
        <main className="relative min-w-0 flex-1">
          <TimelineMap
            markers={markers}
            selectedId={selected?.id ?? ""}
            highlight={highlight}
            onSelect={setSelectedId}
          />

          {/* legend */}
          <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-lg border border-white/10 bg-[#0d0d14]/90 px-3 py-2 text-xs backdrop-blur">
            <div className="mb-1 font-semibold text-white/70">Legend</div>
            {[[ACTIVE_COLOR, "Happening now"], ["#f59e0b", "World boss"], ["#a855f7", "Hardcore boss"], [META_COLOR, "Meta (upcoming)"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2 py-0.5 text-white/60">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} /> {l}
              </div>
            ))}
          </div>

          {/* info panel */}
          {selected && (
            <div className="absolute bottom-3 left-3 z-[1000] flex max-h-[calc(100%-1.5rem)] w-80 flex-col rounded-xl border border-white/10 bg-[#0d0d14]/95 shadow-2xl backdrop-blur">
              <div className="flex items-start gap-2 border-b border-white/10 p-3">
                <span className="mt-0.5 text-orange-400"><Icon path={P.pin} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-white">{selected.name}</h2>
                    {selected.kind === "meta" && (
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-300">
                        {selected.meta!.category}
                      </span>
                    )}
                    {selected.kind === "boss" && selected.boss!.boss.hardcore && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-300">Hardcore</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-white/50">
                    {selected.kind === "boss"
                      ? `${selected.boss!.boss.area}, ${selected.map}`
                      : selected.map}
                  </p>
                </div>
                <button onClick={() => toggleFavorite(selected.id)} className={favorites.has(selected.id) ? "text-amber-400" : "text-white/30 hover:text-white/70"} aria-label="Favorite">
                  <Icon path={P.star} className="h-4 w-4" fill={favorites.has(selected.id) ? "currentColor" : "none"} />
                </button>
                <button onClick={() => setSelectedId(null)} className="text-white/40 hover:text-white" aria-label="Close">
                  <Icon path={P.close} className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto p-3">
                {selected.kind === "boss" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selected.boss!.boss.image} alt={selected.name} loading="lazy" className="h-32 w-full rounded-lg border border-white/10 object-cover" />
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center">
                      {selected.boss!.active ? (
                        <div className="text-sm font-semibold text-green-400">Active now · {formatCountdown(selected.boss!.msActiveLeft)} left</div>
                      ) : (
                        <>
                          <div className="font-mono text-lg font-bold text-orange-400">{formatCountdown(selected.boss!.msUntilSpawn)}</div>
                          <div className="text-xs text-white/50">until spawn</div>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Today&apos;s spawns (local)</div>
                      <div className="flex flex-wrap gap-1">
                        {bossSchedule.map((c) => (
                          <span key={c.utc} className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/70" title={`${c.utc} UTC`}>{c.local}</span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center">
                      {selected.meta!.active ? (
                        <div className="text-sm font-semibold text-green-400">
                          Active now · {formatCountdown(selected.meta!.msUntil)} left
                        </div>
                      ) : (
                        <>
                          <div className="font-mono text-lg font-bold text-orange-400">
                            {formatCountdown(selected.meta!.msUntil)}
                          </div>
                          <div className="text-xs text-white/50">
                            until {selected.meta!.eventName} ·{" "}
                            {selected.meta!.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} local
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Upcoming (local)</div>
                      <div className="flex flex-col gap-1">
                        {phaseSchedule.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded border border-white/10 px-2 py-1 text-xs">
                            <span className="truncate text-white/80">{p.name}</span>
                            <span className="ml-2 shrink-0 font-mono text-white/50">{p.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <a
                  href={`https://wiki.guildwars2.com/index.php?search=${encodeURIComponent(selected.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-white/10 bg-white/5 py-1.5 text-center text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  View on GW2 Wiki ↗
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
