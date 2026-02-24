// src/lib/sectionSuggest.ts

import OpenAI from "openai";

export type SectionAiAction =
  | "summarize"
  | "rephrase"
  | "simplify"
  | "detail"
  | "grammar"
  | "translate";

export const SECTION_AI_ACTIONS = new Set<SectionAiAction>([
  "summarize",
  "rephrase",
  "simplify",
  "detail",
  "grammar",
  "translate",
]);

export const ACTION_PROMPTS: Record<SectionAiAction, string> = {
  summarize: "Summarize the text in a concise paragraph.",
  rephrase: "Rephrase the text while preserving the original meaning.",
  simplify: "Rewrite the text to be simpler and easier to read.",
  detail: "Expand the text with more detail and clarity.",
  grammar:
    "Correct grammar, spelling, and punctuation while preserving tone.",
  translate: "Translate the text to the requested language.",
};

export const SUPPORTED_SECTION_TYPES = new Set([
  "text",
  "section_title",
  "subsection",
  "list",
  "table",
  "comparison_table",
]);

export function serializeSectionContentToText(
  content: Record<string, unknown>
): string {
  if (!content || typeof content !== "object") return "";
  const type = content.type as string;
  if (type === "text" || type === "section_title" || type === "subsection") {
    return (content.text as string) ?? "";
  }
  if (type === "list") {
    return ((content.items as string[]) ?? []).join("\n");
  }
  if (type === "table" || type === "comparison_table") {
    const headers = (content.headers as string[]) ?? [];
    const rows = (content.rows as string[][]) ?? [];
    const headerLine = headers.join(" | ");
    const rowLines = rows.map((row) => row.join(" | "));
    return [headerLine, ...rowLines]
      .filter((line) => line.trim().length > 0)
      .join("\n");
  }
  return "";
}

export function parseTransformedTextToContent(
  transformedText: string,
  originalContent: Record<string, unknown>
): Record<string, unknown> {
  const type = originalContent.type as string;

  if (type === "list") {
    const items = transformedText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      type: "list",
      items,
      ordered: (originalContent as Record<string, unknown>).ordered ?? false,
    };
  }

  if (type === "table" || type === "comparison_table") {
    const lines = transformedText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const splitLine = (line: string) => {
      if (line.includes("|"))
        return line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
      if (line.includes("\t"))
        return line
          .split("\t")
          .map((c) => c.trim())
          .filter(Boolean);
      return line.split(",").map((c) => c.trim());
    };

    const headers =
      lines.length > 0 && lines[0]
        ? splitLine(lines[0])
        : ((originalContent.headers as string[]) ?? []);
    const rows = lines.slice(1).map((line) => {
      const cells = splitLine(line).slice(0, headers.length);
      while (cells.length < headers.length) cells.push("");
      return cells;
    });
    return { type, headers, rows };
  }

  // text, section_title, subsection
  return { type, text: transformedText };
}

export async function executeSectionAiAction(params: {
  action: SectionAiAction;
  sourceText: string;
  sectionType: string;
  language?: string;
  systemPrompt: string;
  openAiApiKey: string;
}): Promise<string> {
  const { action, sourceText, sectionType, language, systemPrompt, openAiApiKey } =
    params;

  const formattingHint =
    sectionType === "list"
      ? "Return one list item per line."
      : sectionType === "table" || sectionType === "comparison_table"
        ? "Return a table with the first line as headers and each next line as a row, using ' | ' as the separator."
        : null;

  const prompt = [
    `Task: ${ACTION_PROMPTS[action]}`,
    action === "translate" ? `Target language: ${language ?? "English"}` : null,
    formattingHint,
    "Return ONLY the updated text. Do not add headings or bullet labels.",
    "",
    "Text:",
    sourceText,
  ]
    .filter(Boolean)
    .join("\n");

  const openai = new OpenAI({ apiKey: openAiApiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 600,
  });

  return completion.choices[0]?.message?.content?.trim() ?? sourceText;
}
