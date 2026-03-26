// src/app/api/messages/[threadId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { listThreadMessages, sendMessage } from "@/server/messages";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { threadId } = await params;
    const result = await listThreadMessages(threadId, user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/messages/[threadId]:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = (await request.json().catch(() => null)) as { text?: string } | null;

    if (!body?.text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const message = await sendMessage(threadId, user.id, body.text.trim());
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/messages/[threadId]:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
