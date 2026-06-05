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
    <div className="grid h-[480px] w-full place-items-center rounded-xl border border-white/10 text-white/40">
      Loading map…
    </div>
  ),
});

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function BossRow({
  status,
  selected,
  onSelect,
}: {
  status: BossStatus;
  selected: boolean;
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
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
        selected ? "border-white/60 bg-white/10" : "border-white/10 hover:bg-white/5",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
          active ? "animate-pulse bg-green-400" : boss.hardcore ? "bg-purple-400" : "bg-amber-400",
        ].join(" ")}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium text-white">{boss.name}</span>
          {boss.hardcore && (
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
              Hardcore
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-white/50">
          {boss.area}, {boss.zone}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {active ? (
          <>
            <span className="block text-sm font-semibold text-green-400">Active now</span>
            <span className="block text-xs text-white/50">
              {formatCountdown(msActiveLeft)} left
            </span>
          </>
        ) : (
          <>
            <span className="block font-mono text-sm font-semibold text-white">
              {formatCountdown(msUntilSpawn)}
            </span>
            <span className="block text-xs text-white/50">at {spawnLabel}</span>
          </>
        )}
      </span>
    </button>
  );
}

export default function MapMasterApp() {
  const now = useNow();
  const statuses = useMemo(() => getBossStatuses(now), [now]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    statuses.find((s) => s.boss.id === selectedId) ?? statuses[0];

  const activeCount = statuses.filter((s) => s.active).length;
  const utc = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">World Boss Timer</h2>
          <span className="font-mono text-xs text-white/50">{utc} UTC</span>
        </div>
        <p className="text-xs text-white/50">
          {activeCount > 0
            ? `${activeCount} boss${activeCount > 1 ? "es" : ""} active right now — sorted by time left.`
            : "Sorted by next spawn. Click a boss to focus it on the map."}
        </p>
        <div className="flex flex-col gap-2">
          {statuses.map((s) => (
            <BossRow
              key={s.boss.id}
              status={s}
              selected={s.boss.id === selected.boss.id}
              onSelect={() => setSelectedId(s.boss.id)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">{selected.boss.name}</h2>
          <span className="text-sm text-white/60">
            {selected.boss.area}, {selected.boss.zone}
          </span>
        </div>
        <Gw2Map
          statuses={statuses}
          selectedId={selected.boss.id}
          onSelect={setSelectedId}
        />
        <p className="text-xs text-white/40">
          Map tiles © ArenaNet via tiles.guildwars2.com · schedule from the GW2 Wiki.
        </p>
      </section>
    </div>
  );
}
