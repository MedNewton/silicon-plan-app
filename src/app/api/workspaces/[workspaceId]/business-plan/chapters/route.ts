// src/app/api/workspaces/[workspaceId]/business-plan/chapters/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createChapter } from "@/server/businessPlan";

// ---------- POST: create new chapter ----------

export async function POST(
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
      businessPlanId: string;
      parentChapterId?: string | null;
      title: string;
      orderIndex?: number;
    };
    const { businessPlanId, parentChapterId, title, orderIndex } = body;

    if (!businessPlanId) {
      return new NextResponse("Business plan id is required", { status: 400 });
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const chapter = await createChapter({
      businessPlanId,
      userId,
      parentChapterId: parentChapterId ?? null,
      title,
      orderIndex,
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /chapters:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
