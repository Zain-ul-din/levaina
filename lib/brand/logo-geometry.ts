/**
 * The Morning Bowl logo: a sun rising out of a bowl (a new day, healing, warm food).
 * Single source of truth for its shapes, drawn on a 100×100 grid. The header mark,
 * the favicon and the Apple touch icon are all rendered from these paths.
 */
export const LOGO_VIEWBOX = "0 0 100 100";

/** Bowl body with its foot, so it reads as a food bowl rather than a hemisphere. */
export const BOWL_PATHS = [
  "M12 56h76c0 15-16 26-38 26S12 71 12 56z",
  "M38 80h24l-2.5 7.5h-19z",
];

/** The sun, sitting just above the rim (the gap keeps the two shapes distinct). */
export const SUN_PATH = "M31 51a19 19 0 0 1 38 0z";

/** Three short rounded rays. Dropped below ~24px, where they turn into specks. */
export const RAYS_PATH = "M50 24v-6.5M30.9 31.9l-4.6-4.6M69.1 31.9l4.6-4.6";
export const RAY_STROKE_WIDTH = 6.5;

/** Brand colours used by the generated icons (the UI itself uses CSS tokens). */
export const BRAND_COLORS = { oat: "#f3f0e7", matcha: "#5e7a2e" } as const;
