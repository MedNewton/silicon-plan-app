// src/app/api/workspaces/[workspaceId]/business-plan/ai/conversation/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getOrCreateBusinessPlan,
  getOrCreateConversation,
  getConversationWithMessages,
} from "@/server/businessPlan";

// ---------- GET: get conversation with messages ----------

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

    // Get or create business plan first
    const businessPlan = await getOrCreateBusinessPlan({
      workspaceId,
      userId,
    });

    // Get conversation with messages
    const result = await getConversationWithMessages({
      businessPlanId: businessPlan.id,
      userId,
    });

    if (!result) {
      // Create conversation if none exists
      const conversation = await getOrCreateConversation({
        businessPlanId: businessPlan.id,
        userId,
      });

      return NextResponse.json({
        conversation,
        messages: [],
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error in GET /ai/conversation:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- POST: create or get conversation ----------

export async function POST(
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

    // Get or create business plan first
    const businessPlan = await getOrCreateBusinessPlan({
      workspaceId,
      userId,
    });

    // Get or create conversation
    const conversation = await getOrCreateConversation({
      businessPlanId: businessPlan.id,
      userId,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /ai/conversation:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
