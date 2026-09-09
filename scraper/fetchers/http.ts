import * as cheerio from "cheerio";

export const USER_AGENT =
  "IBRecruitTracker/1.0 (+personal use; contact: rakshithaakkala@g.ucla.edu)";

export type FetchResult = {
  httpStatus: number | null;
  text: string;
  success: boolean;
  errorMessage?: string;
};

export async function fetchHttp(
  url: string,
  cssSelector?: string | null
): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const scope = cssSelector ? $(cssSelector) : $("body");
    const text = scope.text().replace(/\s+/g, " ").trim();

    return {
      httpStatus: res.status,
      text,
      success: res.ok,
      errorMessage: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      httpStatus: null,
      text: "",
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
