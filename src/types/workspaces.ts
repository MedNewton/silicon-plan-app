// src/types/workspaces.ts

// ========== ID ALIASES ==========

export type WorkspaceId = string;
export type WorkspaceMemberId = string;
export type WorkspaceBusinessProfileId = string;
export type WorkspaceAiDocumentId = string;
export type WorkspaceAiKnowledgeId = string;

// Clerk user id
export type UserId = string;

// ========== ENUM-LIKE STRING LITERALS ==========

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type WorkspaceMemberStatus = "active" | "invited" | "removed";

export type WorkspaceAiDocumentStatus =
  | "uploading"
  | "processing"
  | "uploaded"
  | "failed";

// ========== CORE ENTITIES (MATCH SUPABASE COLUMNS) ==========

export type Workspace = {
  id: WorkspaceId;
  owner_user_id: UserId;
  name: string;
  image_url: string | null;
  is_archived: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

export type WorkspaceMember = {
  id: WorkspaceMemberId;
  workspace_id: WorkspaceId;
  user_id: UserId;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  invited_email: string | null;
  added_by_user_id: UserId | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceBusinessProfile = {
  id: WorkspaceBusinessProfileId;
  workspace_id: WorkspaceId;

  tagline: string | null;
  is_operating: boolean | null;
  industry: string | null;
  company_stage: string | null;

  problem_short: string | null;
  problem_long: string | null;
  solution_and_uniqueness: string | null;
  team_and_roles: string | null;
  financial_projections: string | null;
  risks_and_mitigation: string | null;
  success_metrics: string | null;
  growth_partnerships: string | null;

  raw_form_data: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
};

export type WorkspaceAiDocument = {
  id: WorkspaceAiDocumentId;
  workspace_id: WorkspaceId;
  name: string;
  file_type: string | null;
  storage_url: string;
  uploaded_at: string;
  status: WorkspaceAiDocumentStatus;
  ai_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceAiKnowledge = {
  id: WorkspaceAiKnowledgeId;
  workspace_id: WorkspaceId;
  key_name: string;
  label: string;
  value: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// ========== AGGREGATE TYPES ==========

export type WorkspaceWithDetails = {
  workspace: Workspace;
  businessProfile: WorkspaceBusinessProfile | null;
  members: WorkspaceMember[];
};

// ========== INPUT TYPES (FOR SERVER FUNCTIONS / APIS) ==========

export type CreateWorkspaceParams = {
  userId: UserId; // Clerk user id of the creator
  name: string;
  imageUrl?: string | null;
};

export type UpdateWorkspaceParams = {
  workspaceId: WorkspaceId;
  name?: string;
  imageUrl?: string | null;
  isArchived?: boolean;
};

export type UpsertWorkspaceMemberParams = {
  workspaceId: WorkspaceId;
  userId: UserId;
  role: WorkspaceRole;
  status?: WorkspaceMemberStatus; // default "active" if omitted
  invitedEmail?: string | null;
  addedByUserId?: UserId | null;
};

export type RemoveWorkspaceMemberParams = {
  workspaceId: WorkspaceId;
  userId: UserId;
};

export type UpsertWorkspaceBusinessProfileParams = {
  workspaceId: WorkspaceId;

  tagline?: string | null;
  isOperating?: boolean | null;
  industry?: string | null;
  companyStage?: string | null;

  problemShort?: string | null;
  problemLong?: string | null;
  solutionAndUniqueness?: string | null;
  teamAndRoles?: string | null;
  financialProjections?: string | null;
  risksAndMitigation?: string | null;
  successMetrics?: string | null;
  growthPartnerships?: string | null;

  rawFormData?: Record<string, unknown> | null;
};

export type CreateWorkspaceAiDocumentParams = {
  workspaceId: WorkspaceId;
  name: string;
  fileType?: string | null;
  storageUrl: string;
  status?: WorkspaceAiDocumentStatus; // default "uploaded" if omitted
  aiMetadata?: Record<string, unknown> | null;
};

export type UpsertWorkspaceAiKnowledgeParams = {
  workspaceId: WorkspaceId;
  keyName: string; // e.g. "industry"
  label: string; // human label
  value: string;
  orderIndex?: number;
};
