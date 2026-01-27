// src/app/api/workspaces/[workspaceId]/business-plan/ai/pending-changes/[changeId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolvePendingChange, applyPendingChange } from "@/server/businessPlan";

// ---------- POST: resolve or apply pending change ----------

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; changeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, changeId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!changeId) {
      return new NextResponse("Change id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      action: "accept" | "reject";
    };
    const { action } = body;

    if (!action || !["accept", "reject"].includes(action)) {
      return new NextResponse("Valid action is required (accept or reject)", { status: 400 });
    }

    if (action === "accept") {
      // Apply the change and mark as accepted
      const result = await applyPendingChange({
        pendingChangeId: changeId,
        userId,
      });

      return NextResponse.json({
        success: true,
        action: "accepted",
        result,
      });
    } else {
      // Just mark as rejected without applying
      const pendingChange = await resolvePendingChange({
        pendingChangeId: changeId,
        userId,
        status: "rejected",
      });

      return NextResponse.json({
        success: true,
        action: "rejected",
        pendingChange,
      });
    }
  } catch (error) {
    console.error("Unexpected error in POST /ai/pending-changes/[changeId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
