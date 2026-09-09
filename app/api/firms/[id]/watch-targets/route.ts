import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { watchTargets } from "@/db/schema";
import { watchTargetInputSchema } from "@/lib/validation";

export async function POST(req: Request, ctx: RouteContext<"/api/firms/[id]/watch-targets">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = watchTargetInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(watchTargets)
    .values({ ...parsed.data, firmId: id })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
