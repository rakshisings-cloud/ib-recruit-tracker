import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const ACTIVE_FIRM_STATUSES = ["unknown", "not_open", "error"];

async function main() {
  const { and, eq, inArray } = await import("drizzle-orm");
  const { db } = await import("../db/client");
  const { watchTargets, firms } = await import("../db/schema");
  const { runOne } = await import("./runOne");
  const { launchBrowser } = await import("./fetchers/browser");

  const firmIdArg = process.argv
    .find((a) => a.startsWith("--firm-id="))
    ?.split("=")[1];

  const targets = await db.query.watchTargets.findMany({
    where: firmIdArg
      ? and(eq(watchTargets.isActive, true), eq(watchTargets.firmId, firmIdArg))
      : eq(watchTargets.isActive, true),
  });

  if (targets.length === 0) {
    console.log("No active watch targets to check.");
    return;
  }

  const activeFirms = await db.query.firms.findMany({
    where: inArray(
      firms.id,
      targets.map((t) => t.firmId)
    ),
  });
  const firmStatusById = new Map(activeFirms.map((f) => [f.id, f.status]));

  const targetsToCheck = firmIdArg
    ? targets
    : targets.filter((t) => ACTIVE_FIRM_STATUSES.includes(firmStatusById.get(t.firmId) ?? "unknown"));

  console.log(`Checking ${targetsToCheck.length} of ${targets.length} active watch targets...`);

  const httpTargets = targetsToCheck.filter((t) => t.fetchStrategy !== "browser");
  const browserTargets = targetsToCheck.filter((t) => t.fetchStrategy === "browser");

  for (const target of httpTargets) {
    const result = await runOne(target);
    console.log(`[http] ${target.url} -> ${result.newStatus} (success: ${result.success})`);
  }

  if (browserTargets.length > 0) {
    const browser = await launchBrowser();
    try {
      for (const target of browserTargets) {
        const result = await runOne(target, { browser });
        console.log(`[browser] ${target.url} -> ${result.newStatus} (success: ${result.success})`);
      }
    } finally {
      await browser.close();
    }
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Scrape run failed:", err);
    process.exit(1);
  });
