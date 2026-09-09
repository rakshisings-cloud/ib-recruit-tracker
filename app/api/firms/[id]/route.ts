import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { firms } from "@/db/schema";
import { firmInputSchema } from "@/lib/validation";
import { getFirmDetail } from "@/lib/queries";

export async function GET(_req: Request, ctx: RouteContext<"/api/firms/[id]">) {
  const { id } = await ctx.params;
  const firm = await getFirmDetail(id);
  if (!firm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(firm);
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/firms/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = firmInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(firms)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(firms.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/firms/[id]">) {
  const { id } = await ctx.params;
  await db.delete(firms).where(eq(firms.id, id));
  return NextResponse.json({ ok: true });
}
