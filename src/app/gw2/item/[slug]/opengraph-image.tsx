import { ImageResponse } from "next/og";
import { getItem } from "@/lib/gw2/api";
import { parseItemId, rarityColor } from "@/lib/gw2/items";

export const alt = "Guild Wars 2 item";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-item social card: big icon + name + rarity, on the buildop dark theme.
// Far better than sharing the bare 64px item icon as the OG image.
export default async function ItemOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseItemId(slug);
  const item = id !== null ? await getItem(id).catch(() => null) : null;

  const name = item?.name ?? "Guild Wars 2 item";
  const rarity = item?.rarity ?? null;
  const type = item?.details?.type ?? item?.type ?? null;
  const accent = rarityColor(rarity ?? "") || "#f59e0b";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0a0a0f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {item?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.icon}
              alt=""
              width={180}
              height={180}
              style={{ borderRadius: 28, border: `4px solid ${accent}` }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            {rarity ? (
              <div style={{ fontSize: 34, fontWeight: 700, color: accent, marginBottom: 12 }}>
                {[rarity, type].filter(Boolean).join(" · ")}
              </div>
            ) : null}
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
              {name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, color: "#9ca3af" }}>
            Recipes · acquisition · live Trading Post price
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#f59e0b" }}>buildop.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
