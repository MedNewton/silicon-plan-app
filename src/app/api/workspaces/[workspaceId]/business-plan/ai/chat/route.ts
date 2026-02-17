// src/app/api/workspaces/[workspaceId]/business-plan/ai/chat/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

import {
  getOrCreateBusinessPlan,
  getOrCreateConversation,
  getConversationWithMessages,
  createMessage,
  createPendingChange,
  getBusinessPlanWithChapters,
} from "@/server/businessPlan";
import {
  ensureDefaultBusinessPlanTasks,
  getBusinessPlanTaskTree,
} from "@/server/businessPlanTasks";
import { buildBusinessPlanContext, buildBusinessPlanSystemPrompt } from "@/lib/businessPlanAi";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import type {
  BusinessPlanPendingChange,
  PendingChangeType,
  BusinessPlanChapterWithSections,
} from "@/types/workspaces";

type ChatBody = {
  message: string;
  conversationId?: string | null;
  selectedChapterId?: string | null;
  selectedTaskId?: string | null;
};

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "propose_add_chapter",
      description: "Propose adding a new chapter",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          parentChapterId: { type: "string", nullable: true },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_chapter",
      description: "Propose updating a chapter title",
      parameters: {
        type: "object",
        properties: {
          chapterId: { type: "string" },
          newTitle: { type: "string" },
        },
        required: ["chapterId", "newTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_chapter",
      description: "Propose deleting a chapter",
      parameters: {
        type: "object",
        properties: {
          chapterId: { type: "string" },
        },
        required: ["chapterId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_add_section",
      description: "Propose adding a new section to a chapter",
      parameters: {
        type: "object",
        properties: {
          chapterId: { type: "string" },
          sectionType: { type: "string" },
          content: { type: "object" },
        },
        required: ["chapterId", "sectionType", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_section",
      description: "Propose updating a section's content",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string" },
          newContent: { type: "object" },
        },
        required: ["sectionId", "newContent"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_section",
      description: "Propose deleting a section",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string" },
        },
        required: ["sectionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_add_task",
      description: "Propose adding a new task in the H1/H2 task hierarchy",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          hierarchyLevel: { type: "string", enum: ["h1", "h2"] },
          parentTaskId: { type: "string", nullable: true },
          instructions: { type: "string" },
          aiPrompt: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_task",
      description: "Propose updating an existing task",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          title: { type: "string" },
          instructions: { type: "string" },
          aiPrompt: { type: "string" },
          hierarchyLevel: { type: "string", enum: ["h1", "h2"] },
          parentTaskId: { type: "string", nullable: true },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_task",
      description: "Propose deleting an existing task",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
        },
        required: ["taskId"],
      },
    },
  },
];

const parseToolArguments = (args: string | undefined): Record<string, unknown> => {
  if (!args) return {};
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch (error) {
    console.error("Failed to parse tool arguments:", error);
    return {};
  }
};

const validSectionTypes = new Set([
  "section_title",
  "subsection",
  "text",
  "image",
  "table",
  "list",
  "comparison_table",
  "timeline",
  "embed",
  "page_break",
  "empty_space",
]);

const sectionTypeAliases: Record<string, string> = {
  bullet_list: "list",
  bulleted_list: "list",
  unordered_list: "list",
  ordered_list: "list",
  bullet_points: "list",
  bullets: "list",
  paragraph: "text",
  heading: "section_title",
  title: "section_title",
  compare_table: "comparison_table",
  comparison: "comparison_table",
  chart: "image",
  spacer: "empty_space",
};

const normalizeSectionType = (value: unknown): string => {
  if (typeof value !== "string") return "text";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const aliasResolved = sectionTypeAliases[normalized] ?? normalized;
  return validSectionTypes.has(aliasResolved) ? aliasResolved : "text";
};

const inferSectionTypeFromMessage = (messageText: string): string => {
  if (/\b(bullet|bulleted|unordered|ordered)\s+list\b/i.test(messageText)) return "list";
  if (/\b(list|bullet|bullets)\b/i.test(messageText)) return "list";
  if (/\b(comparison|compare)\b/i.test(messageText)) return "comparison_table";
  if (/\btable\b/i.test(messageText)) return "table";
  if (/\b(timeline|milestone|roadmap)\b/i.test(messageText)) return "timeline";
  if (/\b(embed|iframe|video|youtube)\b/i.test(messageText)) return "embed";
  if (/\b(image|illustration|diagram|chart)\b/i.test(messageText)) return "image";
  if (/\bsubsection\b/i.test(messageText)) return "subsection";
  if (/\b(section\s+title|heading)\b/i.test(messageText)) return "section_title";
  if (/\bpage\s*break\b/i.test(messageText)) return "page_break";
  if (/\b(empty\s*space|spacer)\b/i.test(messageText)) return "empty_space";
  return "text";
};

const buildDefaultContent = (sectionType: string): Record<string, unknown> => {
  switch (sectionType) {
    case "section_title":
    case "subsection":
    case "text":
      return { type: sectionType, text: "Draft content" };
    case "list":
      return { type: "list", items: ["First item", "Second item"], ordered: false };
    case "table":
    case "comparison_table":
      return {
        type: sectionType,
        headers: ["Column 1", "Column 2"],
        rows: [["Value 1", "Value 2"]],
      };
    case "image":
      return { type: "image", url: "", alt_text: "" };
    case "timeline":
      return { type: "timeline", entries: [] };
    case "embed":
      return { type: "embed", embed_type: "html", code: "" };
    case "page_break":
      return { type: "page_break" };
    case "empty_space":
      return { type: "empty_space", height: 40 };
    default:
      return { type: "text", text: "Draft content" };
  }
};

const findSectionById = (
  chapters: BusinessPlanChapterWithSections[],
  sectionId: string
): { id: string; content: Record<string, unknown>; section_type: string } | null => {
  const stack = [...chapters];
  while (stack.length > 0) {
    const chapter = stack.shift();
    if (!chapter) continue;
    for (const section of chapter.sections ?? []) {
      if (section.id === sectionId) {
        return {
          id: section.id,
          content: section.content as Record<string, unknown>,
          section_type: section.section_type as string,
        };
      }
    }
    if (chapter.children?.length) {
      stack.push(...chapter.children);
    }
  }
  return null;
};

const mergeSectionContent = (
  baseContent: Record<string, unknown>,
  updates: Record<string, unknown> | null
): Record<string, unknown> => {
  if (!updates) return baseContent;
  return {
    ...baseContent,
    ...updates,
  };
};

const isSameContent = (
  baseContent: Record<string, unknown>,
  nextContent: Record<string, unknown>
): boolean => {
  try {
    return JSON.stringify(baseContent) === JSON.stringify(nextContent);
  } catch {
    return false;
  }
};

const normalizeTaskHierarchyLevel = (value: unknown): "h1" | "h2" | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "h1") return "h1";
  if (normalized === "h2") return "h2";
  return null;
};

const normalizeTaskStatus = (value: unknown): "todo" | "in_progress" | "done" | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "todo" || normalized === "in_progress" || normalized === "done") {
    return normalized;
  }
  return undefined;
};

const flattenTasks = (
  tasks: Array<{ id: string; title: string; hierarchy_level: string; children?: unknown[] }>
): Array<{ id: string; title: string; hierarchy_level: string; parentTaskId: string | null }> => {
  const list: Array<{
    id: string;
    title: string;
    hierarchy_level: string;
    parentTaskId: string | null;
  }> = [];
  const visit = (
    nodes: Array<{ id: string; title: string; hierarchy_level: string; children?: unknown[] }>,
    parentTaskId: string | null
  ) => {
    for (const node of nodes) {
      list.push({
        id: node.id,
        title: node.title,
        hierarchy_level: node.hierarchy_level,
        parentTaskId,
      });
      if (Array.isArray(node.children) && node.children.length > 0) {
        visit(
          node.children as Array<{
            id: string;
            title: string;
            hierarchy_level: string;
            children?: unknown[];
          }>,
          node.id
        );
      }
    }
  };

  visit(tasks, null);
  return list;
};

const buildTaskContextLines = (
  tasks: Array<{ id: string; title: string; hierarchy_level: string; children?: unknown[] }>
): string[] => {
  const lines: string[] = [];
  const visit = (
    nodes: Array<{ id: string; title: string; hierarchy_level: string; children?: unknown[] }>,
    depth: number
  ) => {
    for (const node of nodes) {
      const indent = "  ".repeat(depth);
      lines.push(
        `${indent}- Task ${node.hierarchy_level.toUpperCase()}: ${node.title} (id: ${node.id})`
      );
      if (Array.isArray(node.children) && node.children.length > 0) {
        visit(
          node.children as Array<{
            id: string;
            title: string;
            hierarchy_level: string;
            children?: unknown[];
          }>,
          depth + 1
        );
      }
    }
  };

  visit(tasks, 0);
  return lines;
};

const extractQuotedUpdate = (message: string): string | null => {
  const match = /["“](.+?)["”]/.exec(message);
  if (!match) return null;
  const candidate = match[1]?.trim();
  return candidate && candidate.length > 0 ? candidate : null;
};

const readStringArg = (
  args: Record<string, unknown>,
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = args[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
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

const findTaskByNormalizedTitle = (
  tasks: Array<{ id: string; title: string; hierarchy_level: string; parentTaskId: string | null }>,
  title: string,
  options?: { hierarchyLevel?: "h1" | "h2" }
): { id: string; title: string; hierarchy_level: string; parentTaskId: string | null } | null => {
  const needle = normalizeLookupText(title);
  if (!needle) return null;

  const scoped = options?.hierarchyLevel
    ? tasks.filter((task) => task.hierarchy_level === options.hierarchyLevel)
    : tasks;

  const exact = scoped.find((task) => normalizeLookupText(task.title) === needle);
  if (exact) return exact;

  const partialMatches = scoped.filter((task) => {
    const hay = normalizeLookupText(task.title);
    return hay.includes(needle) || needle.includes(hay);
  });

  if (partialMatches.length === 1) {
    return partialMatches[0] ?? null;
  }

  return null;
};

const flattenChapterRefs = (
  chapters: BusinessPlanChapterWithSections[]
): Array<{ id: string; title: string; parentId: string | null }> => {
  const refs: Array<{ id: string; title: string; parentId: string | null }> = [];
  const visit = (
    nodes: BusinessPlanChapterWithSections[],
    parentId: string | null
  ) => {
    for (const chapter of nodes) {
      refs.push({ id: chapter.id, title: chapter.title, parentId });
      if (chapter.children?.length) {
        visit(chapter.children, chapter.id);
      }
    }
  };

  visit(chapters, null);
  return refs;
};

const resolveChapterFromArgs = (params: {
  args: Record<string, unknown>;
  chapterRefs: Array<{ id: string; title: string; parentId: string | null }>;
}): { id: string; title: string; parentId: string | null } | null => {
  const { args, chapterRefs } = params;
  if (chapterRefs.length === 0) return null;

  const requestedChapterId = readStringArg(args, ["chapterId", "chapter_id"]);
  if (requestedChapterId) {
    const byId = chapterRefs.find((chapter) => chapter.id === requestedChapterId);
    if (byId) return byId;
  }

  const requestedChapterTitle = readStringArg(args, [
    "chapterTitle",
    "chapter_title",
    "chapterName",
    "chapter",
  ]);
  if (requestedChapterTitle) {
    const needle = normalizeLookupText(requestedChapterTitle);
    const exact = chapterRefs.find((chapter) => normalizeLookupText(chapter.title) === needle);
    if (exact) return exact;

    const partial = chapterRefs.filter((chapter) => {
      const hay = normalizeLookupText(chapter.title);
      return hay.includes(needle) || needle.includes(hay);
    });
    if (partial.length === 1) {
      return partial[0] ?? null;
    }
  }

  if (chapterRefs.length === 1) {
    return chapterRefs[0] ?? null;
  }

  return null;
};

const resolveParentChapterFromArgs = (params: {
  args: Record<string, unknown>;
  chapterRefs: Array<{ id: string; title: string; parentId: string | null }>;
}): { id: string; title: string; parentId: string | null } | null => {
  const { args, chapterRefs } = params;
  if (chapterRefs.length === 0) return null;

  const parentChapterId = readStringArg(args, [
    "parentChapterId",
    "parent_chapter_id",
    "parentId",
    "parent_id",
  ]);
  if (parentChapterId) {
    const byId = chapterRefs.find((chapter) => chapter.id === parentChapterId);
    if (byId) return byId;
  }

  const parentChapterTitle = readStringArg(args, [
    "parentChapterTitle",
    "parent_chapter_title",
    "parentTitle",
    "parentChapter",
    "parent",
  ]);
  if (parentChapterTitle) {
    return resolveChapterFromArgs({
      args: { chapterTitle: parentChapterTitle },
      chapterRefs,
    });
  }

  return null;
};

const isLikelyChapterCreationIntent = (params: {
  messageText: string;
  args: Record<string, unknown>;
}): boolean => {
  const { messageText, args } = params;
  const mentionsChapter = /\b(chapter|subchapter)\b/i.test(messageText);
  const mentionsTask = /\b(task|subtask|h1|h2)\b/i.test(messageText);

  if (mentionsChapter && !mentionsTask) {
    return true;
  }

  const explicitTaskIdHint = readStringArg(args, [
    "taskId",
    "task_id",
    "parentTaskId",
    "parent_task_id",
    "parentId",
    "parent_id",
  ]);
  const explicitHierarchyHint = normalizeTaskHierarchyLevel(
    args.hierarchyLevel ?? args.hierarchy_level ?? args.level
  );
  const explicitChapterHint = readStringArg(args, [
    "chapterTitle",
    "chapter_title",
    "chapterName",
    "chapter",
    "parentChapterId",
    "parent_chapter_id",
  ]);

  if (!explicitTaskIdHint && !explicitHierarchyHint && explicitChapterHint && !mentionsTask) {
    return true;
  }

  return false;
};

const extractQuotedUnderTitle = (messageText: string): string | null => {
  const quotedUnder =
    /\bunder\s+["“](.+?)["”]/i.exec(messageText) ??
    /\bin\s+["“](.+?)["”]/i.exec(messageText);
  const title = quotedUnder?.[1]?.trim();
  return title && title.length > 0 ? title : null;
};

const extractChapterCreationIntent = (messageText: string): {
  title: string;
  parentTitle: string | null;
} | null => {
  const subchapterMatch =
    /\b(?:add|create)\s+(?:a\s+)?subchapter\s+["“](.+?)["”](?:\s+under\s+["“](.+?)["”])?/i.exec(
      messageText
    );
  if (subchapterMatch?.[1]) {
    const title = subchapterMatch[1].trim();
    const parentTitle = subchapterMatch[2]?.trim() ?? null;
    return title.length > 0 ? { title, parentTitle } : null;
  }

  const chapterMatch =
    /\b(?:add|create)\s+(?:a\s+)?(?:top[-\s]?level\s+)?chapter\s+["“](.+?)["”](?:\s+under\s+["“](.+?)["”])?/i.exec(
      messageText
    );
  if (chapterMatch?.[1]) {
    const title = chapterMatch[1].trim();
    const parentTitle = chapterMatch[2]?.trim() ?? null;
    return title.length > 0 ? { title, parentTitle } : null;
  }

  return null;
};

const isChapterOnlyIntent = (messageText: string): boolean => {
  const mentionsChapter = /\b(chapter|subchapter)\b/i.test(messageText);
  const mentionsTask = /\b(task|subtask|h1|h2)\b/i.test(messageText);
  const mentionsSection = /\b(section|paragraph|text|content)\b/i.test(messageText);
  return mentionsChapter && !mentionsTask && !mentionsSection;
};

const hasExplicitChapterAction = (messageText: string): boolean => {
  const chapterActionPattern =
    /\b(add|create|update|rename|delete|remove|edit|change)\b[^\n.!?]{0,40}\b(chapter|subchapter)\b/i;
  const reversePattern =
    /\b(chapter|subchapter)\b[^\n.!?]{0,30}\b(add|create|update|rename|delete|remove|edit|change)\b/i;
  return chapterActionPattern.test(messageText) || reversePattern.test(messageText);
};

const hasExplicitTaskAction = (messageText: string): boolean => {
  const taskActionPattern =
    /\b(add|create|update|rename|delete|remove|edit|change)\b[^\n.!?]{0,40}\b(task|subtask|h1|h2)\b/i;
  const reversePattern =
    /\b(task|subtask|h1|h2)\b[^\n.!?]{0,30}\b(add|create|update|rename|delete|remove|edit|change)\b/i;
  return taskActionPattern.test(messageText) || reversePattern.test(messageText);
};

const isTaskPrimaryIntent = (messageText: string): boolean => {
  const mentionsTask = /\b(task|subtask|h1|h2)\b/i.test(messageText);
  if (!mentionsTask) return false;
  return !hasExplicitChapterAction(messageText);
};

const isSectionOnlyIntent = (messageText: string): boolean => {
  const mentionsSection =
    /\b(section|subsection|paragraph|text|content|list|table|comparison|timeline|embed|page break)\b/i.test(
      messageText
    );
  const mentionsTask = /\b(task|subtask|h1|h2)\b/i.test(messageText);
  return mentionsSection && !mentionsTask && !hasExplicitChapterAction(messageText) && !hasExplicitTaskAction(messageText);
};

const extractQuotedChapterTarget = (messageText: string): string | null => {
  const targetMatch =
    /\b(?:to|in|under)\s+["“](.+?)["”]\s+chapter\b/i.exec(messageText) ??
    /\bchapter\s+["“](.+?)["”]/i.exec(messageText);
  const title = targetMatch?.[1]?.trim();
  return title && title.length > 0 ? title : null;
};

const buildChapterSignature = (params: {
  title: string;
  parentId: string | null;
}): string => {
  const { title, parentId } = params;
  return `${normalizeLookupText(title)}::${parentId ?? "root"}`;
};

const resolveH1TaskFromArgs = (params: {
  args: Record<string, unknown>;
  flattenedTasks: Array<{ id: string; title: string; hierarchy_level: string; parentTaskId: string | null }>;
  chapterRefs: Array<{ id: string; title: string; parentId: string | null }>;
}): { id: string; title: string; hierarchy_level: string; parentTaskId: string | null } | null => {
  const { args, flattenedTasks, chapterRefs } = params;
  const h1Tasks = flattenedTasks.filter((task) => task.hierarchy_level === "h1");

  const requestedParentTaskId = readStringArg(args, [
    "parentTaskId",
    "parent_task_id",
    "parentId",
    "parent_id",
  ]);
  if (requestedParentTaskId) {
    const byId = flattenedTasks.find((task) => task.id === requestedParentTaskId);
    if (byId?.hierarchy_level === "h1") return byId;
    if (byId?.hierarchy_level === "h2" && byId.parentTaskId) {
      const byParent = flattenedTasks.find((task) => task.id === byId.parentTaskId);
      if (byParent?.hierarchy_level === "h1") return byParent;
    }
  }

  const requestedParentTaskTitle = readStringArg(args, [
    "parentTaskTitle",
    "parent_task_title",
    "parentTitle",
    "parentTask",
  ]);
  if (requestedParentTaskTitle) {
    const byParentTitle = findTaskByNormalizedTitle(
      flattenedTasks,
      requestedParentTaskTitle
    );
    if (byParentTitle?.hierarchy_level === "h1") return byParentTitle;
    if (byParentTitle?.hierarchy_level === "h2" && byParentTitle.parentTaskId) {
      const byParent = flattenedTasks.find((task) => task.id === byParentTitle.parentTaskId);
      if (byParent?.hierarchy_level === "h1") return byParent;
    }
  }

  const requestedChapterId = readStringArg(args, ["chapterId", "chapter_id"]);
  if (requestedChapterId) {
    const chapterById = chapterRefs.find((chapter) => chapter.id === requestedChapterId);
    if (chapterById) {
      const byChapterTitle = findTaskByNormalizedTitle(h1Tasks, chapterById.title);
      if (byChapterTitle) return byChapterTitle;
    }
  }

  const requestedChapterTitle = readStringArg(args, [
    "chapterTitle",
    "chapter_title",
    "chapterName",
    "chapter",
  ]);
  if (requestedChapterTitle) {
    const byChapterTitle = findTaskByNormalizedTitle(h1Tasks, requestedChapterTitle);
    if (byChapterTitle) return byChapterTitle;
  }

  if (h1Tasks.length === 1) {
    return h1Tasks[0] ?? null;
  }

  return null;
};

const TOOL_TO_CHANGE: Record<string, PendingChangeType> = {
  propose_add_chapter: "add_chapter",
  propose_update_chapter: "update_chapter",
  propose_delete_chapter: "delete_chapter",
  propose_add_section: "add_section",
  propose_update_section: "update_section",
  propose_delete_section: "delete_section",
  propose_add_task: "add_task",
  propose_update_task: "update_task",
  propose_delete_task: "delete_task",
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

    const body = (await req.json()) as ChatBody;
    const messageText = body.message?.trim();
    const selectedChapterId = body.selectedChapterId ?? null;
    const selectedTaskId = body.selectedTaskId ?? null;

    if (!messageText) {
      return new NextResponse("Message is required", { status: 400 });
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      console.error("OPEN_AI_API_KEY is not configured");
      return new NextResponse("AI service not configured", { status: 500 });
    }

    const businessPlan = await getOrCreateBusinessPlan({
      workspaceId,
      userId,
    });

    const conversation = await getOrCreateConversation({
      businessPlanId: businessPlan.id,
      userId,
    });

    const conversationSnapshot = await getConversationWithMessages({
      businessPlanId: businessPlan.id,
      userId,
    });

    if (body.conversationId && body.conversationId !== conversation.id) {
      return new NextResponse("Conversation mismatch", { status: 400 });
    }

    const planData = await getBusinessPlanWithChapters({
      workspaceId,
      userId,
    });

    await ensureDefaultBusinessPlanTasks({
      businessPlanId: businessPlan.id,
      userId,
    });
    const taskTree = await getBusinessPlanTaskTree({
      workspaceId,
      userId,
    });
    const taskContextLines = buildTaskContextLines(taskTree?.tasks ?? []);
    const flattenedTasks = flattenTasks(taskTree?.tasks ?? []);
    const chapterRefs = flattenChapterRefs(planData?.chapters ?? []);

    // Build selected context labels for AI prompt enrichment
    const selectedChapterRef = selectedChapterId
      ? chapterRefs.find((c) => c.id === selectedChapterId) ?? null
      : null;
    const selectedTaskRef = selectedTaskId
      ? flattenedTasks.find((t) => t.id === selectedTaskId) ?? null
      : null;
    const selectedContextLines: string[] = [];
    if (selectedChapterRef) {
      selectedContextLines.push(
        `User has selected chapter: "${selectedChapterRef.title}" (id: ${selectedChapterRef.id})`
      );
    }
    if (selectedTaskRef) {
      selectedContextLines.push(
        `User has selected task: "${selectedTaskRef.title}" (id: ${selectedTaskRef.id}, level: ${selectedTaskRef.hierarchy_level})`
      );
    }

    const chapterOnlyIntent = isChapterOnlyIntent(messageText);
    const taskPrimaryIntent = isTaskPrimaryIntent(messageText);
    const sectionOnlyIntent = isSectionOnlyIntent(messageText);
    const chapterCreationIntent = extractChapterCreationIntent(messageText);
    const chapterToolNames = new Set([
      "propose_add_chapter",
      "propose_update_chapter",
      "propose_delete_chapter",
    ]);
    const sectionToolNames = new Set([
      "propose_add_section",
      "propose_update_section",
      "propose_delete_section",
    ]);
    const existingChapterSignatures = new Set(
      chapterRefs.map((chapter) =>
        buildChapterSignature({
          title: chapter.title,
          parentId: chapter.parentId ?? null,
        })
      )
    );
    const plannedChapterSignatures = new Set<string>();

    const context = buildBusinessPlanContext({
      businessPlan: planData?.businessPlan ?? null,
      chapters: planData?.chapters ?? [],
    });
    const workspaceContext = await getWorkspaceAiContext(workspaceId);
    const tasksContext = [
      "Current task hierarchy:",
      taskContextLines.length > 0 ? taskContextLines.join("\n") : "- No tasks yet",
    ].join("\n");
    const selectedContextBlock =
      selectedContextLines.length > 0
        ? ["Selected UI context:", ...selectedContextLines].join("\n")
        : "";
    const combinedContext = [context, tasksContext, workspaceContext.context, selectedContextBlock]
      .filter(Boolean)
      .join("\n\n");
    const systemPrompt = buildBusinessPlanSystemPrompt(combinedContext);
    const aiMessageText =
      selectedChapterRef &&
      /\b(here|this section|this chapter|selected chapter|selected one|in this one)\b/i.test(
        messageText
      )
        ? `${messageText}\n\nSelected chapter context: "${selectedChapterRef.title}" (id: ${selectedChapterRef.id}). Treat "here/this" as this chapter.`
        : messageText;

    const historyMessages: Array<{ role: "user" | "assistant"; content: string }> = (
      conversationSnapshot?.messages ?? []
    )
      .filter(
        (msg) =>
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0
      )
      .slice(-12)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    const userMessage = await createMessage({
      conversationId: conversation.id,
      userId,
      role: "user",
      content: messageText,
    });

    const openai = new OpenAI({ apiKey: openAiApiKey });

    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: aiMessageText },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 800,
    });
    let toolCalls = completion.choices[0]?.message?.tool_calls ?? [];

    const looksLikeStructuralRequest = /\b(chapter|section|task|subtask|h1|h2|outline|structure)\b/i.test(
      messageText
    );

    // Retry logic: handles both "no tool call" and "wrong tool type" scenarios
    const hasWrongToolType = (calls: typeof toolCalls): boolean => {
      if (calls.length === 0) return false;
      // If user asked about chapters but only got task tools (or vice versa)
      const mentionsChapter = /\b(chapter|subchapter)\b/i.test(messageText);
      const mentionsTask = /\b(task|subtask|h1|h2)\b/i.test(messageText);
      const mentionsSection = /\b(section|paragraph|text|content)\b/i.test(messageText);

      const hasChapterTool = calls.some((c) => c.type === "function" && c.function.name.includes("chapter"));
      const hasTaskTool = calls.some((c) => c.type === "function" && c.function.name.includes("task"));
      const hasSectionTool = calls.some((c) => c.type === "function" && c.function.name.includes("section"));

      // Wrong: user said "chapter" but only got task tools, no chapter tools
      if (mentionsChapter && !mentionsTask && !hasChapterTool && hasTaskTool) return true;
      // Wrong: user said "task" but only got chapter tools, no task tools
      if (mentionsTask && !mentionsChapter && !hasTaskTool && hasChapterTool) return true;
      // Wrong: user said "section" but got no section tools
      if (mentionsSection && !mentionsChapter && !mentionsTask && !hasSectionTool && (hasChapterTool || hasTaskTool)) return true;

      return false;
    };

    const needsRetry = toolCalls.length === 0 || hasWrongToolType(toolCalls);

    if (needsRetry && looksLikeStructuralRequest) {
      const retryHint = hasWrongToolType(toolCalls)
        ? `\nIMPORTANT: Your previous response used the wrong tool type. Re-read the user request carefully:
- "chapter"/"subchapter" → use chapter tools (propose_add_chapter, propose_update_chapter, propose_delete_chapter)
- "task"/"subtask"/"h1"/"h2" → use task tools (propose_add_task, propose_update_task, propose_delete_task)
- "section"/"paragraph"/"content" → use section tools (propose_add_section, propose_update_section, propose_delete_section)
Do NOT mix tool types unless the user explicitly asks for multiple entity types.`
        : "";

      const strictCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${systemPrompt}

You must call one or more tools when the user asks to create, update, delete, or structure chapters/sections/tasks.
If selected UI context is provided, treat "here" or "this" as that selected target.
If the request is ambiguous, ask a concise clarifying question.${retryHint}`,
          },
          ...historyMessages,
          { role: "user", content: aiMessageText },
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 700,
      });

      const strictToolCalls = strictCompletion.choices[0]?.message?.tool_calls ?? [];
      if (strictToolCalls.length > 0 && !hasWrongToolType(strictToolCalls)) {
        completion = strictCompletion;
        toolCalls = strictToolCalls;
      } else if (strictToolCalls.length > 0 && toolCalls.length === 0) {
        // Even if wrong type, prefer having some tool calls over none
        completion = strictCompletion;
        toolCalls = strictToolCalls;
      }
    }
    const pendingChanges: BusinessPlanPendingChange[] = [];
    const pendingChangeInputs: Array<{
      changeType: PendingChangeType;
      targetId: string | null;
      proposedData: Record<string, unknown>;
    }> = [];
    const skippedUpdates: string[] = [];
    let ignoredChapterToolForTaskIntent = false;
    let ignoredNonSectionToolForSectionIntent = false;
    const pendingChangeInputSignatures = new Set<string>();

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      const functionName = toolCall.function.name;
      if (chapterOnlyIntent && !chapterToolNames.has(functionName)) {
        continue;
      }
      if (sectionOnlyIntent && !sectionToolNames.has(functionName)) {
        if (!ignoredNonSectionToolForSectionIntent) {
          skippedUpdates.push(
            "I treated this as a section request and ignored unrelated chapter/task proposals."
          );
          ignoredNonSectionToolForSectionIntent = true;
        }
        continue;
      }
      if (taskPrimaryIntent && chapterToolNames.has(functionName)) {
        if (!ignoredChapterToolForTaskIntent) {
          skippedUpdates.push(
            "I treated this as a task request and ignored a mismatched chapter proposal."
          );
          ignoredChapterToolForTaskIntent = true;
        }
        continue;
      }
      const mappedChangeType = TOOL_TO_CHANGE[functionName];
      if (!mappedChangeType) continue;
      let changeType: PendingChangeType = mappedChangeType;

      const args = parseToolArguments(toolCall.function.arguments);
      let targetId: string | null = null;
      let proposedData: Record<string, unknown> = {};

      // Use selected UI context for resolution when args lack explicit IDs
      if (selectedChapterId && !readStringArg(args, ["chapterId", "chapter_id"])) {
        // Inject selected chapter as fallback context for section/chapter operations
        if (functionName.includes("section") && !args.chapterId && !args.chapter_id) {
          args.chapterId = selectedChapterId;
        }
      }
      if (selectedTaskId && !readStringArg(args, ["taskId", "task_id"])) {
        if (functionName.includes("task") && functionName !== "propose_add_task" && !args.taskId && !args.task_id) {
          args.taskId = selectedTaskId;
        }
      }

      switch (functionName) {
        case "propose_add_chapter": {
          if (
            chapterOnlyIntent &&
            chapterCreationIntent &&
            pendingChangeInputs.some((input) => input.changeType === "add_chapter")
          ) {
            break;
          }

          const title =
            chapterCreationIntent?.title ??
            readStringArg(args, ["title", "chapterTitle", "newTitle", "chapter"]) ??
            "New Chapter";
          let parentChapter = resolveParentChapterFromArgs({ args, chapterRefs });
          if (!parentChapter && chapterCreationIntent?.parentTitle) {
            parentChapter = resolveChapterFromArgs({
              args: { chapterTitle: chapterCreationIntent.parentTitle },
              chapterRefs,
            });
          }
          if (
            chapterOnlyIntent &&
            chapterCreationIntent?.parentTitle &&
            !parentChapter
          ) {
            skippedUpdates.push(
              `I couldn't find the parent chapter "${chapterCreationIntent.parentTitle}".`
            );
            break;
          }
          if (!parentChapter) {
            const parentTitleInMessage = extractQuotedUnderTitle(messageText);
            if (parentTitleInMessage) {
              parentChapter = resolveChapterFromArgs({
                args: { chapterTitle: parentTitleInMessage },
                chapterRefs,
              });
            }
          }
          const parentId = parentChapter?.id ?? null;
          const signature = buildChapterSignature({
            title,
            parentId,
          });
          if (
            existingChapterSignatures.has(signature) ||
            plannedChapterSignatures.has(signature)
          ) {
            skippedUpdates.push(
              `Chapter "${title}" already exists${
                parentChapter ? ` under "${parentChapter.title}"` : ""
              }, so I skipped duplicate creation.`
            );
            break;
          }
          plannedChapterSignatures.add(signature);
          proposedData = {
            title,
            parent_id: parentId,
            parent_title: parentChapter?.title ?? null,
          };
          break;
        }
        case "propose_update_chapter": {
          // Try to resolve chapter by ID first, then by title
          const requestedId = readStringArg(args, ["chapterId", "chapter_id"]);
          if (requestedId) {
            const byId = chapterRefs.find((c) => c.id === requestedId);
            targetId = byId?.id ?? requestedId;
          }

          // If no ID, try title-based resolution
          if (!targetId) {
            const requestedTitle = readStringArg(args, ["chapterTitle", "chapter_title", "title", "chapter"]);
            if (requestedTitle) {
              const resolved = resolveChapterFromArgs({
                args: { chapterTitle: requestedTitle },
                chapterRefs,
              });
              targetId = resolved?.id ?? null;
            }
          }

          // If still no target, try selected chapter from UI
          if (!targetId && selectedChapterId) {
            targetId = selectedChapterId;
          }

          if (!targetId) {
            skippedUpdates.push(
              "I couldn't determine which chapter to update. Please specify the chapter name or select it in the sidebar."
            );
            break;
          }

          const newTitle = readStringArg(args, ["newTitle", "title", "chapterTitle"]);
          if (!newTitle) {
            skippedUpdates.push(
              "I couldn't determine the new title for the chapter update."
            );
            break;
          }

          proposedData = {
            title: newTitle,
          };
          break;
        }
        case "propose_delete_chapter": {
          // Try to resolve chapter by ID first, then by title
          const requestedId = readStringArg(args, ["chapterId", "chapter_id"]);
          let resolvedChapter: { id: string; title: string; parentId: string | null } | null = null;
          
          if (requestedId) {
            const byId = chapterRefs.find((c) => c.id === requestedId);
            if (byId) {
              resolvedChapter = byId;
              targetId = byId.id;
            } else {
              targetId = requestedId;
            }
          }

          // If no ID, try title-based resolution
          if (!resolvedChapter) {
            const requestedTitle = readStringArg(args, ["chapterTitle", "chapter_title", "title", "chapter"]);
            if (requestedTitle) {
              const resolved = resolveChapterFromArgs({
                args: { chapterTitle: requestedTitle },
                chapterRefs,
              });
              if (resolved) {
                resolvedChapter = resolved;
                targetId = resolved.id;
              } else {
                // Ambiguous - report to user
                skippedUpdates.push(
                  `I couldn't find an unambiguous chapter matching "${requestedTitle}". Please specify more precisely.`
                );
                break;
              }
            }
          }

          // If still no target, try selected chapter from UI
          if (!resolvedChapter && selectedChapterId) {
            const selectedChapter = chapterRefs.find((c) => c.id === selectedChapterId);
            if (selectedChapter) {
              resolvedChapter = selectedChapter;
              targetId = selectedChapter.id;
            }
          }

          if (!resolvedChapter && !targetId) {
            skippedUpdates.push(
              "I couldn't determine which chapter to delete. Please specify the chapter name or select it in the sidebar."
            );
            break;
          }

          // Store chapter title and parent in proposedData for later resolution
          proposedData = {
            title: resolvedChapter?.title ?? "",
            parent_title: resolvedChapter?.parentId 
              ? chapterRefs.find((c) => c.id === resolvedChapter?.parentId)?.title ?? null
              : null,
          };
          break;
        }
        case "propose_add_section": {
          const resolvedChapter = resolveChapterFromArgs({ args, chapterRefs });
          if (!resolvedChapter) {
            skippedUpdates.push(
              "I couldn't determine which chapter should receive the new section."
            );
            break;
          }

          const requestedSectionType = readStringArg(args, ["sectionType", "section_type", "type"]);
          let normalizedType = normalizeSectionType(requestedSectionType);
          const inferredSectionType = inferSectionTypeFromMessage(messageText);
          if (normalizedType === "text" && inferredSectionType !== "text") {
            normalizedType = inferredSectionType;
          }
          const content =
            args.content && typeof args.content === "object"
              ? { type: normalizedType, ...(args.content as Record<string, unknown>) }
              : buildDefaultContent(normalizedType);
          proposedData = {
            chapter_id: resolvedChapter.id,
            chapter_title: resolvedChapter.title,
            section_type: normalizedType,
            content,
          };
          break;
        }
        case "propose_update_section": {
          targetId = (args.sectionId as string) ?? null;
          if (!targetId) break;
          const existingSection = findSectionById(planData?.chapters ?? [], targetId);
          if (!existingSection) {
            skippedUpdates.push("I couldn't find that section to update.");
            break;
          }
          let normalizedUpdates: Record<string, unknown> | null = null;
          if (typeof args.newContent === "string") {
            normalizedUpdates = { text: args.newContent.trim() };
          } else if (args.newContent && typeof args.newContent === "object") {
            normalizedUpdates = args.newContent as Record<string, unknown>;
          } else if (typeof args.text === "string") {
            normalizedUpdates = { text: args.text.trim() };
          }
          const baseContent = existingSection.content ?? buildDefaultContent("text");
          if (!normalizedUpdates) {
            const quoted = extractQuotedUpdate(messageText);
            if (quoted && existingSection.section_type === "text") {
              normalizedUpdates = { text: quoted };
            }
          }
          if (!normalizedUpdates) {
            skippedUpdates.push(
              "Please share the exact text you want for that section so I can update it."
            );
            break;
          }
          const mergedContent = mergeSectionContent(baseContent, normalizedUpdates);
          if (typeof mergedContent.type !== "string") {
            mergedContent.type = existingSection?.section_type ?? "text";
          }
          if (isSameContent(baseContent, mergedContent)) {
            const quoted = extractQuotedUpdate(messageText);
            if (quoted && existingSection.section_type === "text") {
              mergedContent.text = quoted;
            } else {
              skippedUpdates.push(
                "The proposed update matches the current content, so I didn't change it."
              );
              break;
            }
          }
          proposedData = {
            content: mergedContent,
            section_type: existingSection?.section_type,
          };
          break;
        }
        case "propose_delete_section": {
          targetId = (args.sectionId as string) ?? null;
          proposedData = {};
          break;
        }
        case "propose_add_task": {
          if (isLikelyChapterCreationIntent({ messageText, args })) {
            if (
              chapterOnlyIntent &&
              chapterCreationIntent &&
              pendingChangeInputs.some((input) => input.changeType === "add_chapter")
            ) {
              break;
            }

            let resolvedParentChapter = resolveParentChapterFromArgs({
              args,
              chapterRefs,
            });
            if (!resolvedParentChapter && chapterCreationIntent?.parentTitle) {
              resolvedParentChapter = resolveChapterFromArgs({
                args: { chapterTitle: chapterCreationIntent.parentTitle },
                chapterRefs,
              });
            }
            if (!resolvedParentChapter) {
              const parentTitleInMessage = extractQuotedUnderTitle(messageText);
              if (parentTitleInMessage) {
                resolvedParentChapter = resolveChapterFromArgs({
                  args: { chapterTitle: parentTitleInMessage },
                  chapterRefs,
                });
              }
            }
            const title =
              chapterCreationIntent?.title ??
              readStringArg(args, ["title", "chapterTitle", "newTitle", "chapter"]) ??
              "New Chapter";
            const signature = buildChapterSignature({
              title,
              parentId: resolvedParentChapter?.id ?? null,
            });
            if (
              existingChapterSignatures.has(signature) ||
              plannedChapterSignatures.has(signature)
            ) {
              skippedUpdates.push(
                `Chapter "${title}" already exists${
                  resolvedParentChapter ? ` under "${resolvedParentChapter.title}"` : ""
                }, so I skipped duplicate creation.`
              );
              break;
            }
            plannedChapterSignatures.add(signature);
            proposedData = {
              title,
              parent_id: resolvedParentChapter?.id ?? null,
              parent_title: resolvedParentChapter?.title ?? null,
            };
            changeType = "add_chapter";
            break;
          }

          const explicitHierarchyLevel = normalizeTaskHierarchyLevel(
            args.hierarchyLevel ?? args.hierarchy_level ?? args.level
          );
          const hasParentOrChapterHint =
            readStringArg(args, [
              "parentTaskId",
              "parent_task_id",
              "parentId",
              "parent_id",
              "parentTaskTitle",
              "parent_task_title",
              "parentTitle",
              "parentTask",
              "chapterId",
              "chapter_id",
              "chapterTitle",
              "chapter_title",
              "chapterName",
              "chapter",
            ]) != null;

          const hierarchyLevel =
            explicitHierarchyLevel ?? (hasParentOrChapterHint ? "h2" : "h1");

          let parentTaskId: string | null = null;
          if (hierarchyLevel === "h2") {
            const resolvedH1Parent = resolveH1TaskFromArgs({
              args,
              flattenedTasks,
              chapterRefs,
            });
            parentTaskId = resolvedH1Parent?.id ?? null;
            if (!parentTaskId && selectedTaskRef) {
              parentTaskId =
                selectedTaskRef.hierarchy_level === "h1"
                  ? selectedTaskRef.id
                  : selectedTaskRef.parentTaskId;
            }
          }

          if (hierarchyLevel === "h2" && !parentTaskId) {
            skippedUpdates.push(
              "I couldn't determine which H1 task/chapter should own this H2 task. Specify a parent task or chapter title."
            );
            break;
          }

          proposedData = {
            title:
              readStringArg(args, ["title", "taskTitle", "task_title"]) ??
              "New Task",
            instructions:
              readStringArg(args, ["instructions", "taskInstructions", "task_instructions"]) ??
              "",
            ai_prompt: readStringArg(args, ["aiPrompt", "ai_prompt", "prompt"]) ?? "",
            hierarchy_level: hierarchyLevel,
            parent_task_id: hierarchyLevel === "h2" ? parentTaskId : null,
            status: normalizeTaskStatus(args.status ?? args.taskStatus) ?? "todo",
          };
          break;
        }
        case "propose_update_task": {
          targetId = readStringArg(args, ["taskId", "task_id"]) ?? null;

          if (!targetId) {
            const requestedTitle = readStringArg(args, [
              "currentTitle",
              "current_title",
              "targetTitle",
              "target_title",
              "taskTitle",
              "task_title",
              "title",
            ]);
            if (requestedTitle) {
              const byTitle = findTaskByNormalizedTitle(flattenedTasks, requestedTitle);
              targetId = byTitle?.id ?? null;
            }
          }

          if (!targetId) {
            const byChapterRef = resolveH1TaskFromArgs({
              args,
              flattenedTasks,
              chapterRefs,
            });
            targetId = byChapterRef?.id ?? null;
          }

          if (!targetId && selectedTaskRef) {
            targetId = selectedTaskRef.id;
          }

          if (!targetId) {
            skippedUpdates.push("I couldn't find the target task to update.");
            break;
          }

          const nextLevel =
            args.hierarchyLevel !== undefined || args.hierarchy_level !== undefined
              ? normalizeTaskHierarchyLevel(args.hierarchyLevel ?? args.hierarchy_level)
              : undefined;
          const hasParentHint =
            readStringArg(args, [
              "parentTaskId",
              "parent_task_id",
              "parentId",
              "parent_id",
              "parentTaskTitle",
              "parent_task_title",
              "parentTitle",
              "parentTask",
              "chapterId",
              "chapter_id",
              "chapterTitle",
              "chapter_title",
              "chapterName",
              "chapter",
            ]) != null;
          const nextParent = readStringArg(args, [
            "parentTaskId",
            "parent_task_id",
            "parentId",
            "parent_id",
          ]);
          let nextParentResolved: string | null | undefined = undefined;
          if (nextLevel === "h1") {
            nextParentResolved = null;
          } else if (hasParentHint) {
            const resolvedParent = resolveH1TaskFromArgs({
              args,
              flattenedTasks,
              chapterRefs,
            });
            nextParentResolved = nextParent ?? resolvedParent?.id ?? null;
          }

          if (nextLevel === "h2" && hasParentHint && !nextParentResolved) {
            skippedUpdates.push(
              "I couldn't determine which H1 task/chapter should own this H2 task update."
            );
            break;
          }

          const nextStatus = normalizeTaskStatus(args.status ?? args.taskStatus);
          const nextTitle = readStringArg(args, [
            "newTitle",
            "new_title",
            "title",
            "taskTitle",
            "task_title",
          ]);
          const nextInstructions = readStringArg(args, [
            "instructions",
            "taskInstructions",
            "task_instructions",
          ]);
          const nextAiPrompt = readStringArg(args, [
            "aiPrompt",
            "ai_prompt",
            "prompt",
          ]);

          proposedData = {
            ...(typeof nextTitle === "string" ? { title: nextTitle } : {}),
            ...(typeof nextInstructions === "string"
              ? { instructions: nextInstructions }
              : {}),
            ...(typeof nextAiPrompt === "string" ? { ai_prompt: nextAiPrompt } : {}),
            ...(nextLevel != null ? { hierarchy_level: nextLevel } : {}),
            ...(nextParentResolved !== undefined ? { parent_task_id: nextParentResolved } : {}),
            ...(nextStatus ? { status: nextStatus } : {}),
          };

          break;
        }
        case "propose_delete_task": {
          targetId = readStringArg(args, ["taskId", "task_id"]) ?? null;

          if (!targetId) {
            const requestedTitle = readStringArg(args, [
              "currentTitle",
              "current_title",
              "targetTitle",
              "target_title",
              "taskTitle",
              "task_title",
              "title",
            ]);
            if (requestedTitle) {
              const byTitle = findTaskByNormalizedTitle(flattenedTasks, requestedTitle);
              targetId = byTitle?.id ?? null;
            }
          }

          if (!targetId) {
            const byChapterRef = resolveH1TaskFromArgs({
              args,
              flattenedTasks,
              chapterRefs,
            });
            targetId = byChapterRef?.id ?? null;
          }
          if (!targetId && selectedTaskRef) {
            targetId = selectedTaskRef.id;
          }
          if (!targetId) {
            skippedUpdates.push("I couldn't find the target task to delete.");
            break;
          }
          proposedData = {};
          break;
        }
        default:
          break;
      }

      const hasProposedData = Object.keys(proposedData).length > 0;
      if ((changeType === "update_section" || changeType === "update_task") && !hasProposedData) {
        skippedUpdates.push(
          changeType === "update_task"
            ? "I couldn't generate an updated task payload."
            : "I couldn't generate an updated section payload. Please provide the exact text to replace."
        );
        continue;
      }
      if (hasProposedData || targetId) {
        const signature = `${changeType}::${targetId ?? "null"}::${JSON.stringify(proposedData)}`;
        if (!pendingChangeInputSignatures.has(signature)) {
          pendingChangeInputSignatures.add(signature);
          pendingChangeInputs.push({ changeType, targetId, proposedData });
        }
      }
    }

    if (
      chapterOnlyIntent &&
      chapterCreationIntent &&
      !pendingChangeInputs.some((input) => input.changeType === "add_chapter")
    ) {
      const resolvedParent = chapterCreationIntent.parentTitle
        ? resolveChapterFromArgs({
            args: { chapterTitle: chapterCreationIntent.parentTitle },
            chapterRefs,
          })
        : null;

      if (chapterCreationIntent.parentTitle && !resolvedParent) {
        skippedUpdates.push(
          `I couldn't find the parent chapter "${chapterCreationIntent.parentTitle}".`
        );
      } else {
        const signature = buildChapterSignature({
          title: chapterCreationIntent.title,
          parentId: resolvedParent?.id ?? null,
        });
        if (
          !existingChapterSignatures.has(signature) &&
          !plannedChapterSignatures.has(signature)
        ) {
          pendingChangeInputs.push({
            changeType: "add_chapter",
            targetId: null,
            proposedData: {
              title: chapterCreationIntent.title,
              parent_id: resolvedParent?.id ?? null,
              parent_title: resolvedParent?.title ?? null,
            },
          });
          plannedChapterSignatures.add(signature);
        }
      }
    }

    const hasSectionPendingChange = pendingChangeInputs.some((input) =>
      input.changeType === "add_section" ||
      input.changeType === "update_section" ||
      input.changeType === "delete_section"
    );

    if (sectionOnlyIntent && !hasSectionPendingChange) {
      let resolvedChapter = selectedChapterRef;
      if (!resolvedChapter) {
        const quotedChapterTitle = extractQuotedChapterTarget(messageText);
        if (quotedChapterTitle) {
          resolvedChapter = resolveChapterFromArgs({
            args: { chapterTitle: quotedChapterTitle },
            chapterRefs,
          });
        }
      }
      if (!resolvedChapter && chapterRefs.length === 1) {
        resolvedChapter = chapterRefs[0] ?? null;
      }

      if (!resolvedChapter) {
        skippedUpdates.push(
          "I couldn't determine which chapter should receive this section. Please select a chapter or name it explicitly."
        );
      } else {
        const sectionType = inferSectionTypeFromMessage(messageText);
        const quotedContent = extractQuotedUpdate(messageText);
        const content =
          sectionType === "text" && quotedContent
            ? { type: "text", text: quotedContent }
            : sectionType === "list" && quotedContent
              ? { type: "list", items: [quotedContent], ordered: false }
              : buildDefaultContent(sectionType);
        const fallbackProposedData = {
          chapter_id: resolvedChapter.id,
          chapter_title: resolvedChapter.title,
          section_type: sectionType,
          content,
        };
        const signature = `add_section::null::${JSON.stringify(fallbackProposedData)}`;
        if (!pendingChangeInputSignatures.has(signature)) {
          pendingChangeInputSignatures.add(signature);
          pendingChangeInputs.push({
            changeType: "add_section",
            targetId: null,
            proposedData: fallbackProposedData,
          });
        }
      }
    }

    const assistantContentBase =
      completion.choices[0]?.message?.content?.trim() ??
      "I have suggestions for your business plan. Would you like to review them?";
    const genericNotice = workspaceContext.hasContext
      ? ""
      : "Note: I don't have access to workspace knowledge or AI documents, so my answers may be generic.";
    const assistantContent = [
      assistantContentBase,
      skippedUpdates.length > 0 ? skippedUpdates.join(" ") : null,
      genericNotice.length > 0 ? genericNotice : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const assistantMessage = await createMessage({
      conversationId: conversation.id,
      userId,
      role: "assistant",
      content: assistantContent,
    });

    for (const input of pendingChangeInputs) {
      try {
        const pendingChange = await createPendingChange({
          messageId: assistantMessage.id,
          userId,
          changeType: input.changeType,
          targetId: input.targetId,
          proposedData: input.proposedData,
        });

        pendingChanges.push(pendingChange);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create pending change.";

        if (
          message.includes("invalid input value for enum pending_change_type") ||
          message.includes('invalid input value for enum "pending_change_type"')
        ) {
          throw new Error(
            "Database migration required: pending_change_type must include add_task/update_task/delete_task."
          );
        }

        throw error;
      }
    }

    return NextResponse.json({
      conversation,
      userMessage,
      assistantMessage,
      pendingChanges,
    });
  } catch (error) {
    console.error("Unexpected error in POST /ai/chat:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
