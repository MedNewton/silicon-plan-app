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
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clerkClient as getClerkClient,
} from "@clerk/nextjs/server";

type Supa = SupabaseClient<SupabaseDb>;
type Tables = SupabaseDb["public"]["Tables"];

// ========== SMALL HELPERS ==========

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
  const client = getSupabaseClient();

  const {
    data: membershipRows,
    error: membershipError,
  } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(
      `Failed to load workspace memberships: ${membershipError.message}`,
    );
  }

  if (!membershipRows || membershipRows.length === 0) {
    return [];
  }

  const workspaceIds = membershipRows.map((row) => row.workspace_id);

  const {
    data: workspacesData,
    error: workspacesError,
  } = await client
    .from("workspaces")
    .select("*")
    .in("id", workspaceIds)
    .order("created_at", { ascending: false });

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
};

export async function getWorkspaceMembersForSettings(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<WorkspaceMembersForSettingsResult> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const {
    data: memberRows,
    error: membersError,
  } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(
      `Failed to load workspace members: ${
        membersError.message ?? "Unknown error"
      }`,
    );
  }

  const rows: WorkspaceMember[] = (memberRows ?? []).map((row) =>
    mapWorkspaceMemberRow(row),
  );

  if (rows.length === 0) {
    return {
      currentUserRole: null,
      members: [],
    };
  }

  const currentMember =
    rows.find((m) => m.user_id === userId && m.status === "active") ?? null;

  const currentUserRole: WorkspaceRole | null = currentMember
    ? currentMember.role
    : null;

  // ---- Fetch profile info from Clerk ----
  const uniqueUserIds = Array.from(
    new Set<UserId>(rows.map((m) => m.user_id)),
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

  return {
    currentUserRole,
    members: mappedMembers,
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
