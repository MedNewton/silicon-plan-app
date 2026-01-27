// src/app/api/workspaces/[workspaceId]/pitch-deck/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getPitchDecksByWorkspace,
  createPitchDeck,
} from "@/server/pitchDeck";

// ---------- GET: list pitch decks for workspace ----------

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

    const pitchDecks = await getPitchDecksByWorkspace({
      workspaceId,
      userId,
    });

    return NextResponse.json({ pitchDecks });
  } catch (error) {
    console.error("Unexpected error in GET /pitch-deck:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- POST: create new pitch deck ----------

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
      templateId: string;
      title: string;
    };
    const { templateId, title } = body;

    if (!templateId) {
      return new NextResponse("Template id is required", { status: 400 });
    }

    if (!title || typeof title !== "string") {
      return new NextResponse("Title is required", { status: 400 });
    }

    const pitchDeck = await createPitchDeck({
      workspaceId,
      templateId,
      title: title.trim(),
      createdBy: userId,
    });

    return NextResponse.json({ pitchDeck }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /pitch-deck:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
