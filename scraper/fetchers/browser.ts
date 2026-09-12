import { chromium, type Browser } from "playwright";
import type { FetchResult } from "./http";

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

export async function fetchBrowser(
  browser: Browser,
  url: string,
  cssSelector?: string | null
): Promise<FetchResult> {
  // Deliberately no custom User-Agent override here (unlike the http
  // fetcher) — this is a real Chromium browser executing real JS, so it
  // sends Chromium's own natural UA, same as any visitor's browser would.
  // Some sites (e.g. Goldman Sachs, Morgan Stanley) block our honest,
  // identifying UA outright; pairing that unusual UA with a full browser
  // session would look more anomalous, not less.
  const page = await browser.newPage();
  try {
    // "networkidle" is too strict for real-world pages with persistent
    // background traffic (analytics beacons, etc.) that never fully quiet
    // down — it was timing out on pages that had actually loaded fine.
    // "load" plus a short settle delay is more reliable and still gives
    // post-load JS widgets (e.g. job-search widgets) time to render.
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: 30_000,
    });
    await page.waitForTimeout(2_000);

    const text = cssSelector
      ? await page
          .locator(cssSelector)
          .first()
          .innerText()
          .catch(() => "")
      : await page.locator("body").innerText();

    const httpStatus = response?.status() ?? null;

    return {
      httpStatus,
      text: text.replace(/\s+/g, " ").trim(),
      success: httpStatus === null || (httpStatus >= 200 && httpStatus < 400),
      errorMessage:
        httpStatus !== null && (httpStatus < 200 || httpStatus >= 400)
          ? `HTTP ${httpStatus}`
          : undefined,
    };
  } catch (err) {
    return {
      httpStatus: null,
      text: "",
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await page.close();
  }
}
