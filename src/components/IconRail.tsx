"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, P } from "@/components/icons";

const LINKS = [
  { href: "/", path: P.home, label: "Map" },
  { href: "/bosses", path: P.list, label: "Boss timers" },
];

export default function IconRail() {
  const pathname = usePathname();
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
      <span
        className="mt-auto grid h-10 w-10 cursor-default place-items-center rounded-lg text-white/25"
        title="More coming soon"
      >
        <Icon path={P.info} />
      </span>
    </nav>
  );
}
