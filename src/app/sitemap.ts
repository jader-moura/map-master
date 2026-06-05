import type { MetadataRoute } from "next";

const SITE_URL = "https://buildop.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/bosses`, lastModified, changeFrequency: "daily", priority: 0.9 },
  ];
}
