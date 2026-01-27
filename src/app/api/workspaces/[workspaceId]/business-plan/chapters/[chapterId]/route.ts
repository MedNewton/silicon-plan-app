// src/app/api/workspaces/[workspaceId]/business-plan/chapters/[chapterId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateChapter, deleteChapter } from "@/server/businessPlan";

// ---------- PUT: update chapter ----------

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, chapterId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!chapterId) {
      return new NextResponse("Chapter id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      title?: string;
      orderIndex?: number;
      parentChapterId?: string | null;
    };
    const { title, orderIndex, parentChapterId } = body;

    const chapter = await updateChapter({
      chapterId,
      userId,
      title,
      orderIndex,
      parentChapterId,
    });

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Unexpected error in PUT /chapters/[chapterId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- DELETE: delete chapter ----------

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, chapterId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!chapterId) {
      return new NextResponse("Chapter id is required", { status: 400 });
    }

    await deleteChapter({
      chapterId,
      userId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /chapters/[chapterId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
