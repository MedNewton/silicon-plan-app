// src/lib/workspaceAiContext.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabaseServer";
import { getSupabaseClient } from "@/lib/supabaseServer";
import type {
  WorkspaceAiKnowledge,
  WorkspaceAiDocument,
  WorkspaceBusinessProfile,
  WorkspaceId,
} from "@/types/workspaces";

type Supa = SupabaseClient<Database>;

const TEXT_TYPES = ["txt", "md", "json", "csv", "xml", "html"];

const trimTo = (value: string, max = 320): string =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const asRawString = (
  raw: Record<string, unknown> | null,
  key: string,
): string => {
  if (!raw) return "";
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
};

const getWorkspaceKnowledge = async (
  client: Supa,
  workspaceId: WorkspaceId
): Promise<WorkspaceAiKnowledge[]> => {
  const { data, error } = await client
    .from("workspace_ai_knowledge")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Failed to load workspace knowledge:", error);
    return [];
  }

  return (data ?? []) as WorkspaceAiKnowledge[];
};

const getWorkspaceDocuments = async (
  client: Supa,
  workspaceId: WorkspaceId
): Promise<WorkspaceAiDocument[]> => {
  const { data, error } = await client
    .from("workspace_ai_documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "uploaded");

  if (error) {
    console.error("Failed to load workspace documents:", error);
    return [];
  }

  return (data ?? []) as WorkspaceAiDocument[];
};

const getWorkspaceBusinessProfile = async (
  client: Supa,
  workspaceId: WorkspaceId,
): Promise<WorkspaceBusinessProfile | null> => {
  const { data, error } = await client
    .from("workspace_business_profile")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to load workspace business profile:", error);
    return null;
  }

  return (data as WorkspaceBusinessProfile | null) ?? null;
};

const getWorkspaceName = async (
  client: Supa,
  workspaceId: WorkspaceId,
): Promise<string> => {
  const { data, error } = await client
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to load workspace name:", error);
    return "";
  }

  return typeof data?.name === "string" ? data.name : "";
};

const buildOnboardingLines = (params: {
  workspaceName: string;
  profile: WorkspaceBusinessProfile | null;
}): string => {
  const { workspaceName, profile } = params;
  if (!profile && !workspaceName) return "";

  const raw =
    profile?.raw_form_data && typeof profile.raw_form_data === "object"
      ? profile.raw_form_data
      : null;

  const lines: string[] = [];

  const push = (label: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    lines.push(`- ${label}: ${trimTo(trimmed)}`);
  };

  push("Workspace Name", asRawString(raw, "workspaceName") || workspaceName);
  push("Business Name", asRawString(raw, "businessName"));
  push("Tagline", profile?.tagline ?? asRawString(raw, "tagline"));

  if (profile?.is_operating === true) push("Operating Status", "Operating");
  if (profile?.is_operating === false) push("Operating Status", "Not operating yet");
  if (profile?.is_operating == null) {
    const op = asRawString(raw, "isOperating");
    if (op === "yes") push("Operating Status", "Operating");
    if (op === "no") push("Operating Status", "Not operating yet");
  }

  push("Business Plan Purpose", asRawString(raw, "businessPlanPurpose"));
  push("Industry", profile?.industry ?? asRawString(raw, "industryOption"));
  push(
    "Industry Custom",
    asRawString(raw, "industryCustom"),
  );
  push(
    "Company Stage",
    profile?.company_stage ?? asRawString(raw, "companyStageOption"),
  );
  push("Company Stage Custom", asRawString(raw, "companyStageCustom"));
  push("ATECO Code", asRawString(raw, "atecoCode"));
  push("ATECO Description", asRawString(raw, "atecoDescription"));
  push(
    "Problem Target",
    profile?.problem_short ?? asRawString(raw, "problemShortOption"),
  );
  push("Problem Target Custom", asRawString(raw, "problemShortCustom"));
  push(
    "Problem Details",
    profile?.problem_long ?? asRawString(raw, "problemLong"),
  );
  push(
    "Solution & Uniqueness",
    profile?.solution_and_uniqueness ?? asRawString(raw, "solutionAndUniqueness"),
  );
  push("Product or Service", asRawString(raw, "productOrService"));
  push("Sales Channel", asRawString(raw, "salesChannel"));
  push("Target Market", asRawString(raw, "targetMarket"));
  push("Team Size", asRawString(raw, "teamSize"));
  push("Team & Roles", profile?.team_and_roles ?? asRawString(raw, "teamAndRoles"));
  push(
    "Financial Projections",
    profile?.financial_projections ?? asRawString(raw, "financialProjections"),
  );
  push(
    "Risks & Mitigation",
    profile?.risks_and_mitigation ?? asRawString(raw, "risksAndMitigation"),
  );
  push(
    "Success Metrics",
    profile?.success_metrics ?? asRawString(raw, "successMetrics"),
  );
  push(
    "Growth Partnerships",
    profile?.growth_partnerships ?? asRawString(raw, "growthPartnerships"),
  );

  return lines.join("\n");
};

const getDocumentContent = async (
  client: Supa,
  document: WorkspaceAiDocument
): Promise<string | null> => {
  try {
    const extractedFromMetadata = (() => {
      const metadata = document.ai_metadata;
      if (!metadata || typeof metadata !== "object") return "";
      const value = metadata.extractedText;
      return typeof value === "string" ? value.trim() : "";
    })();

    if (extractedFromMetadata) {
      return extractedFromMetadata.slice(0, 5000);
    }

    if (!document.file_type || !TEXT_TYPES.includes(document.file_type.toLowerCase())) {
      return null;
    }

    const { data, error } = await client.storage
      .from(document.storage_bucket)
      .download(document.storage_path);

    if (error || !data) {
      console.error("Failed to download document:", error);
      return null;
    }

    const text = await data.text();
    return text.slice(0, 5000);
  } catch (err) {
    console.error("Error reading document content:", err);
    return null;
  }
};

export const getWorkspaceAiContext = async (workspaceId: WorkspaceId) => {
  const client = getSupabaseClient();

  const [knowledge, documents, profile, workspaceName] = await Promise.all([
    getWorkspaceKnowledge(client, workspaceId),
    getWorkspaceDocuments(client, workspaceId),
    getWorkspaceBusinessProfile(client, workspaceId),
    getWorkspaceName(client, workspaceId),
  ]);

  const onboardingLines = buildOnboardingLines({ workspaceName, profile });
  const knowledgeLines =
    knowledge.length > 0
      ? knowledge.map((item) => `- ${item.label ?? item.key_name}: ${item.value}`).join("\n")
      : "";

  const documentEntries = await Promise.all(
    documents.map(async (doc) => {
      const snippet = await getDocumentContent(client, doc);
      if (!snippet) {
        return `- ${doc.name} (${doc.file_type ?? "unknown"}): [content not available]`;
      }
      return `- ${doc.name} (${doc.file_type ?? "unknown"}): ${snippet}`;
    })
  );

  const documentsLines = documentEntries.filter(Boolean).join("\n");

  const parts: string[] = [];
  if (onboardingLines) {
    parts.push(`Workspace onboarding profile:\n${onboardingLines}`);
  }
  if (knowledgeLines) {
    parts.push(`Workspace knowledge:\n${knowledgeLines}`);
  }
  if (documentsLines) {
    parts.push(`Workspace AI documents:\n${documentsLines}`);
  }

  const context = parts.join("\n\n");
  const hasContext = Boolean(onboardingLines || knowledgeLines || documentsLines);

  return {
    context,
    hasContext,
  };
};
