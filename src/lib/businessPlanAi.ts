// src/lib/businessPlanAi.ts

import type {
  BusinessPlan,
  BusinessPlanChapterWithSections,
  BusinessPlanSectionContent,
} from "@/types/workspaces";

const summarizeSectionContent = (content: BusinessPlanSectionContent): string => {
  switch (content.type) {
    case "section_title":
    case "subsection":
    case "text":
      return content.text.slice(0, 160);
    case "list":
      return content.items.slice(0, 5).join(", ");
    case "table":
    case "comparison_table":
      return `${content.headers.length} columns, ${content.rows.length} rows`;
    case "image":
      return content.caption ?? content.alt_text ?? content.url;
    case "timeline":
      return `${content.entries.length} timeline entries`;
    case "embed":
      return content.embed_type;
    case "page_break":
      return "page break";
    case "empty_space":
      return content.height ? `empty space (${content.height}px)` : "empty space";
    default:
      return "";
  }
};

const buildChapterLines = (
  chapters: BusinessPlanChapterWithSections[],
  depth: number
): string[] => {
  const lines: string[] = [];

  chapters.forEach((chapter) => {
    const indent = "  ".repeat(depth);
    lines.push(`${indent}- Chapter: ${chapter.title} (id: ${chapter.id})`);

    chapter.sections.forEach((section) => {
      const preview = summarizeSectionContent(section.content);
      lines.push(
        `${indent}  - Section: ${section.section_type} (id: ${section.id})${
          preview ? ` -> ${preview}` : ""
        }`
      );
    });

    if (chapter.children?.length) {
      lines.push(...buildChapterLines(chapter.children, depth + 1));
    }
  });

  return lines;
};

export const buildBusinessPlanContext = (params: {
  businessPlan: BusinessPlan | null;
  chapters: BusinessPlanChapterWithSections[];
}): string => {
  const { businessPlan, chapters } = params;
  if (!businessPlan) {
    return "No business plan exists yet.";
  }

  const chapterLines = buildChapterLines(chapters, 0);
  return [
    `Business Plan Title: ${businessPlan.title}`,
    `Status: ${businessPlan.status}`,
    "Chapters & Sections:",
    chapterLines.length > 0 ? chapterLines.join("\n") : "- No chapters yet",
  ].join("\n");
};

export const buildBusinessPlanSystemPrompt = (context: string): string => {
  return `You are Silicon Plan AI, an expert business plan assistant.
You help users craft, improve, and organize their business plan content.

Important behavior:
- If the user asks for updates to chapters or sections, propose changes using the tools.
- If the user asks to create, edit, or remove plan tasks, propose task changes using the tools.
- If the user says "chapter" or "subchapter", use chapter tools (not task tools).
- For requests like "add subchapter X under Y", propose exactly one chapter creation for X under Y (no duplicate or extra unrelated proposals).
- When the user asks for chapter/task structures, generate concrete tool calls (one per proposed chapter/task) instead of plain text only.
- Prefer H1 tasks for chapter-level items and H2 tasks for sub-items tied to a parent H1.
- Do NOT apply changes directly. Always propose and request user approval.
- Ask clarifying questions when needed, especially if a target chapter or section is ambiguous.
- Use concise, actionable responses.
- The current business plan context below is authoritative. If any prior conversation content conflicts with it, ignore the older content and trust the context below.

Current business plan context:
${context}
`;
};
