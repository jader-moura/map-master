import type { MetadataRoute } from "next";

const SITE_URL = "https://buildop.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/gw2-world-boss-timer`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/gw2-event-timer`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/gw2-gathering-map`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/gw2-trading-post`, lastModified, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE_URL}/gw2/items`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
