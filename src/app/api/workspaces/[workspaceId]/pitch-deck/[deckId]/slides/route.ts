// src/app/api/workspaces/[workspaceId]/pitch-deck/[deckId]/slides/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSlide, reorderSlides } from "@/server/pitchDeck";
import type { PitchDeckSlideContent, PitchDeckSlideType } from "@/types/workspaces";

// ---------- POST: create slide or reorder slides ----------

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; deckId: string }> }
) {
  try {
    const { userId } = await auth();
    const { deckId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!deckId) {
      return new NextResponse("Deck id is required", { status: 400 });
    }

    const body = (await req.json()) as {
      // For creating a slide
      title?: string;
      slideType?: PitchDeckSlideType;
      content?: PitchDeckSlideContent;
      orderIndex?: number;
      // For reordering slides
      action?: "reorder";
      orderedSlideIds?: string[];
    };

    // Handle reorder action
    if (body.action === "reorder") {
      if (!body.orderedSlideIds || !Array.isArray(body.orderedSlideIds)) {
        return new NextResponse("orderedSlideIds array is required for reorder", { status: 400 });
      }

      await reorderSlides({
        pitchDeckId: deckId,
        userId,
        orderedSlideIds: body.orderedSlideIds,
      });

      return NextResponse.json({ success: true });
    }

    // Handle create slide
    const { title, slideType, content, orderIndex } = body;

    if (!title || typeof title !== "string") {
      return new NextResponse("Title is required", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const slide = await createSlide({
      pitchDeckId: deckId,
      userId,
      title: title.trim(),
      slideType,
      content,
      orderIndex,
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /pitch-deck/[deckId]/slides:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
