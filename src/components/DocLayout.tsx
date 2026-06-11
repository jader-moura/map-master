import type { ReactNode } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";

// Shell for long-form text pages (privacy, about, terms, contact). Uses the
// shared PageShell so the header/sidebar layout matches the rest of the app.
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
    <PageShell
      title={title}
      headerRight={
        <Link href="/" className="text-sm text-white/55 transition hover:text-white">
          Back to map
        </Link>
      }
    >
      <article className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold">{title}</h1>
        {updated && <p className="mt-2 text-sm text-white/40">Last updated: {updated}</p>}
        <div className="doc mt-8 text-[15px] leading-relaxed text-white/70">{children}</div>
      </article>

      <Footer />
    </PageShell>
  );
}
