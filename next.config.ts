import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 308 permanent redirects from the old short slugs to the keyword-rich SEO
  // slugs, so any existing/bookmarked links (and crawled URLs) don't 404.
  async redirects() {
    return [
      { source: "/bosses", destination: "/gw2-world-boss-timer", permanent: true },
      { source: "/timeline", destination: "/gw2-event-timer", permanent: true },
      { source: "/gather", destination: "/gw2-gathering-map", permanent: true },
      { source: "/market", destination: "/gw2-trading-post", permanent: true },
    ];
  },
};

export default nextConfig;
