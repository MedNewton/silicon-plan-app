import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { revokeWorkspaceInvite } from "@/server/workspaces";

type RouteParams = {
  workspaceId: string;
  inviteId: string;
};

export async function POST(
  _request: Request,
  context: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { workspaceId, inviteId } = await context.params;

    if (!workspaceId || !inviteId) {
      return NextResponse.json(
        { error: "workspaceId and inviteId are required" },
        { status: 400 },
      );
    }

    await revokeWorkspaceInvite({
      workspaceId,
      inviteToken: inviteId,
      requesterUserId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to revoke invite";

    if (
      message.includes("Only owner or admin") ||
      message.includes("not a member")
    ) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes("Invite not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes("accepted invite")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error(
      "Error in POST /api/workspaces/[workspaceId]/members/invites/[inviteId]/revoke:",
      error,
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
