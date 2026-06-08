import Link from "next/link";

// Sitewide footer. Descriptive text links improve internal linking and give
// crawlers keyword-rich anchors to every tool. Rendered in the root layout.
const LINKS = [
  { href: "/", label: "Guild Wars 2 Interactive Map" },
  { href: "/gw2-world-boss-timer", label: "GW2 World Boss Timer" },
  { href: "/gw2-event-timer", label: "GW2 Event Timer" },
  { href: "/gw2-gathering-map", label: "GW2 Gathering Map" },
  { href: "/gw2-trading-post", label: "GW2 Trading Post Prices" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0d14] px-5 py-9 text-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="text-base font-semibold text-white">buildop</p>
          <p className="mt-2 leading-relaxed text-white/45">
            Free Guild Wars 2 companion tools, an interactive Tyria map, live world
            boss &amp; event timers, a gathering map and Trading Post prices.
          </p>
        </div>
        <nav aria-label="Tools" className="flex flex-col gap-2.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white/60 transition hover:text-orange-400"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-5xl text-xs leading-relaxed text-white/30">
        buildop is a fan-made project and is not affiliated with or endorsed by ArenaNet.
        Guild Wars 2 and all related logos and names are trademarks of ArenaNet, LLC.
      </p>
    </footer>
  );
}
