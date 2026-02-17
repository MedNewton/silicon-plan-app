import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Buffer } from "buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { exportCanvasToPptx } from "@/lib/canvasExport";
import { sanitizeFileName } from "@/lib/exportStyles";
import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  CanvasSectionsData,
  UserId,
  WorkspaceCanvasTemplateType,
  WorkspaceId,
} from "@/types/workspaces";

export const runtime = "nodejs";

type Supa = SupabaseClient<SupabaseDb>;

type WorkspaceBranding = {
  workspaceName: string;
  workspaceLogoDataUrl: string | null;
};

type ExportRequestBody = {
  title?: string;
  templateType?: WorkspaceCanvasTemplateType;
  sectionsData?: CanvasSectionsData;
  includeBranding?: boolean;
};

const VALID_TEMPLATE_TYPES: WorkspaceCanvasTemplateType[] = [
  "business-model",
  "four-quarters",
  "value-proposition",
  "pitch",
  "startup",
  "lean",
];

async function ensureWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId
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

const loadWorkspaceBranding = async (
  client: Supa,
  workspaceId: string
): Promise<WorkspaceBranding> => {
  const { data } = await client
    .from("workspaces")
    .select("name,image_url")
    .eq("id", workspaceId)
    .maybeSingle();

  const workspaceName =
    data && typeof data.name === "string" && data.name.trim().length > 0
      ? data.name.trim()
      : "Workspace";

  const imageUrl = data?.image_url;
  if (!imageUrl || typeof imageUrl !== "string") {
    return { workspaceName, workspaceLogoDataUrl: null };
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { workspaceName, workspaceLogoDataUrl: null };
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return {
      workspaceName,
      workspaceLogoDataUrl: `data:${contentType};base64,${base64}`,
    };
  } catch {
    return { workspaceName, workspaceLogoDataUrl: null };
  }
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string }> }
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

    const body = (await req.json().catch(() => null)) as ExportRequestBody | null;
    const templateType = body?.templateType;
    const includeBranding = body?.includeBranding ?? true;
    const title =
      typeof body?.title === "string" && body.title.trim().length > 0
        ? body.title.trim()
        : "Canvas Model";
    const sectionsData =
      body?.sectionsData && typeof body.sectionsData === "object"
        ? body.sectionsData
        : {};

    if (!templateType || !VALID_TEMPLATE_TYPES.includes(templateType)) {
      return new NextResponse("Invalid template type", { status: 400 });
    }

    const client = getSupabaseClient();
    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const branding = includeBranding
      ? await loadWorkspaceBranding(client, workspaceId)
      : null;

    const blob = await exportCanvasToPptx({
      title,
      templateType,
      sectionsData,
      workspaceName: includeBranding ? branding?.workspaceName ?? null : null,
      workspaceLogoDataUrl: includeBranding ? branding?.workspaceLogoDataUrl ?? null : null,
    });

    const buffer = await blob.arrayBuffer();
    const fileName = `${sanitizeFileName(title, "canvas-export")}.pptx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /canvas-models/export:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
