import { ImageResponse } from "next/og";

export const alt = "Nuvola Home - Contemporary Furniture Miami";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f3f0e9", color: "#191815", padding: "72px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #191815", fontFamily: "serif", fontSize: 32 }}>N</div>
        <div style={{ display: "flex", fontSize: 23, letterSpacing: "8px" }}>NUVOLA HOME</div>
      </div>
      <div style={{ display: "flex", fontFamily: "serif", fontSize: 88, lineHeight: 0.92, maxWidth: 800 }}>Contemporary furniture for considered living.</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}><span>MIAMI, FLORIDA</span><span>8217 BISCAYNE BOULEVARD</span></div>
    </div>,
    size,
  );
}
