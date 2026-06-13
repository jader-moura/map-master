"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, P } from "@/components/icons";
import { useSeoModal } from "@/components/seo/SeoModalContext";

const NAV_KEY = "nav-expanded";

// IconRail is rendered inside each page (it remounts on every navigation), so we
// must restore the saved open/closed state BEFORE the browser paints, otherwise
// every URL change briefly flashes the collapsed rail then snaps open. A layout
// effect runs before paint; fall back to useEffect during SSR to avoid warnings.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const LINKS = [
  { href: "/", path: P.home, label: "Map" },
  { href: "/gw2-world-boss-timer", path: P.swords, label: "World boss timer" },
  { href: "/gw2-event-timer", path: P.clock, label: "Event timeline" },
  { href: "/gw2-reset-timer", path: P.refresh, label: "Reset timer" },
  { href: "/gw2-gathering-map", path: P.pickaxe, label: "Gathering map" },
  { href: "/gw2-trading-post", path: P.coins, label: "Trading Post" },
  { href: "/gw2-gems", path: P.gem, label: "Gem calculator" },
  { href: "/gw2/items", path: P.list, label: "Item database" },
  { href: "/gw2/vendors", path: P.store, label: "Vendors" },
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
  const [expanded, setExpanded] = useState(false);
  // The width transition is enabled only after the saved state is applied, so a
  // remount on navigation snaps straight to the saved width instead of animating
  // collapsed -> open (which looked like the rail briefly closing and reopening).
  const [animate, setAnimate] = useState(false);

  // Restore saved state before paint (no flash on navigation).
  useIsomorphicLayoutEffect(() => {
    try {
      const raw = window.localStorage.getItem(NAV_KEY);
      if (raw != null) setExpanded(JSON.parse(raw) as boolean);
    } catch {
      /* ignore unavailable storage */
    }
  }, []);

  // After the first paint (state already applied), allow width animations on
  // user toggles.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () =>
    setExpanded((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(NAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore unavailable storage */
      }
      return next;
    });

  // Shared classes for an item (nav link or button) that adapts to the rail width.
  const itemCls = (active: boolean, dim = false) =>
    [
      "flex h-10 items-center rounded-lg transition",
      expanded ? "w-full gap-3 px-3" : "w-10 justify-center",
      active
        ? "bg-orange-500/15 text-orange-400"
        : `${dim ? "text-white/30" : "text-white/40"} hover:bg-white/5 hover:text-white`,
    ].join(" ");

  return (
    <nav
      className={[
        "scroll-themed flex shrink-0 flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0d0d14] py-3",
        animate ? "transition-[width] duration-200" : "",
        expanded ? "w-56 items-stretch px-2" : "w-14 items-center",
      ].join(" ")}
    >
      {/* Expand / collapse toggle */}
      <button
        type="button"
        onClick={toggle}
        title={expanded ? "Collapse menu" : "Expand menu"}
        aria-label={expanded ? "Collapse menu" : "Expand menu"}
        aria-expanded={expanded}
        className={itemCls(false)}
      >
        <Icon path={P.menu} className="h-5 w-5 shrink-0" />
        {expanded && <span className="truncate text-sm font-medium">Menu</span>}
      </button>

      <span aria-hidden className={expanded ? "my-1 h-px w-full bg-white/10" : "my-1 h-px w-7 bg-white/10"} />

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
            className={itemCls(active)}
          >
            <Icon path={it.path} className="h-5 w-5 shrink-0" />
            {expanded && <span className="truncate text-sm">{it.label}</span>}
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
              className={itemCls(active, true)}
            >
              <Icon path={it.path} className="h-[18px] w-[18px] shrink-0" />
              {expanded && <span className="truncate text-sm">{it.label}</span>}
            </Link>
          );
        })}

        {showInfo && (
          <>
            <span aria-hidden className={expanded ? "my-1.5 h-px w-full bg-white/10" : "my-1.5 h-px w-7 bg-white/10"} />
            <button
              type="button"
              onClick={() => seo?.setOpen(true)}
              title="About this page & FAQ"
              aria-label="About this page & FAQ"
              className={[
                "flex h-9 items-center rounded-full border border-white/15 bg-white/5 text-white/60 transition hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-400",
                expanded ? "w-full gap-3 px-3" : "w-9 justify-center",
              ].join(" ")}
            >
              <Icon path={P.info} className="h-[18px] w-[18px] shrink-0" />
              {expanded && <span className="truncate text-sm">About this page &amp; FAQ</span>}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
