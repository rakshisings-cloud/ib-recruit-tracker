"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import UpcomingWindowBanner from "./UpcomingWindowBanner";
import CheckNowButton from "./CheckNowButton";
import { daysUntil, nextAnniversary, isWindowApproaching } from "@/lib/dates";

export type FirmRow = {
  id: string;
  name: string;
  ticker: string | null;
  institutionType: string;
  targetLocation: string | null;
  historicalOpenDate: string | null;
  actualOpenDate: string | null;
  status: string;
  lastCheckedAt: string | null;
  careersUrl: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  bulge_bracket: "Bulge Bracket",
  elite_boutique: "Elite Boutique",
  private_equity: "Private Equity",
  middle_market: "Middle Market",
};

export default function FirmTable({ firms }: { firms: FirmRow[] }) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const types = useMemo(
    () => Array.from(new Set(firms.map((f) => f.institutionType))),
    [firms]
  );

  const sorted = useMemo(() => {
    return [...firms]
      .filter((f) => !typeFilter || f.institutionType === typeFilter)
      .sort((a, b) => {
        const aApproaching = isWindowApproaching(a.historicalOpenDate);
        const bApproaching = isWindowApproaching(b.historicalOpenDate);
        if (aApproaching !== bApproaching) return aApproaching ? -1 : 1;
        const aDays = a.historicalOpenDate
          ? daysUntil(nextAnniversary(a.historicalOpenDate))
          : Infinity;
        const bDays = b.historicalOpenDate
          ? daysUntil(nextAnniversary(b.historicalOpenDate))
          : Infinity;
        return aDays - bDays;
      });
  }, [firms, typeFilter]);

  return (
    <div>
      <div className="filter-bar">
        <button data-active={typeFilter === null} onClick={() => setTypeFilter(null)}>
          All
        </button>
        {types.map((t) => (
          <button key={t} data-active={typeFilter === t} onClick={() => setTypeFilter(t)}>
            {TYPE_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Firm</th>
            <th>Type</th>
            <th>Status</th>
            <th>Historical Open</th>
            <th>Location</th>
            <th>Last Checked</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((firm) => (
            <tr key={firm.id} className={isWindowApproaching(firm.historicalOpenDate) ? "approaching" : ""}>
              <td>
                <Link href={`/firms/${firm.id}`}>{firm.name}</Link>
                {firm.ticker && <span className="muted"> ({firm.ticker})</span>}
                <UpcomingWindowBanner historicalOpenDate={firm.historicalOpenDate} />
              </td>
              <td>{TYPE_LABELS[firm.institutionType] ?? firm.institutionType}</td>
              <td>
                <StatusBadge status={firm.status} />
              </td>
              <td className="muted">{firm.historicalOpenDate ?? "—"}</td>
              <td className="muted">{firm.targetLocation ?? "—"}</td>
              <td className="muted">
                {firm.lastCheckedAt ? new Date(firm.lastCheckedAt).toLocaleString() : "never"}
              </td>
              <td>
                <CheckNowButton firmId={firm.id} />
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No firms yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
