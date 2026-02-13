// src/server/workspaces.ts
import { randomUUID } from "crypto";
import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  Workspace,
  WorkspaceBusinessProfile,
  WorkspaceMember,
  WorkspaceWithDetails,
  CreateWorkspaceParams,
  UpsertWorkspaceBusinessProfileParams,
  UserId,
  WorkspaceId,
  WorkspaceRole,
  RemoveWorkspaceMemberParams,
  WorkspaceAiDocument,
  WorkspaceAiKnowledge,
  WorkspaceAiLibraryEvent,
  WorkspaceMemberInvite,
  WorkspaceAiDocumentStatus,
  CreateWorkspaceAiDocumentParams,
  UpsertWorkspaceAiKnowledgeParams,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clerkClient as getClerkClient } from "@clerk/nextjs/server";


type Supa = SupabaseClient<SupabaseDb>;
type Tables = SupabaseDb["public"]["Tables"];

// ========== SMALL HELPERS ==========

function isTransientSupabaseNetworkError(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("econnreset")
  );
}

function mapWorkspaceRow(row: unknown): Workspace {
  const r = row as Workspace;
  return {
    id: r.id,
    owner_user_id: r.owner_user_id,
    name: r.name,
    image_url: r.image_url,
    is_archived: r.is_archived,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapWorkspaceMemberRow(row: unknown): WorkspaceMember {
  const r = row as WorkspaceMember;
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    user_id: r.user_id,
    role: r.role,
    status: r.status,
    invited_email: r.invited_email,
    added_by_user_id: r.added_by_user_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapWorkspaceBusinessProfileRow(
  row: unknown,
): WorkspaceBusinessProfile {
  const r = row as WorkspaceBusinessProfile;
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    tagline: r.tagline,
    is_operating: r.is_operating,
    industry: r.industry,
    company_stage: r.company_stage,
    problem_short: r.problem_short,
    problem_long: r.problem_long,
    solution_and_uniqueness: r.solution_and_uniqueness,
    team_and_roles: r.team_and_roles,
    financial_projections: r.financial_projections,
    risks_and_mitigation: r.risks_and_mitigation,
    success_metrics: r.success_metrics,
    growth_partnerships: r.growth_partnerships,
    raw_form_data: r.raw_form_data,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function userHasWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId,
): Promise<boolean> {
  const { data, error } = await client
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check workspace access: ${error.message}`);
  }

  return data != null;
}

async function ensureUserHasWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId,
): Promise<void> {
  const hasAccess = await userHasWorkspaceAccess(client, workspaceId, userId);
  if (!hasAccess) {
    throw new Error("User does not have access to this workspace.");
  }
}

// ========== CREATE / LIST / DETAILS ==========

export async function createWorkspace(
  params: CreateWorkspaceParams,
): Promise<Workspace> {
  const { userId, name, imageUrl } = params;

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Workspace name cannot be empty.");
  }

  const client = getSupabaseClient();

  const insertPayload: Tables["workspaces"]["Insert"] = {
    owner_user_id: userId,
    name: trimmedName,
    image_url: imageUrl ?? null,
  };

  const {
    data: workspaceRow,
    error: workspaceError,
  } = await client.from("workspaces").insert(insertPayload).select("*").single();

  if (workspaceError || !workspaceRow) {
    throw new Error(
      `Failed to create workspace: ${
        workspaceError?.message ?? "Unknown error"
      }`,
    );
  }

  const workspace = mapWorkspaceRow(workspaceRow);
  const workspaceId: WorkspaceId = workspace.id;

  const memberPayload: Tables["workspace_members"]["Insert"] = {
    workspace_id: workspaceId,
    user_id: userId,
    role: "owner",
    status: "active",
    invited_email: null,
    added_by_user_id: userId,
  };

  const { error: memberError } = await client
    .from("workspace_members")
    .insert(memberPayload);

  if (memberError) {
    console.error(
      "Workspace created but failed to insert owner member:",
      memberError.message,
    );
  }

  return workspace;
}

export async function getWorkspacesForUser(
  userId: UserId,
): Promise<Workspace[]> {
  let membershipResult = await getSupabaseClient()
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipResult.error && isTransientSupabaseNetworkError(membershipResult.error.message)) {
    console.warn(
      "Transient Supabase error while loading workspace memberships, retrying once with fresh client.",
    );
    membershipResult = await getSupabaseClient({ fresh: true })
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("status", "active");
  }

  const { data: membershipRows, error: membershipError } = membershipResult;

  if (membershipError) {
    throw new Error(
      `Failed to load workspace memberships: ${membershipError.message}`,
    );
  }

  if (!membershipRows || membershipRows.length === 0) {
    return [];
  }

  const workspaceIds = membershipRows.map((row) => row.workspace_id);

  let workspacesResult = await getSupabaseClient()
    .from("workspaces")
    .select("*")
    .in("id", workspaceIds)
    .order("created_at", { ascending: false });

  if (workspacesResult.error && isTransientSupabaseNetworkError(workspacesResult.error.message)) {
    console.warn(
      "Transient Supabase error while loading workspaces, retrying once with fresh client.",
    );
    workspacesResult = await getSupabaseClient({ fresh: true })
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
      .order("created_at", { ascending: false });
  }

  const { data: workspacesData, error: workspacesError } = workspacesResult;

  if (workspacesError || !workspacesData) {
    throw new Error(
      `Failed to load workspaces: ${
        workspacesError?.message ?? "Unknown error"
      }`,
    );
  }

  return workspacesData.map((row) => mapWorkspaceRow(row));
}

export async function getUserWorkspaces({
  userId,
}: {
  userId: UserId;
}): Promise<Workspace[]> {
  return getWorkspacesForUser(userId);
}

export async function getWorkspaceWithDetails(
  workspaceId: WorkspaceId,
  userId: UserId,
): Promise<WorkspaceWithDetails | null> {
  const client = getSupabaseClient();

  const hasAccess = await userHasWorkspaceAccess(client, workspaceId, userId);
  if (!hasAccess) {
    return null;
  }

  const {
    data: workspaceRow,
    error: workspaceError,
  } = await client
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspaceRow) {
    throw new Error(
      `Failed to load workspace: ${
        workspaceError?.message ?? "Unknown error"
      }`,
    );
  }

  const workspace = mapWorkspaceRow(workspaceRow);

  const {
    data: businessProfileRow,
    error: profileError,
  } = await client
    .from("workspace_business_profile")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    throw new Error(
      `Failed to load workspace business profile: ${profileError.message}`,
    );
  }

  const businessProfile =
    businessProfileRow == null
      ? null
      : mapWorkspaceBusinessProfileRow(businessProfileRow);

  const {
    data: membersRows,
    error: membersError,
  } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  if (membersError || !membersRows) {
    throw new Error(
      `Failed to load workspace members: ${
        membersError?.message ?? "Unknown error"
      }`,
    );
  }

  const members = membersRows.map((row) => mapWorkspaceMemberRow(row));

  return {
    workspace,
    businessProfile,
    members,
  };
}

// ========== BUSINESS PROFILE ==========

export async function upsertWorkspaceBusinessProfile(
  params: UpsertWorkspaceBusinessProfileParams & { userId: UserId },
): Promise<WorkspaceBusinessProfile> {
  const {
    workspaceId,
    userId,
    tagline,
    isOperating,
    industry,
    companyStage,
    problemShort,
    problemLong,
    solutionAndUniqueness,
    teamAndRoles,
    financialProjections,
    risksAndMitigation,
    successMetrics,
    growthPartnerships,
    rawFormData,
  } = params;

  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  type Insert = Tables["workspace_business_profile"]["Insert"];

  const payload: Insert = {
    workspace_id: workspaceId,
  };

  if (tagline !== undefined) payload.tagline = tagline;
  if (isOperating !== undefined) payload.is_operating = isOperating;
  if (industry !== undefined) payload.industry = industry;
  if (companyStage !== undefined) payload.company_stage = companyStage;
  if (problemShort !== undefined) payload.problem_short = problemShort;
  if (problemLong !== undefined) payload.problem_long = problemLong;
  if (solutionAndUniqueness !== undefined) {
    payload.solution_and_uniqueness = solutionAndUniqueness;
  }
  if (teamAndRoles !== undefined) payload.team_and_roles = teamAndRoles;
  if (financialProjections !== undefined) {
    payload.financial_projections = financialProjections;
  }
  if (risksAndMitigation !== undefined) {
    payload.risks_and_mitigation = risksAndMitigation;
  }
  if (successMetrics !== undefined) {
    payload.success_metrics = successMetrics;
  }
  if (growthPartnerships !== undefined) {
    payload.growth_partnerships = growthPartnerships;
  }
  if (rawFormData !== undefined) {
    payload.raw_form_data = rawFormData;
  }

  const { data, error } = await client
    .from("workspace_business_profile")
    .upsert(payload, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to upsert workspace business profile: ${
        error?.message ?? "Unknown error"
      }`,
    );
  }

  return mapWorkspaceBusinessProfileRow(data);
}

// ========== GENERAL UPDATE ==========

export async function updateWorkspaceGeneral(params: {
  userId: UserId;
  workspaceId: WorkspaceId;
  name?: string;
  imageUrl?: string | null;
}): Promise<Workspace> {
  const { userId, workspaceId, name, imageUrl } = params;

  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updatePayload: Tables["workspaces"]["Update"] = {};

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Workspace name cannot be empty.");
    }
    updatePayload.name = trimmed;
  }

  if (imageUrl !== undefined) {
    updatePayload.image_url = imageUrl;
  }

  const { data, error } = await client
    .from("workspaces")
    .update(updatePayload)
    .eq("id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update workspace: ${error?.message ?? "Unknown error"}`,
    );
  }

  return mapWorkspaceRow(data);
}

// ========== MEMBERS (SETTINGS TAB) ==========

export type WorkspaceMembersForSettingsResult = {
  currentUserRole: WorkspaceRole | null;
  members: {
    userId: UserId;
    name: string | null;
    email: string | null;
    role: WorkspaceRole;
    isOwner: boolean;
  }[];
  invites: {
    inviteId: string;
    email: string;
    role: WorkspaceRole;
    status: "pending" | "accepted" | "declined" | "expired" | "revoked";
    invitedByUserId: UserId;
    invitedByName: string | null;
    invitedByEmail: string | null;
    createdAt: string;
    expiresAt: string | null;
    acceptedAt: string | null;
    declinedAt: string | null;
    revokedAt: string | null;
    resendCount: number;
    lastSentAt: string | null;
  }[];
};

const computeInviteStatus = (invite: {
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
}): "pending" | "accepted" | "declined" | "expired" | "revoked" => {
  if (invite.revoked_at) return "revoked";
  if (invite.accepted_at) return "accepted";
  if (invite.declined_at) return "declined";
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return "expired";
  }
  return "pending";
};

export async function getWorkspaceMembersForSettings(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<WorkspaceMembersForSettingsResult> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const [
    { data: memberRows, error: membersError },
    { data: inviteRows, error: invitesError },
  ] = await Promise.all([
    client
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    client
      .from("workspace_member_invites")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  if (membersError) {
    throw new Error(
      `Failed to load workspace members: ${
        membersError.message ?? "Unknown error"
      }`,
    );
  }

  if (invitesError) {
    throw new Error(
      `Failed to load workspace invites: ${
        invitesError.message ?? "Unknown error"
      }`,
    );
  }

  const rows: WorkspaceMember[] = (memberRows ?? []).map((row) =>
    mapWorkspaceMemberRow(row),
  );
  const invites = (inviteRows ?? []) as Tables["workspace_member_invites"]["Row"][];

  if (rows.length === 0) {
    return {
      currentUserRole: null,
      members: [],
      invites: [],
    };
  }

  const currentMember =
    rows.find((m) => m.user_id === userId && m.status === "active") ?? null;

  const currentUserRole: WorkspaceRole | null = currentMember
    ? currentMember.role
    : null;

  const uniqueUserIds = Array.from(
    new Set<UserId>([
      ...rows.map((m) => m.user_id),
      ...invites
        .map((invite) => invite.invited_by_user_id)
        .filter((id): id is UserId => Boolean(id)),
    ]),
  );

  const userInfoById = new Map<
    UserId,
    { name: string | null; email: string | null }
  >();

  try {
    const clerk = await getClerkClient();
    const usersResponse = await clerk.users.getUserList({
      userId: uniqueUserIds,
    });

    const clerkUsers = usersResponse.data;

    for (const u of clerkUsers) {
      const hasName = Boolean(u.firstName ?? u.lastName);
      const fullName = hasName
        ? [u.firstName, u.lastName].filter(Boolean).join(" ")
        : null;

      const primaryEmail =
        u.emailAddresses.find(
          (e) => e.id === u.primaryEmailAddressId,
        )?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        null;

      userInfoById.set(u.id, {
        name: fullName,
        email: primaryEmail,
      });
    }
  } catch (error: unknown) {
    console.error("Failed to enrich workspace members from Clerk", error);
  }

  const mappedMembers = rows.map((m) => {
    const enriched = userInfoById.get(m.user_id) ?? null;

    return {
      userId: m.user_id,
      name: enriched?.name ?? null,
      email: enriched?.email ?? m.invited_email,
      role: m.role,
      isOwner: m.role === "owner",
    };
  });

  const mappedInvites = invites.map((invite) => ({
    inviteId: invite.token,
    email: invite.email,
    role: invite.role,
    status: computeInviteStatus(invite),
    invitedByUserId: invite.invited_by_user_id,
    invitedByName: userInfoById.get(invite.invited_by_user_id)?.name ?? null,
    invitedByEmail: userInfoById.get(invite.invited_by_user_id)?.email ?? null,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
    declinedAt: invite.declined_at,
    revokedAt: invite.revoked_at,
    resendCount: invite.resend_count ?? 0,
    lastSentAt: invite.last_sent_at,
  }));

  return {
    currentUserRole,
    members: mappedMembers,
    invites: mappedInvites,
  };
}

export type WorkspaceInviteResult = {
  inviteId: string;
  workspaceId: WorkspaceId;
  workspaceName: string | null;
  email: string;
  role: WorkspaceRole;
};

export async function createWorkspaceInvite(params: {
  workspaceId: WorkspaceId;
  inviterUserId: UserId;
  email: string;
  role: WorkspaceRole;
}): Promise<WorkspaceInviteResult> {
  const { workspaceId, inviterUserId, email, role } = params;
  const client = getSupabaseClient();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail?.includes("@")) {
    throw new Error("A valid email address is required.");
  }

  const {
    data: inviterRow,
    error: inviterError,
  } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", inviterUserId)
    .eq("status", "active")
    .single();

  if (inviterError || !inviterRow) {
    throw new Error("You are not a member of this workspace.");
  }

  const inviter = mapWorkspaceMemberRow(inviterRow);
  if (inviter.role !== "owner" && inviter.role !== "admin") {
    throw new Error("Only owner or admin can invite new members.");
  }

  if (role === "owner") {
    throw new Error("Cannot invite a member with owner role.");
  }

  const {
    data: workspaceRow,
    error: workspaceError,
  } = await client
    .from("workspaces")
    .select("id,name")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspaceRow) {
    throw new Error("Workspace not found.");
  }

  type InviteInsert = Tables["workspace_member_invites"]["Insert"];

  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const insertPayload: InviteInsert = {
    workspace_id: workspaceId,
    email: normalizedEmail,
    role,
    token,
    invited_by_user_id: inviterUserId,
    expires_at: expiresAt.toISOString(),
    resend_count: 0,
    last_sent_at: new Date().toISOString(),
  };

  const {
    data: inviteRow,
    error: inviteError,
  } = await client
    .from("workspace_member_invites")
    .insert(insertPayload)
    .select("*")
    .single();

  if (inviteError || !inviteRow) {
    throw new Error(
      `Failed to create workspace invite: ${
        inviteError?.message ?? "Unknown error"
      }`,
    );
  }

  return {
    inviteId: (inviteRow as { token?: string }).token ?? token,
    workspaceId,
    workspaceName: (workspaceRow as { name: string | null }).name ?? null,
    email: normalizedEmail,
    role,
  };
}

async function assertCanManageWorkspaceInvites(params: {
  client: Supa;
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<void> {
  const { client, workspaceId, userId } = params;

  const { data: memberRow, error: memberError } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (memberError) {
    throw new Error(`Failed to verify workspace member: ${memberError.message}`);
  }

  if (!memberRow) {
    throw new Error("You are not a member of this workspace.");
  }

  const member = mapWorkspaceMemberRow(memberRow);
  if (member.role !== "owner" && member.role !== "admin") {
    throw new Error("Only owner or admin can manage invites.");
  }
}

type WorkspaceInviteActionResult = {
  inviteId: string;
  workspaceId: WorkspaceId;
  email: string;
  role: WorkspaceRole;
  expiresAt: string | null;
};

export async function resendWorkspaceInvite(params: {
  workspaceId: WorkspaceId;
  inviteToken: string;
  requesterUserId: UserId;
}): Promise<WorkspaceInviteActionResult> {
  const { workspaceId, inviteToken, requesterUserId } = params;
  const client = getSupabaseClient();

  await assertCanManageWorkspaceInvites({
    client,
    workspaceId,
    userId: requesterUserId,
  });

  const { data: inviteRow, error: inviteError } = await client
    .from("workspace_member_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("token", inviteToken)
    .maybeSingle();

  if (inviteError) {
    throw new Error(`Failed to load invite: ${inviteError.message}`);
  }
  if (!inviteRow) {
    throw new Error("Invite not found.");
  }

  const invite = inviteRow as Tables["workspace_member_invites"]["Row"];

  if (invite.accepted_at) {
    throw new Error("Cannot resend an already accepted invite.");
  }

  const newToken = randomUUID();
  const nextExpiry = new Date();
  nextExpiry.setDate(nextExpiry.getDate() + 7);
  const nowIso = new Date().toISOString();

  const { data: updatedRow, error: updateError } = await client
    .from("workspace_member_invites")
    .update({
      token: newToken,
      expires_at: nextExpiry.toISOString(),
      declined_at: null,
      declined_by_user_id: null,
      revoked_at: null,
      revoked_by_user_id: null,
      resend_count: (invite.resend_count ?? 0) + 1,
      last_sent_at: nowIso,
    })
    .eq("workspace_id", workspaceId)
    .eq("token", inviteToken)
    .select("*")
    .single();

  if (updateError || !updatedRow) {
    throw new Error(
      `Failed to resend invite: ${updateError?.message ?? "Unknown error"}`,
    );
  }

  const updated = updatedRow as WorkspaceMemberInvite;

  return {
    inviteId: updated.token,
    workspaceId,
    email: updated.email,
    role: updated.role,
    expiresAt: updated.expires_at,
  };
}

export async function revokeWorkspaceInvite(params: {
  workspaceId: WorkspaceId;
  inviteToken: string;
  requesterUserId: UserId;
}): Promise<void> {
  const { workspaceId, inviteToken, requesterUserId } = params;
  const client = getSupabaseClient();

  await assertCanManageWorkspaceInvites({
    client,
    workspaceId,
    userId: requesterUserId,
  });

  const { data: inviteRow, error: inviteError } = await client
    .from("workspace_member_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("token", inviteToken)
    .maybeSingle();

  if (inviteError) {
    throw new Error(`Failed to load invite: ${inviteError.message}`);
  }
  if (!inviteRow) {
    throw new Error("Invite not found.");
  }

  const invite = inviteRow as Tables["workspace_member_invites"]["Row"];

  if (invite.accepted_at) {
    throw new Error("Cannot revoke an accepted invite.");
  }
  if (invite.revoked_at) {
    return;
  }

  const { error: revokeError } = await client
    .from("workspace_member_invites")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by_user_id: requesterUserId,
    })
    .eq("workspace_id", workspaceId)
    .eq("token", inviteToken);

  if (revokeError) {
    throw new Error(`Failed to revoke invite: ${revokeError.message}`);
  }
}

// ========== REMOVE MEMBER ==========

export async function removeWorkspaceMemberFromWorkspace(params: {
  workspaceId: WorkspaceId;
  target: RemoveWorkspaceMemberParams;
  requesterUserId: UserId;
}): Promise<void> {
  const { workspaceId, target, requesterUserId } = params;
  const { userId: targetUserId } = target;

  const client = getSupabaseClient();

  const {
    data: callerRow,
    error: callerError,
  } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", requesterUserId)
    .eq("status", "active")
    .single();

  if (callerError || !callerRow) {
    throw new Error("You are not a member of this workspace.");
  }

  const caller = mapWorkspaceMemberRow(callerRow);
  const callerRole: WorkspaceRole = caller.role;

  const {
    data: targetRow,
    error: targetError,
  } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId)
    .eq("status", "active")
    .single();

  if (targetError || !targetRow) {
    throw new Error("Workspace member not found.");
  }

  const targetMember = mapWorkspaceMemberRow(targetRow);
  const targetRole: WorkspaceRole = targetMember.role;

  if (targetRole === "owner") {
    throw new Error("Workspace owner cannot be removed.");
  }

  if (targetRole === "admin" && callerRole !== "owner") {
    throw new Error("Only the owner can remove an admin.");
  }

  if (
    (targetRole === "editor" || targetRole === "viewer") &&
    callerRole !== "owner" &&
    callerRole !== "admin"
  ) {
    throw new Error("Only owner or admin can remove members.");
  }

  const { error: deleteError } = await client
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  if (deleteError) {
    throw new Error(
      `Failed to remove workspace member: ${
        deleteError.message ?? "Unknown error"
      }`,
    );
  }
}

// ========== AI LIBRARY: SNAPSHOT (DOCS + KNOWLEDGE) ==========

export type WorkspaceAiLibrarySnapshot = {
  documents: WorkspaceAiDocument[];
  knowledge: WorkspaceAiKnowledge[];
};

export async function getWorkspaceAiLibrarySnapshot(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<WorkspaceAiLibrarySnapshot> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const [docsResult, knowledgeResult] = await Promise.all([
    client
      .from("workspace_ai_documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("uploaded_at", { ascending: false }),
    client
      .from("workspace_ai_knowledge")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (docsResult.error) {
    throw new Error(
      `Failed to load AI documents: ${docsResult.error.message ?? "Unknown error"}`,
    );
  }

  if (knowledgeResult.error) {
    throw new Error(
      `Failed to load AI knowledge: ${
        knowledgeResult.error.message ?? "Unknown error"
      }`,
    );
  }

  return {
    documents: (docsResult.data ?? []) as WorkspaceAiDocument[],
    knowledge: (knowledgeResult.data ?? []) as WorkspaceAiKnowledge[],
  };
}

// ========== AI LIBRARY: DOCUMENTS ==========

export async function createWorkspaceAiDocumentRecord(
  params: CreateWorkspaceAiDocumentParams & {
    userId: UserId;
  },
): Promise<WorkspaceAiDocument> {
  const {
    workspaceId,
    userId,
    name,
    fileType,
    storageBucket,
    storagePath,
    status,
    aiMetadata,
  } = params;

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Document name cannot be empty.");
  }

  const client = getSupabaseClient();
  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  type Insert = Tables["workspace_ai_documents"]["Insert"];

  const insertPayload: Insert = {
    workspace_id: workspaceId,
    created_by: userId,
    name: trimmedName,
    file_type: fileType ?? null,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    status: status ?? "uploaded",
    ai_metadata: aiMetadata ?? null,
  };

  const { data, error } = await client
    .from("workspace_ai_documents")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create AI document record: ${error?.message ?? "Unknown error"}`,
    );
  }

  // Best-effort event logging, do not throw if it fails
  await logWorkspaceAiLibraryEvent({
    workspaceId,
    userId,
    eventType: "document_uploaded",
    documentId: (data as WorkspaceAiDocument).id,
    payload: { file_type: (data as WorkspaceAiDocument).file_type },
  }).catch((err) => {
    console.error("Failed to log document_uploaded event", err);
  });

  return data as WorkspaceAiDocument;
}

export async function updateWorkspaceAiDocumentStatus(params: {
  workspaceId: WorkspaceId;
  documentId: string;
  userId: UserId;
  status: WorkspaceAiDocumentStatus;
  aiMetadata?: Record<string, unknown> | null;
}): Promise<WorkspaceAiDocument> {
  const { workspaceId, documentId, userId, status, aiMetadata } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updatePayload: Tables["workspace_ai_documents"]["Update"] = {
    status,
  };

  if (aiMetadata !== undefined) {
    updatePayload.ai_metadata = aiMetadata;
  }

  const { data, error } = await client
    .from("workspace_ai_documents")
    .update(updatePayload)
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update AI document status: ${error?.message ?? "Unknown error"}`,
    );
  }

  return data as WorkspaceAiDocument;
}

export async function deleteWorkspaceAiDocument(params: {
  workspaceId: WorkspaceId;
  documentId: string;
  userId: UserId;
  deleteFromStorage?: boolean;
}): Promise<void> {
  const { workspaceId, documentId, userId, deleteFromStorage = true } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Load the document to know bucket/path before deleting
  const { data: docRow, error: fetchError } = await client
    .from("workspace_ai_documents")
    .select("*")
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(
      `Failed to load AI document before delete: ${
        fetchError.message ?? "Unknown error"
      }`,
    );
  }

  const doc = docRow as WorkspaceAiDocument | null;
  if (!doc) {
    // Already deleted / not found; nothing to do
    return;
  }

  if (deleteFromStorage) {
    const { error: storageError } = await client.storage
      .from(doc.storage_bucket)
      .remove([doc.storage_path]);

    if (storageError) {
      console.error(
        "Failed to delete storage object for AI document:",
        storageError.message,
      );
      // We still proceed to delete DB row to avoid dangling references
    }
  }

  const { error: deleteError } = await client
    .from("workspace_ai_documents")
    .delete()
    .eq("id", documentId)
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    throw new Error(
      `Failed to delete AI document: ${
        deleteError.message ?? "Unknown error"
      }`,
    );
  }

  // Best-effort event logging
  await logWorkspaceAiLibraryEvent({
    workspaceId,
    userId,
    eventType: "document_deleted",
    documentId,
    payload: { file_type: doc.file_type },
  }).catch((err) => {
    console.error("Failed to log document_deleted event", err);
  });
}

// ========== AI LIBRARY: KNOWLEDGE ==========

export async function createWorkspaceAiKnowledgeEntry(
  params: UpsertWorkspaceAiKnowledgeParams & {
    userId: UserId;
  },
): Promise<WorkspaceAiKnowledge> {
  const {
    workspaceId,
    userId,
    keyName,
    label,
    value,
    orderIndex,
  } = params;

  const trimmedLabel = label.trim();
  const trimmedValue = value.trim();

  if (!trimmedLabel) {
    throw new Error("Knowledge label cannot be empty.");
  }
  if (!trimmedValue) {
    throw new Error("Knowledge value cannot be empty.");
  }

  const client = getSupabaseClient();
  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  let finalOrderIndex = orderIndex;

  if (finalOrderIndex === undefined) {
    // compute next order_index
    const { data: maxRow, error: maxError } = await client
      .from("workspace_ai_knowledge")
      .select("order_index")
      .eq("workspace_id", workspaceId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxError && maxError.code !== "PGRST116") {
      throw new Error(
        `Failed to compute knowledge order index: ${
          maxError.message ?? "Unknown error"
        }`,
      );
    }

    finalOrderIndex =
      maxRow && typeof maxRow.order_index === "number"
        ? maxRow.order_index + 1
        : 0;
  }

  type Insert = Tables["workspace_ai_knowledge"]["Insert"];

  const insertPayload: Insert = {
    workspace_id: workspaceId,
    key_name: keyName,
    label: trimmedLabel,
    value: trimmedValue,
    order_index: finalOrderIndex,
  };

  const { data, error } = await client
    .from("workspace_ai_knowledge")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create AI knowledge entry: ${error?.message ?? "Unknown error"}`,
    );
  }

    // Best-effort event logging
    await logWorkspaceAiLibraryEvent({
      workspaceId,
      userId,
      eventType: "knowledge_created",
      knowledgeId: (data as WorkspaceAiKnowledge).id,
      payload: { key_name: (data as WorkspaceAiKnowledge).key_name },
    }).catch((err) => {
      console.error("Failed to log knowledge_created event", err);
    });  

  return data as WorkspaceAiKnowledge;
}

export async function deleteWorkspaceAiKnowledgeEntry(params: {
  workspaceId: WorkspaceId;
  knowledgeId: string;
  userId: UserId;
}): Promise<void> {
  const { workspaceId, knowledgeId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Load first so we can log meaningful info
  const { data: row, error: fetchError } = await client
    .from("workspace_ai_knowledge")
    .select("*")
    .eq("id", knowledgeId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(
      `Failed to load AI knowledge before delete: ${
        fetchError.message ?? "Unknown error"
      }`,
    );
  }

  const existing = row as WorkspaceAiKnowledge | null;
  if (!existing) {
    // Already removed
    return;
  }

  const { error: deleteError } = await client
    .from("workspace_ai_knowledge")
    .delete()
    .eq("id", knowledgeId)
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    throw new Error(
      `Failed to delete AI knowledge entry: ${
        deleteError.message ?? "Unknown error"
      }`,
    );
  }

  // Best-effort event logging
  await logWorkspaceAiLibraryEvent({
    workspaceId,
    userId,
    eventType: "knowledge_deleted",
    knowledgeId,
    payload: { key_name: existing.key_name },
  }).catch((err) => {
    console.error("Failed to log knowledge_deleted event", err);
  });
}

// ========== AI LIBRARY: EVENT LOGGING (INTERNAL HELPER) ==========

export async function logWorkspaceAiLibraryEvent(params: {
  workspaceId: WorkspaceId;
  userId?: UserId | null;
  eventType: WorkspaceAiLibraryEvent["event_type"];
  documentId?: string | null;
  knowledgeId?: string | null;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  const {
    workspaceId,
    userId = null,
    eventType,
    documentId = null,
    knowledgeId = null,
    payload = null,
  } = params;

  const client = getSupabaseClient();

  type Insert = Tables["workspace_ai_library_events"]["Insert"];

  const insertPayload: Insert = {
    workspace_id: workspaceId,
    user_id: userId,
    event_type: eventType,
    document_id: documentId,
    knowledge_id: knowledgeId,
    payload,
  };

  const { error } = await client
    .from("workspace_ai_library_events")
    .insert(insertPayload);

  if (error) {
    // Do NOT throw here – event logging must be best-effort only.
    console.error(
      "Failed to insert workspace_ai_library_event:",
      error.message,
    );
  }
}
