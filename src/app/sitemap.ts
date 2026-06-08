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
  ];
}
