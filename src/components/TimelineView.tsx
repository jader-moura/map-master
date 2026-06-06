"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { getWindowSegments, type MetaEvent } from "@/lib/gw2/events";

// Order of category groups, top to bottom (matches the GW2 wiki).
const CATEGORY_ORDER = [
  "Core Tyria",
  "Living World Season 2",
  "Heart of Thorns",
  "Living World Season 3",
  "Path of Fire",
  "Living World Season 4",
  "The Icebrood Saga",
  "End of Dragons",
  "Secrets of the Obscure",
  "Janthir Wilds",
  "Visions of Eternity",
  "Public Instances",
  "Special Events",
];

const PAST_MIN = 30; // minutes of history shown on the left
const WINDOW_MIN = 180; // total visible window (3 hours)

function useNow() {
  const [n, setN] = useState<Date | null>(null);
  useEffect(() => {
    setN(new Date());
    const id = setInterval(() => setN(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return n;
}

export default function TimelineView() {
  const now = useNow();
  const { data: events, isLoading, isError } = useQuery<MetaEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const r = await fetch("/api/events");
      if (!r.ok) throw new Error("Failed to load events");
      return r.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const ready = now !== null;
  const nowMs = (now ?? new Date(0)).getTime();
  const startMs = nowMs - PAST_MIN * 60_000;
  const durMs = WINDOW_MIN * 60_000;
  const endMs = startMs + durMs;
  const nowPct = (PAST_MIN / WINDOW_MIN) * 100;

  // Group events by category, dropping any with no named phase in the window.
  const groups = useMemo(() => {
    const g: Record<string, { ev: MetaEvent; segs: ReturnType<typeof getWindowSegments> }[]> = {};
    if (!ready) return g;
    for (const ev of events ?? []) {
      const segs = getWindowSegments(ev, startMs, endMs);
      if (!segs.some((s) => s.name)) continue;
      (g[ev.category] ??= []).push({ ev, segs });
    }
    return g;
  }, [events, ready, startMs, endMs]);

  const ticks = useMemo(() => {
    if (!ready) return [];
    const step = 30 * 60_000;
    const out: { pct: number; label: string }[] = [];
    for (let t = Math.ceil(startMs / step) * step; t <= endMs; t += step) {
      out.push({
        pct: ((t - startMs) / durMs) * 100,
        label: new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
    return out;
  }, [ready, startMs, endMs, durMs]);

  const cats = CATEGORY_ORDER.filter((c) => groups[c]?.length);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0f] text-white">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0d0d14] px-3 sm:gap-4 sm:px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">buildop</span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            Event Timers
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
          <span className="hidden sm:inline">3-hour window · red line = now</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <IconRail />

        <main className="scroll-themed min-w-0 flex-1 overflow-auto">
          {!ready || isLoading ? (
            <div className="grid h-full place-items-center text-white/40">Loading event timers…</div>
          ) : isError ? (
            <div className="grid h-full place-items-center text-red-400">Couldn’t load events.</div>
          ) : (
            <div className="min-w-[680px]">
              {/* time axis */}
              <div className="sticky top-0 z-20 flex h-8 items-end border-b border-white/10 bg-[#0a0a0f]">
                <div className="w-40 shrink-0 sm:w-48" />
                <div className="relative flex-1">
                  {ticks.map((tk, i) => (
                    <span
                      key={i}
                      className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/40"
                      style={{ left: `${tk.pct}%` }}
                    >
                      {tk.label}
                    </span>
                  ))}
                </div>
              </div>

              {cats.map((cat) => (
                <div key={cat}>
                  <div className="bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                    {cat}
                  </div>
                  {groups[cat].map(({ ev, segs }) => (
                    <div key={ev.id} className="flex h-7 items-stretch border-b border-white/5">
                      <div className="flex w-40 shrink-0 items-center truncate px-3 text-xs text-white/80 sm:w-48">
                        <span className="truncate">{ev.name}</span>
                      </div>
                      <div className="relative flex-1 bg-white/[0.015]">
                        {segs.map((s, i) => {
                          const ls = Math.max(0, ((s.startMs - startMs) / durMs) * 100);
                          const rs = Math.min(100, ((s.endMs - startMs) / durMs) * 100);
                          if (rs <= ls) return null;
                          const w = rs - ls;
                          return (
                            <div
                              key={i}
                              className="absolute inset-y-0.5 flex items-center overflow-hidden rounded-sm px-1 text-[10px] font-medium text-black/80"
                              style={{ left: `${ls}%`, width: `${w}%`, backgroundColor: s.color }}
                              title={s.name ?? undefined}
                            >
                              {w > 6 && s.name ? <span className="truncate">{s.name}</span> : null}
                            </div>
                          );
                        })}
                        {/* now line */}
                        <div
                          className="absolute inset-y-0 z-10 w-0.5 bg-red-500"
                          style={{ left: `${nowPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
