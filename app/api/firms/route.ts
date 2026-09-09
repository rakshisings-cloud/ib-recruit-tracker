import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { firms } from "@/db/schema";
import { firmInputSchema } from "@/lib/validation";

export async function GET() {
  const rows = await db.query.firms.findMany({ orderBy: [firms.name] });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = firmInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db.insert(firms).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
