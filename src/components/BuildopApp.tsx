"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  getBossStatuses,
  formatCountdown,
  type BossStatus,
} from "@/lib/gw2/bosses";
import { usePersistentState } from "@/lib/usePersistentState";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import {
  fireSpawnAlert,
  requestNotifyPermission,
  notifyPermission,
  playBeep,
} from "@/lib/gw2/notify";

// Leaflet touches `window`, so the map must never render on the server.
const Gw2Map = dynamic(() => import("@/components/Gw2Map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-white/40">Loading map…</div>
  ),
});

type CategoryKey = "active" | "standard" | "hardcore";

const CATEGORY: Record<CategoryKey, { label: string; short: string; dot: string }> = {
  active: { label: "Active Now", short: "Active", dot: "bg-green-400" },
  standard: { label: "Standard Bosses", short: "Standard", dot: "bg-amber-400" },
  hardcore: { label: "Hardcore Bosses", short: "Hardcore", dot: "bg-purple-400" },
};

function categoryOf(s: BossStatus): CategoryKey {
  if (s.active) return "active";
  return s.boss.hardcore ? "hardcore" : "standard";
}

function useNow(intervalMs = 1000) {
  // Starts null so the server render and the first client render match (no
  // time-based hydration mismatch); the live clock begins after mount.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

type NotifSettings = { enabled: boolean; lead: number; sound: boolean };

// Fixed reference time used before mount, so pre-hydration output is deterministic.
const EPOCH = new Date(0);

/* ------------------------------- boss row -------------------------------- */

function BossRow({
  status,
  selected,
  favorite,
  ready,
  onSelect,
  onToggleFavorite,
}: {
  status: BossStatus;
  selected: boolean;
  favorite: boolean;
  ready: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const { boss, active, msUntilSpawn, msActiveLeft, spawn } = status;
  const spawnLabel = spawn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
          className={[
            "h-2 w-2 shrink-0 rounded-full",
            ready && active ? "animate-pulse bg-green-400" : boss.hardcore ? "bg-purple-400" : "bg-amber-400",
          ].join(" ")}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{boss.name}</span>
          <span className="block truncate text-[11px] text-white/45">
            {boss.area}, {boss.zone}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {!ready ? (
            <span className="block font-mono text-xs font-semibold text-white/25">·····</span>
          ) : active ? (
            <>
              <span className="block text-xs font-semibold text-green-400">Active</span>
              <span className="block text-[11px] text-white/45">{formatCountdown(msActiveLeft)}</span>
            </>
          ) : (
            <>
              <span className="block font-mono text-xs font-semibold text-white">
                {formatCountdown(msUntilSpawn)}
              </span>
              <span className="block text-[11px] text-white/45">{spawnLabel}</span>
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
  // Concrete Date for time math; before mount we use a fixed epoch so server
  // and first client render are identical (live values appear after mount).
  const clock = now ?? EPOCH;
  const statuses = useMemo(() => getBossStatuses(clock), [clock]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [favList, setFavList] = usePersistentState<string[]>("buildop:favorites", []);
  const [favOnly, setFavOnly] = usePersistentState<boolean>("buildop:favOnly", false);
  const [visible, setVisible] = usePersistentState<Record<CategoryKey, boolean>>("buildop:visible", {
    active: true,
    standard: true,
    hardcore: true,
  });
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
    for (const s of statuses) {
      if (s.active || !favorites.has(s.boss.id)) continue;
      const key = `${s.boss.id}@${s.spawn.toISOString()}`;
      if (s.msUntilSpawn > 0 && s.msUntilSpawn <= leadMs && !firedRef.current.has(key)) {
        firedRef.current.add(key);
        fireSpawnAlert(s, notif.sound);
      }
    }
    if (firedRef.current.size > 100) firedRef.current.clear();
  }, [statuses, notif, favorites]);

  async function toggleNotifications() {
    if (!notif.enabled) {
      const result = await requestNotifyPermission();
      setPerm(result);
    }
    setNotif((n) => ({ ...n, enabled: !n.enabled }));
  }

  /* ----------------------------- derived data ---------------------------- */
  const q = query.trim().toLowerCase();
  const matches = (s: BossStatus) =>
    !q ||
    s.boss.name.toLowerCase().includes(q) ||
    s.boss.zone.toLowerCase().includes(q) ||
    s.boss.area.toLowerCase().includes(q);

  // One flat list, always in chronological order (active first, then soonest
  // spawn) — getBossStatuses already sorts this way. We do NOT regroup by type.
  const listStatuses = statuses
    .filter(matches)
    .filter((s) => !favOnly || favorites.has(s.boss.id))
    .filter((s) => visible[categoryOf(s)]);

  const mapStatuses = listStatuses;
  // Only "selected" once the user clicks a boss (in the list or on the map).
  const selected = selectedId
    ? mapStatuses.find((s) => s.boss.id === selectedId)
    : undefined;

  const catCounts: Record<CategoryKey, number> = {
    active: statuses.filter((s) => categoryOf(s) === "active").length,
    standard: statuses.filter((s) => categoryOf(s) === "standard").length,
    hardcore: statuses.filter((s) => categoryOf(s) === "hardcore").length,
  };

  const activeCount = catCounts.active;
  const upcoming = statuses.find((s) => !s.active);
  const utc = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" })
    : "--:--:--";
  const local = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const setAll = (v: boolean) => setVisible({ active: v, standard: v, hardcore: v });

  // Today's full spawn schedule for the selected boss, in local time.
  const schedule = selected
    ? selected.boss.times
        .map((t) => {
          const [h, m] = t.split(":").map(Number);
          const d = new Date(
            Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate(), h, m),
          );
          return {
            utc: t,
            local: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            ms: d.getTime(),
          };
        })
        .sort((a, b) => a.ms - b.ms)
    : [];
  const pad = (n: number) => String(n).padStart(2, "0");
  const selNextUTC = selected
    ? `${pad(selected.spawn.getUTCHours())}:${pad(selected.spawn.getUTCMinutes())}`
    : "";
  const durationMs = selected ? selected.boss.durationMin * 60_000 : 0;

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
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
              <span className="text-xs text-white/50">Next</span>
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
          <div className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-right font-mono text-xs text-white/70 sm:block">
            <span className="text-white">{local}</span>
            <span className="ml-2 text-white/40">{utc} UTC</span>
          </div>

          {/* notifications button + popover */}
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
                  className={[
                    "relative h-6 w-11 rounded-full transition",
                    notif.enabled ? "bg-orange-500" : "bg-white/15",
                  ].join(" ")}
                  role="switch"
                  aria-checked={notif.enabled}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                      notif.enabled ? "left-[22px]" : "left-0.5",
                    ].join(" ")}
                  />
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
                    <option key={m} value={m} className="bg-[#0d0d14]">
                      {m} min before
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-white/80">Play sound</span>
                <input
                  type="checkbox"
                  checked={notif.sound}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setNotif((n) => ({ ...n, sound: on }));
                    if (on) playBeep();
                  }}
                  className="h-4 w-4 accent-orange-500"
                />
              </label>

              <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-white/45">
                Alerts fire for your{" "}
                <span className="text-amber-400">★ favorited</span> bosses.
                {perm === "denied" && (
                  <span className="mt-1 block text-red-400">
                    Browser notifications are blocked — enable them in site settings (sound still works).
                  </span>
                )}
                {perm === "unsupported" && (
                  <span className="mt-1 block text-white/40">
                    This browser doesn’t support notifications — sound only.
                  </span>
                )}
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
              <h1 className="text-sm font-bold text-white">GW2 World Boss Timer</h1>
              <p className="text-[11px] text-white/45">
                Sorted by next spawn · times in your local zone ({tz})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                <Icon path={P.search} className="h-4 w-4 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bosses or zones…"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFavOnly((v) => !v)}
                aria-label="Show favorites only"
                title="Show favorites only"
                className={[
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition",
                  favOnly
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-400"
                    : "border-white/10 bg-white/5 text-white/50 hover:text-white",
                ].join(" ")}
              >
                <Icon path={P.star} className="h-4 w-4" fill={favOnly ? "currentColor" : "none"} />
              </button>
            </div>

            {/* category filter pills (control list + map markers) */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY) as CategoryKey[]).map((cat) => {
                const on = visible[cat];
                const meta = CATEGORY[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setVisible((v) => ({ ...v, [cat]: !v[cat] }))}
                    className={[
                      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                      on
                        ? "border-white/15 bg-white/10 text-white"
                        : "border-white/10 bg-transparent text-white/35",
                    ].join(" ")}
                    title={`${on ? "Hide" : "Show"} ${meta.label}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot} ${on ? "" : "opacity-40"}`} />
                    {meta.short}
                    <span className="text-white/40">{catCounts[cat]}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAll(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
              >
                <Icon path={P.eye} className="h-4 w-4" /> Show All
              </button>
              <button
                onClick={() => setAll(false)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
              >
                <Icon path={P.eyeOff} className="h-4 w-4" /> Hide All
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <div className="flex flex-col gap-0.5">
              {listStatuses.map((s) => (
                <BossRow
                  key={s.boss.id}
                  status={s}
                  selected={s.boss.id === selected?.boss.id}
                  favorite={favorites.has(s.boss.id)}
                  ready={ready}
                  onSelect={() => setSelectedId(s.boss.id)}
                  onToggleFavorite={() => toggleFavorite(s.boss.id)}
                />
              ))}
            </div>
            {listStatuses.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-white/40">
                {favOnly
                  ? "No favorites match — tap ☆ on a boss to add one."
                  : query
                    ? `No bosses match “${query}”.`
                    : "All categories hidden — enable one above."}
              </p>
            )}
          </div>
        </aside>

        {/* ----------------------------- map ----------------------------- */}
        <main className="relative min-w-0 flex-1">
          {mapStatuses.length > 0 ? (
            <Gw2Map
              statuses={mapStatuses}
              selectedId={selected?.boss.id ?? ""}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="grid h-full place-items-center text-white/40">
              All categories hidden — enable a category or clear the search.
            </div>
          )}

          {/* legend (top-right) */}
          <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-lg border border-white/10 bg-[#0d0d14]/90 px-3 py-2 text-xs backdrop-blur">
            <div className="mb-1 font-semibold text-white/70">Legend</div>
            {(Object.keys(CATEGORY) as CategoryKey[]).map((c) => (
              <div key={c} className="flex items-center gap-2 py-0.5 text-white/60">
                <span className={`h-2 w-2 rounded-full ${CATEGORY[c].dot}`} />
                {CATEGORY[c].label}
              </div>
            ))}
          </div>

          {/* selected boss info panel (bottom-left) */}
          {selected && (
            <div className="absolute bottom-3 left-3 z-[1000] flex max-h-[calc(100%-1.5rem)] w-80 flex-col rounded-xl border border-white/10 bg-[#0d0d14]/95 shadow-2xl backdrop-blur">
              {/* header */}
              <div className="flex items-start gap-2 border-b border-white/10 p-3">
                <span className="mt-0.5 text-orange-400"><Icon path={P.pin} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-white">{selected.boss.name}</h2>
                    {selected.boss.hardcore && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-300">
                        Hardcore
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-white/50">
                    {selected.boss.area}, {selected.boss.zone}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(selected.boss.id)}
                  className={favorites.has(selected.boss.id) ? "text-amber-400" : "text-white/30 hover:text-white/70"}
                  aria-label="Favorite"
                >
                  <Icon path={P.star} className="h-4 w-4" fill={favorites.has(selected.boss.id) ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-white/40 hover:text-white"
                  aria-label="Close"
                >
                  <Icon path={P.close} className="h-4 w-4" />
                </button>
              </div>

              {/* body */}
              <div className="space-y-3 overflow-y-auto p-3">
                {/* boss image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.boss.image}
                  alt={selected.boss.name}
                  loading="lazy"
                  className="h-32 w-full rounded-lg border border-white/10 object-cover"
                />

                {/* status */}
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center">
                  {selected.active ? (
                    <>
                      <div className="text-sm font-semibold text-green-400">Active now</div>
                      <div className="text-xs text-white/50">
                        {formatCountdown(selected.msActiveLeft)} remaining
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-mono text-lg font-bold text-orange-400">
                        {formatCountdown(selected.msUntilSpawn)}
                      </div>
                      <div className="text-xs text-white/50">
                        until spawn ·{" "}
                        {selected.spawn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} local
                      </div>
                    </>
                  )}
                </div>

                {/* quick stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Difficulty", value: selected.boss.hardcore ? "Hardcore" : "Standard" },
                    { label: "Duration", value: `${selected.boss.durationMin}m` },
                    { label: "Per day", value: `${selected.boss.times.length}×` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-white/10 bg-white/5 px-1 py-1.5">
                      <div className="text-sm font-semibold text-white">{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-white/40">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* daily schedule */}
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    Today’s spawns (local)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {schedule.map((c) => {
                      const isNext = c.utc === selNextUTC;
                      const isPast = !isNext && c.ms + durationMs <= clock.getTime();
                      return (
                        <span
                          key={c.utc}
                          className={[
                            "rounded border px-1.5 py-0.5 font-mono text-[11px]",
                            isNext
                              ? "border-orange-400/50 bg-orange-400/15 font-semibold text-orange-300"
                              : isPast
                                ? "border-transparent text-white/25"
                                : "border-white/10 text-white/70",
                          ].join(" ")}
                          title={`${c.utc} UTC`}
                        >
                          {c.local}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <a
                  href={`https://wiki.guildwars2.com/index.php?search=${encodeURIComponent(selected.boss.name)}`}
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
