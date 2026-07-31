import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Nexus Digital Agency — engineering the future of brand";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated at the edge rather than shipped as a static asset, so the card
 * always matches the brand tokens and never becomes a stale binary in the repo.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #0c1513 0%, #0f1c19 55%, #123028 100%)",
          color: "#f2f6f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#43c793",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#04120d",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>
            Nexus Digital Agency
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Engineering the future of brand.
          </div>
          <div style={{ fontSize: 28, color: "#9fb0ab", maxWidth: 820 }}>
            Commerce, content and measurement — built end to end.
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, fontSize: 20, color: "#7e918c" }}>
          <span>nexus.agency</span>
          <span>·</span>
          <span>Strategy</span>
          <span>·</span>
          <span>Design</span>
          <span>·</span>
          <span>Engineering</span>
        </div>
      </div>
    ),
    size
  );
}
