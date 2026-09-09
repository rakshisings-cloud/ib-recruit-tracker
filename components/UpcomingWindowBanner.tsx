import { daysUntil, nextAnniversary } from "@/lib/dates";

export default function UpcomingWindowBanner({
  historicalOpenDate,
}: {
  historicalOpenDate: string | null;
}) {
  if (!historicalOpenDate) return null;
  const days = daysUntil(nextAnniversary(historicalOpenDate));
  if (days < 0 || days > 14) return null;

  return (
    <span className="window-tag">
      {days === 0 ? "window today" : `window in ${days}d`}
    </span>
  );
}
