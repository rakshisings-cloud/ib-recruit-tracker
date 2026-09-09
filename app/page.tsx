import Link from "next/link";
import FirmTable from "@/components/FirmTable";
import { getFirmsForDashboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const firms = await getFirmsForDashboard();

  return (
    <div className="container">
      <div className="page-header">
        <h1>IB Recruit Tracker</h1>
        <Link href="/firms/new" className="btn btn-primary">
          + Add Firm
        </Link>
      </div>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        {firms.length} firms tracked. Firms whose historical open window falls within the next 14
        days are highlighted.
      </p>
      <FirmTable firms={firms} />
    </div>
  );
}
