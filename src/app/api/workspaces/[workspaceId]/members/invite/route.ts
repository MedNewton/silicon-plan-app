// src/app/api/workspaces/[workspaceId]/members/invite/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";

import { createWorkspaceInvite } from "@/server/workspaces";
import type { WorkspaceRole } from "@/types/workspaces";
import { resolvePublicAppUrl } from "@/lib/publicAppUrl";

export const dynamic = "force-dynamic";

type RouteParams = {
  workspaceId: string;
};

type InviteBody = {
  email?: string;
  role?: WorkspaceRole;
};

type ResendClient = {
  emails: {
    send: (args: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
    }) => Promise<{ error?: unknown }>;
  };
};

const resendApiKey =
  process.env.RESEND_API_KEY ?? process.env.RESEND_API_KE;

let resend: ResendClient | null = null;

if (resendApiKey) {
  const client = new Resend(resendApiKey);
  resend = client as unknown as ResendClient;
}

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as InviteBody;

    const rawEmail = (body.email ?? "").trim();
    const role: WorkspaceRole = body.role ?? "viewer";

    if (!rawEmail?.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    if (role === "owner") {
      return NextResponse.json(
        { error: "You cannot invite a member with role owner" },
        { status: 400 },
      );
    }

    const invite = await createWorkspaceInvite({
      workspaceId,
      inviterUserId: user.id,
      email: rawEmail.toLowerCase(),
      role,
    });

    if (!resend) {
      return NextResponse.json(
        { success: true, inviteId: invite.inviteId },
        { status: 200 },
      );
    }

    const origin = resolvePublicAppUrl(request);
    const inviteUrl = `${origin}/workspaces/join?invite=${encodeURIComponent(
      invite.inviteId,
    )}`;

    const inviterName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const workspaceLabel = invite.workspaceName ?? "a workspace";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
        <h2 style="margin-bottom:16px;">You&#39;re invited to join ${workspaceLabel} on Silicon Plan</h2>
        <p style="margin-bottom:12px;">
          ${inviterName || "A teammate"} has invited you to collaborate in the workspace
          <strong>${workspaceLabel}</strong> on Silicon Plan.
        </p>
        <p style="margin-bottom:24px;">Click the button below to accept this invitation.</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#4C6AD2;color:#ffffff;text-decoration:none;font-weight:600;">
            Accept invitation
          </a>
        </p>
        <p style="margin-top:24px;font-size:13px;color:#6B7280;">
          If you weren&#39;t expecting this invitation, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      const sendResult = await resend.emails.send({
        from: "Silicon Plan <notifications@silicon-plan.live>",
        to: invite.email,
        subject: `You're invited to join ${workspaceLabel} on Silicon Plan`,
        html,
      });

      if (sendResult?.error) {
        console.error("Failed to send workspace invite email:", sendResult.error);
      }
    } catch (sendErr: unknown) {
      console.error("Failed to send workspace invite email:", sendErr);
    }

    return NextResponse.json(
      { success: true, inviteId: invite.inviteId },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      "Error in POST /api/workspaces/[workspaceId]/members/invite:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to send workspace invitation" },
      { status: 500 },
    );
  }
}
