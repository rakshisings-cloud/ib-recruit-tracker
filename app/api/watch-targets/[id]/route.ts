import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { firms, watchTargets, checkRuns } from "@/db/schema";
import { watchTargetInputSchema } from "@/lib/validation";

export async function PATCH(req: Request, ctx: RouteContext<"/api/watch-targets/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = watchTargetInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.watchTargets.findFirst({ where: eq(watchTargets.id, id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(watchTargets)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(watchTargets.id, id))
    .returning();

  // Changing the URL or keywords invalidates any prior check history: an
  // old check's matched keywords aren't a meaningful comparison basis for
  // a different keyword list, and could otherwise cause a false "just
  // opened" trigger on the very next check. Clearing check_runs makes the
  // next check treated as a fresh, safe baseline (same as a brand-new
  // target), and also un-sticks a firm that was previously misclassified.
  if (parsed.data.url !== undefined || parsed.data.keywords !== undefined) {
    await db.delete(checkRuns).where(eq(checkRuns.watchTargetId, id));

    const firm = await db.query.firms.findFirst({ where: eq(firms.id, existing.firmId) });
    if (firm && firm.status !== "does_not_sponsor") {
      await db.update(firms).set({ status: "unknown", updatedAt: new Date() }).where(eq(firms.id, firm.id));
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/watch-targets/[id]">) {
  const { id } = await ctx.params;
  await db.delete(watchTargets).where(eq(watchTargets.id, id));
  return NextResponse.json({ ok: true });
}
