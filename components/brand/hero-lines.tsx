import { cn } from "@/lib/utils";

/*
 * Line illustration for the sign-in band: crisp single-weight strokes on a solid colour.
 * Every mark means something:
 *   - the sun rising out of a bowl (the logo's idea), with rings and short rays
 *   - one long flowing line across the band: digestion, and the journey you're on
 *   - leaves along that line: food and growth
 *   - small bubbles by the bowl: the levain (sourdough starter) in the name
 * Strokes don't scale with the drawing (vector-effect), so they stay sharp at any size, and the
 * composition is centred on the bowl, so a phone's narrower crop still keeps the meaning.
 */

const LEAF = "M0 0 C12 -16 34 -16 46 0 C34 16 12 16 0 0 Z M0 0 L46 0";
const RAY_ANGLES = [30, 55, 80, 105, 130, 150];
const SUN = { x: 620, y: 192 };

const ray = (deg: number) => {
  const rad = (deg * Math.PI) / 180;
  const from = 138;
  const to = 156;
  return `M${SUN.x + Math.cos(rad) * from} ${SUN.y - Math.sin(rad) * from} L${SUN.x + Math.cos(rad) * to} ${SUN.y - Math.sin(rad) * to}`;
};

/** Each line draws itself in once, in order (see .line-draw); --d is its start delay. */
function Line({ d, delay, className, ...rest }: { d: string; delay: number; className?: string } & React.SVGProps<SVGPathElement>) {
  return (
    <path
      d={d}
      pathLength={1}
      className={cn("line-draw", className)}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
      {...rest}
    />
  );
}

export function HeroLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("block", className)}
      fill="none"
      stroke="var(--hero-line)"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g vectorEffect="non-scaling-stroke" style={{ vectorEffect: "non-scaling-stroke" }}>
        {/* The journey: one unbroken line from edge to edge, passing behind the sun. */}
        <Line
          delay={0}
          d="M-20 150 C110 70 230 230 360 170 S520 60 600 120 S780 230 900 160 S1080 60 1220 110"
        />

        {/* Leaves along the journey. */}
        <g transform="translate(318 186) rotate(-32)">
          <Line delay={260} d={LEAF} />
        </g>
        <g transform="translate(860 176) rotate(18)">
          <Line delay={320} d={LEAF} />
        </g>
        <g transform="translate(1030 96) rotate(-14) scale(0.8)">
          <Line delay={380} d={LEAF} />
        </g>

        {/* The bowl. */}
        <Line delay={120} d="M520 206 H720 C720 252 676 282 620 282 C564 282 520 252 520 206 Z" />
        <Line delay={160} d="M596 282 L600 298 H640 L644 282" />

        {/* The sun rising out of it: a half disc, two rings, short rays (the one warm accent). */}
        <g stroke="var(--hero-accent)">
          <Line delay={220} d={`M${SUN.x - 64} ${SUN.y} A64 64 0 0 1 ${SUN.x + 64} ${SUN.y}`} />
          <Line delay={300} d={`M${SUN.x - 98} ${SUN.y} A98 98 0 0 1 ${SUN.x + 98} ${SUN.y}`} />
          <Line
            delay={360}
            d={`M${SUN.x - 128} ${SUN.y} A128 128 0 0 1 ${SUN.x + 128} ${SUN.y}`}
            strokeDasharray="0.012 0.02"
          />
          {RAY_ANGLES.map((deg, i) => (
            <Line key={deg} delay={420 + i * 30} d={ray(deg)} />
          ))}
        </g>

        {/* Levain bubbles rising beside the bowl. */}
        {[
          [778, 200, 7],
          [800, 172, 4.5],
          [774, 150, 3],
          [462, 196, 5],
          [444, 170, 3],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} className="line-fade" style={{ "--d": `${520 + i * 40}ms` } as React.CSSProperties} />
        ))}

        {/* A few seeds scattered along the left, for texture. */}
        {[
          [140, 250],
          [176, 272],
          [214, 246],
          [1110, 210],
          [1146, 232],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={1.6} fill="var(--hero-line)" stroke="none" className="line-fade" style={{ "--d": `${600 + i * 30}ms` } as React.CSSProperties} />
        ))}
      </g>
    </svg>
  );
}
