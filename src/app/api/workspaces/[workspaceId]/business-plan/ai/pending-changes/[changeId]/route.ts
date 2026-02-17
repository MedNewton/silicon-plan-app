// src/app/api/workspaces/[workspaceId]/business-plan/ai/pending-changes/[changeId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolvePendingChange, applyPendingChange } from "@/server/businessPlan";

// ---------- POST: resolve or apply pending change ----------

const classifyPendingChangeError = (message: string): {
  statusCode: number;
  code: "TARGET_NOT_FOUND" | "INVALID_CHANGE" | "ACCESS_DENIED" | "INTERNAL_ERROR";
} => {
  if (
    message.includes("not found") ||
    message.includes("could not be resolved")
  ) {
    return { statusCode: 404, code: "TARGET_NOT_FOUND" };
  }
  if (
    message.includes("already been resolved") ||
    message.includes("no updates provided") ||
    message.includes("is missing")
  ) {
    return { statusCode: 422, code: "INVALID_CHANGE" };
  }
  if (message.includes("does not have access")) {
    return { statusCode: 403, code: "ACCESS_DENIED" };
  }
  return { statusCode: 500, code: "INTERNAL_ERROR" };
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; changeId: string }> }
) {
  let userIdForRecovery: string | null = null;
  let changeIdForRecovery: string | null = null;
  let requestedAction: "accept" | "reject" | null = null;

  try {
    const { userId } = await auth();
    const { workspaceId, changeId } = await ctx.params;
    userIdForRecovery = userId ?? null;
    changeIdForRecovery = changeId ?? null;

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
    requestedAction = action ?? null;

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
    const message = error instanceof Error ? error.message : "Internal server error";
    const { statusCode, code } = classifyPendingChangeError(message);
    const isExpectedError = statusCode !== 500;

    let autoRejected = false;
    if (
      requestedAction === "accept" &&
      code === "TARGET_NOT_FOUND" &&
      userIdForRecovery &&
      changeIdForRecovery
    ) {
      try {
        await resolvePendingChange({
          pendingChangeId: changeIdForRecovery,
          userId: userIdForRecovery,
          status: "rejected",
        });
        autoRejected = true;
      } catch (resolveError) {
        console.warn(
          "Failed to auto-reject stale pending change after target-not-found:",
          resolveError
        );
      }
    }

    if (!isExpectedError) {
      console.error("Unexpected error in POST /ai/pending-changes/[changeId]:", error);
    }

    return new NextResponse(
      JSON.stringify({
        error: autoRejected
          ? `${message} This pending change was automatically rejected because its target no longer exists.`
          : message,
        code,
        autoRejected,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
