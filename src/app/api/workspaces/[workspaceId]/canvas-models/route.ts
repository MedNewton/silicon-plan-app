// src/app/api/workspaces/[workspaceId]/canvas-models/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceCanvasModel,
  WorkspaceCanvasTemplateType,
  WorkspaceId,
  UserId,
  CanvasSectionsData,
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
    console.error("Failed to check workspace access:", error);
    throw new Error("Failed to check workspace access");
  }

  return data != null;
}

// ---------- GET: list canvas models for workspace ----------

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
      .from("workspace_canvas_models")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load canvas models:", error);
      return new NextResponse("Failed to load canvas models", { status: 500 });
    }

    const canvasModels = (data ?? []) as WorkspaceCanvasModel[];

    return NextResponse.json({ canvasModels });
  } catch (error) {
    console.error("Unexpected error in GET /canvas-models:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// ---------- POST: create new canvas model ----------

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

    const body = await req.json();
    const { title, templateType, sectionsData } = body as {
      title?: string;
      templateType?: WorkspaceCanvasTemplateType;
      sectionsData?: CanvasSectionsData;
    };

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new NextResponse("Title is required", { status: 400 });
    }

    if (!templateType) {
      return new NextResponse("Template type is required", { status: 400 });
    }

    const validTemplateTypes: WorkspaceCanvasTemplateType[] = [
      "business-model",
      "four-quarters",
      "value-proposition",
      "pitch",
      "startup",
      "lean",
    ];

    if (!validTemplateTypes.includes(templateType)) {
      return new NextResponse("Invalid template type", { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { data, error } = await client
      .from("workspace_canvas_models")
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title: title.trim(),
        template_type: templateType,
        sections_data: sectionsData ?? {},
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Failed to create canvas model:", error);
      return new NextResponse("Failed to create canvas model", { status: 500 });
    }

    const created = data as WorkspaceCanvasModel;

    return NextResponse.json({ canvasModel: created }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /canvas-models:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
