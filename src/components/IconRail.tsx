"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, P } from "@/components/icons";
import { useSeoModal } from "@/components/seo/SeoModalContext";

const LINKS = [
  { href: "/", path: P.home, label: "Map" },
  { href: "/gw2-world-boss-timer", path: P.swords, label: "Event & boss timers" },
  { href: "/gw2-event-timer", path: P.clock, label: "Event timeline" },
  { href: "/gw2-gathering-map", path: P.pickaxe, label: "Gathering map" },
  { href: "/gw2-trading-post", path: P.coins, label: "Trading Post & materials" },
];

export default function IconRail({
  onToggleActive,
}: {
  /** Called when the icon for the current page is clicked (toggles its panel). */
  onToggleActive?: () => void;
}) {
  const pathname = usePathname();
  const seo = useSeoModal();
  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-[#0d0d14] py-3">
      {LINKS.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            title={it.label}
            aria-label={it.label}
            onClick={
              active && onToggleActive
                ? (e) => {
                    e.preventDefault();
                    onToggleActive();
                  }
                : undefined
            }
            className={[
              "grid h-10 w-10 place-items-center rounded-lg transition",
              active
                ? "bg-orange-500/15 text-orange-400"
                : "text-white/40 hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            <Icon path={it.path} />
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => seo?.setOpen(true)}
        title="About this page & FAQ"
        aria-label="About this page & FAQ"
        className="mt-auto grid h-10 w-10 place-items-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <Icon path={P.info} />
      </button>
    </nav>
  );
}
