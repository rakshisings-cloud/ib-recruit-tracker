import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { watchTargets } from "@/db/schema";
import { watchTargetInputSchema } from "@/lib/validation";

export async function PATCH(req: Request, ctx: RouteContext<"/api/watch-targets/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = watchTargetInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(watchTargets)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(watchTargets.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/watch-targets/[id]">) {
  const { id } = await ctx.params;
  await db.delete(watchTargets).where(eq(watchTargets.id, id));
  return NextResponse.json({ ok: true });
}
