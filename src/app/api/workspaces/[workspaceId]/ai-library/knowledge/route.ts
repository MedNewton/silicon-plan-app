// src/app/api/workspaces/[workspaceId]/ai-library/knowledge/route.ts

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
type Tables = SupabaseDb["public"]["Tables"];

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
      .from("workspace_ai_knowledge")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      if (error instanceof Error) {
        console.error("Failed to load workspace AI knowledge:", error.message);
      } else {
        console.error("Failed to load workspace AI knowledge:", error);
      }
      return new NextResponse("Failed to load knowledge", { status: 500 });
    }

    const knowledgeEntries = (data ?? []) as WorkspaceAiKnowledge[];

    return NextResponse.json({ knowledge: knowledgeEntries });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Unexpected error in GET /ai-library/knowledge:",
        error.message,
      );
    } else {
      console.error("Unexpected error in GET /ai-library/knowledge:", error);
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

type UpsertKnowledgeBody = {
  keyName: string;
  label: string;
  value: string;
  orderIndex?: number;
};

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

    const body = (await req.json()) as UpsertKnowledgeBody;

    const keyName = body.keyName?.trim();
    const label = body.label?.trim();
    const value = body.value?.trim();
    const orderIndex =
      typeof body.orderIndex === "number" ? body.orderIndex : 0;

    if (!keyName) {
      return new NextResponse("keyName is required", { status: 400 });
    }

    if (!label) {
      return new NextResponse("label is required", { status: 400 });
    }

    if (!value) {
      return new NextResponse("value is required", { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    type KnowledgeInsert = Tables["workspace_ai_knowledge"]["Insert"];

    const insertPayload: KnowledgeInsert = {
      workspace_id: workspaceId,
      key_name: keyName,
      label,
      value,
      order_index: orderIndex,
    };

    const { data, error } = await client
      .from("workspace_ai_knowledge")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      if (error instanceof Error) {
        console.error("Failed to insert AI knowledge:", error.message);
      } else {
        console.error("Failed to insert AI knowledge:", error);
      }
      return new NextResponse("Failed to save knowledge", { status: 500 });
    }

    const knowledge = data as WorkspaceAiKnowledge;

    const { error: eventError } = await client
      .from("workspace_ai_library_events")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        event_type: "knowledge_created",
        document_id: null,
        knowledge_id: knowledge.id,
        payload: {
          keyName,
          label,
        },
      });

    if (eventError) {
      if (eventError instanceof Error) {
        console.error(
          "Failed to insert library event for knowledge create:",
          eventError.message,
        );
      } else {
        console.error(
          "Failed to insert library event for knowledge create:",
          eventError,
        );
      }
      // best-effort, do not fail request
    }

    return NextResponse.json({ knowledge }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Unexpected error in POST /ai-library/knowledge:",
        error.message,
      );
    } else {
      console.error("Unexpected error in POST /ai-library/knowledge:", error);
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
