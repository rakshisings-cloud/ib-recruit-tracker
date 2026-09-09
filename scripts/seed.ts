import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

config({ path: [".env.local", ".env"] });

type Row = {
  name: string;
  ticker: string;
  institution_type: string;
  historical_open_date: string;
  does_not_sponsor: string;
  target_location: string;
};

async function main() {
  const { db } = await import("../db/client");
  const { firms } = await import("../db/schema");

  const csvPath = path.join(__dirname, "..", "seed", "firms.csv");
  const rows: Row[] = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  });

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const doesNotSponsor = row.does_not_sponsor.trim().toLowerCase() === "true";

    const values = {
      name: row.name.trim(),
      ticker: row.ticker.trim() || null,
      institutionType: row.institution_type.trim(),
      targetLocation: row.target_location.trim() || null,
      historicalOpenDate: row.historical_open_date.trim() || null,
      status: doesNotSponsor ? "does_not_sponsor" : "unknown",
    };

    const existing = await db.query.firms.findFirst({
      where: eq(firms.name, values.name),
    });

    if (existing) {
      await db.update(firms).set(values).where(eq(firms.id, existing.id));
      updated++;
    } else {
      await db.insert(firms).values(values);
      created++;
    }
  }

  console.log(`Seed complete: ${created} firms created, ${updated} updated.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
