// src/app/api/consultants/[consultantId]/slots/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getAvailableSlots } from "@/server/bookings";

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
    const slots = await getAvailableSlots(consultantId);
    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/consultants/[consultantId]/slots:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
