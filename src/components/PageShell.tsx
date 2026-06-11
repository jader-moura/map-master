import type { ReactNode } from "react";
import Link from "next/link";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";
import { SeoModal } from "@/components/seo/SeoModal";
import type { Faq, Crumb } from "@/lib/seo";

export type PageSeo = { heading: string; intro: ReactNode; faqs?: Faq[]; breadcrumb: Crumb[] };

// Shared app shell for non-map pages. Matches the map/boss-timer layout: a
// full-width header across the top, then the IconRail sidebar beside the
// scrollable content below it. `headerRight` is an optional slot for the
// top-right link(s).
export default function PageShell({
  title,
  headerRight,
  seo,
  children,
}: {
  /** Short page title shown as a badge in the header, like the map pages. */
  title?: string;
  headerRight?: ReactNode;
  /** Per-page SEO content shown in the info modal (opened from the sidebar). */
  seo?: PageSeo;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] flex-col bg-[#0a0a0f] text-white">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0d0d14] px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
            <Icon path={P.bolt} className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">buildop</span>
        </Link>
        {title && (
          <span className="hidden max-w-[45vw] truncate rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 sm:inline">
            {title}
          </span>
        )}
        {headerRight && <div className="ml-auto flex items-center gap-4">{headerRight}</div>}
      </header>

      <div className="flex min-h-0 flex-1">
        <IconRail showInfo={Boolean(seo)} />
        <main className="scroll-themed min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {seo && (
        <SeoModal heading={seo.heading} intro={seo.intro} faqs={seo.faqs} breadcrumb={seo.breadcrumb} />
      )}
    </div>
  );
}
