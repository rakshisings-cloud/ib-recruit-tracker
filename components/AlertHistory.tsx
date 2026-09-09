export type AlertRow = {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  message: string | null;
  emailedAt: string | null;
  createdAt: string;
};

export default function AlertHistory({ alerts }: { alerts: AlertRow[] }) {
  if (alerts.length === 0) {
    return <p className="muted">No status changes recorded yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>When</th>
          <th>Change</th>
          <th>Detail</th>
          <th>Emailed</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map((a) => (
          <tr key={a.id}>
            <td className="muted">{new Date(a.createdAt).toLocaleString()}</td>
            <td>
              {a.previousStatus ?? "unknown"} → {a.newStatus}
            </td>
            <td className="muted">{a.message}</td>
            <td className="muted">{a.emailedAt ? "yes" : "no"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
