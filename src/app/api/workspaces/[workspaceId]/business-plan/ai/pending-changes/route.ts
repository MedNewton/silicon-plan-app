// src/app/api/workspaces/[workspaceId]/business-plan/ai/pending-changes/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getOrCreateBusinessPlan,
  getPendingChangesForBusinessPlan,
  createPendingChange,
} from "@/server/businessPlan";
import type { PendingChangeType, PendingChangeStatus } from "@/types/workspaces";

// ---------- GET: get all pending changes for business plan ----------

export async function GET(
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

    // Get status filter from query params
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") as PendingChangeStatus | null;

    // Get or create business plan first
    const businessPlan = await getOrCreateBusinessPlan({
      workspaceId,
      userId,
    });

    const pendingChanges = await getPendingChangesForBusinessPlan({
      businessPlanId: businessPlan.id,
      userId,
      statusFilter: statusFilter ?? undefined,
    });

    return NextResponse.json({ pendingChanges });
  } catch (error) {
    console.error("Unexpected error in GET /ai/pending-changes:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- POST: create new pending change ----------

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
      messageId: string;
      changeType: PendingChangeType;
      targetId?: string | null;
      proposedData: Record<string, unknown>;
    };
    const { messageId, changeType, targetId, proposedData } = body;

    if (!messageId) {
      return new NextResponse("Message id is required", { status: 400 });
    }

    const validChangeTypes: PendingChangeType[] = [
      "add_section",
      "update_section",
      "delete_section",
      "reorder_sections",
      "add_chapter",
      "update_chapter",
      "delete_chapter",
      "reorder_chapters",
      "add_task",
      "update_task",
      "delete_task",
    ];

    if (!changeType || !validChangeTypes.includes(changeType)) {
      return new NextResponse("Valid change type is required", { status: 400 });
    }

    if (!proposedData || typeof proposedData !== "object") {
      return new NextResponse("Proposed data is required", { status: 400 });
    }

    const pendingChange = await createPendingChange({
      messageId,
      userId,
      changeType,
      targetId,
      proposedData,
    });

    return NextResponse.json({ pendingChange }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /ai/pending-changes:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
