// src/app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createBooking, listUserBookings } from "@/server/bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const bookings = await listUserBookings(user.id);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/bookings:", error);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      consultantId?: string;
      servicePackageId?: string;
      availabilitySlotId?: string;
      userComment?: string;
    } | null;

    if (!body?.consultantId || !body.servicePackageId || !body.availabilitySlotId) {
      return NextResponse.json(
        { error: "consultantId, servicePackageId, and availabilitySlotId are required" },
        { status: 400 },
      );
    }

    const booking = await createBooking({
      userId: user.id,
      consultantId: body.consultantId,
      servicePackageId: body.servicePackageId,
      availabilitySlotId: body.availabilitySlotId,
      userComment: body.userComment,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/bookings:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("no longer available")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
