import Link from "next/link";
import { notFound } from "next/navigation";
import { getFirmDetail } from "@/lib/queries";
import FirmForm from "@/components/FirmForm";
import StatusBadge from "@/components/StatusBadge";
import CheckNowButton from "@/components/CheckNowButton";
import WatchTargetManager from "@/components/WatchTargetManager";
import AlertHistory from "@/components/AlertHistory";

export const dynamic = "force-dynamic";

export default async function FirmDetailPage(props: PageProps<"/firms/[id]">) {
  const { id } = await props.params;
  const firm = await getFirmDetail(id);
  if (!firm) notFound();

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1>{firm.name}</h1>
          <StatusBadge status={firm.status} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <CheckNowButton firmId={firm.id} />
          <Link href="/" className="btn">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <FirmForm
        initial={{
          id: firm.id,
          name: firm.name,
          ticker: firm.ticker ?? "",
          institutionType: firm.institutionType,
          targetLocation: firm.targetLocation ?? "",
          historicalOpenDate: firm.historicalOpenDate ?? "",
          notes: firm.notes ?? "",
        }}
      />

      <WatchTargetManager
        firmId={firm.id}
        targets={firm.watchTargets.map((t) => ({
          id: t.id,
          url: t.url,
          cssSelector: t.cssSelector,
          keywords: t.keywords as string[],
          fetchStrategy: t.fetchStrategy,
          isActive: t.isActive,
        }))}
      />

      <div className="card">
        <h3 style={{ marginBottom: "0.75rem" }}>Alert History</h3>
        <AlertHistory
          alerts={firm.alerts.map((a) => ({
            id: a.id,
            previousStatus: a.previousStatus,
            newStatus: a.newStatus,
            message: a.message,
            emailedAt: a.emailedAt ? a.emailedAt.toString() : null,
            createdAt: a.createdAt.toString(),
          }))}
        />
      </div>
    </div>
  );
}
