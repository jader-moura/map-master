import type { MetadataRoute } from "next";

const SITE_URL = "https://buildop.app";

export const revalidate = 86400;

// We expose a sitemap index at /sitemap_index.xml that references every chunk
// (generateSitemaps emits /sitemap/0.xml … N.xml but no index of its own).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE_URL}/sitemap_index.xml`,
    host: SITE_URL,
  };
}
