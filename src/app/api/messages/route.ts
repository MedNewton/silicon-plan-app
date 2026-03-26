// src/app/api/messages/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { listUserThreads } from "@/server/messages";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const threads = await listUserThreads(user.id);
    return NextResponse.json({ threads }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/messages:", error);
    return NextResponse.json(
      { error: "Failed to load threads" },
      { status: 500 },
    );
  }
}
