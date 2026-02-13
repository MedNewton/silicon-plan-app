// src/server/businessPlan.ts
import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import {
  createBusinessPlanTask,
  updateBusinessPlanTask,
  deleteBusinessPlanTask,
} from "@/server/businessPlanTasks";
import type {
  BusinessPlan,
  BusinessPlanChapter,
  BusinessPlanSection,
  BusinessPlanTask,
  BusinessPlanAiConversation,
  BusinessPlanAiMessage,
  BusinessPlanPendingChange,
  BusinessPlanWithChapters,
  BusinessPlanChapterWithSections,
  AiConversationWithMessages,
  UpdateBusinessPlanParams,
  CreateBusinessPlanChapterParams,
  UpdateBusinessPlanChapterParams,
  CreateBusinessPlanSectionParams,
  UpdateBusinessPlanSectionParams,
  CreateAiConversationParams,
  CreateAiMessageParams,
  CreatePendingChangeParams,
  ResolvePendingChangeParams,
  WorkspaceId,
  UserId,
  BusinessPlanId,
  BusinessPlanChapterId,
  BusinessPlanSectionId,
  BusinessPlanAiMessageId,
  BusinessPlanPendingChangeId,
  BusinessPlanSectionContent,
  PendingChangeType,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supa = SupabaseClient<SupabaseDb>;

// ========== HELPERS ==========

async function userHasWorkspaceAccess(
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
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check workspace access: ${error.message}`);
  }

  return data != null;
}

async function ensureUserHasWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId
): Promise<void> {
  const hasAccess = await userHasWorkspaceAccess(client, workspaceId, userId);
  if (!hasAccess) {
    throw new Error("User does not have access to this workspace.");
  }
}

async function getWorkspaceIdFromBusinessPlan(
  client: Supa,
  businessPlanId: BusinessPlanId
): Promise<WorkspaceId | null> {
  const { data, error } = await client
    .from("workspace_business_plans")
    .select("workspace_id")
    .eq("id", businessPlanId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.workspace_id;
}

async function getWorkspaceIdFromChapter(
  client: Supa,
  chapterId: BusinessPlanChapterId
): Promise<WorkspaceId | null> {
  const { data, error } = await client
    .from("business_plan_chapters")
    .select("business_plan_id")
    .eq("id", chapterId)
    .single();

  if (error || !data) {
    return null;
  }

  return getWorkspaceIdFromBusinessPlan(client, data.business_plan_id);
}

async function getWorkspaceIdFromSection(
  client: Supa,
  sectionId: BusinessPlanSectionId
): Promise<WorkspaceId | null> {
  const { data, error } = await client
    .from("business_plan_sections")
    .select("chapter_id")
    .eq("id", sectionId)
    .single();

  if (error || !data) {
    return null;
  }

  return getWorkspaceIdFromChapter(client, data.chapter_id);
}

// ========== MAPPERS ==========

function mapBusinessPlanRow(row: unknown): BusinessPlan {
  const r = row as BusinessPlan;
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    title: r.title,
    status: r.status,
    export_settings: r.export_settings,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapChapterRow(row: unknown): BusinessPlanChapter {
  const r = row as BusinessPlanChapter;
  return {
    id: r.id,
    business_plan_id: r.business_plan_id,
    parent_id: r.parent_id,
    title: r.title,
    order_index: r.order_index,
    is_collapsed: r.is_collapsed,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapSectionRow(row: unknown): BusinessPlanSection {
  const r = row as BusinessPlanSection;
  return {
    id: r.id,
    chapter_id: r.chapter_id,
    section_type: r.section_type,
    content: r.content,
    order_index: r.order_index,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapConversationRow(row: unknown): BusinessPlanAiConversation {
  const r = row as BusinessPlanAiConversation;
  return {
    id: r.id,
    business_plan_id: r.business_plan_id,
    user_id: r.user_id,
    created_at: r.created_at,
  };
}

function mapMessageRow(row: unknown): BusinessPlanAiMessage {
  const r = row as BusinessPlanAiMessage;
  return {
    id: r.id,
    conversation_id: r.conversation_id,
    role: r.role,
    content: r.content,
    metadata: r.metadata,
    created_at: r.created_at,
  };
}

function mapPendingChangeRow(row: unknown): BusinessPlanPendingChange {
  const r = row as BusinessPlanPendingChange;
  return {
    id: r.id,
    conversation_id: r.conversation_id,
    message_id: r.message_id,
    change_type: r.change_type,
    target_id: r.target_id,
    proposed_data: r.proposed_data,
    status: r.status,
    created_at: r.created_at,
    reviewed_at: r.reviewed_at,
  };
}

const getStringField = (
  data: Record<string, unknown>,
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const normalizeTaskHierarchyLevelValue = (
  value: unknown
): "h1" | "h2" | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "h1" || normalized === "h2") {
    return normalized;
  }
  return undefined;
};

const normalizeTaskStatusValue = (
  value: unknown
): "todo" | "in_progress" | "done" | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "todo" || normalized === "in_progress" || normalized === "done") {
    return normalized;
  }
  return undefined;
};

const normalizeLookupText = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

async function resolveParentTaskIdForPendingTaskChange(params: {
  client: Supa;
  businessPlanId: BusinessPlanId;
  proposedData: Record<string, unknown>;
  hierarchyLevel: "h1" | "h2";
}): Promise<string | null | undefined> {
  const { client, businessPlanId, proposedData, hierarchyLevel } = params;

  const explicitParentId = getStringField(proposedData, [
    "parent_task_id",
    "parentTaskId",
    "parent_id",
    "parentId",
  ]);

  if (hierarchyLevel === "h1") {
    return null;
  }

  if (explicitParentId) {
    const { data: explicitParentRow, error: explicitParentError } = await client
      .from("business_plan_tasks")
      .select("id,hierarchy_level,parent_task_id")
      .eq("id", explicitParentId)
      .eq("business_plan_id", businessPlanId)
      .maybeSingle();

    if (explicitParentError && explicitParentError.code !== "PGRST116") {
      throw new Error(`Failed to validate explicit parent task: ${explicitParentError.message}`);
    }

    if (explicitParentRow) {
      if (explicitParentRow.hierarchy_level === "h1") {
        return explicitParentRow.id;
      }
      if (
        explicitParentRow.hierarchy_level === "h2" &&
        typeof explicitParentRow.parent_task_id === "string" &&
        explicitParentRow.parent_task_id.length > 0
      ) {
        return explicitParentRow.parent_task_id;
      }
    }
  }

  const { data: h1Rows, error: h1Error } = await client
    .from("business_plan_tasks")
    .select("id,title")
    .eq("business_plan_id", businessPlanId)
    .eq("hierarchy_level", "h1");

  if (h1Error) {
    throw new Error(`Failed to resolve parent task: ${h1Error.message}`);
  }

  const h1Tasks = (h1Rows ?? []) as Array<{ id: string; title: string }>;
  if (h1Tasks.length === 0) {
    return undefined;
  }

  const parentTaskTitle = getStringField(proposedData, [
    "parent_task_title",
    "parentTaskTitle",
    "parentTitle",
    "parentTask",
  ]);

  if (parentTaskTitle) {
    const needle = normalizeLookupText(parentTaskTitle);
    const exact = h1Tasks.find((task) => normalizeLookupText(task.title) === needle);
    if (exact) return exact.id;
    const partial = h1Tasks.filter((task) => {
      const hay = normalizeLookupText(task.title);
      return hay.includes(needle) || needle.includes(hay);
    });
    if (partial.length === 1) {
      return partial[0]?.id;
    }
  }

  const chapterId = getStringField(proposedData, ["chapter_id", "chapterId"]);
  let chapterTitle = getStringField(proposedData, [
    "chapter_title",
    "chapterTitle",
    "chapterName",
    "chapter",
  ]);

  if (!chapterTitle && chapterId) {
    const { data: chapterRow, error: chapterError } = await client
      .from("business_plan_chapters")
      .select("title")
      .eq("id", chapterId)
      .maybeSingle();

    if (chapterError && chapterError.code !== "PGRST116") {
      throw new Error(`Failed to resolve chapter title for task parent: ${chapterError.message}`);
    }

    if (chapterRow?.title && typeof chapterRow.title === "string") {
      chapterTitle = chapterRow.title;
    }
  }

  if (chapterTitle) {
    const chapterNeedle = normalizeLookupText(chapterTitle);
    const exactByChapter = h1Tasks.find(
      (task) => normalizeLookupText(task.title) === chapterNeedle
    );
    if (exactByChapter) return exactByChapter.id;

    const partialByChapter = h1Tasks.filter((task) => {
      const hay = normalizeLookupText(task.title);
      return hay.includes(chapterNeedle) || chapterNeedle.includes(hay);
    });
    if (partialByChapter.length === 1) {
      return partialByChapter[0]?.id;
    }
  }

  if (h1Tasks.length === 1) {
    return h1Tasks[0]?.id;
  }

  return undefined;
}

async function resolveParentChapterIdForPendingChange(params: {
  client: Supa;
  businessPlanId: BusinessPlanId;
  proposedData: Record<string, unknown>;
}): Promise<string | null> {
  const { client, businessPlanId, proposedData } = params;
  const rawParentChapterId = getStringField(proposedData, [
    "parent_id",
    "parentChapterId",
    "parent_chapter_id",
    "parentId",
  ]);

  if (!rawParentChapterId) {
    return null;
  }

  const { data: parentRow, error: parentError } = await client
    .from("business_plan_chapters")
    .select("id")
    .eq("id", rawParentChapterId)
    .eq("business_plan_id", businessPlanId)
    .maybeSingle();

  if (parentError && parentError.code !== "PGRST116") {
    throw new Error(`Failed to validate parent chapter: ${parentError.message}`);
  }

  if (!parentRow) {
    return null;
  }

  return parentRow.id;
}

async function resolveChapterIdForPendingSectionChange(params: {
  client: Supa;
  businessPlanId: BusinessPlanId;
  proposedData: Record<string, unknown>;
}): Promise<string | undefined> {
  const { client, businessPlanId, proposedData } = params;

  const chapterId = getStringField(proposedData, ["chapter_id", "chapterId"]);
  if (chapterId) {
    const { data: chapterById, error: chapterByIdError } = await client
      .from("business_plan_chapters")
      .select("id")
      .eq("id", chapterId)
      .eq("business_plan_id", businessPlanId)
      .maybeSingle();

    if (chapterByIdError && chapterByIdError.code !== "PGRST116") {
      throw new Error(`Failed to validate section chapter: ${chapterByIdError.message}`);
    }

    if (chapterById) {
      return chapterById.id;
    }
  }

  const chapterTitle = getStringField(proposedData, [
    "chapter_title",
    "chapterTitle",
    "chapterName",
    "chapter",
  ]);
  if (!chapterTitle) {
    return undefined;
  }

  const { data: chapterRows, error: chapterRowsError } = await client
    .from("business_plan_chapters")
    .select("id,title")
    .eq("business_plan_id", businessPlanId);

  if (chapterRowsError) {
    throw new Error(`Failed to resolve section chapter: ${chapterRowsError.message}`);
  }

  const chapters = (chapterRows ?? []) as Array<{ id: string; title: string }>;
  if (chapters.length === 0) {
    return undefined;
  }

  const needle = normalizeLookupText(chapterTitle);
  const exact = chapters.find((item) => normalizeLookupText(item.title) === needle);
  if (exact) return exact.id;

  const partial = chapters.filter((item) => {
    const hay = normalizeLookupText(item.title);
    return hay.includes(needle) || needle.includes(hay);
  });

  if (partial.length === 1) {
    return partial[0]?.id;
  }

  return undefined;
}

const normalizePendingChangeType = (
  rawChangeType: unknown,
  rawTargetType: unknown
): PendingChangeType | null => {
  if (typeof rawChangeType !== "string") {
    return null;
  }

  const normalizedType = rawChangeType.trim();
  const normalizedTarget =
    typeof rawTargetType === "string" ? rawTargetType.trim() : null;

  if (normalizedType === "create") {
    if (normalizedTarget === "chapter") return "add_chapter";
    if (normalizedTarget === "section") return "add_section";
    return null;
  }

  if (normalizedType === "update") {
    if (normalizedTarget === "chapter") return "update_chapter";
    if (normalizedTarget === "section") return "update_section";
    return null;
  }

  if (normalizedType === "delete") {
    if (normalizedTarget === "chapter") return "delete_chapter";
    if (normalizedTarget === "section") return "delete_section";
    return null;
  }

  const allowed: PendingChangeType[] = [
    "add_section",
    "update_section",
    "delete_section",
    "reorder_sections",
    "add_chapter",
    "update_chapter",
    "delete_chapter",
    "reorder_chapters",
    "add_task",
    "update_task",
    "delete_task",
  ];

  return allowed.includes(normalizedType as PendingChangeType)
    ? (normalizedType as PendingChangeType)
    : null;
};

// ========== BUSINESS PLAN CRUD ==========

export async function getOrCreateBusinessPlan(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<BusinessPlan> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Try to get existing business plan
  const { data: existing, error: fetchError } = await client
    .from("workspace_business_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(`Failed to fetch business plan: ${fetchError.message}`);
  }

  if (existing) {
    return mapBusinessPlanRow(existing);
  }

  // Create new business plan
  const { data: created, error: createError } = await client
    .from("workspace_business_plans")
    .insert({
      workspace_id: workspaceId,
      title: "Business Plan",
      status: "draft",
    })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create business plan: ${createError?.message ?? "Unknown error"}`);
  }

  return mapBusinessPlanRow(created);
}

export async function updateBusinessPlan(
  params: UpdateBusinessPlanParams & { userId: UserId }
): Promise<BusinessPlan> {
  const { businessPlanId, userId, title, status, exportSettings } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updatePayload: Record<string, unknown> = {};
  if (title !== undefined) updatePayload.title = title.trim();
  if (status !== undefined) updatePayload.status = status;
  if (exportSettings !== undefined) updatePayload.export_settings = exportSettings;

  const { data, error } = await client
    .from("workspace_business_plans")
    .update(updatePayload)
    .eq("id", businessPlanId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update business plan: ${error?.message ?? "Unknown error"}`);
  }

  return mapBusinessPlanRow(data);
}

export async function getBusinessPlanWithChapters(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<BusinessPlanWithChapters | null> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Get business plan
  const { data: planRow, error: planError } = await client
    .from("workspace_business_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (planError && planError.code !== "PGRST116") {
    throw new Error(`Failed to fetch business plan: ${planError.message}`);
  }

  if (!planRow) {
    return null;
  }

  const businessPlan = mapBusinessPlanRow(planRow);

  // Get all chapters
  const { data: chapterRows, error: chaptersError } = await client
    .from("business_plan_chapters")
    .select("*")
    .eq("business_plan_id", businessPlan.id)
    .order("order_index", { ascending: true });

  if (chaptersError) {
    throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
  }

  const chapters = (chapterRows ?? []).map(mapChapterRow);

  // Get all sections for all chapters
  const chapterIds = chapters.map((c) => c.id);
  let sections: BusinessPlanSection[] = [];

  if (chapterIds.length > 0) {
    const { data: sectionRows, error: sectionsError } = await client
      .from("business_plan_sections")
      .select("*")
      .in("chapter_id", chapterIds)
      .order("order_index", { ascending: true });

    if (sectionsError) {
      throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
    }

    sections = (sectionRows ?? []).map(mapSectionRow);
  }

  // Build hierarchical structure
  const sectionsByChapter = new Map<BusinessPlanChapterId, BusinessPlanSection[]>();
  for (const section of sections) {
    const list = sectionsByChapter.get(section.chapter_id) ?? [];
    list.push(section);
    sectionsByChapter.set(section.chapter_id, list);
  }

  const buildChapterTree = (
    parentId: BusinessPlanChapterId | null
  ): BusinessPlanChapterWithSections[] => {
    return chapters
      .filter((c) => c.parent_id === parentId)
      .map((chapter) => ({
        ...chapter,
        sections: sectionsByChapter.get(chapter.id) ?? [],
        children: buildChapterTree(chapter.id),
      }));
  };

  return {
    businessPlan,
    chapters: buildChapterTree(null),
  };
}

// ========== CHAPTER CRUD ==========

export async function createChapter(
  params: CreateBusinessPlanChapterParams & { userId: UserId }
): Promise<BusinessPlanChapter> {
  const { businessPlanId, userId, parentChapterId, title, orderIndex } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Compute order_index if not provided
  let finalOrderIndex = orderIndex;
  if (finalOrderIndex === undefined) {
    let query = client
      .from("business_plan_chapters")
      .select("order_index")
      .eq("business_plan_id", businessPlanId);

    // Use .eq() for string values, .is() for null
    if (parentChapterId) {
      query = query.eq("parent_id", parentChapterId);
    } else {
      query = query.is("parent_id", null);
    }

    const { data: maxRow } = await query
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    finalOrderIndex = maxRow?.order_index != null ? maxRow.order_index + 1 : 0;
  }

  const { data, error } = await client
    .from("business_plan_chapters")
    .insert({
      business_plan_id: businessPlanId,
      parent_id: parentChapterId ?? null,
      title: title.trim(),
      order_index: finalOrderIndex,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create chapter: ${error?.message ?? "Unknown error"}`);
  }

  return mapChapterRow(data);
}

export async function updateChapter(
  params: UpdateBusinessPlanChapterParams & { userId: UserId }
): Promise<BusinessPlanChapter> {
  const { chapterId, userId, title, orderIndex, parentChapterId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromChapter(client, chapterId);
  if (!workspaceId) {
    throw new Error("Chapter not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updatePayload: Record<string, unknown> = {};
  if (title !== undefined) updatePayload.title = title.trim();
  if (orderIndex !== undefined) updatePayload.order_index = orderIndex;
  if (parentChapterId !== undefined) updatePayload.parent_id = parentChapterId;

  const { data, error } = await client
    .from("business_plan_chapters")
    .update(updatePayload)
    .eq("id", chapterId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update chapter: ${error?.message ?? "Unknown error"}`);
  }

  return mapChapterRow(data);
}

export async function deleteChapter(params: {
  chapterId: BusinessPlanChapterId;
  userId: UserId;
}): Promise<void> {
  const { chapterId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromChapter(client, chapterId);
  if (!workspaceId) {
    throw new Error("Chapter not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Delete will cascade to sections due to ON DELETE CASCADE
  const { error } = await client
    .from("business_plan_chapters")
    .delete()
    .eq("id", chapterId);

  if (error) {
    throw new Error(`Failed to delete chapter: ${error.message}`);
  }
}

export async function reorderChapters(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
  orderedChapterIds: string[];
}): Promise<void> {
  const { workspaceId, userId, orderedChapterIds } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Update each chapter's order_index based on its position in the array
  const updates = orderedChapterIds.map((chapterId, index) =>
    client
      .from("business_plan_chapters")
      .update({ order_index: index })
      .eq("id", chapterId)
  );

  const results = await Promise.all(updates);

  // Check for any errors
  const firstError = results.find((r) => r.error);
  if (firstError?.error) {
    throw new Error(`Failed to reorder chapters: ${firstError.error.message}`);
  }
}

export async function reorderSections(params: {
  chapterId: BusinessPlanChapterId;
  userId: UserId;
  orderedSectionIds: string[];
}): Promise<void> {
  const { chapterId, userId, orderedSectionIds } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromChapter(client, chapterId);
  if (!workspaceId) {
    throw new Error("Chapter not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updates = orderedSectionIds.map((sectionId, index) =>
    client
      .from("business_plan_sections")
      .update({ order_index: index })
      .eq("id", sectionId)
      .eq("chapter_id", chapterId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) {
    throw new Error(`Failed to reorder sections: ${firstError.error.message}`);
  }
}

// ========== SECTION CRUD ==========

export async function createSection(
  params: CreateBusinessPlanSectionParams & { userId: UserId }
): Promise<BusinessPlanSection> {
  const { chapterId, userId, sectionType, content, orderIndex } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromChapter(client, chapterId);
  if (!workspaceId) {
    throw new Error("Chapter not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Compute order_index if not provided
  let finalOrderIndex = orderIndex;
  if (finalOrderIndex === undefined) {
    const { data: maxRow } = await client
      .from("business_plan_sections")
      .select("order_index")
      .eq("chapter_id", chapterId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    finalOrderIndex = maxRow?.order_index != null ? maxRow.order_index + 1 : 0;
  }

  const { data, error } = await client
    .from("business_plan_sections")
    .insert({
      chapter_id: chapterId,
      section_type: sectionType,
      content: content,
      order_index: finalOrderIndex,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create section: ${error?.message ?? "Unknown error"}`);
  }

  return mapSectionRow(data);
}

export async function updateSection(
  params: UpdateBusinessPlanSectionParams & { userId: UserId }
): Promise<BusinessPlanSection> {
  const { sectionId, userId, sectionType, content, orderIndex } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromSection(client, sectionId);
  if (!workspaceId) {
    throw new Error("Section not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updatePayload: Record<string, unknown> = {};
  if (sectionType !== undefined) updatePayload.section_type = sectionType;
  if (content !== undefined) updatePayload.content = content;
  if (orderIndex !== undefined) updatePayload.order_index = orderIndex;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error("No updates provided for section.");
  }

  const { data, error } = await client
    .from("business_plan_sections")
    .update(updatePayload)
    .eq("id", sectionId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update section: ${error?.message ?? "Unknown error"}`);
  }

  return mapSectionRow(data);
}

export async function deleteSection(params: {
  sectionId: BusinessPlanSectionId;
  userId: UserId;
}): Promise<void> {
  const { sectionId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromSection(client, sectionId);
  if (!workspaceId) {
    throw new Error("Section not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { error } = await client
    .from("business_plan_sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    throw new Error(`Failed to delete section: ${error.message}`);
  }
}

// ========== AI CONVERSATION CRUD ==========

export async function getOrCreateConversation(
  params: CreateAiConversationParams
): Promise<BusinessPlanAiConversation> {
  const { businessPlanId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Try to get existing conversation for this user
  const { data: existing, error: fetchError } = await client
    .from("business_plan_ai_conversations")
    .select("*")
    .eq("business_plan_id", businessPlanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
  }

  if (existing) {
    return mapConversationRow(existing);
  }

  // Create new conversation
  const { data: created, error: createError } = await client
    .from("business_plan_ai_conversations")
    .insert({
      business_plan_id: businessPlanId,
      user_id: userId,
    })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create conversation: ${createError?.message ?? "Unknown error"}`);
  }

  return mapConversationRow(created);
}

export async function getConversationWithMessages(params: {
  businessPlanId: BusinessPlanId;
  userId: UserId;
}): Promise<AiConversationWithMessages | null> {
  const { businessPlanId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Get conversation
  const { data: convRow, error: convError } = await client
    .from("business_plan_ai_conversations")
    .select("*")
    .eq("business_plan_id", businessPlanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (convError && convError.code !== "PGRST116") {
    throw new Error(`Failed to fetch conversation: ${convError.message}`);
  }

  if (!convRow) {
    return null;
  }

  const conversation = mapConversationRow(convRow);

  // Get messages
  const { data: messageRows, error: msgError } = await client
    .from("business_plan_ai_messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (msgError) {
    throw new Error(`Failed to fetch messages: ${msgError.message}`);
  }

  return {
    conversation,
    messages: (messageRows ?? []).map(mapMessageRow),
  };
}

export async function createMessage(
  params: CreateAiMessageParams & { userId: UserId }
): Promise<BusinessPlanAiMessage> {
  const { conversationId, userId, role, content, metadata } = params;
  const client = getSupabaseClient();

  // Verify conversation exists and user has access
  const { data: convRow, error: convError } = await client
    .from("business_plan_ai_conversations")
    .select("business_plan_id, user_id")
    .eq("id", conversationId)
    .single();

  if (convError || !convRow) {
    throw new Error("Conversation not found.");
  }

  // Check if this is the user's conversation or they have workspace access
  const workspaceId = await getWorkspaceIdFromBusinessPlan(
    client,
    convRow.business_plan_id
  );
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("business_plan_ai_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create message: ${error?.message ?? "Unknown error"}`);
  }

  return mapMessageRow(data);
}

// ========== PENDING CHANGES CRUD ==========

export async function createPendingChange(
  params: CreatePendingChangeParams & { userId: UserId }
): Promise<BusinessPlanPendingChange> {
  const { messageId, userId, changeType, targetId, proposedData } = params;
  const client = getSupabaseClient();

  // Get message to verify access
  const { data: msgRow, error: msgError } = await client
    .from("business_plan_ai_messages")
    .select("conversation_id")
    .eq("id", messageId)
    .single();

  if (msgError || !msgRow) {
    throw new Error("Message not found.");
  }

  // Get conversation to get business plan
  const { data: convRow, error: convError } = await client
    .from("business_plan_ai_conversations")
    .select("business_plan_id")
    .eq("id", msgRow.conversation_id)
    .single();

  if (convError || !convRow) {
    throw new Error("Conversation not found.");
  }

  const workspaceId = await getWorkspaceIdFromBusinessPlan(
    client,
    convRow.business_plan_id
  );
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("business_plan_pending_changes")
    .insert({
      conversation_id: msgRow.conversation_id,
      message_id: messageId,
      change_type: changeType,
      target_id: targetId ?? null,
      proposed_data: proposedData,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create pending change: ${error?.message ?? "Unknown error"}`);
  }

  return mapPendingChangeRow(data);
}

export async function getPendingChangesForMessage(params: {
  messageId: BusinessPlanAiMessageId;
  userId: UserId;
}): Promise<BusinessPlanPendingChange[]> {
  const { messageId, userId } = params;
  const client = getSupabaseClient();

  // Verify access through message -> conversation -> business plan -> workspace
  const { data: msgRow, error: msgError } = await client
    .from("business_plan_ai_messages")
    .select("conversation_id")
    .eq("id", messageId)
    .single();

  if (msgError || !msgRow) {
    throw new Error("Message not found.");
  }

  const { data: convRow, error: convError } = await client
    .from("business_plan_ai_conversations")
    .select("business_plan_id")
    .eq("id", msgRow.conversation_id)
    .single();

  if (convError || !convRow) {
    throw new Error("Conversation not found.");
  }

  const workspaceId = await getWorkspaceIdFromBusinessPlan(
    client,
    convRow.business_plan_id
  );
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("business_plan_pending_changes")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pending changes: ${error.message}`);
  }

  return (data ?? []).map(mapPendingChangeRow);
}

export async function getPendingChangesForBusinessPlan(params: {
  businessPlanId: BusinessPlanId;
  userId: UserId;
  statusFilter?: "pending" | "approved" | "rejected";
}): Promise<BusinessPlanPendingChange[]> {
  const { businessPlanId, userId, statusFilter } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Get all conversations for this business plan
  const { data: convRows, error: convError } = await client
    .from("business_plan_ai_conversations")
    .select("id")
    .eq("business_plan_id", businessPlanId);

  if (convError) {
    throw new Error(`Failed to fetch conversations: ${convError.message}`);
  }

  if (!convRows || convRows.length === 0) {
    return [];
  }

  const conversationIds = convRows.map((c) => c.id);

  // Get all messages for these conversations
  const { data: msgRows, error: msgError } = await client
    .from("business_plan_ai_messages")
    .select("id")
    .in("conversation_id", conversationIds);

  if (msgError) {
    throw new Error(`Failed to fetch messages: ${msgError.message}`);
  }

  if (!msgRows || msgRows.length === 0) {
    return [];
  }

  const messageIds = msgRows.map((m) => m.id);

  // Get pending changes
  let query = client
    .from("business_plan_pending_changes")
    .select("*")
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pending changes: ${error.message}`);
  }

  return (data ?? []).map(mapPendingChangeRow);
}

export async function resolvePendingChange(
  params: ResolvePendingChangeParams & { userId: UserId }
): Promise<BusinessPlanPendingChange> {
  const { pendingChangeId, userId, status } = params;
  const client = getSupabaseClient();

  // Get the pending change to verify access
  const { data: changeRow, error: fetchError } = await client
    .from("business_plan_pending_changes")
    .select("*, business_plan_ai_messages(conversation_id)")
    .eq("id", pendingChangeId)
    .single();

  if (fetchError || !changeRow) {
    throw new Error("Pending change not found.");
  }

  // Navigate to workspace through message -> conversation -> business plan
  const messageData = changeRow.business_plan_ai_messages as { conversation_id: string } | null;
  if (!messageData) {
    throw new Error("Message not found for pending change.");
  }

  const { data: convRow, error: convError } = await client
    .from("business_plan_ai_conversations")
    .select("business_plan_id")
    .eq("id", messageData.conversation_id)
    .single();

  if (convError || !convRow) {
    throw new Error("Conversation not found.");
  }

  const workspaceId = await getWorkspaceIdFromBusinessPlan(
    client,
    convRow.business_plan_id
  );
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("business_plan_pending_changes")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", pendingChangeId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to resolve pending change: ${error?.message ?? "Unknown error"}`);
  }

  return mapPendingChangeRow(data);
}

// ========== APPLY PENDING CHANGE ==========

export async function applyPendingChange(params: {
  pendingChangeId: BusinessPlanPendingChangeId;
  userId: UserId;
}): Promise<{ chapter?: BusinessPlanChapter; section?: BusinessPlanSection; task?: BusinessPlanTask }> {
  const { pendingChangeId, userId } = params;
  const client = getSupabaseClient();

  // Get the pending change
  const { data: changeRow, error: fetchError } = await client
    .from("business_plan_pending_changes")
    .select("*")
    .eq("id", pendingChangeId)
    .single();

  if (fetchError || !changeRow) {
    throw new Error("Pending change not found.");
  }

  const change = mapPendingChangeRow(changeRow);

  if (change.status !== "pending") {
    throw new Error("This change has already been resolved.");
  }

  // Navigate to workspace to verify access
  const { data: msgRow } = await client
    .from("business_plan_ai_messages")
    .select("conversation_id")
    .eq("id", change.message_id)
    .single();

  if (!msgRow) {
    throw new Error("Message not found.");
  }

  const { data: convRow } = await client
    .from("business_plan_ai_conversations")
    .select("business_plan_id")
    .eq("id", msgRow.conversation_id)
    .single();

  if (!convRow) {
    throw new Error("Conversation not found.");
  }

  const businessPlanId = convRow.business_plan_id;
  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const result: { chapter?: BusinessPlanChapter; section?: BusinessPlanSection; task?: BusinessPlanTask } = {};
  const changeType = normalizePendingChangeType(
    (changeRow as { change_type?: unknown }).change_type,
    (changeRow as { target_type?: unknown }).target_type
  );

  if (!changeType) {
    throw new Error(
      `Unsupported pending change type: ${String(
        (changeRow as { change_type?: unknown }).change_type
      )}`
    );
  }

  // Apply the change based on change_type
  switch (changeType) {
    case "add_chapter": {
      const proposedData = change.proposed_data ?? {};
      const title =
        getStringField(proposedData, ["title", "newTitle", "chapterTitle"]) ??
        "New Chapter";
      const parentChapterId = await resolveParentChapterIdForPendingChange({
        client,
        businessPlanId,
        proposedData,
      });

      const chapter = await createChapter({
        businessPlanId,
        userId,
        title,
        parentChapterId,
      });
      result.chapter = chapter;
      break;
    }
    case "update_chapter": {
      if (change.target_id) {
        const chapter = await updateChapter({
          chapterId: change.target_id,
          userId,
          title: (change.proposed_data as { title?: string }).title,
          orderIndex: (change.proposed_data as { order_index?: number }).order_index,
        });
        result.chapter = chapter;
      }
      break;
    }
    case "delete_chapter": {
      if (change.target_id) {
        await deleteChapter({
          chapterId: change.target_id,
          userId,
        });
      }
      break;
    }
    case "add_section": {
      const proposedData = change.proposed_data ?? {};
      const resolvedChapterId = await resolveChapterIdForPendingSectionChange({
        client,
        businessPlanId,
        proposedData,
      });
      if (!resolvedChapterId) {
        throw new Error(
          "Cannot apply add_section pending change: chapter could not be resolved."
        );
      }

      const sectionType =
        getStringField(proposedData, ["section_type", "sectionType"]) ?? "text";
      const content =
        typeof proposedData.content === "object" && proposedData.content !== null
          ? (proposedData.content as BusinessPlanSectionContent)
          : ({ type: "text", text: "Draft content" } as BusinessPlanSectionContent);

      const section = await createSection({
        chapterId: resolvedChapterId,
        userId,
        sectionType: sectionType as BusinessPlanSection["section_type"],
        content,
      });
      result.section = section;
      break;
    }
    case "update_section": {
      if (change.target_id) {
        const proposedData = change.proposed_data as {
          section_type?: string;
          content?: BusinessPlanSectionContent;
          order_index?: number;
        };
        const hasUpdate =
          proposedData.section_type !== undefined ||
          proposedData.content !== undefined ||
          proposedData.order_index !== undefined;
        if (hasUpdate) {
          const section = await updateSection({
            sectionId: change.target_id,
            userId,
            sectionType:
              proposedData.section_type as BusinessPlanSection["section_type"] | undefined,
            content: proposedData.content,
            orderIndex: proposedData.order_index,
          });
          result.section = section;
        }
      }
      break;
    }
    case "delete_section": {
      if (change.target_id) {
        await deleteSection({
          sectionId: change.target_id,
          userId,
        });
      }
      break;
    }
    case "reorder_chapters":
    case "reorder_sections":
      if (change.change_type === "reorder_chapters") {
        const proposedData = change.proposed_data as { ordered_chapter_ids?: string[] };
        const orderedIds = proposedData.ordered_chapter_ids ?? [];
        if (orderedIds.length > 0) {
          await reorderChapters({
            workspaceId,
            userId,
            orderedChapterIds: orderedIds,
          });
        }
      } else {
        const proposedData = change.proposed_data as {
          chapter_id?: string;
          ordered_section_ids?: string[];
        };
        if (proposedData.chapter_id && proposedData.ordered_section_ids?.length) {
          await reorderSections({
            chapterId: proposedData.chapter_id,
            userId,
            orderedSectionIds: proposedData.ordered_section_ids,
          });
        }
      }
      break;
    case "add_task": {
      const proposedData = change.proposed_data ?? {};
      const hierarchyLevel =
        normalizeTaskHierarchyLevelValue(
          proposedData.hierarchy_level ?? proposedData.hierarchyLevel
        ) ?? "h1";
      const parentTaskId = await resolveParentTaskIdForPendingTaskChange({
        client,
        businessPlanId,
        proposedData,
        hierarchyLevel,
      });

      if (hierarchyLevel === "h2" && !parentTaskId) {
        throw new Error(
          "Cannot apply add_task pending change: parent H1 task could not be resolved."
        );
      }

      const task = await createBusinessPlanTask({
        businessPlanId,
        userId,
        title:
          getStringField(proposedData, ["title", "taskTitle", "task_title"]) ??
          "New Task",
        instructions: getStringField(proposedData, [
          "instructions",
          "taskInstructions",
          "task_instructions",
        ]),
        aiPrompt: getStringField(proposedData, ["ai_prompt", "aiPrompt", "prompt"]),
        hierarchyLevel,
        parentTaskId: hierarchyLevel === "h2" ? parentTaskId ?? null : null,
        status: normalizeTaskStatusValue(proposedData.status ?? proposedData.taskStatus),
        orderIndex:
          typeof proposedData.order_index === "number"
            ? proposedData.order_index
            : typeof proposedData.orderIndex === "number"
              ? proposedData.orderIndex
              : undefined,
      });
      result.task = task;
      break;
    }
    case "update_task": {
      const proposedData = change.proposed_data ?? {};
      const targetTaskId =
        change.target_id ??
        getStringField(proposedData, ["task_id", "taskId"]) ??
        null;

      if (!targetTaskId) {
        throw new Error("Cannot apply update_task pending change: target task is missing.");
      }

      const hierarchyLevel = normalizeTaskHierarchyLevelValue(
        proposedData.hierarchy_level ?? proposedData.hierarchyLevel
      );
      const parentTaskId =
        hierarchyLevel !== undefined
          ? await resolveParentTaskIdForPendingTaskChange({
              client,
              businessPlanId,
              proposedData,
              hierarchyLevel,
            })
          : getStringField(proposedData, [
              "parent_task_id",
              "parentTaskId",
              "parent_id",
              "parentId",
            ]);

      if (hierarchyLevel === "h2" && parentTaskId === undefined) {
        throw new Error(
          "Cannot apply update_task pending change: parent H1 task could not be resolved."
        );
      }

      const title = getStringField(proposedData, ["title", "taskTitle", "task_title"]);
      const instructions = getStringField(proposedData, [
        "instructions",
        "taskInstructions",
        "task_instructions",
      ]);
      const aiPrompt = getStringField(proposedData, ["ai_prompt", "aiPrompt", "prompt"]);
      const status = normalizeTaskStatusValue(proposedData.status ?? proposedData.taskStatus);
      const orderIndex =
        typeof proposedData.order_index === "number"
          ? proposedData.order_index
          : typeof proposedData.orderIndex === "number"
            ? proposedData.orderIndex
            : undefined;

      const hasUpdate =
        title !== undefined ||
        instructions !== undefined ||
        aiPrompt !== undefined ||
        hierarchyLevel !== undefined ||
        parentTaskId !== undefined ||
        status !== undefined ||
        orderIndex !== undefined;

      if (!hasUpdate) {
        throw new Error("Cannot apply update_task pending change: no updates provided.");
      }

      const task = await updateBusinessPlanTask({
        taskId: targetTaskId,
        userId,
        title,
        instructions,
        aiPrompt,
        hierarchyLevel,
        parentTaskId,
        status,
        orderIndex,
      });
      result.task = task;
      break;
    }
    case "delete_task": {
      const proposedData = change.proposed_data ?? {};
      const targetTaskId =
        change.target_id ??
        getStringField(proposedData, ["task_id", "taskId"]) ??
        null;

      if (!targetTaskId) {
        throw new Error("Cannot apply delete_task pending change: target task is missing.");
      }

      await deleteBusinessPlanTask({
        taskId: targetTaskId,
        userId,
      });
      break;
    }
  }

  // Mark as approved
  await resolvePendingChange({
    pendingChangeId,
    userId,
    status: "approved",
  });

  return result;
}
