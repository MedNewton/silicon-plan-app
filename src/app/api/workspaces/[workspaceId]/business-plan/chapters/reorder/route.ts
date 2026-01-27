// src/app/api/workspaces/[workspaceId]/business-plan/chapters/reorder/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { reorderChapters } from "@/server/businessPlan";

// ---------- PUT: reorder chapters ----------

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      orderedChapterIds: string[];
    };
    const { orderedChapterIds } = body;

    if (!orderedChapterIds || !Array.isArray(orderedChapterIds)) {
      return new NextResponse("orderedChapterIds array is required", { status: 400 });
    }

    await reorderChapters({
      workspaceId,
      userId,
      orderedChapterIds,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in PUT /chapters/reorder:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
