/**
 * Historical open dates are from a past cycle. To flag "the window is
 * approaching" for the *next* cycle, we project the same month/day forward
 * to the next occurrence on or after today.
 */
export function nextAnniversary(dateStr: string, today: Date = new Date()): Date {
  const source = new Date(dateStr);
  const candidate = new Date(today.getFullYear(), source.getUTCMonth(), source.getUTCDate());
  if (candidate < stripTime(today)) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(date: Date, today: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((stripTime(date).getTime() - stripTime(today).getTime()) / msPerDay);
}

export function isWindowApproaching(
  historicalOpenDate: string | null,
  windowDays = 14,
  today: Date = new Date()
): boolean {
  if (!historicalOpenDate) return false;
  const days = daysUntil(nextAnniversary(historicalOpenDate, today), today);
  return days >= 0 && days <= windowDays;
}
