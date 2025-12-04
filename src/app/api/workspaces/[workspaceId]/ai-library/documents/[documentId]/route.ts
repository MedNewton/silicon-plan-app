// src/app/api/workspaces/[workspaceId]/ai-library/documents/[documentId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceAiDocument,
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
  ctx: { params: Promise<{ workspaceId: string; documentId: string }> },
) {
  try {
    const { userId } = await auth();
    const { workspaceId, documentId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId || !documentId) {
      return new NextResponse("Workspace id and document id are required", {
        status: 400,
      });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 1) Load the document row, scoped to workspace
    const {
      data: docRow,
      error: docError,
    } = await client
      .from("workspace_ai_documents")
      .select("*")
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (docError) {
      if (docError instanceof Error) {
        console.error(
          "Failed to load AI document before delete:",
          docError.message,
        );
      } else {
        console.error("Failed to load AI document before delete:", docError);
      }
      return new NextResponse("Failed to load document", { status: 500 });
    }

    if (!docRow) {
      return new NextResponse("Document not found", { status: 404 });
    }

    const document = docRow as WorkspaceAiDocument;

    const storageBucket = document.storage_bucket ?? null;
    const storagePath = document.storage_path ?? null;
    const fileName = document.name;
    const fileType = document.file_type ?? null;

    // 2) Best-effort delete from storage
    if (storageBucket && storagePath) {
      const { error: storageError } = await client.storage
        .from(storageBucket)
        .remove([storagePath]);

      if (storageError) {
        if (storageError instanceof Error) {
          console.error(
            "Failed to delete file from storage (continuing with DB delete):",
            storageError.message,
          );
        } else {
          console.error(
            "Failed to delete file from storage (continuing with DB delete):",
            storageError,
          );
        }
        // best-effort only – do not fail the whole request
      }
    }

    // 3) Delete the DB row
    const { error: deleteError } = await client
      .from("workspace_ai_documents")
      .delete()
      .eq("id", documentId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      if (deleteError instanceof Error) {
        console.error("Failed to delete AI document row:", deleteError.message);
      } else {
        console.error("Failed to delete AI document row:", deleteError);
      }
      return new NextResponse("Failed to delete document", { status: 500 });
    }

    // 4) Log the event (best effort, NO FK link for a deleted doc)
    const { error: eventError } = await client
      .from("workspace_ai_library_events")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        event_type: "document_deleted",
        document_id: null, // <- important: no FK to deleted row
        knowledge_id: null,
        payload: {
          deletedDocumentId: documentId,
          name: fileName,
          fileType,
          storageBucket,
          storagePath,
        },
      });

    if (eventError) {
      if (eventError instanceof Error) {
        console.error(
          "Failed to insert library event for document delete:",
          eventError.message,
        );
      } else {
        console.error(
          "Failed to insert library event for document delete:",
          eventError,
        );
      }
      // best-effort: do not fail response
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Unexpected error in DELETE /ai-library/documents/[documentId]:",
        error.message,
      );
    } else {
      console.error(
        "Unexpected error in DELETE /ai-library/documents/[documentId]:",
        error,
      );
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
