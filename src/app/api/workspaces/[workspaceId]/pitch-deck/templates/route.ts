// src/app/api/workspaces/[workspaceId]/pitch-deck/templates/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTemplates } from "@/server/pitchDeck";

// ---------- GET: list available templates ----------

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const templates = await getTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Unexpected error in GET /pitch-deck/templates:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
