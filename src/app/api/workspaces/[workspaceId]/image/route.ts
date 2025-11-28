// src/app/api/workspaces/[workspaceId]/image/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabaseServer";
import type { Workspace } from "@/types/workspaces";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

const BUCKET_NAME = "workspace-images";

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 },
      );
    }

    const client = getSupabaseClient();

    const { data: membership, error: membershipError } = await client
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Failed to check workspace access:", membershipError);
      return NextResponse.json(
        { error: "Failed to check workspace access" },
        { status: 500 },
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this workspace" },
        { status: 403 },
      );
    }

    const ext = file.name.split(".").pop() ?? "png";
    const filePath = `${workspaceId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload workspace image:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    const { data: publicData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    const { data: workspace, error: updateError } = await client
      .from("workspaces")
      .update({ image_url: publicUrl })
      .eq("id", workspaceId)
      .select("*")
      .single();

    if (updateError || !workspace) {
      console.error("Failed to update workspace with image URL:", updateError);
      return NextResponse.json(
        { error: "Failed to update workspace image" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { workspace: workspace as Workspace },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error in POST /api/workspaces/[workspaceId]/image:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to upload workspace image" },
      { status: 500 },
    );
  }
}
