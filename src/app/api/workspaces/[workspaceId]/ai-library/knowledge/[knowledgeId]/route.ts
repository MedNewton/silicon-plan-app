// src/app/api/workspaces/[workspaceId]/ai-library/knowledge/[knowledgeId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceAiKnowledge,
  WorkspaceId,
  UserId,
} from "@/types/workspaces";

type Supa = SupabaseClient<SupabaseDb>;

async function ensureWorkspaceAccess(
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
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    if (error instanceof Error) {
      console.error("Failed to check workspace access:", error.message);
    } else {
      console.error("Failed to check workspace access:", error);
    }
    throw new Error("Failed to check workspace access");
  }

  return data != null;
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; knowledgeId: string }> },
) {
  try {
    const { userId } = await auth();
    const { workspaceId, knowledgeId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId || !knowledgeId) {
      return new NextResponse("Workspace id and knowledge id are required", {
        status: 400,
      });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 1) Load knowledge row and verify workspace
    const {
      data: knowledgeRow,
      error: loadError,
    } = await client
      .from("workspace_ai_knowledge")
      .select("*")
      .eq("id", knowledgeId)
      .maybeSingle();

    if (loadError) {
      if (loadError instanceof Error) {
        console.error(
          "Failed to load AI knowledge before delete:",
          loadError.message,
        );
      } else {
        console.error("Failed to load AI knowledge before delete:", loadError);
      }
      return new NextResponse("Failed to load knowledge item", { status: 500 });
    }

    if (!knowledgeRow) {
      return new NextResponse("Knowledge item not found", { status: 404 });
    }

    const knowledge = knowledgeRow as WorkspaceAiKnowledge;

    if (knowledge.workspace_id !== workspaceId) {
      // The knowledge entry exists but does not belong to this workspace
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2) Delete the knowledge row
    const { error: deleteError } = await client
      .from("workspace_ai_knowledge")
      .delete()
      .eq("id", knowledgeId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      if (deleteError instanceof Error) {
        console.error("Failed to delete AI knowledge:", deleteError.message);
      } else {
        console.error("Failed to delete AI knowledge:", deleteError);
      }
      return new NextResponse("Failed to delete knowledge item", {
        status: 500,
      });
    }

    // 3) Log event (best-effort) – do NOT reference the deleted row via FK
    const { error: eventError } = await client
      .from("workspace_ai_library_events")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        event_type: "knowledge_deleted",
        document_id: null,
        knowledge_id: null, // <-- important: avoid FK violation after delete
        payload: {
          id: knowledgeId,
          keyName: knowledge.key_name,
          label: knowledge.label,
        },
      });

    if (eventError) {
      if (eventError instanceof Error) {
        console.error(
          "Failed to insert library event for knowledge delete:",
          eventError.message,
        );
      } else {
        console.error(
          "Failed to insert library event for knowledge delete:",
          eventError,
        );
      }
      // best-effort: do not fail the delete because of logging
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Unexpected error in DELETE /ai-library/knowledge/[knowledgeId]:",
        error.message,
      );
    } else {
      console.error(
        "Unexpected error in DELETE /ai-library/knowledge/[knowledgeId]:",
        error,
      );
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
