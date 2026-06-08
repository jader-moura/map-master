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

// Secondary, lower-priority links shown at the very bottom of the rail, set apart
// from the main navigation above.
const SECONDARY = [
  { href: "/about", path: P.user, label: "About buildop" },
  { href: "/privacy", path: P.shield, label: "Privacy policy" },
  { href: "/terms", path: P.doc, label: "Terms of service" },
  { href: "/contact", path: P.mail, label: "Contact" },
];

export default function IconRail({
  onToggleActive,
  showInfo = true,
}: {
  /** Called when the icon for the current page is clicked (toggles its panel). */
  onToggleActive?: () => void;
  /** Show the page FAQ/info button. Off on pages with no SEO modal (e.g. docs). */
  showInfo?: boolean;
}) {
  const pathname = usePathname();
  const seo = useSeoModal();
  return (
    <nav className="scroll-themed flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-white/10 bg-[#0d0d14] py-3">
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
      {/* Bottom cluster: institutional links, then a divider, then the page
          FAQ/info button (styled distinctly as an action, not a nav item). */}
      <div className="mt-auto flex w-full flex-col items-center gap-1 pt-1">
        {SECONDARY.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              title={it.label}
              aria-label={it.label}
              className={[
                "grid h-9 w-9 place-items-center rounded-lg transition",
                active
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-white/30 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon path={it.path} className="h-[18px] w-[18px]" />
            </Link>
          );
        })}

        {showInfo && (
          <>
            <span aria-hidden className="my-1.5 h-px w-7 bg-white/10" />
            <button
              type="button"
              onClick={() => seo?.setOpen(true)}
              title="About this page & FAQ"
              aria-label="About this page & FAQ"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/60 transition hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-400"
            >
              <Icon path={P.info} className="h-[18px] w-[18px]" />
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
