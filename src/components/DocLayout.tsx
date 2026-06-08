import type { ReactNode } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import IconRail from "@/components/IconRail";
import { Icon, P } from "@/components/icons";

// Shell for long-form text pages (privacy, about, terms, contact). Keeps the same
// IconRail navigation as the rest of the app so users can jump straight back to
// any tool. The root body is locked to the viewport, so the content column owns
// its own vertical scroll.
export default function DocLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] bg-[#0a0a0f] text-white">
      <IconRail showInfo={false} />

      <main className="scroll-themed min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0d0d14]/95 px-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-black">
              <Icon path={P.bolt} className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight">buildop</span>
          </Link>
          <Link
            href="/"
            className="ml-auto text-sm text-white/55 transition hover:text-white"
          >
            Back to map
          </Link>
        </header>

        <article className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-bold">{title}</h1>
          {updated && (
            <p className="mt-2 text-sm text-white/40">Last updated: {updated}</p>
          )}
          <div className="doc mt-8 text-[15px] leading-relaxed text-white/70">
            {children}
          </div>
        </article>

        <Footer />
      </main>
    </div>
  );
}
