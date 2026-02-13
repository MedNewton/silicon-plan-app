// src/app/api/workspaces/[workspaceId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  deleteWorkspaceByOwner,
  getWorkspaceWithDetails,
  updateWorkspaceGeneral,
} from "@/server/workspaces";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

type PatchBody = {
  name?: string;
  imageUrl?: string | null;
};

type DeleteBody = {
  confirmationName?: string;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const details = await getWorkspaceWithDetails(workspaceId, user.id);

    if (!details) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { workspace: details.workspace },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/workspaces/[workspaceId]:", error);
    return NextResponse.json(
      { error: "Failed to load workspace" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as PatchBody | null;

    if (!body || (body.name == null && body.imageUrl === undefined)) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 },
      );
    }

    const updated = await updateWorkspaceGeneral({
      userId: user.id,
      workspaceId,
      name: body.name,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json(
      { workspace: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in PATCH /api/workspaces/[workspaceId]:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as DeleteBody | null;
    const confirmationName = body?.confirmationName?.trim();

    if (!confirmationName) {
      return NextResponse.json(
        { error: "confirmationName is required" },
        { status: 400 },
      );
    }

    await deleteWorkspaceByOwner({
      userId: user.id,
      workspaceId,
      confirmationName,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/workspaces/[workspaceId]:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete workspace";

    if (message.includes("Workspace not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes("Only the workspace owner")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (
      message.includes("confirmation name is required") ||
      message.includes("confirmation name does not match")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
