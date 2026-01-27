// src/app/api/workspaces/[workspaceId]/business-plan/sections/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSection } from "@/server/businessPlan";
import type { BusinessPlanSectionType, BusinessPlanSectionContent } from "@/types/workspaces";

// ---------- POST: create new section ----------

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
      chapterId: string;
      sectionType: BusinessPlanSectionType;
      content: BusinessPlanSectionContent;
      orderIndex?: number;
    };
    const { chapterId, sectionType, content, orderIndex } = body;

    if (!chapterId) {
      return new NextResponse("Chapter id is required", { status: 400 });
    }

    if (!sectionType) {
      return new NextResponse("Section type is required", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const validSectionTypes: BusinessPlanSectionType[] = [
      "section_title",
      "subsection",
      "text",
      "image",
      "table",
      "list",
      "comparison_table",
      "timeline",
      "embed",
      "page_break",
      "empty_space",
    ];

    if (!validSectionTypes.includes(sectionType)) {
      return new NextResponse("Invalid section type", { status: 400 });
    }

    const section = await createSection({
      chapterId,
      userId,
      sectionType,
      content,
      orderIndex,
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /sections:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
