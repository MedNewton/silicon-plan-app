import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  deleteBusinessPlanTask,
  updateBusinessPlanTask,
} from "@/server/businessPlanTasks";
import type { BusinessPlanTaskHierarchyLevel, BusinessPlanTaskStatus } from "@/types/workspaces";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, taskId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!taskId) {
      return new NextResponse("Task id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      parentTaskId?: string | null;
      title?: string;
      instructions?: string;
      aiPrompt?: string;
      hierarchyLevel?: BusinessPlanTaskHierarchyLevel;
      status?: BusinessPlanTaskStatus;
      orderIndex?: number;
    };

    if (
      body.hierarchyLevel !== undefined &&
      body.hierarchyLevel !== "h1" &&
      body.hierarchyLevel !== "h2"
    ) {
      return new NextResponse("hierarchyLevel must be 'h1' or 'h2'", { status: 400 });
    }

    const task = await updateBusinessPlanTask({
      taskId,
      parentTaskId: body.parentTaskId,
      title: body.title,
      instructions: body.instructions,
      aiPrompt: body.aiPrompt,
      hierarchyLevel: body.hierarchyLevel,
      status: body.status,
      orderIndex: body.orderIndex,
      userId,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Unexpected error in PUT /business-plan/tasks/[taskId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, taskId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!taskId) {
      return new NextResponse("Task id is required", { status: 400 });
    }

    await deleteBusinessPlanTask({
      taskId,
      userId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /business-plan/tasks/[taskId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
