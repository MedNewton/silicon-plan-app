// src/lib/businessPlanExport.ts
import type {
  BusinessPlan,
  BusinessPlanCurrencyCode,
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
  ImageRun,
  AlignmentType,
} from "docx";
import {
  A4_MARGIN_CM,
  A4_MARGIN_TWIP,
  DEFAULT_EXPORT_FONT_FAMILY,
  DOCX_TYPOGRAPHY,
  EXPORT_TYPOGRAPHY,
} from "@/lib/exportStyles";
import { fetchImageAsUint8Array } from "@/lib/workspaceBranding";

const DOCX_PAGE_SIZE_TWIPS: Record<"A4" | "Letter" | "A3", { width: number; height: number }> = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
  A3: { width: 16838, height: 23811 },
};

export type BusinessPlanHtmlExportOptions = {
  headingColor?: string;
  fontFamily?: string;
  fontSize?: number;
  paperSize?: "A4" | "Letter" | "A3";
  marginCm?: number;
  currencyCode?: BusinessPlanCurrencyCode;
  logoDataUrl?: string | null;
  workspaceName?: string | null;
};

export type BusinessPlanDocxExportOptions = {
  headingColor?: string;
  fontFamily?: string;
  paperSize?: "A4" | "Letter" | "A3";
  marginTwip?: number;
  currencyCode?: BusinessPlanCurrencyCode;
  logoBytes?: Uint8Array | null;
  workspaceName?: string | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeExportText = (value: string | null | undefined, maxChars = 8000): string => {
  if (!value) return "";
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/\u0000/g, "")
    .replace(/[ \u00A0]{2,}/g, " ")
    .trimEnd();
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars - 1)}…` : normalized;
};

const buildRunsFromText = (value: string): TextRun[] => {
  const normalized = normalizeExportText(value);
  if (!normalized) return [new TextRun("")];
  return normalized.split("\n").map(
    (line, index) =>
      new TextRun({
        text: line,
        break: index === 0 ? undefined : 1,
      })
  );
};

const CURRENCY_VALUE_REGEX = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
const CURRENCY_SYMBOL_REGEX = /[$€£¥₹]/;

const formatTableValueByCurrency = (
  value: string,
  currencyCode?: BusinessPlanCurrencyCode,
  columnIndex?: number
): string => {
  if (!currencyCode) return value;
  if (columnIndex === 0) return value;

  const trimmed = value.trim();
  if (!trimmed) return value;
  if (trimmed.endsWith("%")) return value;
  if (CURRENCY_SYMBOL_REGEX.test(trimmed)) return value;
  if (!CURRENCY_VALUE_REGEX.test(trimmed)) return value;

  const parsed = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(parsed);
};

const renderSectionHtml = (
  content: BusinessPlanSectionContent,
  currencyCode?: BusinessPlanCurrencyCode
): string => {
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
            `<tr>${row
              .map((cell, cellIndex) =>
                `<td>${escapeHtml(
                  formatTableValueByCurrency(cell, currencyCode, cellIndex)
                )}</td>`
              )
              .join("")}</tr>`
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
      return `<hr class="page-break" />`;
    default:
      return `<p>[Unsupported section]</p>`;
  }
};

const renderChapterHtml = (
  chapter: BusinessPlanChapterWithSections,
  currencyCode?: BusinessPlanCurrencyCode,
  isChild = false,
): string => {
  const headingTag = isChild ? "h2" : "h1";
  const headingHtml = `<${headingTag}>${escapeHtml(chapter.title ?? "")}</${headingTag}>`;
  const sectionHtmls = (chapter.sections ?? []).map((section) =>
    renderSectionHtml(section.content, currencyCode)
  );
  const children = (chapter.children ?? []).map((child) =>
    renderChapterHtml(child, currencyCode, true)
  );

  // Group the heading with the first section so the heading is never orphaned
  // at the bottom of a page without its content following it
  const firstBlock = sectionHtmls.length > 0
    ? `<div class="export-block">${headingHtml}${sectionHtmls[0]}</div>`
    : `<div class="export-block">${headingHtml}</div>`;
  const remainingBlocks = sectionHtmls.slice(1).map(s => `<div class="export-block">${s}</div>`);

  return [firstBlock, ...remainingBlocks, ...children].join("\n");
};

export const buildBusinessPlanHtml = (
  plan: BusinessPlan | null,
  chapters: BusinessPlanChapterWithSections[],
  options: BusinessPlanHtmlExportOptions = {}
): string => {
  const fontFamily = options.fontFamily ?? DEFAULT_EXPORT_FONT_FAMILY;
  const fontSize = options.fontSize ?? EXPORT_TYPOGRAPHY.body;
  const headingColor = options.headingColor ?? "#1F2933";
  const paperSize = options.paperSize ?? "A4";
  const marginCm = options.marginCm ?? A4_MARGIN_CM;
  const currencyCode = options.currencyCode;
  const workspaceName = options.workspaceName?.trim();
  const logoDataUrl = options.logoDataUrl?.trim();

  const body = chapters.length
    ? chapters.map((chapter) => renderChapterHtml(chapter, currencyCode)).join("\n")
    : "<p>No chapters yet.</p>";

  const title = escapeHtml(plan?.title ?? "Business Plan");
  const currencyLabel = currencyCode ? escapeHtml(currencyCode) : null;

  const headerHtml =
    logoDataUrl || workspaceName
      ? `
      <header class="brand-header">
        ${
          logoDataUrl
            ? `<img class="brand-logo" src="${escapeHtml(logoDataUrl)}" alt="${escapeHtml(
                workspaceName ?? "Workspace Logo"
              )}" />`
            : ""
        }
        ${workspaceName ? `<span class="brand-name">${escapeHtml(workspaceName)}</span>` : ""}
      </header>
    `
      : "";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page {
        size: ${paperSize};
        margin: ${marginCm}cm;
      }
      body {
        margin: 0;
        font-family: ${fontFamily}, Arial, sans-serif;
        font-size: ${fontSize}px;
        color: #1F2933;
        line-height: 1.6;
      }
      .export-block {
        break-inside: avoid;
      }
      .brand-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #E5E7EB;
      }
      .brand-logo {
        max-width: 150px;
        max-height: 54px;
        object-fit: contain;
      }
      .brand-name {
        font-size: ${EXPORT_TYPOGRAPHY.bodySmall}px;
        color: #6B7280;
        font-weight: 600;
      }
      .currency-note {
        margin: 0 0 12px;
        color: #4B5563;
        font-size: ${EXPORT_TYPOGRAPHY.bodySmall}px;
      }
      h1, h2, h3 {
        color: ${headingColor};
        margin: 0;
        break-after: avoid;
      }
      h1 {
        margin-top: 28px;
        margin-bottom: 12px;
        font-size: ${EXPORT_TYPOGRAPHY.h1}px;
        line-height: 1.25;
      }
      h2 {
        margin-top: 22px;
        margin-bottom: 8px;
        font-size: ${EXPORT_TYPOGRAPHY.h2}px;
        line-height: 1.3;
      }
      h3 {
        margin-top: 16px;
        margin-bottom: 6px;
        font-size: ${EXPORT_TYPOGRAPHY.h3}px;
        line-height: 1.35;
      }
      p, li, td, th {
        font-size: ${EXPORT_TYPOGRAPHY.body}px;
      }
      p {
        margin: 0 0 10px;
      }
      ul, ol {
        margin: 8px 0 12px 24px;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        break-inside: avoid;
      }
      th, td {
        border: 1px solid #E5E7EB;
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #F9FAFB;
        font-weight: 700;
      }
      figure {
        margin: 14px 0;
        break-inside: avoid;
      }
      figcaption {
        margin-top: 6px;
        color: #6B7280;
        font-size: ${EXPORT_TYPOGRAPHY.bodySmall}px;
      }
      img {
        max-width: 100%;
      }
      hr {
        border: 0;
        border-top: 1px solid #D1D5DB;
      }
      li {
        break-inside: avoid;
      }
      .page-break {
        break-after: page;
        page-break-after: always;
        margin: 12px 0;
      }
    </style>
  </head>
  <body>
    ${headerHtml ? `<div class="export-block">${headerHtml}</div>` : ""}
    <div class="export-block"><h1>${title}</h1></div>
    ${currencyLabel ? `<div class="export-block"><p class="currency-note">Currency: ${currencyLabel}</p></div>` : ""}
    ${body}
  </body>
</html>`;
};

const paragraphFromText = (
  text: string,
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]
) =>
  new Paragraph({
    children: buildRunsFromText(text),
    heading,
    keepNext: heading != null,
  });

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 500, height: 350 });
    img.src = url;
  });

const buildDocxSections = async (
  chapters: BusinessPlanChapterWithSections[],
  currencyCode?: BusinessPlanCurrencyCode
): Promise<Array<Paragraph | Table>> => {
  const blocks: Array<Paragraph | Table> = [];

  for (const chapter of chapters) {
    blocks.push(paragraphFromText(chapter.title ?? "", HeadingLevel.HEADING_1));

    for (const section of chapter.sections ?? []) {
      const content = section.content;
      switch (content.type) {
        case "section_title":
          blocks.push(paragraphFromText(content.text ?? "", HeadingLevel.HEADING_2));
          break;
        case "subsection":
          blocks.push(paragraphFromText(content.text ?? "", HeadingLevel.HEADING_3));
          break;
        case "text": {
          const textVal = normalizeExportText(content.text ?? "");
          if (textVal) {
            blocks.push(
              new Paragraph({
                children: buildRunsFromText(textVal),
              })
            );
          }
          break;
        }
        case "list":
          (content.items ?? []).forEach((item) => {
            blocks.push(
              new Paragraph({
                children: buildRunsFromText(item),
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
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: normalizeExportText(header),
                        bold: true,
                      }),
                    ],
                  }),
                ],
              })
          );
          const rows = [
            new TableRow({ cantSplit: true, children: headerCells }),
            ...(content.rows ?? []).map(
              (row) =>
                new TableRow({
                  cantSplit: true,
                  children: row.map((cell, cellIndex) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: buildRunsFromText(
                            formatTableValueByCurrency(cell, currencyCode, cellIndex)
                          ),
                        }),
                      ],
                    })
                  ),
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
        case "image": {
          if (content.url) {
            try {
              const imageBytes = await fetchImageAsUint8Array(content.url);
              if (imageBytes && imageBytes.length > 0) {
                const dims = await getImageDimensions(content.url);
                const maxW = 500;
                const scale = Math.min(1, maxW / dims.width);
                const ext = content.url.split(".").pop()?.toLowerCase();
                const imgType =
                  ext === "jpg" || ext === "jpeg" ? "jpg"
                    : ext === "gif" ? "gif"
                    : ext === "bmp" ? "bmp"
                    : "png";

                blocks.push(
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: imageBytes,
                        type: imgType,
                        transformation: {
                          width: Math.round(dims.width * scale),
                          height: Math.round(dims.height * scale),
                        },
                      }),
                    ],
                  })
                );
              }
            } catch {
              blocks.push(new Paragraph("[Image could not be loaded]"));
            }

            if (content.caption) {
              blocks.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: normalizeExportText(content.caption),
                      color: "6B7280",
                      size: DOCX_TYPOGRAPHY.bodySmall,
                      italics: true,
                    }),
                  ],
                })
              );
            }
          } else {
            blocks.push(new Paragraph("[Image placeholder]"));
          }
          break;
        }
        case "timeline":
          (content.entries ?? []).forEach((entry) => {
            blocks.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: normalizeExportText(entry.date ?? ""),
                    bold: true,
                  }),
                  new TextRun({
                    text: ` ${normalizeExportText(entry.title ?? "")}`,
                  }),
                  ...(entry.description
                    ? [
                        new TextRun({
                          text: normalizeExportText(entry.description),
                          break: 1,
                        }),
                      ]
                    : []),
                ],
              })
            );
          });
          break;
        case "page_break":
          blocks.push(
            new Paragraph({
              pageBreakBefore: true,
              children: [new TextRun("")],
            })
          );
          break;
        case "empty_space":
          blocks.push(
            new Paragraph({
              spacing: { after: (content.height ?? 40) * 15 },
              children: [new TextRun("")],
            })
          );
          break;
        case "embed":
          blocks.push(
            new Paragraph({
              children: buildRunsFromText(content.code ?? ""),
            })
          );
          break;
        default:
          break;
      }
    }

    if (chapter.children?.length) {
      blocks.push(...await buildDocxSections(chapter.children, currencyCode));
    }
  }

  return blocks;
};

export const buildBusinessPlanDocx = async (
  plan: BusinessPlan | null,
  chapters: BusinessPlanChapterWithSections[],
  options: BusinessPlanDocxExportOptions = {}
): Promise<Blob> => {
  const headingColor = (options.headingColor ?? "#1F2933").replace("#", "");
  const fontFamily = options.fontFamily ?? DEFAULT_EXPORT_FONT_FAMILY;
  const paperSize = options.paperSize ?? "A4";
  const marginTwip = options.marginTwip ?? A4_MARGIN_TWIP;
  const currencyCode = options.currencyCode;
  const pageSize = DOCX_PAGE_SIZE_TWIPS[paperSize];

  const brandingBlocks: Paragraph[] = [];

  if (options.logoBytes && options.logoBytes.length > 0) {
    brandingBlocks.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new ImageRun({
            data: options.logoBytes,
            type: "png",
            transformation: {
              width: 150,
              height: 52,
            },
          }),
        ],
      })
    );
  }

  if (options.workspaceName && options.workspaceName.trim().length > 0) {
    brandingBlocks.push(
      new Paragraph({
        children: [
          new TextRun({
            text: options.workspaceName.trim(),
            color: "6B7280",
            size: DOCX_TYPOGRAPHY.bodySmall,
            bold: true,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily,
            size: DOCX_TYPOGRAPHY.body,
            color: "1F2933",
          },
          paragraph: {
            spacing: {
              line: 360,
              after: 140,
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: DOCX_TYPOGRAPHY.title,
            bold: true,
            color: headingColor,
          },
          paragraph: {
            spacing: { after: 260, before: 120 },
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: DOCX_TYPOGRAPHY.h1,
            bold: true,
            color: headingColor,
          },
          paragraph: {
            keepNext: true,
            spacing: { before: 260, after: 140 },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: DOCX_TYPOGRAPHY.h2,
            bold: true,
            color: headingColor,
          },
          paragraph: {
            keepNext: true,
            spacing: { before: 220, after: 120 },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: DOCX_TYPOGRAPHY.h3,
            bold: true,
            color: headingColor,
          },
          paragraph: {
            keepNext: true,
            spacing: { before: 180, after: 100 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageSize.width,
              height: pageSize.height,
            },
            margin: {
              top: marginTwip,
              right: marginTwip,
              bottom: marginTwip,
              left: marginTwip,
            },
          },
        },
        children: [
          ...brandingBlocks,
          paragraphFromText(plan?.title ?? "Business Plan", HeadingLevel.TITLE),
          ...(currencyCode
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Currency: ${currencyCode}`,
                      size: DOCX_TYPOGRAPHY.bodySmall,
                      color: "4B5563",
                    }),
                  ],
                }),
              ]
            : []),
          ...(await buildDocxSections(chapters, currencyCode)),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
};
