import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import { DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE } from "@/server/businessPlanTaskTemplate";
import type {
  BusinessPlanId,
  BusinessPlanTask,
  BusinessPlanTaskId,
  BusinessPlanTaskWithChildren,
  CreateBusinessPlanTaskParams,
  UpdateBusinessPlanTaskParams,
  UserId,
  WorkspaceId,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supa = SupabaseClient<SupabaseDb>;

const extractContextHighlights = (context: string): string[] => {
  return context
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .slice(0, 5)
    .map((line) => line.replace(/^- /, "").trim())
    .filter(Boolean);
};

async function buildAutoTaskDefaults(params: {
  client: Supa;
  workspaceId: WorkspaceId;
  title: string;
  hierarchyLevel: "h1" | "h2";
  parentTaskId: BusinessPlanTaskId | null;
}): Promise<{ instructions: string; aiPrompt: string }> {
  const { client, workspaceId, title, hierarchyLevel, parentTaskId } = params;
  const workspaceContext = await getWorkspaceAiContext(workspaceId);
  const highlights = extractContextHighlights(workspaceContext.context);

  let parentTitle = "";
  if (parentTaskId) {
    const { data: parentTask } = await client
      .from("business_plan_tasks")
      .select("title")
      .eq("id", parentTaskId)
      .maybeSingle();
    parentTitle = typeof parentTask?.title === "string" ? parentTask.title : "";
  }

  const instructions = [
    `Draft the task content for "${title}" (${hierarchyLevel.toUpperCase()}).`,
    "Reuse existing workspace setup, AI knowledge, and uploaded library documents automatically.",
    highlights.length > 0
      ? `Incorporate these known context points:\n${highlights.map((item) => `- ${item}`).join("\n")}`
      : "Use all currently known project context. Ask for extra input only if strictly required.",
  ].join("\n");

  const aiPrompt = [
    `Generate high-quality content for task: "${title}".`,
    parentTitle ? `Parent chapter: "${parentTitle}".` : null,
    `Hierarchy level: ${hierarchyLevel.toUpperCase()}.`,
    "Do not ask the user to repeat information that already exists in workspace onboarding/profile/library context.",
    "When assumptions are required, keep them minimal and explicit.",
  ]
    .filter(Boolean)
    .join("\n");

  return { instructions, aiPrompt };
}

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

function mapTaskRow(row: unknown): BusinessPlanTask {
  const r = row as BusinessPlanTask;
  return {
    id: r.id,
    business_plan_id: r.business_plan_id,
    parent_task_id: r.parent_task_id,
    title: r.title,
    instructions: r.instructions,
    ai_prompt: r.ai_prompt,
    hierarchy_level: r.hierarchy_level,
    status: r.status,
    order_index: r.order_index,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function computeNextOrderIndex(params: {
  client: Supa;
  businessPlanId: BusinessPlanId;
  parentTaskId: BusinessPlanTaskId | null;
}): Promise<number> {
  const { client, businessPlanId, parentTaskId } = params;
  let query = client
    .from("business_plan_tasks")
    .select("order_index")
    .eq("business_plan_id", businessPlanId);

  if (parentTaskId) {
    query = query.eq("parent_task_id", parentTaskId);
  } else {
    query = query.is("parent_task_id", null);
  }

  const { data } = await query
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.order_index != null ? data.order_index + 1 : 0;
}

async function validateParentTask(params: {
  client: Supa;
  businessPlanId: BusinessPlanId;
  taskId?: BusinessPlanTaskId;
  parentTaskId: BusinessPlanTaskId | null;
  hierarchyLevel: "h1" | "h2";
}): Promise<void> {
  const { client, businessPlanId, taskId, parentTaskId, hierarchyLevel } = params;

  if (hierarchyLevel === "h1" && parentTaskId) {
    throw new Error("H1 tasks cannot have a parent task.");
  }

  if (hierarchyLevel === "h2" && !parentTaskId) {
    throw new Error("H2 tasks must reference an H1 parent task.");
  }

  if (!parentTaskId) {
    return;
  }

  if (taskId && parentTaskId === taskId) {
    throw new Error("A task cannot be its own parent.");
  }

  const { data: parentRow, error } = await client
    .from("business_plan_tasks")
    .select("id, business_plan_id, hierarchy_level")
    .eq("id", parentTaskId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to validate parent task: ${error.message}`);
  }

  if (!parentRow) {
    throw new Error("Parent task not found.");
  }

  if (parentRow.business_plan_id !== businessPlanId) {
    throw new Error("Parent task must belong to the same business plan.");
  }

  if (parentRow.hierarchy_level !== "h1") {
    throw new Error("Only H1 tasks can be used as parent tasks.");
  }
}

function buildTaskTree(tasks: BusinessPlanTask[]): BusinessPlanTaskWithChildren[] {
  const byParent = new Map<BusinessPlanTaskId | null, BusinessPlanTask[]>();
  for (const task of tasks) {
    const list = byParent.get(task.parent_task_id) ?? [];
    list.push(task);
    byParent.set(task.parent_task_id, list);
  }

  const build = (parentId: BusinessPlanTaskId | null): BusinessPlanTaskWithChildren[] => {
    const children = byParent.get(parentId) ?? [];
    return children.map((task) => ({
      ...task,
      children: build(task.id),
    }));
  };

  return build(null);
}

export async function getBusinessPlanTaskTree(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<{ businessPlanId: BusinessPlanId; tasks: BusinessPlanTaskWithChildren[] } | null> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data: planRow, error: planError } = await client
    .from("workspace_business_plans")
    .select("id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (planError && planError.code !== "PGRST116") {
    throw new Error(`Failed to fetch business plan: ${planError.message}`);
  }

  if (!planRow) {
    return null;
  }

  const businessPlanId = planRow.id;

  const { data: taskRows, error: tasksError } = await client
    .from("business_plan_tasks")
    .select("*")
    .eq("business_plan_id", businessPlanId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (tasksError) {
    throw new Error(`Failed to fetch business plan tasks: ${tasksError.message}`);
  }

  const tasks = (taskRows ?? []).map(mapTaskRow);

  return {
    businessPlanId,
    tasks: buildTaskTree(tasks),
  };
}

export async function createBusinessPlanTask(
  params: CreateBusinessPlanTaskParams & { userId: UserId }
): Promise<BusinessPlanTask> {
  const {
    businessPlanId,
    userId,
    parentTaskId,
    title,
    instructions,
    aiPrompt,
    hierarchyLevel,
    status,
    orderIndex,
  } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Task title is required.");
  }

  const normalizedParentId = parentTaskId ?? null;
  await validateParentTask({
    client,
    businessPlanId,
    parentTaskId: normalizedParentId,
    hierarchyLevel,
  });

  const finalOrderIndex =
    orderIndex ?? (await computeNextOrderIndex({
      client,
      businessPlanId,
      parentTaskId: normalizedParentId,
    }));

  const normalizedInstructions = instructions?.trim() ?? "";
  const normalizedAiPrompt = aiPrompt?.trim() ?? "";
  let finalInstructions = normalizedInstructions;
  let finalAiPrompt = normalizedAiPrompt;

  if (!finalInstructions || !finalAiPrompt) {
    const autoDefaults = await buildAutoTaskDefaults({
      client,
      workspaceId,
      title: trimmedTitle,
      hierarchyLevel,
      parentTaskId: normalizedParentId,
    });
    if (!finalInstructions) {
      finalInstructions = autoDefaults.instructions;
    }
    if (!finalAiPrompt) {
      finalAiPrompt = autoDefaults.aiPrompt;
    }
  }

  const { data, error } = await client
    .from("business_plan_tasks")
    .insert({
      business_plan_id: businessPlanId,
      parent_task_id: normalizedParentId,
      title: trimmedTitle,
      instructions: finalInstructions,
      ai_prompt: finalAiPrompt,
      hierarchy_level: hierarchyLevel,
      status: status ?? "todo",
      order_index: finalOrderIndex,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create business plan task: ${error?.message ?? "Unknown error"}`);
  }

  return mapTaskRow(data);
}

export async function getBusinessPlanTask(params: {
  taskId: BusinessPlanTaskId;
  userId: UserId;
}): Promise<BusinessPlanTask> {
  const { taskId, userId } = params;
  const client = getSupabaseClient();

  const { data: taskRow, error: taskError } = await client
    .from("business_plan_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError && taskError.code !== "PGRST116") {
    throw new Error(`Failed to load business plan task: ${taskError.message}`);
  }

  if (!taskRow) {
    throw new Error("Business plan task not found.");
  }

  const task = mapTaskRow(taskRow);
  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, task.business_plan_id);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);
  return task;
}

export async function ensureDefaultBusinessPlanTasks(params: {
  businessPlanId: BusinessPlanId;
  userId: UserId;
}): Promise<{ seeded: boolean; createdCount: number }> {
  const { businessPlanId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, businessPlanId);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data: existingTask, error: existingError } = await client
    .from("business_plan_tasks")
    .select("id")
    .eq("business_plan_id", businessPlanId)
    .limit(1)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(`Failed to check existing business plan tasks: ${existingError.message}`);
  }

  if (existingTask) {
    return { seeded: false, createdCount: 0 };
  }

  let createdCount = 0;

  for (const [h1Index, h1] of DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE.entries()) {
    const { data: h1Row, error: h1Error } = await client
      .from("business_plan_tasks")
      .insert({
        business_plan_id: businessPlanId,
        parent_task_id: null,
        title: h1.title,
        instructions: h1.instructions,
        ai_prompt: h1.aiPrompt,
        hierarchy_level: "h1",
        status: "todo",
        order_index: h1Index,
      })
      .select("id")
      .single();

    if (h1Error || !h1Row) {
      throw new Error(`Failed to seed default H1 task: ${h1Error?.message ?? "Unknown error"}`);
    }
    createdCount += 1;

    for (const [h2Index, h2] of h1.children.entries()) {
      const { error: h2Error } = await client
        .from("business_plan_tasks")
        .insert({
          business_plan_id: businessPlanId,
          parent_task_id: h1Row.id,
          title: h2.title,
          instructions: h2.instructions,
          ai_prompt: h2.aiPrompt,
          hierarchy_level: "h2",
          status: "todo",
          order_index: h2Index,
        });

      if (h2Error) {
        throw new Error(`Failed to seed default H2 task: ${h2Error.message}`);
      }
      createdCount += 1;
    }
  }

  return { seeded: true, createdCount };
}

export async function updateBusinessPlanTask(
  params: UpdateBusinessPlanTaskParams & { userId: UserId }
): Promise<BusinessPlanTask> {
  const {
    taskId,
    userId,
    parentTaskId,
    title,
    instructions,
    aiPrompt,
    hierarchyLevel,
    status,
    orderIndex,
  } = params;
  const client = getSupabaseClient();

  const { data: existingRow, error: existingError } = await client
    .from("business_plan_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(`Failed to load business plan task: ${existingError.message}`);
  }

  if (!existingRow) {
    throw new Error("Business plan task not found.");
  }

  const existingTask = mapTaskRow(existingRow);

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, existingTask.business_plan_id);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const nextHierarchyLevel = hierarchyLevel ?? existingTask.hierarchy_level;
  const nextParentTaskId =
    parentTaskId !== undefined ? parentTaskId : existingTask.parent_task_id;

  await validateParentTask({
    client,
    businessPlanId: existingTask.business_plan_id,
    taskId,
    parentTaskId: nextParentTaskId,
    hierarchyLevel: nextHierarchyLevel,
  });

  let finalOrderIndex = orderIndex;
  const parentChanged = parentTaskId !== undefined && parentTaskId !== existingTask.parent_task_id;
  if (parentChanged && finalOrderIndex === undefined) {
    finalOrderIndex = await computeNextOrderIndex({
      client,
      businessPlanId: existingTask.business_plan_id,
      parentTaskId: nextParentTaskId,
    });
  }

  const updatePayload: Record<string, unknown> = {};
  if (title !== undefined) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error("Task title cannot be empty.");
    }
    updatePayload.title = trimmedTitle;
  }
  if (instructions !== undefined) updatePayload.instructions = instructions.trim();
  if (aiPrompt !== undefined) updatePayload.ai_prompt = aiPrompt.trim();
  if (hierarchyLevel !== undefined) updatePayload.hierarchy_level = hierarchyLevel;
  if (status !== undefined) updatePayload.status = status;
  if (parentTaskId !== undefined) updatePayload.parent_task_id = parentTaskId;
  if (finalOrderIndex !== undefined) updatePayload.order_index = finalOrderIndex;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error("No updates provided for business plan task.");
  }

  const { data, error } = await client
    .from("business_plan_tasks")
    .update(updatePayload)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update business plan task: ${error?.message ?? "Unknown error"}`);
  }

  return mapTaskRow(data);
}

export async function deleteBusinessPlanTask(params: {
  taskId: BusinessPlanTaskId;
  userId: UserId;
}): Promise<void> {
  const { taskId, userId } = params;
  const client = getSupabaseClient();

  const { data: taskRow, error: taskError } = await client
    .from("business_plan_tasks")
    .select("business_plan_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError && taskError.code !== "PGRST116") {
    throw new Error(`Failed to load business plan task: ${taskError.message}`);
  }

  if (!taskRow) {
    throw new Error("Business plan task not found.");
  }

  const workspaceId = await getWorkspaceIdFromBusinessPlan(client, taskRow.business_plan_id);
  if (!workspaceId) {
    throw new Error("Business plan not found.");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { error } = await client.from("business_plan_tasks").delete().eq("id", taskId);

  if (error) {
    throw new Error(`Failed to delete business plan task: ${error.message}`);
  }
}
