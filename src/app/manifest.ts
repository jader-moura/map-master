import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "buildop — Guild Wars 2 Map & World Boss Timer",
    short_name: "buildop",
    description:
      "A free Guild Wars 2 companion: live world boss timer and an interactive Tyria map.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    categories: ["games", "utilities"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
