// src/app/api/workspaces/[workspaceId]/business-plan/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getOrCreateBusinessPlan,
  getBusinessPlanWithChapters,
  updateBusinessPlan,
} from "@/server/businessPlan";
import type { BusinessPlanStatus, BusinessPlanExportSettings } from "@/types/workspaces";

// ---------- GET: get business plan with all chapters and sections ----------

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

    const result = await getBusinessPlanWithChapters({
      workspaceId,
      userId,
    });

    if (!result) {
      // Create a new business plan if none exists
      const businessPlan = await getOrCreateBusinessPlan({
        workspaceId,
        userId,
      });

      return NextResponse.json({
        businessPlan,
        chapters: [],
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error in GET /business-plan:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- PUT: update business plan ----------

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
      businessPlanId: string;
      title?: string;
      status?: BusinessPlanStatus;
      exportSettings?: BusinessPlanExportSettings | null;
    };
    const { businessPlanId, title, status, exportSettings } = body;

    if (!businessPlanId) {
      return new NextResponse("Business plan id is required", { status: 400 });
    }

    const updated = await updateBusinessPlan({
      businessPlanId,
      userId,
      title,
      status,
      exportSettings,
    });

    return NextResponse.json({ businessPlan: updated });
  } catch (error) {
    console.error("Unexpected error in PUT /business-plan:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
