// src/app/api/workspaces/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createWorkspace } from "@/server/workspaces";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null) as
      | { name?: string }
      | null;

    const name = body?.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 },
      );
    }

    const workspace = await createWorkspace({
      userId: user.id,
      name,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/workspaces:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 },
    );
  }
}
