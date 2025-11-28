// src/app/api/workspaces/invites/accept/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceMemberInvite,
  WorkspaceRole,
  WorkspaceId,
  UserId,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Supa = SupabaseClient<SupabaseDb>;
type Tables = SupabaseDb["public"]["Tables"];

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = user.primaryEmailAddress.emailAddress.toLowerCase();
    const body = (await req.json()) as { inviteId?: string };

    if (!body.inviteId) {
      return NextResponse.json(
        { error: "Missing invite id" },
        { status: 400 },
      );
    }

    const inviteToken = body.inviteId;
    const client: Supa = getSupabaseClient();

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

    const inviteEmail = (invite.email ?? "").toLowerCase();
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
    const role: WorkspaceRole = invite.role;
    const invitedByUserId: UserId = invite.invited_by_user_id;

    const memberPayload: Tables["workspace_members"]["Insert"] = {
      workspace_id: workspaceId,
      user_id: user.id,
      role,
      status: "active",
      invited_email: invite.email,
      added_by_user_id: invitedByUserId,
    };

    const { error: memberError } = await client
      .from("workspace_members")
      .upsert(memberPayload, {
        onConflict: "workspace_id,user_id",
      });

    if (memberError) {
      console.error("memberError", memberError);
      return NextResponse.json(
        { error: "Failed to add you to this workspace." },
        { status: 500 },
      );
    }

    const { error: updateInviteError } = await client
      .from("workspace_member_invites")
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq("token", inviteToken);

    if (updateInviteError) {
      console.error("updateInviteError", updateInviteError);
    }

    return NextResponse.json({
      workspaceId,
    });
  } catch (error) {
    console.error("Error in POST /api/workspaces/invites/accept:", error);
    return NextResponse.json(
      { error: "Failed to accept workspace invite" },
      { status: 500 },
    );
  }
}
