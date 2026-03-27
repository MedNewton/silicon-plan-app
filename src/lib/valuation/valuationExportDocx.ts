// src/lib/valuation/valuationExportDocx.ts
// Builds DOCX sections for the Pre-Money Valuation report.

import {
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  type ISectionOptions,
  type FileChild,
} from "docx";
import type {
  FinancialProjectionData,
  IndustryClassification,
  IncomeStatement,
} from "@/types/financialProjections";
import type { FullValuationResults } from "@/types/valuation";
import { computeIncomeStatement } from "@/lib/valuation";
import { A4_MARGIN_TWIP, DOCX_TYPOGRAPHY } from "@/lib/exportStyles";

export type ValuationDocxExportOptions = {
  headingColor?: string;
  fontFamily?: string;
  paperSize?: "A4" | "Letter" | "A3";
  marginTwip?: number;
  locale?: "en" | "it";
};

const fmt = (v: number) =>
  v.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtDec = (v: number, d = 1) => v.toFixed(d);

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
  A3: { width: 16838, height: 23811 },
};

const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "E5E7EB",
};

// ========== HELPERS ==========

function heading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2, color: string): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true, color, size: level === HeadingLevel.HEADING_1 ? DOCX_TYPOGRAPHY.h1 : DOCX_TYPOGRAPHY.h2 })],
  });
}

function subheading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: DOCX_TYPOGRAPHY.h3 })],
  });
}

function metricParagraph(label: string, value: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: `${label}: `, size: DOCX_TYPOGRAPHY.body, color: "6B7280" }),
      new TextRun({ text: value, size: DOCX_TYPOGRAPHY.body, bold: bold || undefined }),
    ],
  });
}

function makeTable(
  headers: string[],
  rows: string[][],
  highlightLastCol = false,
  accentColor = "4C6AD2",
): Table {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
        shading: { fill: "F3F4FB" },
        borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, size: DOCX_TYPOGRAPHY.bodySmall, color: accentColor })],
          }),
        ],
      }),
  );

  const bodyRows = rows.map(
    (cells) =>
      new TableRow({
        children: cells.map(
          (cell, cIdx) =>
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              children: [
                new Paragraph({
                  alignment: cIdx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: cell,
                      size: DOCX_TYPOGRAPHY.bodySmall,
                      bold: highlightLastCol && cIdx === cells.length - 1 ? true : undefined,
                      color: highlightLastCol && cIdx === cells.length - 1 ? accentColor : undefined,
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

// ========== SECTION BUILDERS ==========

function buildIncomeStatementSection(
  is: IncomeStatement,
  yearLabels: string[],
  locale: string,
  accent: string,
): FileChild[] {
  const rows: { label: string; values: number[] }[] = [
    { label: locale === "it" ? "Ricavi" : "Revenue", values: [...is.revenue] },
    { label: locale === "it" ? "Costi Totali" : "Total Costs", values: [...is.totalCosts] },
    { label: "EBITDA", values: [...is.ebitda] },
    { label: locale === "it" ? "Ammortamenti" : "Depreciation", values: [...is.depreciation] },
    { label: "EBIT", values: [...is.ebit] },
    { label: locale === "it" ? "Imposte" : "Taxes", values: [...is.taxes] },
    { label: locale === "it" ? "Utile Netto" : "Net Income", values: [...is.netIncome] },
  ];

  const table = makeTable(
    ["", ...yearLabels],
    rows.map((r) => [r.label, ...r.values.map(fmt)]),
    false,
    accent,
  );

  return [table, spacer()];
}

function buildVCSection(
  results: FullValuationResults,
  accent: string,
): FileChild[] {
  const { vc } = results;
  const paragraphs: FileChild[] = [
    metricParagraph("EV at Exit", fmt(vc.evAtExit), true),
    metricParagraph("Discounted Multiple", `${fmtDec(vc.discountedMultiple)}x`, true),
    spacer(),
  ];

  const table = makeTable(
    ["Year", "IRR", "Post-Money", "Investment", "Pre-Money"],
    vc.annualResults.map((r) => [
      `Year ${r.year}`,
      fmtPct(r.irr),
      fmt(r.postMoney),
      fmt(r.investment),
      fmt(r.preMoney),
    ]),
    true,
    accent,
  );

  paragraphs.push(table, spacer());

  // Sensitivity matrix
  if (vc.sensitivityMatrix) {
    const sm = vc.sensitivityMatrix;
    paragraphs.push(subheading("Sensitivity Analysis"));

    const smTable = makeTable(
      ["IRR \\ Multiple", ...sm.multipleValues.map((m) => `${m}x`)],
      sm.grid.map((row, rIdx) => [fmtPct(sm.irrValues[rIdx]!), ...row.map(fmt)]),
      false,
      accent,
    );
    paragraphs.push(smTable, spacer());
  }

  return paragraphs;
}

function buildDCFSection(
  results: FullValuationResults,
  locale: string,
  accent: string,
): FileChild[] {
  const { dcf } = results;
  const paragraphs: FileChild[] = [
    metricParagraph("DCF Value", fmt(dcf.dcfValue), true),
    metricParagraph("Terminal Value", fmt(dcf.terminalValue)),
    metricParagraph("WACC", fmtPct(dcf.discountRate)),
    metricParagraph("Terminal Growth", fmtPct(dcf.terminalGrowthRate)),
    spacer(),
  ];

  const rows = [
    { label: "EBIT", data: [...dcf.ebit] },
    { label: locale === "it" ? "Imposte" : "Taxes", data: [...dcf.taxes] },
    { label: locale === "it" ? "Ammortamenti" : "Depreciation", data: [...dcf.depreciation] },
    { label: "CAPEX", data: [...dcf.capex] },
    { label: "FCF", data: [...dcf.fcf] },
  ];

  const table = makeTable(
    ["", ...dcf.fcf.map((_, i) => `Year ${i + 1}`)],
    rows.map((r) => [r.label, ...r.data.map(fmt)]),
    false,
    accent,
  );

  paragraphs.push(table, spacer());
  return paragraphs;
}

function buildFirstChicagoSection(
  results: FullValuationResults,
  accent: string,
): FileChild[] {
  const { firstChicago } = results;

  const table = makeTable(
    ["Scenario", "Market Capture", "Probability", "Terminal Value", "Present Value", "Weighted"],
    [
      ...firstChicago.scenarios.map((s) => [
        s.name,
        fmtPct(s.marketCapture),
        fmtPct(s.probability),
        fmt(s.terminalValue),
        fmt(s.presentValue),
        fmt(s.weightedValue),
      ]),
      ["Weighted Total", "", "", "", "", fmt(firstChicago.finalWeightedValue)],
    ],
    true,
    accent,
  );

  return [table, spacer()];
}

function buildEVASection(
  results: FullValuationResults,
): FileChild[] {
  const { eva } = results;
  return [
    metricParagraph("NOPAT", fmt(eva.nopat)),
    metricParagraph("Invested Capital", fmt(eva.investedCapital)),
    metricParagraph("WACC", fmtPct(eva.wacc)),
    metricParagraph("ROE", fmtPct(eva.roe)),
    metricParagraph("ROI", fmtPct(eva.roi)),
    metricParagraph("EVA", fmt(eva.eva), true),
    spacer(),
  ];
}

function buildSummarySection(
  results: FullValuationResults,
  locale: string,
  accent: string,
): FileChild[] {
  const { summary } = results;

  const table = makeTable(
    [locale === "it" ? "Metodo" : "Method", "Pre-Money"],
    [
      ["Venture Capital Method", fmt(summary.vcValue)],
      ["DCF Method", fmt(summary.dcfValue)],
      ["First Chicago Model", fmt(summary.firstChicagoValue)],
      ["EVA Method", fmt(summary.evaValue)],
    ],
    true,
    accent,
  );

  return [
    table,
    spacer(),
    metricParagraph(locale === "it" ? "Minimo" : "Minimum", fmt(summary.min), true),
    metricParagraph(locale === "it" ? "Massimo" : "Maximum", fmt(summary.max), true),
    metricParagraph(locale === "it" ? "Media" : "Average", fmt(summary.average), true),
    spacer(),
  ];
}

// ========== MAIN EXPORT ==========

export function buildValuationDocxSections(
  financialData: FinancialProjectionData,
  industryClassification: IndustryClassification,
  results: FullValuationResults,
  options: ValuationDocxExportOptions = {},
): ISectionOptions[] {
  const accent = (options.headingColor ?? "#4C6AD2").replace("#", "");
  const locale = options.locale ?? "en";
  const paperSize = options.paperSize ?? "A4";
  const marginTwip = options.marginTwip ?? A4_MARGIN_TWIP;
  const pageSize = PAGE_SIZES[paperSize] ?? PAGE_SIZES.A4!;

  const is = computeIncomeStatement(
    financialData.revenueLines,
    financialData.costLines,
    financialData.valuationInputs.depreciation,
    financialData.valuationInputs.taxRate,
  );

  const yearLabels = [...financialData.yearLabels];
  const chFinancial = locale === "it" ? "Analisi Economico Finanziaria" : "Financial Analysis";
  const chValuation = locale === "it" ? "Valutazione Pre-Money" : "Pre-Money Valuation";

  const sectionProps = {
    size: { width: pageSize.width, height: pageSize.height },
    margins: { top: marginTwip, bottom: marginTwip, left: marginTwip, right: marginTwip },
  } as const;

  // Section 1: Financial Analysis
  const financialChildren: FileChild[] = [
    heading(chFinancial, HeadingLevel.HEADING_1, accent),

    subheading(locale === "it" ? "Classificazione Settoriale" : "Industry Classification"),
    metricParagraph(locale === "it" ? "Settore" : "Sector", industryClassification.onboardingSector),
    metricParagraph("Damodaran Industry", industryClassification.damodaranIndustry),
    metricParagraph(locale === "it" ? "Multiplo Base" : "Base Multiple", `${fmtDec(industryClassification.baseMultiple)}x`),
    metricParagraph(locale === "it" ? "Multiplo Aggiustato" : "Adjusted Multiple", `${fmtDec(industryClassification.adjustedMultiple)}x`, true),
    metricParagraph("Stage", industryClassification.companyStage),
    spacer(),

    subheading(locale === "it" ? "Conto Economico Previsionale" : "Projected Income Statement"),
    ...buildIncomeStatementSection(is, yearLabels, locale, accent),
  ];

  // Section 2: Valuation Methods
  const valuationChildren: FileChild[] = [
    heading(chValuation, HeadingLevel.HEADING_1, accent),

    subheading("Venture Capital Method"),
    ...buildVCSection(results, accent),

    subheading("DCF Method"),
    ...buildDCFSection(results, locale, accent),

    subheading("First Chicago Model"),
    ...buildFirstChicagoSection(results, accent),

    subheading("EVA Method"),
    ...buildEVASection(results),

    subheading(locale === "it" ? "Riepilogo Pre-Money" : "Pre-Money Summary"),
    ...buildSummarySection(results, locale, accent),
  ];

  return [
    {
      properties: { page: sectionProps },
      children: financialChildren,
    },
    {
      properties: { page: sectionProps },
      children: valuationChildren,
    },
  ];
}
