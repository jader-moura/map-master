// Helpers for per-page structured data (JSON-LD). Kept framework-agnostic so
// they can be rendered from server components via the <JsonLd> component.

export const SITE_URL = "https://buildop.app";

export type Faq = { q: string; a: string };
export type Crumb = { name: string; path: string };

/** schema.org FAQPage — can produce expandable FAQ rich results in Google. */
export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** schema.org BreadcrumbList — shows the trail under the result title. */
export function breadcrumbJsonLd(trail: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}
