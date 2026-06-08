"use client";

import { useEffect, type ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon, P } from "@/components/icons";
import Footer from "@/components/Footer";
import { useSeoModal } from "@/components/seo/SeoModalContext";
import { faqJsonLd, breadcrumbJsonLd, type Faq, type Crumb } from "@/lib/seo";

// Per-page SEO content shown in a modal, opened from the sidebar info button.
//
// SEO note: the content is ALWAYS rendered into the (server-rendered) HTML and
// merely hidden with `display:none` while closed — it is never conditionally
// mounted. Googlebot therefore sees it in the DOM and indexes it, and because a
// real user can open it via the info button, it's a legitimate pattern (not
// hidden/cloaked text). FAQPage + BreadcrumbList JSON-LD are emitted regardless.
export function SeoModal({
  heading,
  intro,
  faqs = [],
  breadcrumb,
  children,
}: {
  heading: string;
  intro: ReactNode;
  faqs?: Faq[];
  breadcrumb: Crumb[];
  children?: ReactNode;
}) {
  const ctx = useSeoModal();
  const open = ctx?.open ?? false;
  const close = () => ctx?.setOpen(false);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className={
          open
            ? "fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6"
            : "hidden"
        }
      >
        {/* backdrop */}
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        />

        {/* panel — flex column so the header is flush at the very top and only the
            body scrolls */}
        <div className="relative z-10 flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white sm:text-xl">{heading}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <Icon path={P.close} className="h-5 w-5" />
            </button>
          </div>

          <div className="scroll-themed min-h-0 flex-1 overflow-y-auto">
            <div className="px-6 py-6">
              <div className="space-y-3 text-[15px] leading-relaxed text-white/65">
                {intro}
              </div>

              {children}

              {faqs.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-white">
                    Frequently asked questions
                  </h3>
                  <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
                    {faqs.map((f) => (
                      <div key={f.q} className="py-4">
                        <dt className="font-medium text-white/90">{f.q}</dt>
                        <dd className="mt-1.5 text-white/60">{f.a}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Internal links live inside the modal so they stay reachable while
                the base app is locked to the viewport. */}
            <Footer />
          </div>
        </div>
      </div>

      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
      <JsonLd data={breadcrumbJsonLd(breadcrumb)} />
    </>
  );
}
