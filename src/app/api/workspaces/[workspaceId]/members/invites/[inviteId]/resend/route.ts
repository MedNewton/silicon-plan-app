import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";

import { resendWorkspaceInvite } from "@/server/workspaces";

type RouteParams = {
  workspaceId: string;
  inviteId: string;
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

    const { workspaceId, inviteId } = await context.params;

    if (!workspaceId || !inviteId) {
      return NextResponse.json(
        { error: "workspaceId and inviteId are required" },
        { status: 400 },
      );
    }

    const invite = await resendWorkspaceInvite({
      workspaceId,
      inviteToken: inviteId,
      requesterUserId: user.id,
    });

    if (resend) {
      const origin = new URL(request.url).origin;
      const inviteUrl = `${origin}/workspaces/join?invite=${encodeURIComponent(
        invite.inviteId,
      )}`;

      const inviterName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
          <h2 style="margin-bottom:16px;">Workspace invitation reminder</h2>
          <p style="margin-bottom:12px;">
            ${inviterName || "A teammate"} has resent your Silicon Plan workspace invitation.
          </p>
          <p style="margin-bottom:24px;">Click below to accept the invitation.</p>
          <p>
            <a href="${inviteUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#4C6AD2;color:#ffffff;text-decoration:none;font-weight:600;">
              Accept invitation
            </a>
          </p>
        </div>
      `;

      try {
        const sendResult = await resend.emails.send({
          from: "Silicon Plan <notifications@silicon-plan.live>",
          to: invite.email,
          subject: "Silicon Plan workspace invitation reminder",
          html,
        });

        if (sendResult?.error) {
          console.error("Failed to send workspace invite reminder:", sendResult.error);
        }
      } catch (sendError) {
        console.error("Failed to send workspace invite reminder:", sendError);
      }
    }

    return NextResponse.json({
      success: true,
      inviteId: invite.inviteId,
      expiresAt: invite.expiresAt,
      email: invite.email,
      role: invite.role,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to resend invite";

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
      "Error in POST /api/workspaces/[workspaceId]/members/invites/[inviteId]/resend:",
      error,
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
