const LABELS: Record<string, string> = {
  unknown: "Unknown",
  not_open: "Not Open",
  open: "Application Open",
  does_not_sponsor: "Does Not Sponsor",
  error: "Check Error",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] ?? status}</span>;
}
