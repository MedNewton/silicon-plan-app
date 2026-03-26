// src/app/api/consultants/[consultantId]/reviews/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { canUserReview, createReview } from "@/server/consultants";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ consultantId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { consultantId } = await params;
    const result = await canUserReview(user.id, consultantId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/consultants/[consultantId]/reviews:", error);
    return NextResponse.json({ error: "Failed to check review eligibility" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ consultantId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { consultantId } = await params;
    const body = (await request.json().catch(() => null)) as {
      rating?: number;
      text?: string;
    } | null;

    if (!body?.rating || !body.text?.trim()) {
      return NextResponse.json(
        { error: "rating and text are required" },
        { status: 400 },
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const review = await createReview({
      userId: user.id,
      consultantId,
      rating: body.rating,
      text: body.text.trim(),
      userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Anonymous",
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/consultants/[consultantId]/reviews:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
