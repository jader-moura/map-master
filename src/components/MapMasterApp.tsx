"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  getBossStatuses,
  formatCountdown,
  type BossStatus,
} from "@/lib/gw2/bosses";

// Leaflet touches `window`, so the map must never render on the server.
const Gw2Map = dynamic(() => import("@/components/Gw2Map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-white/40">
      Loading map…
    </div>
  ),
});

type CategoryKey = "active" | "standard" | "hardcore";

const CATEGORY: Record<
  CategoryKey,
  { label: string; dot: string; text: string }
> = {
  active: { label: "Active Now", dot: "bg-green-400", text: "text-green-400" },
  standard: { label: "Standard Bosses", dot: "bg-amber-400", text: "text-amber-400" },
  hardcore: { label: "Hardcore Bosses", dot: "bg-purple-400", text: "text-purple-300" },
};

function categoryOf(s: BossStatus): CategoryKey {
  if (s.active) return "active";
  return s.boss.hardcore ? "hardcore" : "standard";
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* --------------------------------- icons --------------------------------- */

function Icon({ path, className = "h-5 w-5" }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}
const P = {
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  map: "M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  info: "M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  search: "M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4M6.1 6.1A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 3.1-.5",
  chevron: "M6 9l6 6 6-6",
  pin: "M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};

/* ------------------------------- boss row -------------------------------- */

function BossRow({
  status,
  selected,
  dimmed,
  onSelect,
}: {
  status: BossStatus;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const { boss, active, msUntilSpawn, msActiveLeft, spawn } = status;
  const spawnLabel = spawn.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition",
        selected
          ? "border-orange-400/60 bg-orange-400/10"
          : "border-transparent hover:bg-white/5",
        dimmed ? "opacity-40" : "",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 shrink-0 rounded-full",
          active ? "animate-pulse bg-green-400" : boss.hardcore ? "bg-purple-400" : "bg-amber-400",
        ].join(" ")}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">{boss.name}</span>
        <span className="block truncate text-[11px] text-white/45">
          {boss.area}, {boss.zone}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {active ? (
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
  );
}

/* ------------------------------ category group ---------------------------- */

function Group({
  cat,
  items,
  count,
  visible,
  collapsed,
  selectedId,
  onToggleVisible,
  onToggleCollapsed,
  onSelect,
}: {
  cat: CategoryKey;
  items: BossStatus[];
  count: number;
  visible: boolean;
  collapsed: boolean;
  selectedId: string;
  onToggleVisible: () => void;
  onToggleCollapsed: () => void;
  onSelect: (id: string) => void;
}) {
  const meta = CATEGORY[cat];
  if (items.length === 0) return null;

  return (
    <div className="border-b border-white/5 pb-2">
      <div className="flex items-center gap-2 px-1 py-2">
        <button
          onClick={onToggleCollapsed}
          className="text-white/40 transition hover:text-white"
          aria-label="Collapse"
        >
          <Icon
            path={P.chevron}
            className={`h-4 w-4 transition ${collapsed ? "-rotate-90" : ""}`}
          />
        </button>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-white/70">
          {meta.label}
        </span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white/70">
          {count}
        </span>
        <button
          onClick={onToggleVisible}
          className="text-white/40 transition hover:text-white"
          aria-label="Toggle visibility"
        >
          <Icon path={visible ? P.eye : P.eyeOff} className="h-4 w-4" />
        </button>
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-0.5">
          {items.map((s) => (
            <BossRow
              key={s.boss.id}
              status={s}
              selected={s.boss.id === selectedId}
              dimmed={!visible}
              onSelect={() => onSelect(s.boss.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- shell --------------------------------- */

export default function MapMasterApp() {
  const now = useNow();
  const statuses = useMemo(() => getBossStatuses(now), [now]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState<Record<CategoryKey, boolean>>({
    active: true,
    standard: true,
    hardcore: true,
  });
  const [collapsed, setCollapsed] = useState<Record<CategoryKey, boolean>>({
    active: false,
    standard: false,
    hardcore: false,
  });

  // List grouping (filtered by search text only).
  const q = query.trim().toLowerCase();
  const matches = (s: BossStatus) =>
    !q ||
    s.boss.name.toLowerCase().includes(q) ||
    s.boss.zone.toLowerCase().includes(q) ||
    s.boss.area.toLowerCase().includes(q);

  const filtered = statuses.filter(matches);
  const groups: Record<CategoryKey, BossStatus[]> = {
    active: filtered.filter((s) => categoryOf(s) === "active"),
    standard: filtered.filter((s) => categoryOf(s) === "standard"),
    hardcore: filtered.filter((s) => categoryOf(s) === "hardcore"),
  };

  // Map markers: only categories toggled visible, and matching the search.
  const mapStatuses = filtered.filter((s) => visible[categoryOf(s)]);

  const selected =
    mapStatuses.find((s) => s.boss.id === selectedId) ??
    mapStatuses[0] ??
    statuses[0];

  const activeCount = statuses.filter((s) => s.active).length;
  const upcoming = statuses.find((s) => !s.active);
  const utc = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });

  const setAll = (v: boolean) =>
    setVisible({ active: v, standard: v, hardcore: v });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0f] text-white">
      {/* ---------------------------- top bar ---------------------------- */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d0d14] px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">GW2 MapMaster</span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            Guild Wars 2
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {upcoming && (
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
            <span className="text-xs font-semibold text-white">{activeCount} active</span>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70">
            {utc} UTC
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* -------------------------- icon rail -------------------------- */}
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-[#0d0d14] py-3">
          {[
            { p: P.home, on: false },
            { p: P.list, on: true },
            { p: P.map, on: false },
            { p: P.bell, on: false },
            { p: P.info, on: false },
          ].map((it, i) => (
            <span
              key={i}
              className={[
                "grid h-10 w-10 place-items-center rounded-lg transition",
                it.on
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-white/40 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon path={it.p} />
            </span>
          ))}
        </nav>

        {/* --------------------------- sidebar --------------------------- */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b11]">
          <div className="shrink-0 space-y-3 p-3">
            <div>
              <h1 className="text-sm font-bold text-white">Tyria World Bosses</h1>
              <p className="text-[11px] text-white/45">
                Live timers · click a boss to focus the map
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
              <Icon path={P.search} className="h-4 w-4 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bosses or zones…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
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
            {(Object.keys(groups) as CategoryKey[]).map((cat) => (
              <Group
                key={cat}
                cat={cat}
                items={groups[cat]}
                count={groups[cat].length}
                visible={visible[cat]}
                collapsed={collapsed[cat]}
                selectedId={selected?.boss.id ?? ""}
                onToggleVisible={() =>
                  setVisible((v) => ({ ...v, [cat]: !v[cat] }))
                }
                onToggleCollapsed={() =>
                  setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))
                }
                onSelect={setSelectedId}
              />
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-white/40">
                No bosses match “{query}”.
              </p>
            )}
          </div>
        </aside>

        {/* ----------------------------- map ----------------------------- */}
        <main className="relative min-w-0 flex-1">
          {selected ? (
            <Gw2Map
              statuses={mapStatuses}
              selectedId={selected.boss.id}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="grid h-full place-items-center text-white/40">
              No markers visible — enable a category.
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

          {/* selected boss card (bottom-left) */}
          {selected && (
            <div className="absolute bottom-3 left-3 z-[1000] w-72 rounded-xl border border-white/10 bg-[#0d0d14]/95 p-3 shadow-2xl backdrop-blur">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-400">
                  <Icon path={P.pin} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-white">
                      {selected.boss.name}
                    </h2>
                    {selected.boss.hardcore && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-300">
                        Hardcore
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-white/50">
                    {selected.boss.area}, {selected.boss.zone}
                  </p>
                  <p className="mt-1.5 text-sm">
                    {selected.active ? (
                      <span className="font-semibold text-green-400">
                        Active now · {formatCountdown(selected.msActiveLeft)} left
                      </span>
                    ) : (
                      <span className="text-white/80">
                        Next spawn in{" "}
                        <span className="font-mono font-semibold text-orange-400">
                          {formatCountdown(selected.msUntilSpawn)}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
