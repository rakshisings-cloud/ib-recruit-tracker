import { chromium, type Browser } from "playwright";
import { USER_AGENT, type FetchResult } from "./http";

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

export async function fetchBrowser(
  browser: Browser,
  url: string,
  cssSelector?: string | null
): Promise<FetchResult> {
  const page = await browser.newPage({ userAgent: USER_AGENT });
  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

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
