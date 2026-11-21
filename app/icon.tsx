import { LogoMark } from "@/components/brand/logo-mark";
import { BRAND_COLORS } from "@/lib/brand/logo-geometry";
import { ImageResponse } from "next/og";

/** Browser tab icon: matcha tile with the small (ray-less) mark, which stays crisp at 16–32px. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.matcha,
          borderRadius: 8,
        }}
      >
        <LogoMark variant="small" color={BRAND_COLORS.oat} size={24} />
      </div>
    ),
    size,
  );
}
