import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { watchTargets } from "@/db/schema";
import { runOne } from "@/scraper/runOne";

async function dispatchWorkflow(firmId: string) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_DISPATCH_TOKEN } = process.env;
  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_DISPATCH_TOKEN) {
    throw new Error("GitHub dispatch is not configured (GITHUB_OWNER/GITHUB_REPO/GITHUB_DISPATCH_TOKEN)");
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/scrape.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_DISPATCH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { firm_id: firmId } }),
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub dispatch failed: ${res.status} ${await res.text()}`);
  }
}

export async function POST(_req: Request, ctx: RouteContext<"/api/check-now/[firmId]">) {
  const { firmId } = await ctx.params;

  const targets = await db.query.watchTargets.findMany({
    where: and(eq(watchTargets.firmId, firmId), eq(watchTargets.isActive, true)),
  });

  if (targets.length === 0) {
    return NextResponse.json({ error: "No active watch target for this firm" }, { status: 400 });
  }

  const needsBrowser = targets.some((t) => t.fetchStrategy === "browser");

  if (needsBrowser) {
    try {
      await dispatchWorkflow(firmId);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
    return NextResponse.json({ queued: true });
  }

  const results = await Promise.all(targets.map((t) => runOne(t)));
  return NextResponse.json({ queued: false, results });
}
