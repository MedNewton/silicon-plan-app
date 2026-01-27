// src/app/api/workspaces/[workspaceId]/business-plan/ai/messages/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMessage } from "@/server/businessPlan";
import type { AiMessageRole, AiMessageMetadata } from "@/types/workspaces";

// ---------- POST: create new message ----------

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
      conversationId: string;
      role: AiMessageRole;
      content: string;
      metadata?: AiMessageMetadata | null;
    };
    const { conversationId, role, content, metadata } = body;

    if (!conversationId) {
      return new NextResponse("Conversation id is required", { status: 400 });
    }

    if (!role || !["user", "assistant"].includes(role)) {
      return new NextResponse("Valid role is required (user or assistant)", { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const message = await createMessage({
      conversationId,
      userId,
      role,
      content: content.trim(),
      metadata,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /ai/messages:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
