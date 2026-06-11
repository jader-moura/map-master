import Link from "next/link";
import { Icon, P } from "@/components/icons";
import CopyWaypoint from "@/components/CopyWaypoint";

// Shared vendor list-card: portrait image + name + location, with an optional
// item count (vendor directory) or cost (item "Sold by" list), plus an optional
// copy-waypoint button for the vendor's primary location. Plain component so it
// works in both server pages and the client directory.
export type VendorCardData = {
  slug: string;
  name: string;
  icon: string | null;
  location: string | null;
};

export function VendorCard({
  vendor,
  itemCount,
  cost,
  waypoint,
}: {
  vendor: VendorCardData;
  itemCount?: number;
  cost?: string | null;
  /** Chat code of the vendor's primary location; shows a copy button when set. */
  waypoint?: string | null;
}) {
  return (
    <div className="flex items-stretch gap-1 rounded-lg border border-white/10 bg-white/[0.03] transition hover:border-orange-400/30">
      <Link
        href={`/gw2/vendor/${vendor.slug}`}
        className="flex min-w-0 flex-1 items-center gap-3 p-2 text-sm text-white/75 transition hover:text-orange-400"
      >
        {vendor.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.icon}
            alt=""
            loading="lazy"
            width={60}
            height={104}
            className="h-[104px] w-[60px] shrink-0 rounded-md border border-white/10 object-cover"
          />
        ) : (
          <span className="grid h-[104px] w-[60px] shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-white/30">
            <Icon path={P.store} className="h-7 w-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white/85">{vendor.name}</p>
          {vendor.location && <p className="mt-0.5 truncate text-xs text-white/45">{vendor.location}</p>}
          {cost ? (
            <p className="mt-1 truncate text-xs text-orange-300/80">{cost}</p>
          ) : itemCount ? (
            <p className="mt-1 text-xs text-white/35">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </Link>
      {waypoint && (
        <div className="flex items-center pr-2">
          <CopyWaypoint code={waypoint} compact />
        </div>
      )}
    </div>
  );
}
