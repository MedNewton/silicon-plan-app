// src/server/workspaces.ts

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
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supa = SupabaseClient<SupabaseDb>;
type Tables = SupabaseDb["public"]["Tables"];

// ---------- Access helpers ----------

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

// ---------- Core operations ----------

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
    data: workspace,
    error: workspaceError,
  } = await client.from("workspaces").insert(insertPayload).select("*").single();

  if (workspaceError || !workspace) {
    throw new Error(
      `Failed to create workspace: ${
        workspaceError?.message ?? "Unknown error"
      }`,
    );
  }

  const typedWorkspace = workspace as Workspace;

  const memberPayload: Tables["workspace_members"]["Insert"] = {
    workspace_id: typedWorkspace.id,
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

  return typedWorkspace;
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
    data: workspaces,
    error: workspacesError,
  } = await client
    .from("workspaces")
    .select("*")
    .in("id", workspaceIds)
    .order("created_at", { ascending: false });

  if (workspacesError || !workspaces) {
    throw new Error(
      `Failed to load workspaces: ${
        workspacesError?.message ?? "Unknown error"
      }`,
    );
  }

  return workspaces as Workspace[];
}

// Small wrapper to match the API route call signature
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
    data: workspace,
    error: workspaceError,
  } = await client
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    throw new Error(
      `Failed to load workspace: ${
        workspaceError?.message ?? "Unknown error"
      }`,
    );
  }

  const {
    data: businessProfile,
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

  const {
    data: members,
    error: membersError,
  } = await client
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  if (membersError || !members) {
    throw new Error(
      `Failed to load workspace members: ${
        membersError?.message ?? "Unknown error"
      }`,
    );
  }

  return {
    workspace: workspace as Workspace,
    businessProfile: (businessProfile as WorkspaceBusinessProfile | null) ?? null,
    members: members as WorkspaceMember[],
  };
}

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

  const payload: Tables["workspace_business_profile"]["Insert"] = {
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

  const {
    data,
    error,
  } = await client
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

  return data as WorkspaceBusinessProfile;
}
