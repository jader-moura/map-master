"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BOSSES } from "@/lib/gw2/bosses";

// A full-day timetable of every world boss: one row per boss, spawn windows
// laid out across a 24h UTC axis, with a live "now" line sweeping across.
// The axis is UTC (the schedule is defined in UTC); every block's tooltip also
// shows the user's local time so nobody has to do timezone math.

const PX_PER_HOUR = 56;
const DAY_WIDTH = 24 * PX_PER_HOUR;
const PX_PER_MIN = PX_PER_HOUR / 60;
const ROW_H = 36; // px, matches h-9

type Block = {
  label: string; // "HH:MM"
  startMin: number; // minutes into the UTC day
  durMin: number;
};

function bossColor(hardcore: boolean) {
  return hardcore ? "#a855f7" : "#f59e0b";
}

// Render one spawn time's local-clock equivalent for the tooltip.
function localOf(hhmm: string, base: Date): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h, m));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function BossTimeline() {
  const [now, setNow] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Current time-of-day in UTC minutes (fractional for a smooth line).
  const nowMin = now
    ? now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60
    : null;

  // Scroll so "now" sits about a third from the left edge, once, on first tick.
  useEffect(() => {
    if (nowMin == null || scrolledRef.current || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollLeft = Math.max(0, nowMin * PX_PER_MIN - el.clientWidth / 3);
    scrolledRef.current = true;
  }, [nowMin]);

  const rows = useMemo(
    () =>
      BOSSES.map((b) => ({
        boss: b,
        blocks: b.times.map<Block>((t) => {
          const [h, m] = t.split(":").map(Number);
          return { label: t, startMin: h * 60 + m, durMin: b.durationMin };
        }),
      })),
    [],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-white/10 px-4 py-2.5 text-[11px] text-white/45">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" /> World boss</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#a855f7]" /> Hardcore (Tequatl, etc.)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-400" /> Active now</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-0.5 bg-orange-400" /> Current time (UTC)</span>
        <span className="ml-auto">Axis in UTC · hover a block for your local time</span>
      </div>

      <div className="flex">
        {/* Sticky boss-name column */}
        <div className="z-10 shrink-0 border-r border-white/10 bg-[#0b0b11]">
          <div style={{ height: ROW_H }} className="border-b border-white/10" />
          {rows.map((r) => (
            <Link
              key={r.boss.id}
              href={`/gw2/boss/${r.boss.id}`}
              style={{ height: ROW_H }}
              className="flex w-36 items-center truncate border-b border-white/5 px-3 text-xs text-white/75 transition hover:bg-white/5 hover:text-white sm:w-44"
              title={`${r.boss.name} — ${r.boss.zone}`}
            >
              <span className="truncate">{r.boss.name}</span>
            </Link>
          ))}
        </div>

        {/* Scrollable track */}
        <div ref={scrollRef} className="scroll-themed min-w-0 flex-1 overflow-x-auto">
          <div style={{ width: DAY_WIDTH }} className="relative">
            {/* Hour ruler */}
            <div style={{ height: ROW_H }} className="relative border-b border-white/10">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  style={{ left: h * PX_PER_HOUR }}
                  className="absolute top-0 flex h-full items-center border-l border-white/5 pl-1 text-[10px] tabular-nums text-white/35"
                >
                  {String(h).padStart(2, "0")}
                </div>
              ))}
            </div>

            {/* Boss rows */}
            {rows.map((r) => (
              <div
                key={r.boss.id}
                style={{ height: ROW_H }}
                className="relative border-b border-white/5"
              >
                {/* faint hour gridlines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    style={{ left: h * PX_PER_HOUR }}
                    className="absolute inset-y-0 w-px bg-white/[0.04]"
                  />
                ))}
                {r.blocks.map((blk, i) => {
                  const active =
                    nowMin != null && nowMin >= blk.startMin && nowMin < blk.startMin + blk.durMin;
                  const past = nowMin != null && nowMin >= blk.startMin + blk.durMin;
                  const bg = active ? "#22c55e" : bossColor(r.boss.hardcore);
                  return (
                    <div
                      key={i}
                      style={{
                        left: blk.startMin * PX_PER_MIN,
                        width: Math.max(7, blk.durMin * PX_PER_MIN),
                        backgroundColor: bg,
                        opacity: past ? 0.28 : active ? 1 : 0.85,
                      }}
                      className="absolute top-1/2 h-4 -translate-y-1/2 rounded-sm ring-1 ring-black/30 transition-colors"
                      title={`${r.boss.name} · ${blk.label} UTC (${localOf(blk.label, now ?? new Date())} local)${active ? " · active now" : ""}`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Now line, spanning the ruler + all rows */}
            {nowMin != null && (
              <div
                style={{ left: nowMin * PX_PER_MIN, height: ROW_H * (rows.length + 1) }}
                className="pointer-events-none absolute top-0 z-20 w-0.5 bg-orange-400"
              >
                <span className="absolute top-0 left-1 whitespace-nowrap rounded bg-orange-400 px-1 py-0.5 text-[9px] font-bold leading-none text-black">
                  {now!.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
