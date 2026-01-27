// src/app/api/workspaces/[workspaceId]/canvas-models/[canvasId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceCanvasModel,
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

// ---------- GET: get single canvas model ----------

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; canvasId: string }> },
) {
  try {
    const { userId } = await auth();
    const { workspaceId, canvasId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!canvasId) {
      return new NextResponse("Canvas id is required", { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { data, error } = await client
      .from("workspace_canvas_models")
      .select("*")
      .eq("id", canvasId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse("Canvas model not found", { status: 404 });
      }
      console.error("Failed to load canvas model:", error);
      return new NextResponse("Failed to load canvas model", { status: 500 });
    }

    const canvasModel = data as WorkspaceCanvasModel;

    return NextResponse.json({ canvasModel });
  } catch (error) {
    console.error("Unexpected error in GET /canvas-models/[canvasId]:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// ---------- PATCH: update canvas model ----------

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; canvasId: string }> },
) {
  try {
    const { userId } = await auth();
    const { workspaceId, canvasId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!canvasId) {
      return new NextResponse("Canvas id is required", { status: 400 });
    }

    const body = await req.json();
    const { title, sectionsData } = body as {
      title?: string;
      sectionsData?: CanvasSectionsData;
    };

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return new NextResponse("Title cannot be empty", { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (sectionsData !== undefined) {
      updateData.sections_data = sectionsData;
    }

    if (Object.keys(updateData).length === 0) {
      return new NextResponse("No fields to update", { status: 400 });
    }

    const { data, error } = await client
      .from("workspace_canvas_models")
      .update(updateData)
      .eq("id", canvasId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse("Canvas model not found", { status: 404 });
      }
      console.error("Failed to update canvas model:", error);
      return new NextResponse("Failed to update canvas model", { status: 500 });
    }

    const updated = data as WorkspaceCanvasModel;

    return NextResponse.json({ canvasModel: updated });
  } catch (error) {
    console.error("Unexpected error in PATCH /canvas-models/[canvasId]:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// ---------- DELETE: delete canvas model ----------

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; canvasId: string }> },
) {
  try {
    const { userId } = await auth();
    const { workspaceId, canvasId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!canvasId) {
      return new NextResponse("Canvas id is required", { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { error } = await client
      .from("workspace_canvas_models")
      .delete()
      .eq("id", canvasId)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("Failed to delete canvas model:", error);
      return new NextResponse("Failed to delete canvas model", { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /canvas-models/[canvasId]:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
