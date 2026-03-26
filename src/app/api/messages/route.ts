// src/app/api/messages/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { listUserThreads, getOrCreateThread } from "@/server/messages";

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

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as { consultantId?: string };
    if (!body.consultantId) {
      return NextResponse.json({ error: "consultantId is required" }, { status: 400 });
    }

    const thread = await getOrCreateThread(user.id, body.consultantId);
    return NextResponse.json({ thread }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/messages:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
