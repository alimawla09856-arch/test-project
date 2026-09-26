/** Arabic-locale presentation helpers for the client portal (kept separate from `format.ts`, which the English admin dashboard also uses). */

/** Arabic plural rules for "week": 1 أسبوع، 2 أسبوعين، 3–10 أسابيع، 11+ أسبوعاً. */
export function formatWeeksAr(weeks: number): string {
  const rounded = Math.round(weeks * 2) / 2;
  const word = rounded === 1 ? "أسبوع" : rounded === 2 ? "أسبوعين" : rounded <= 10 ? "أسابيع" : "أسبوعاً";
  return `${rounded} ${word}`;
}
