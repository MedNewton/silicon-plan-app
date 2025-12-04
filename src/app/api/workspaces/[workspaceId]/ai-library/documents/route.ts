// src/app/api/workspaces/[workspaceId]/ai-library/documents/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceAiDocument,
  WorkspaceAiDocumentStatus,
  WorkspaceId,
  UserId,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

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

// ---------- GET: list AI documents ----------

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { userId } = await auth();
    const { workspaceId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { data, error } = await client
      .from("workspace_ai_documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error instanceof Error) {
        console.error("Failed to load workspace AI documents:", error.message);
      } else {
        console.error("Failed to load workspace AI documents:", error);
      }
      return new NextResponse("Failed to load documents", { status: 500 });
    }

    const documents = (data ?? []) as WorkspaceAiDocument[];

    return NextResponse.json({ documents });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Unexpected error in GET /ai-library/documents:",
        error.message,
      );
    } else {
      console.error("Unexpected error in GET /ai-library/documents:", error);
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// ---------- POST: upload file + create AI document row ----------

export async function POST(
    req: Request,
    ctx: { params: Promise<{ workspaceId: string }> },
  ) {
    try {
      const { userId } = await auth();
      const { workspaceId } = await ctx.params;
  
      if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
  
      if (!workspaceId) {
        return new NextResponse("Workspace id is required", { status: 400 });
      }
  
      // Expect multipart/form-data
      const formData = await req.formData();
  
      const file = formData.get("file");
      const nameRaw = formData.get("name");
  
      if (!(file instanceof File)) {
        return new NextResponse("File is required", { status: 400 });
      }
  
      // Safely derive name as a string
      let name: string;
      if (typeof nameRaw === "string" && nameRaw.trim().length > 0) {
        name = nameRaw.trim();
      } else if (typeof file.name === "string" && file.name.trim().length > 0) {
        name = file.name.trim();
      } else {
        name = "";
      }
  
      if (!name) {
        return new NextResponse("Document name is required", { status: 400 });
      }
  
      const storageBucket =
        process.env.NEXT_PUBLIC_SUPABASE_AI_DOCS_BUCKET ??
        "workspace-ai-documents";
  
      if (!storageBucket) {
        return new NextResponse("storageBucket is required", { status: 500 });
      }
  
      // Derive file extension / fileType from filename
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
      const fileType = extMatch?.[1]?.toLowerCase() ?? null;
  
      // Build storage path
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "_");
      const storagePath = `workspace-${workspaceId}/${Date.now()}-${sanitizedName}`;
  
      const client = getSupabaseClient();
  
      const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
      if (!hasAccess) {
        return new NextResponse("Forbidden", { status: 403 });
      }
  
      // 1) Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from(storageBucket)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
  
      if (uploadError) {
        if (uploadError instanceof Error) {
          console.error(
            "Failed to upload file to Supabase Storage:",
            uploadError.message,
          );
        } else {
          console.error(
            "Failed to upload file to Supabase Storage:",
            uploadError,
          );
        }
        return new NextResponse("Failed to upload file", { status: 500 });
      }
  
      if (!uploadData) {
        console.error("Supabase upload returned no data");
        return new NextResponse("Failed to upload file", { status: 500 });
      }
  
      const status: WorkspaceAiDocumentStatus = "uploaded";
      const aiMetadata: Record<string, unknown> | null = null;
  
      // 2) Insert DB row
      const { data, error } = await client
        .from("workspace_ai_documents")
        .insert({
          workspace_id: workspaceId,
          created_by: userId,
          name,
          file_type: fileType,
          storage_bucket: storageBucket,
          storage_path: storagePath,
          status,
          ai_metadata: aiMetadata,
        })
        .select("*")
        .single();
  
      if (error || !data) {
        if (error instanceof Error) {
          console.error("Failed to create AI document record:", error.message);
        } else {
          console.error("Failed to create AI document record:", error);
        }
        return new NextResponse("Failed to create document", { status: 500 });
      }
  
      const created = data as WorkspaceAiDocument;
  
      // 3) Insert library event (best-effort)
      const { error: eventError } = await client
        .from("workspace_ai_library_events")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          event_type: "document_uploaded",
          document_id: created.id,
          knowledge_id: null,
          payload: {
            name,
            fileType,
            storageBucket,
            storagePath,
            status,
          },
        });
  
      if (eventError) {
        if (eventError instanceof Error) {
          console.error(
            "Failed to insert library event for document upload:",
            eventError.message,
          );
        } else {
          console.error(
            "Failed to insert library event for document upload:",
            eventError,
          );
        }
        // don't fail the request for event issues
      }
  
      return NextResponse.json({ document: created }, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Unexpected error in POST /ai-library/documents:",
          error.message,
        );
      } else {
        console.error("Unexpected error in POST /ai-library/documents:", error);
      }
      return new NextResponse("Internal server error", { status: 500 });
    }
  }
  