// src/lib/workspaceAiContext.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabaseServer";
import { getSupabaseClient } from "@/lib/supabaseServer";
import type { WorkspaceAiKnowledge, WorkspaceAiDocument, WorkspaceId } from "@/types/workspaces";

type Supa = SupabaseClient<Database>;

const TEXT_TYPES = ["txt", "md", "json", "csv", "xml", "html"];

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

const getDocumentContent = async (
  client: Supa,
  document: WorkspaceAiDocument
): Promise<string | null> => {
  try {
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

  const [knowledge, documents] = await Promise.all([
    getWorkspaceKnowledge(client, workspaceId),
    getWorkspaceDocuments(client, workspaceId),
  ]);

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
  if (knowledgeLines) {
    parts.push(`Workspace knowledge:\n${knowledgeLines}`);
  }
  if (documentsLines) {
    parts.push(`Workspace AI documents:\n${documentsLines}`);
  }

  const context = parts.join("\n\n");
  const hasContext = Boolean(knowledgeLines || documentsLines);

  return {
    context,
    hasContext,
  };
};
