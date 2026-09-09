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
};

/**
 * A firm only flips to "open" when a keyword appears that wasn't matched on
 * the prior check — a stable set of matches (e.g. the same evergreen page
 * text) never triggers an alert on its own.
 */
export function determineNewStatus({
  currentStatus,
  previousMatchedKeywords,
  newMatchedKeywords,
}: StatusTransitionInput): "open" | "not_open" | null {
  if (currentStatus === "does_not_sponsor") return null;

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
