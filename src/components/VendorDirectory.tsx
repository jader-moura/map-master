"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, P } from "@/components/icons";

type Vendor = { slug: string; name: string; item_count: number };

export default function VendorDirectory({ vendors }: { vendors: Vendor[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(needle));
  }, [q, vendors]);

  return (
    <div>
      <div className="relative">
        <Icon
          path={P.search}
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter vendors by name, e.g. Candy Corn, Artisan, Laurel"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-orange-400/40 focus:outline-none"
        />
      </div>

      <p className="mt-3 text-xs text-white/40">
        {filtered.length.toLocaleString()} vendor{filtered.length === 1 ? "" : "s"}
        {q.trim() ? ` matching “${q.trim()}”` : ""}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v.slug}
              href={`/gw2/vendor/${v.slug}`}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75 transition hover:border-orange-400/30 hover:text-orange-400"
            >
              <span className="truncate">{v.name}</span>
              {v.item_count > 0 && (
                <span className="ml-auto shrink-0 text-xs text-white/40">{v.item_count}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
          No vendors match that filter.
        </p>
      )}
    </div>
  );
}
