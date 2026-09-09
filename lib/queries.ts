import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { firms, watchTargets, checkRuns, alerts } from "@/db/schema";
import type { FirmRow } from "@/components/FirmTable";

export async function getFirmsForDashboard(): Promise<FirmRow[]> {
  const rows = await db.query.firms.findMany({
    orderBy: [firms.name],
    with: {
      watchTargets: {
        with: {
          checkRuns: {
            orderBy: [desc(checkRuns.checkedAt)],
            limit: 1,
          },
        },
      },
    },
  });

  return rows.map((firm) => {
    const activeTarget = firm.watchTargets.find((t) => t.isActive) ?? firm.watchTargets[0];
    const lastCheck = firm.watchTargets
      .flatMap((t) => t.checkRuns)
      .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())[0];

    return {
      id: firm.id,
      name: firm.name,
      ticker: firm.ticker,
      institutionType: firm.institutionType,
      targetLocation: firm.targetLocation,
      historicalOpenDate: firm.historicalOpenDate,
      actualOpenDate: firm.actualOpenDate,
      status: firm.status,
      lastCheckedAt: lastCheck ? lastCheck.checkedAt.toString() : null,
      careersUrl: activeTarget?.url ?? null,
    };
  });
}

export async function getFirmDetail(firmId: string) {
  const firm = await db.query.firms.findFirst({
    where: eq(firms.id, firmId),
    with: {
      watchTargets: {
        orderBy: [desc(watchTargets.createdAt)],
      },
      alerts: {
        orderBy: [desc(alerts.createdAt)],
        limit: 20,
      },
    },
  });
  return firm ?? null;
}
