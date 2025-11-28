// src/app/api/workspaces/invites/inspect/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { currentUser, clerkClient as getClerkClient } from "@clerk/nextjs/server";

import { getSupabaseClient } from "@/lib/supabaseServer";
import type {
  WorkspaceMemberInvite,
  Workspace,
  WorkspaceId,
  UserId,
} from "@/types/workspaces";

export const dynamic = "force-dynamic";

type WorkspaceRow = Pick<Workspace, "id" | "name">;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = user.primaryEmailAddress.emailAddress.toLowerCase();

    const { searchParams } = new URL(req.url);
    const inviteToken = searchParams.get("invite");

    if (!inviteToken) {
      return NextResponse.json(
        { error: "Missing invite token" },
        { status: 400 },
      );
    }

    const client = getSupabaseClient();

    const {
      data: inviteRow,
      error: inviteError,
    } = await client
      .from("workspace_member_invites")
      .select("*")
      .eq("token", inviteToken)
      .maybeSingle();

    if (inviteError && inviteError.code !== "PGRST116") {
      console.error("inviteError", inviteError);
      return NextResponse.json(
        { error: "Failed to load invitation" },
        { status: 500 },
      );
    }

    if (!inviteRow) {
      return NextResponse.json(
        { error: "This invitation is invalid." },
        { status: 404 },
      );
    }

    const invite = inviteRow as WorkspaceMemberInvite;

    const inviteEmail = invite.email.toLowerCase();
    if (!inviteEmail || inviteEmail !== email) {
      return NextResponse.json(
        { error: "This invitation is not for this account." },
        { status: 403 },
      );
    }

    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "This invitation has already been used." },
        { status: 400 },
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 400 },
      );
    }

    const workspaceId: WorkspaceId = invite.workspace_id;

    const {
      data: workspaceRow,
      error: workspaceError,
    } = await client
      .from("workspaces")
      .select("id,name")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspaceRow) {
      console.error("workspaceError", workspaceError);
      return NextResponse.json(
        { error: "Workspace not found for this invitation." },
        { status: 404 },
      );
    }

    const workspace = workspaceRow as WorkspaceRow;

    let inviterName: string | null = null;
    let inviterEmail: string | null = null;

    const inviterUserId: UserId | null =
      invite.invited_by_user_id ?? null;

    if (inviterUserId) {
      try {
        const clerk = await getClerkClient();
        const inviter = await clerk.users.getUser(inviterUserId);

        const hasName = Boolean(inviter.firstName ?? inviter.lastName);
        inviterName = hasName
          ? [inviter.firstName, inviter.lastName].filter(Boolean).join(" ")
          : null;

        const emailAddresses = inviter.emailAddresses;
        const primaryEmail =
          emailAddresses.find(
            (e) => e.id === inviter.primaryEmailAddressId,
          )?.emailAddress ?? emailAddresses[0]?.emailAddress ?? null;

        inviterEmail = primaryEmail;
      } catch (err) {
        console.error("Failed to load inviter from Clerk", err);
      }
    }

    const {
      data: membershipRow,
      error: membershipError,
    } = await client
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("membershipError", membershipError);
      return NextResponse.json(
        { error: "Failed to inspect workspace membership." },
        { status: 500 },
      );
    }

    const alreadyMember = Boolean(membershipRow);

    return NextResponse.json({
      workspaceId: workspace.id,
      workspaceName: workspace.name ?? "Untitled workspace",
      inviterName,
      inviterEmail,
      role: invite.role,
      alreadyMember,
    });
  } catch (error) {
    console.error("Error in GET /api/workspaces/invites/inspect:", error);
    return NextResponse.json(
      { error: "Failed to inspect workspace invite" },
      { status: 500 },
    );
  }
}
