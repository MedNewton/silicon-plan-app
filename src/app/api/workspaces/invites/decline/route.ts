import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceMemberInvite,
  WorkspaceId,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Supa = SupabaseClient<SupabaseDb>;

type DeclineBody = {
  inviteId?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = user.primaryEmailAddress.emailAddress.toLowerCase();
    const body = (await req.json().catch(() => null)) as DeclineBody | null;

    if (!body?.inviteId) {
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
        { error: "This invitation has already been accepted." },
        { status: 400 },
      );
    }

    if (invite.revoked_at) {
      return NextResponse.json(
        { error: "This invitation has been revoked." },
        { status: 400 },
      );
    }

    if (invite.declined_at) {
      return NextResponse.json({ success: true });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 400 },
      );
    }

    const workspaceId: WorkspaceId = invite.workspace_id;

    const {
      data: memberRow,
      error: memberError,
    } = await client
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memberError && memberError.code !== "PGRST116") {
      console.error("memberError", memberError);
      return NextResponse.json(
        { error: "Failed to inspect membership." },
        { status: 500 },
      );
    }

    if (memberRow) {
      return NextResponse.json(
        { error: "You are already a member of this workspace." },
        { status: 400 },
      );
    }

    const { error: updateError } = await client
      .from("workspace_member_invites")
      .update({
        declined_at: new Date().toISOString(),
        declined_by_user_id: user.id,
      })
      .eq("token", inviteToken);

    if (updateError) {
      console.error("updateError", updateError);
      return NextResponse.json(
        { error: "Failed to decline invitation" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/workspaces/invites/decline:", error);
    return NextResponse.json(
      { error: "Failed to decline workspace invite" },
      { status: 500 },
    );
  }
}
