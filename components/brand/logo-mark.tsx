import {
  BOWL_PATHS,
  LOGO_VIEWBOX,
  RAY_STROKE_WIDTH,
  RAYS_PATH,
  SUN_PATH,
} from "@/lib/brand/logo-geometry";

type LogoMarkProps = {
  /** "full" with rays for 24px and up; "small" without rays for favicons and tiny sizes. */
  variant?: "full" | "small";
  /** Defaults to currentColor so it follows text colour (and dark mode) in the UI. */
  color?: string;
  size?: number | string;
  className?: string;
};

/**
 * The Morning Bowl mark. Plain SVG with inline attributes and no hooks, so it renders
 * the same in the app and inside next/og ImageResponse (the generated app icons).
 */
export function LogoMark({ variant = "full", color = "currentColor", size, className }: LogoMarkProps) {
  return (
    <svg viewBox={LOGO_VIEWBOX} width={size} height={size} className={className} aria-hidden="true">
      {BOWL_PATHS.map((d) => (
        <path key={d} d={d} fill={color} />
      ))}
      <path d={SUN_PATH} fill={color} />
      {variant === "full" && (
        <path d={RAYS_PATH} fill="none" stroke={color} strokeWidth={RAY_STROKE_WIDTH} strokeLinecap="round" />
      )}
    </svg>
  );
}
