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

/**
 * schema.org Product for a GW2 item. We deliberately omit `offers`: the Trading
 * Post trades in in-game gold, not an ISO-4217 currency, so a real-money Offer
 * would be misleading and rejected by Google. We still emit a Product entity
 * (image, brand, attributes) so search engines understand the page subject.
 */
export function itemProductJsonLd(p: {
  id: number;
  name: string;
  url: string;
  image?: string | null;
  description?: string | null;
  rarity?: string | null;
  type?: string | null;
  level?: number | null;
}) {
  const props: object[] = [];
  if (p.rarity) props.push({ "@type": "PropertyValue", name: "Rarity", value: p.rarity });
  if (p.type) props.push({ "@type": "PropertyValue", name: "Type", value: p.type });
  if (p.level) props.push({ "@type": "PropertyValue", name: "Required level", value: String(p.level) });
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}${p.url}#product`,
    name: p.name,
    url: `${SITE_URL}${p.url}`,
    sku: `gw2-item-${p.id}`,
    category: p.type || "Guild Wars 2 item",
    brand: { "@type": "Brand", name: "Guild Wars 2" },
    ...(p.image ? { image: p.image } : {}),
    ...(p.description ? { description: p.description.slice(0, 5000) } : {}),
    ...(props.length ? { additionalProperty: props } : {}),
  };
}

/**
 * schema.org ItemList — used on vendor / achievement pages to describe the set
 * of items they sell or reward, with crawlable links to each item page.
 */
export function itemListJsonLd(
  name: string,
  url: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${SITE_URL}${url}`,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${SITE_URL}${it.path}`,
    })),
  };
}

/** schema.org WebSite with a SearchAction (enables the sitelinks search box). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "buildop",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/gw2/items?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** schema.org Organization — ties the brand + logo together for knowledge panel. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "buildop",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  };
}
