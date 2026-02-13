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

const normalizeKeyName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const ensureUniqueKeyName = async (
  client: Supa,
  workspaceId: string,
  requestedKeyName: string,
): Promise<string> => {
  const base = normalizeKeyName(requestedKeyName) || "custom_note";

  const { data, error } = await client
    .from("workspace_ai_knowledge")
    .select("key_name")
    .eq("workspace_id", workspaceId)
    .ilike("key_name", `${base}%`);

  if (error) {
    throw new Error(`Failed to validate key_name uniqueness: ${error.message}`);
  }

  const existing = new Set(
    (data ?? [])
      .map((row) => (typeof row?.key_name === "string" ? row.key_name : ""))
      .filter(Boolean),
  );

  if (!existing.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existing.has(`${base}_${suffix}`)) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
};

const resolveNextOrderIndex = async (
  client: Supa,
  workspaceId: string,
): Promise<number> => {
  const { data, error } = await client
    .from("workspace_ai_knowledge")
    .select("order_index")
    .eq("workspace_id", workspaceId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to resolve knowledge order index: ${error.message}`);
  }

  const current =
    data && typeof data.order_index === "number" ? data.order_index : -1;
  return current + 1;
};

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

    const body = (await req.json()) as UpsertKnowledgeBody;
    const label = body.label?.trim();
    const value = body.value?.trim();
    const rawKeyName = body.keyName?.trim() || label || "custom_note";

    if (!label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    if (!value) {
      return NextResponse.json({ error: "value is required" }, { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const keyName = await ensureUniqueKeyName(client, workspaceId, rawKeyName);
    const orderIndex =
      typeof body.orderIndex === "number"
        ? body.orderIndex
        : await resolveNextOrderIndex(client, workspaceId);

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
      return NextResponse.json(
        { error: "Failed to save knowledge" },
        { status: 500 },
      );
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
