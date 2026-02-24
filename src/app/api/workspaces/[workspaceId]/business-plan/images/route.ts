// src/app/api/workspaces/[workspaceId]/business-plan/images/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

const BUCKET_NAME = "business-plan-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PNG, JPEG, GIF, or WebP." },
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
      console.error("Failed to upload business plan image:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    const { data: publicData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json(
      { url: publicData.publicUrl },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error in POST /api/workspaces/[workspaceId]/business-plan/images:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
