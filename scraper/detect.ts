import { createHash } from "node:crypto";

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function findMatchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

export type StatusTransitionInput = {
  currentStatus: string;
  previousMatchedKeywords: string[];
  newMatchedKeywords: string[];
  isFirstCheck: boolean;
};

/**
 * A firm only flips to "open" when a keyword appears that wasn't matched on
 * the prior check — a stable set of matches (e.g. the same evergreen page
 * text) never triggers an alert on its own.
 *
 * The very first check on a target has no prior check to compare against,
 * so any match would otherwise look "newly appeared" even if it's just
 * generic evergreen page text (e.g. "Apply Now" in a nav link). We only
 * record a baseline on the first check and never alert from it — real
 * detection starts from the second check onward.
 */
export function determineNewStatus({
  currentStatus,
  previousMatchedKeywords,
  newMatchedKeywords,
  isFirstCheck,
}: StatusTransitionInput): "open" | "not_open" | null {
  if (currentStatus === "does_not_sponsor") return null;

  if (isFirstCheck) {
    return newMatchedKeywords.length === 0 && currentStatus === "unknown" ? "not_open" : null;
  }

  const newlyAppeared = newMatchedKeywords.filter(
    (kw) => !previousMatchedKeywords.includes(kw)
  );

  if (newlyAppeared.length > 0 && currentStatus !== "open") {
    return "open";
  }

  if (newMatchedKeywords.length === 0 && currentStatus === "unknown") {
    return "not_open";
  }

  return null;
}
