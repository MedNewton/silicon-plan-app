// src/app/api/workspaces/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createWorkspace } from "@/server/workspaces";
import type { CreateWorkspaceParams } from "@/types/workspaces";

type CreateWorkspaceRequestBody = {
  name: string;
  imageUrl?: string | null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateWorkspaceRequestBody;
  try {
    body = (await req.json()) as CreateWorkspaceRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const trimmedName = body.name?.trim();
  if (!trimmedName) {
    return NextResponse.json(
      { error: "Workspace name is required" },
      { status: 400 },
    );
  }

  const params: CreateWorkspaceParams = {
    userId: user.id,
    name: trimmedName,
    imageUrl: body.imageUrl ?? null,
  };

  try {
    const workspace = await createWorkspace(params);

    return NextResponse.json(
      { workspace },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Failed to create workspace:", message);

    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 },
    );
  }
}
