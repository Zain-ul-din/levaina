/**
 * "Saturday, 21 November 2026, 17:42 (2026-11-21, Asia/Karachi, GMT+5)": spelled out, because
 * models skim past a bare ISO date. The ISO date is the local one, used for episode dates.
 */
export function formatNow(now: Date, timeZone: string) {
  const part = (options: Intl.DateTimeFormatOptions, locale = "en-GB") =>
    new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(now);
  const date = part({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = part({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const isoDate = part({ year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
  const offset = part({ timeZoneName: "shortOffset" }).split(" ").pop();
  return `${date}, ${time} (${isoDate}, ${timeZone}, ${offset})`;
}
