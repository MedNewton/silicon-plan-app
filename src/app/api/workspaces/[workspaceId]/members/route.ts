// src/app/api/workspaces/[workspaceId]/members/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  getWorkspaceMembersForSettings,
  removeWorkspaceMemberFromWorkspace,
} from "@/server/workspaces";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    workspaceId: string;
  };
};

type DeleteBody = {
  // this is the *user id* of the member to remove
  userId?: string;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { workspaceId } = context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const result = await getWorkspaceMembersForSettings({
      workspaceId,
      userId: user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "Error in GET /api/workspaces/[workspaceId]/members:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load workspace members";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { workspaceId } = context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    let body: DeleteBody | null = null;
    try {
      body = (await request.json()) as DeleteBody;
    } catch {
      body = null;
    }

    const targetUserId = body?.userId;
    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    await removeWorkspaceMemberFromWorkspace({
      workspaceId,
      target: {
        workspaceId,
        userId: targetUserId,
      },
      requesterUserId: user.id,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "Error in DELETE /api/workspaces/[workspaceId]/members:",
      error,
    );

    if (error instanceof Error) {
      const message = error.message;

      const isPermissionError =
        message.includes("cannot be removed") ||
        message.includes("Only the owner can remove") ||
        message.includes("Only owner or admin can remove") ||
        message.includes("not a member of this workspace") ||
        message.includes("User does not have access");

      const status = isPermissionError ? 403 : 500;

      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to remove workspace member" },
      { status: 500 },
    );
  }
}
