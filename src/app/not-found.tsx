import type { Metadata } from "next";
import Link from "next/link";
import { Icon, P } from "@/components/icons";

export const metadata: Metadata = {
  title: "Page Not Found (404)",
  description:
    "This waypoint doesn't exist. Jump back to the buildop Guild Wars 2 map, world boss timer, event timer, gathering map or Trading Post.",
};

// Quick links back into the app, mirroring the IconRail destinations.
const DESTINATIONS = [
  { href: "/", icon: P.map, label: "Interactive Map", blurb: "Waypoints, vistas, hearts & more" },
  { href: "/gw2-world-boss-timer", icon: P.swords, label: "World Boss Timer", blurb: "Live spawn countdowns" },
  { href: "/gw2-event-timer", icon: P.clock, label: "Event Timer", blurb: "Meta event timeline" },
  { href: "/gw2-gathering-map", icon: P.pickaxe, label: "Gathering Map", blurb: "Where to farm every material" },
  { href: "/gw2-trading-post", icon: P.coins, label: "Trading Post", blurb: "Gem rate & item prices" },
];

export default function NotFound() {
  return (
    <main className="relative grid h-full w-full place-items-center overflow-y-auto bg-[#0a0a0f] px-6 py-12 text-white">
      {/* Decorative backdrop: faint map grid + orange glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-[120px]"
      />

      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        {/* Lost waypoint pin */}
        <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-2xl border border-orange-400/30 bg-orange-500/10 text-orange-400 shadow-[0_0_40px_-8px] shadow-orange-500/40">
          <Icon path={P.pin} className="h-10 w-10" />
        </div>

        <p className="text-7xl font-black tracking-tight text-white/90 sm:text-8xl">404</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">You&apos;ve wandered off the map</h1>
        <p className="mt-3 max-w-md text-balance text-white/60">
          This waypoint doesn&apos;t exist looks like the asura gate dropped you in
          uncharted territory. Pick a destination below to find your way back to Tyria.
        </p>

        {/* Destination grid */}
        <nav className="mt-9 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-orange-400/40 hover:bg-white/[0.06]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/5 text-white/50 transition group-hover:bg-orange-500/15 group-hover:text-orange-400">
                <Icon path={d.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white/90">{d.label}</span>
                <span className="block truncate text-xs text-white/45">{d.blurb}</span>
              </span>
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-[#0a0a0f] transition hover:bg-orange-400"
        >
          <Icon path={P.home} className="h-4 w-4" />
          Back to the map
        </Link>
      </div>
    </main>
  );
}
