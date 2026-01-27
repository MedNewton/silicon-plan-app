// src/app/api/workspaces/[workspaceId]/business-plan/sections/[sectionId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateSection, deleteSection } from "@/server/businessPlan";
import type { BusinessPlanSectionType, BusinessPlanSectionContent } from "@/types/workspaces";

// ---------- PUT: update section ----------

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; sectionId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, sectionId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!sectionId) {
      return new NextResponse("Section id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      sectionType?: BusinessPlanSectionType;
      content?: BusinessPlanSectionContent;
      orderIndex?: number;
    };
    const { sectionType, content, orderIndex } = body;

    const section = await updateSection({
      sectionId,
      userId,
      sectionType,
      content,
      orderIndex,
    });

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Unexpected error in PUT /sections/[sectionId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- DELETE: delete section ----------

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; sectionId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, sectionId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!sectionId) {
      return new NextResponse("Section id is required", { status: 400 });
    }

    await deleteSection({
      sectionId,
      userId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /sections/[sectionId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
