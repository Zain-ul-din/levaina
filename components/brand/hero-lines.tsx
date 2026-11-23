import { cn } from "@/lib/utils";

/*
 * A minimal trail for the sign-in band: one dashed path winding up from the bottom left in a few
 * gentle switchbacks to a small matcha dot (the goal), with three faint contour lines around it,
 * like a footpath climbing a hill on a map. The dashes drift slowly toward the goal (.trail-walk).
 *
 * Strokes don't scale with the drawing, so they stay hairline-sharp at any size. The composition
 * keeps the goal near the centre, so a phone's narrower crop still shows where the trail leads.
 */

const GOAL = { x: 700, y: 120 };

/** Contour rings round the goal: slightly irregular, so they read as land, not targets. */
const CONTOURS = [
  "M640 120 C640 84 668 70 702 72 C738 74 762 94 760 122 C758 150 730 166 698 164 C664 162 640 150 640 120 Z",
  "M590 124 C586 70 640 36 706 38 C776 40 820 80 816 128 C812 180 760 206 698 204 C632 202 594 176 590 124 Z",
  "M536 130 C528 52 610 0 712 4 C812 8 878 66 872 134 C866 206 794 250 700 248 C604 246 544 204 536 130 Z",
];

const TRAIL =
  "M-40 410 C80 360 170 380 250 330 S330 250 420 270 S560 300 600 230 S600 150 650 138 S688 126 700 120";

export function HeroLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("block", className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Contours: barely there, just enough to suggest a hill. */}
      <g stroke="var(--hero-line)" strokeOpacity={0.16} strokeWidth={1}>
        {CONTOURS.map((d) => (
          <path key={d} d={d} style={{ vectorEffect: "non-scaling-stroke" }} />
        ))}
      </g>

      {/* The trail: short dashes, drifting toward the goal. */}
      <path
        d={TRAIL}
        stroke="var(--hero-line)"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeDasharray="6 9"
        className="trail-walk"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* The goal. */}
      <circle
        cx={GOAL.x}
        cy={GOAL.y}
        r={11}
        stroke="var(--hero-accent)"
        strokeOpacity={0.45}
        strokeWidth={1.2}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />
      <circle cx={GOAL.x} cy={GOAL.y} r={4.5} fill="var(--hero-accent)" />
    </svg>
  );
}
