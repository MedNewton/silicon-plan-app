import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateBusinessPlan } from "@/server/businessPlan";
import {
  createBusinessPlanTask,
  ensureTaskAutomationDefaults,
  ensureDefaultBusinessPlanTasks,
  getBusinessPlanTaskTree,
} from "@/server/businessPlanTasks";
import type { BusinessPlanTaskHierarchyLevel, BusinessPlanTaskStatus } from "@/types/workspaces";

export async function GET(
  _req: Request,
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

    const result = await getBusinessPlanTaskTree({
      workspaceId,
      userId,
    });

    if (result) {
      await ensureDefaultBusinessPlanTasks({
        businessPlanId: result.businessPlanId,
        userId,
      });
      await ensureTaskAutomationDefaults({
        workspaceId,
        userId,
      });

      const refreshed = await getBusinessPlanTaskTree({
        workspaceId,
        userId,
      });

      return NextResponse.json(
        refreshed ?? {
          businessPlanId: result.businessPlanId,
          tasks: [],
        }
      );
    }

    const businessPlan = await getOrCreateBusinessPlan({
      workspaceId,
      userId,
    });

    await ensureDefaultBusinessPlanTasks({
      businessPlanId: businessPlan.id,
      userId,
    });
    await ensureTaskAutomationDefaults({
      workspaceId,
      userId,
    });

    const seeded = await getBusinessPlanTaskTree({
      workspaceId,
      userId,
    });

    return NextResponse.json(
      seeded ?? {
        businessPlanId: businessPlan.id,
        tasks: [],
      }
    );
  } catch (error) {
    console.error("Unexpected error in GET /business-plan/tasks:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

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
      parentTaskId?: string | null;
      title: string;
      instructions?: string;
      aiPrompt?: string;
      hierarchyLevel: BusinessPlanTaskHierarchyLevel;
      status?: BusinessPlanTaskStatus;
      orderIndex?: number;
    };

    if (!body.businessPlanId) {
      return new NextResponse("Business plan id is required", { status: 400 });
    }

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return new NextResponse("Task title is required", { status: 400 });
    }

    if (body.hierarchyLevel !== "h1" && body.hierarchyLevel !== "h2") {
      return new NextResponse("hierarchyLevel must be 'h1' or 'h2'", { status: 400 });
    }

    const task = await createBusinessPlanTask({
      businessPlanId: body.businessPlanId,
      parentTaskId: body.parentTaskId ?? null,
      title: body.title,
      instructions: body.instructions,
      aiPrompt: body.aiPrompt,
      hierarchyLevel: body.hierarchyLevel,
      status: body.status,
      orderIndex: body.orderIndex,
      userId,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /business-plan/tasks:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
