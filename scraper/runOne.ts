import { eq, desc } from "drizzle-orm";
import type { Browser } from "playwright";
import { db } from "../db/client";
import { firms, watchTargets, checkRuns, alerts } from "../db/schema";
import { fetchHttp } from "./fetchers/http";
import { fetchBrowser } from "./fetchers/browser";
import { hashText, findMatchedKeywords, determineNewStatus } from "./detect";
import { sendAlertEmail } from "./email";

export type RunOneResult = {
  firmId: string;
  watchTargetId: string;
  success: boolean;
  newStatus: string | null;
  errorMessage?: string;
};

export async function runOne(
  watchTarget: typeof watchTargets.$inferSelect,
  opts: { browser?: Browser } = {}
): Promise<RunOneResult> {
  const start = Date.now();

  const firm = await db.query.firms.findFirst({
    where: eq(firms.id, watchTarget.firmId),
  });
  if (!firm) {
    throw new Error(`Firm ${watchTarget.firmId} not found for watch target ${watchTarget.id}`);
  }

  const keywords = watchTarget.keywords as string[];

  const fetchResult =
    watchTarget.fetchStrategy === "browser" && opts.browser
      ? await fetchBrowser(opts.browser, watchTarget.url, watchTarget.cssSelector)
      : await fetchHttp(watchTarget.url, watchTarget.cssSelector);

  const contentHash = fetchResult.text ? hashText(fetchResult.text) : null;
  const matchedKeywords = findMatchedKeywords(fetchResult.text, keywords);
  const durationMs = Date.now() - start;

  const [checkRun] = await db
    .insert(checkRuns)
    .values({
      watchTargetId: watchTarget.id,
      httpStatus: fetchResult.httpStatus,
      contentHash,
      matchedKeywords,
      rawExcerpt: fetchResult.text.slice(0, 500),
      success: fetchResult.success,
      errorMessage: fetchResult.errorMessage,
      durationMs,
    })
    .returning();

  if (!fetchResult.success) {
    await db.update(firms).set({ status: "error", updatedAt: new Date() }).where(eq(firms.id, firm.id));
    return {
      firmId: firm.id,
      watchTargetId: watchTarget.id,
      success: false,
      newStatus: "error",
      errorMessage: fetchResult.errorMessage,
    };
  }

  const previousCheckRun = await db.query.checkRuns.findFirst({
    where: eq(checkRuns.watchTargetId, watchTarget.id),
    orderBy: [desc(checkRuns.checkedAt)],
    offset: 1,
  });
  const previousMatchedKeywords = (previousCheckRun?.matchedKeywords as string[]) ?? [];

  const newStatus = determineNewStatus({
    currentStatus: firm.status,
    previousMatchedKeywords,
    newMatchedKeywords: matchedKeywords,
    isFirstCheck: previousCheckRun === undefined,
  });

  if (newStatus && newStatus !== firm.status) {
    await db
      .update(firms)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(firms.id, firm.id));

    const [alert] = await db
      .insert(alerts)
      .values({
        firmId: firm.id,
        watchTargetId: watchTarget.id,
        checkRunId: checkRun.id,
        previousStatus: firm.status,
        newStatus,
        message: `Matched keywords: ${matchedKeywords.join(", ") || "(none)"}`,
      })
      .returning();

    if (newStatus === "open") {
      try {
        await sendAlertEmail({ firmName: firm.name, newStatus, url: watchTarget.url });
        await db.update(alerts).set({ emailedAt: new Date() }).where(eq(alerts.id, alert.id));
      } catch (err) {
        console.error(`Failed to send alert email for ${firm.name}:`, err);
      }
    }
  }

  return {
    firmId: firm.id,
    watchTargetId: watchTarget.id,
    success: true,
    newStatus: newStatus ?? firm.status,
  };
}
