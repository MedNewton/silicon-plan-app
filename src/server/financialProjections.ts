// src/server/financialProjections.ts
// CRUD operations for workspace_financial_projections table.

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WorkspaceId,
  UserId,
  WorkspaceFinancialProjection,
} from "@/types/workspaces";
import type { FinancialProjectionData, IndustryClassification } from "@/types/financialProjections";
import type { FullValuationResults } from "@/types/valuation";

type Supa = SupabaseClient<SupabaseDb>;

// ========== HELPERS ==========

async function ensureUserHasWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId,
): Promise<void> {
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
  if (!data) {
    throw new Error("User does not have access to this workspace.");
  }
}

// ========== READ ==========

export async function getFinancialProjection(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<WorkspaceFinancialProjection | null> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("workspace_financial_projections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get financial projection: ${error.message}`);
  }

  return (data as WorkspaceFinancialProjection) ?? null;
}

// ========== UPSERT ==========

export async function upsertFinancialProjection(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
  financialData: FinancialProjectionData;
  industryClassification?: IndustryClassification | null;
}): Promise<WorkspaceFinancialProjection> {
  const { workspaceId, userId, financialData, industryClassification } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("workspace_financial_projections")
    .upsert(
      {
        workspace_id: workspaceId,
        financial_data: financialData as unknown as Record<string, unknown>,
        industry_classification: industryClassification
          ? (industryClassification as unknown as Record<string, unknown>)
          : null,
      },
      { onConflict: "workspace_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert financial projection: ${error.message}`);
  }

  return data as WorkspaceFinancialProjection;
}

// ========== UPDATE VALUATION RESULTS ==========

export async function updateValuationResults(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
  valuationResults: FullValuationResults;
}): Promise<WorkspaceFinancialProjection> {
  const { workspaceId, userId, valuationResults } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("workspace_financial_projections")
    .update({
      valuation_results: valuationResults as unknown as Record<string, unknown>,
    })
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update valuation results: ${error.message}`);
  }

  return data as WorkspaceFinancialProjection;
}

// ========== UPDATE INDUSTRY CLASSIFICATION ==========

export async function updateIndustryClassification(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
  industryClassification: IndustryClassification;
}): Promise<WorkspaceFinancialProjection> {
  const { workspaceId, userId, industryClassification } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("workspace_financial_projections")
    .update({
      industry_classification: industryClassification as unknown as Record<string, unknown>,
    })
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update industry classification: ${error.message}`);
  }

  return data as WorkspaceFinancialProjection;
}
