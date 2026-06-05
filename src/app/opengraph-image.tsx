import { ImageResponse } from "next/og";

export const alt = "buildop — Guild Wars 2 Map & World Boss Timer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0a0a0f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "linear-gradient(135deg, #f97316, #d97706)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="#0a0a0f">
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
          </div>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3 }}>buildop</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 46, fontWeight: 700, color: "#e5e7eb" }}>
          Guild Wars 2 Map &amp; World Boss Timer
        </div>
        <div style={{ marginTop: 18, fontSize: 30, color: "#9ca3af" }}>
          Live boss spawns · waypoints, vistas, hearts, hero points &amp; portals
        </div>
        <div style={{ marginTop: 52, fontSize: 30, fontWeight: 600, color: "#f59e0b" }}>
          buildop.app
        </div>
      </div>
    ),
    { ...size },
  );
}
