// src/app/api/bookings/[bookingId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { cancelBooking, updateBookingDetails } from "@/server/bookings";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookingId } = await params;
    await cancelBooking(bookingId, user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/bookings/[bookingId]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookingId } = await params;
    const body = (await request.json()) as { slotId?: string; userComment?: string };
    if (!body.slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 });
    }

    await updateBookingDetails(bookingId, user.id, body.slotId, body.userComment ?? "");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/bookings/[bookingId]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

