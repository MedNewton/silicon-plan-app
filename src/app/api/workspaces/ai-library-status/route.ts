// src/app/api/workspaces/ai-library-status/route.ts

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabaseServer";
import { getUserWorkspaces } from "@/server/workspaces";

export const dynamic = "force-dynamic";

/**
 * GET /api/workspaces/ai-library-status
 *
 * Returns a map of workspace IDs → whether they have AI library content
 * (documents or knowledge entries).
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const workspaces = await getUserWorkspaces({ userId: user.id });
    if (workspaces.length === 0) {
      return NextResponse.json({ missingLibrary: [] });
    }

    const client = getSupabaseClient();
    const workspaceIds = workspaces.map((w) => w.id);

    // Check for knowledge entries and documents in parallel
    const [knowledgeResult, documentsResult] = await Promise.all([
      client
        .from("workspace_ai_knowledge")
        .select("workspace_id")
        .in("workspace_id", workspaceIds),
      client
        .from("workspace_ai_documents")
        .select("workspace_id")
        .eq("status", "uploaded")
        .in("workspace_id", workspaceIds),
    ]);

    const hasLibrarySet = new Set<string>();

    for (const row of knowledgeResult.data ?? []) {
      hasLibrarySet.add(row.workspace_id);
    }
    for (const row of documentsResult.data ?? []) {
      hasLibrarySet.add(row.workspace_id);
    }

    const missingLibrary = workspaceIds.filter((id) => !hasLibrarySet.has(id));

    return NextResponse.json({ missingLibrary });
  } catch (error) {
    console.error("Error in GET /api/workspaces/ai-library-status:", error);
    return NextResponse.json(
      { error: "Failed to check AI library status" },
      { status: 500 }
    );
  }
}
