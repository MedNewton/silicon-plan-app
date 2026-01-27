// src/app/api/workspaces/[workspaceId]/pitch-deck/[deckId]/slides/[slideId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateSlide, deleteSlide, duplicateSlide } from "@/server/pitchDeck";
import type { PitchDeckSlideContent, PitchDeckSlideType } from "@/types/workspaces";

// ---------- PUT: update slide ----------

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; deckId: string; slideId: string }> }
) {
  try {
    const { userId } = await auth();
    const { slideId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!slideId) {
      return new NextResponse("Slide id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      title?: string;
      slideType?: PitchDeckSlideType;
      content?: PitchDeckSlideContent;
      orderIndex?: number;
    };
    const { title, slideType, content, orderIndex } = body;

    const slide = await updateSlide({
      slideId,
      userId,
      title: title?.trim(),
      slideType,
      content,
      orderIndex,
    });

    return NextResponse.json({ slide });
  } catch (error) {
    console.error("Unexpected error in PUT /slides/[slideId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- DELETE: delete slide ----------

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; deckId: string; slideId: string }> }
) {
  try {
    const { userId } = await auth();
    const { slideId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!slideId) {
      return new NextResponse("Slide id is required", { status: 400 });
    }

    await deleteSlide({
      slideId,
      userId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /slides/[slideId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- POST: duplicate slide ----------

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; deckId: string; slideId: string }> }
) {
  try {
    const { userId } = await auth();
    const { slideId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!slideId) {
      return new NextResponse("Slide id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      action: "duplicate";
    };

    if (body.action !== "duplicate") {
      return new NextResponse("Invalid action", { status: 400 });
    }

    const slide = await duplicateSlide({
      slideId,
      userId,
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /slides/[slideId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
