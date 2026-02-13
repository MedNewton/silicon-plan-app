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
import {
  extractAiDocumentText,
  isSupportedAiLibraryExtension,
} from "@/lib/aiDocumentExtraction";

type Supa = SupabaseClient<SupabaseDb>;
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace id is required" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const nameRaw = formData.get("name");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 3MB." },
        { status: 400 },
      );
    }

    const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
    const fileType = extMatch?.[1]?.toLowerCase() ?? null;

    if (!fileType || !isSupportedAiLibraryExtension(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 400 },
      );
    }

    let name: string;
    if (typeof nameRaw === "string" && nameRaw.trim().length > 0) {
      name = nameRaw.trim();
    } else if (typeof file.name === "string" && file.name.trim().length > 0) {
      name = file.name.trim();
    } else {
      name = "";
    }

    if (!name) {
      return NextResponse.json(
        { error: "Document name is required" },
        { status: 400 },
      );
    }

    const storageBucket =
      process.env.NEXT_PUBLIC_SUPABASE_AI_DOCS_BUCKET ?? "workspace-ai-documents";

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "_");
    const storagePath = `workspace-${workspaceId}/${Date.now()}-${sanitizedName}`;

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let extractedText: string | null = null;
    let extractionMetadata: Record<string, unknown> = {
      extractionStatus: "not_started",
      extractionSource: "none",
    };

    try {
      const extraction = await extractAiDocumentText(file, fileType);
      extractedText = extraction.extractedText;
      extractionMetadata = extraction.metadata;
    } catch (error) {
      console.error("Failed to extract AI document text:", error);
      extractionMetadata = {
        extractionStatus: "failed",
        extractionSource: "none",
      };
    }

    const { data: uploadData, error: uploadError } = await client.storage
      .from(storageBucket)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError || !uploadData) {
      if (uploadError instanceof Error) {
        console.error(
          "Failed to upload file to Supabase Storage:",
          uploadError.message,
        );
      } else {
        console.error("Failed to upload file to Supabase Storage:", uploadError);
      }
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    const status: WorkspaceAiDocumentStatus = "uploaded";
    const aiMetadata: Record<string, unknown> = {
      ...extractionMetadata,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      mimeType: file.type || null,
      extractedText,
    };

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
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 },
      );
    }

    const created = data as WorkspaceAiDocument;

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
          extractionStatus: extractionMetadata.extractionStatus ?? "unknown",
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
  
