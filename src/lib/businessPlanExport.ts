// src/lib/businessPlanExport.ts
import type {
  BusinessPlan,
  BusinessPlanChapterWithSections,
  BusinessPlanSectionContent,
} from "@/types/workspaces";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

type ExportOptions = {
  headingColor?: string;
  fontSize?: number;
  paperSize?: "A4" | "Letter" | "A3";
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderSectionHtml = (content: BusinessPlanSectionContent): string => {
  switch (content.type) {
    case "section_title":
      return `<h2>${escapeHtml(content.text ?? "")}</h2>`;
    case "subsection":
      return `<h3>${escapeHtml(content.text ?? "")}</h3>`;
    case "text":
      return `<p>${escapeHtml(content.text ?? "")}</p>`;
    case "list": {
      const tag = content.ordered ? "ol" : "ul";
      const items = (content.items ?? [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "table":
    case "comparison_table": {
      const headerRow = (content.headers ?? [])
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join("");
      const bodyRows = (content.rows ?? [])
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
        )
        .join("");
      return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }
    case "image": {
      if (!content.url) {
        return `<p>[Image placeholder]</p>`;
      }
      const caption = content.caption ? `<figcaption>${escapeHtml(content.caption)}</figcaption>` : "";
      return `<figure><img src="${escapeHtml(content.url)}" alt="${escapeHtml(
        content.alt_text ?? ""
      )}" />${caption}</figure>`;
    }
    case "timeline": {
      const items = (content.entries ?? [])
        .map(
          (entry) =>
            `<li><strong>${escapeHtml(entry.date ?? "")}</strong> ${escapeHtml(
              entry.title ?? ""
            )} ${escapeHtml(entry.description ?? "")}</li>`
        )
        .join("");
      return `<ul>${items}</ul>`;
    }
    case "embed":
      return `<pre>${escapeHtml(content.code ?? "")}</pre>`;
    case "empty_space":
      return `<div style="height:${content.height ?? 40}px;"></div>`;
    case "page_break":
      return `<hr />`;
    default:
      return `<p>[Unsupported section]</p>`;
  }
};

const renderChapterHtml = (chapter: BusinessPlanChapterWithSections): string => {
  const sections = (chapter.sections ?? []).map((section) => renderSectionHtml(section.content));
  const children = (chapter.children ?? []).map((child) => renderChapterHtml(child));
  return [
    `<h1>${escapeHtml(chapter.title ?? "")}</h1>`,
    ...sections,
    ...children,
  ].join("\n");
};

export const buildBusinessPlanHtml = (
  plan: BusinessPlan | null,
  chapters: BusinessPlanChapterWithSections[],
  options: ExportOptions = {}
): string => {
  const fontSize = options.fontSize ?? 14;
  const headingColor = options.headingColor ?? "#1F2933";
  const body = chapters.length
    ? chapters.map((chapter) => renderChapterHtml(chapter)).join("\n")
    : "<p>No chapters yet.</p>";

  const title = escapeHtml(plan?.title ?? "Business Plan");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; font-size: ${fontSize}px; color: #1F2933; }
      h1, h2, h3 { color: ${headingColor}; }
      h1 { margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { border: 1px solid #E5E7EB; padding: 6px 10px; text-align: left; }
      th { background: #F9FAFB; }
      figure { margin: 12px 0; }
      img { max-width: 100%; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${body}
  </body>
</html>`;
};

const paragraphFromText = (
  text: string,
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]
) =>
  new Paragraph({
    text,
    heading,
  });

const buildDocxSections = (chapters: BusinessPlanChapterWithSections[]) => {
  const blocks: Array<Paragraph | Table> = [];

  chapters.forEach((chapter) => {
    blocks.push(paragraphFromText(chapter.title ?? "", HeadingLevel.HEADING_1));

    (chapter.sections ?? []).forEach((section) => {
      const content = section.content as BusinessPlanSectionContent;
      switch (content.type) {
        case "section_title":
          blocks.push(paragraphFromText(content.text ?? "", HeadingLevel.HEADING_2));
          break;
        case "subsection":
          blocks.push(paragraphFromText(content.text ?? "", HeadingLevel.HEADING_3));
          break;
        case "text":
          blocks.push(new Paragraph(content.text ?? ""));
          break;
        case "list":
          (content.items ?? []).forEach((item) => {
            blocks.push(
              new Paragraph({
                text: item,
                bullet: { level: 0 },
              })
            );
          });
          break;
        case "table":
        case "comparison_table": {
          const headerCells = (content.headers ?? []).map(
            (header) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
              })
          );
          const rows = [
            new TableRow({ children: headerCells }),
            ...(content.rows ?? []).map(
              (row) =>
                new TableRow({
                  children: row.map((cell) => new TableCell({ children: [new Paragraph(cell)] })),
                })
            ),
          ];
          blocks.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows,
            })
          );
          break;
        }
        default:
          blocks.push(new Paragraph("[Unsupported section]"));
      }
    });

    if (chapter.children?.length) {
      blocks.push(...buildDocxSections(chapter.children));
    }
  });

  return blocks;
};

export const buildBusinessPlanDocx = async (
  plan: BusinessPlan | null,
  chapters: BusinessPlanChapterWithSections[]
): Promise<Blob> => {
  const doc = new Document({
    sections: [
      {
        children: [
          paragraphFromText(plan?.title ?? "Business Plan", HeadingLevel.TITLE),
          ...buildDocxSections(chapters),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
};
