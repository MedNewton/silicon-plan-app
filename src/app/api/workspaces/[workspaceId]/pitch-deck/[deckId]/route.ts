// src/app/api/workspaces/[workspaceId]/pitch-deck/[deckId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getPitchDeck,
  updatePitchDeck,
  deletePitchDeck,
  duplicatePitchDeck,
} from "@/server/pitchDeck";
import type { PitchDeckSettings } from "@/types/workspaces";

// ---------- GET: get pitch deck with slides ----------

export async function GET(
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

    const result = await getPitchDeck({
      pitchDeckId: deckId,
      userId,
    });

    if (!result) {
      return new NextResponse("Pitch deck not found", { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error in GET /pitch-deck/[deckId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- PUT: update pitch deck ----------

export async function PUT(
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
      title?: string;
      settings?: Partial<PitchDeckSettings>;
      templateId?: string;
    };
    const { title, settings, templateId } = body;

    const pitchDeck = await updatePitchDeck({
      pitchDeckId: deckId,
      userId,
      title: title?.trim(),
      settings,
      templateId,
    });

    return NextResponse.json({ pitchDeck });
  } catch (error) {
    console.error("Unexpected error in PUT /pitch-deck/[deckId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- DELETE: delete pitch deck ----------

export async function DELETE(
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

    await deletePitchDeck({
      pitchDeckId: deckId,
      userId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /pitch-deck/[deckId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

// ---------- POST: duplicate pitch deck ----------

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
      action: "duplicate";
      newTitle?: string;
    };

    if (body.action !== "duplicate") {
      return new NextResponse("Invalid action", { status: 400 });
    }

    const pitchDeck = await duplicatePitchDeck({
      pitchDeckId: deckId,
      userId,
      newTitle: body.newTitle,
    });

    return NextResponse.json({ pitchDeck }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /pitch-deck/[deckId]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
