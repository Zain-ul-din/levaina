import { LogoMark } from "@/components/brand/logo-mark";
import { BRAND_COLORS } from "@/lib/brand/logo-geometry";
import { ImageResponse } from "next/og";

/**
 * Home-screen icon: the full mark in matcha on oat. Full-bleed square on purpose:
 * iOS applies its own rounded mask, so no corner radius here.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.oat,
        }}
      >
        <LogoMark variant="full" color={BRAND_COLORS.matcha} size={124} />
      </div>
    ),
    size,
  );
}
