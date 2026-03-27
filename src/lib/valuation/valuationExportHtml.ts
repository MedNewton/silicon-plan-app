// src/lib/valuation/valuationExportHtml.ts
// Builds branded HTML for the Pre-Money Valuation report following the premoney.pdf template.

import type {
  FinancialProjectionData,
  IndustryClassification,
  IncomeStatement,
} from "@/types/financialProjections";
import type { FullValuationResults } from "@/types/valuation";
import { computeIncomeStatement } from "@/lib/valuation";
import {
  A4_MARGIN_CM,
  DEFAULT_EXPORT_FONT_FAMILY,
  EXPORT_TYPOGRAPHY,
} from "@/lib/exportStyles";

export type ValuationHtmlExportOptions = {
  headingColor?: string;
  fontFamily?: string;
  fontSize?: number;
  paperSize?: "A4" | "Letter" | "A3";
  marginCm?: number;
  locale?: "en" | "it";
  logoDataUrl?: string | null;
  workspaceName?: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmt = (v: number) =>
  v.toLocaleString("en-US", { maximumFractionDigits: 0 });

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

const fmtDec = (v: number, d = 1) => v.toFixed(d);

// ========== TABLE HELPERS ==========

const tableStyle = (accent: string) => `
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
  margin: 12px 0 20px 0;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  overflow: hidden;
`;

const thStyle = (accent: string) => `
  background: #F3F4FB;
  color: ${accent};
  font-weight: 600;
  text-align: right;
  padding: 8px 12px;
  border-bottom: 2px solid #E5E7EB;
  font-size: 11px;
`;

const thLeftStyle = (accent: string) => `
  ${thStyle(accent)}
  text-align: left;
`;

const tdStyle = `
  padding: 6px 12px;
  text-align: right;
  border-bottom: 1px solid #F3F4F6;
  color: #374151;
`;

const tdLeftStyle = `
  ${tdStyle}
  text-align: left;
  font-weight: 600;
`;

const tdHighlightStyle = (accent: string) => `
  ${tdStyle}
  font-weight: 700;
  color: ${accent};
  background: #F3F4FB;
`;

const sectionTitle = (text: string, accent: string) =>
  `<div class="export-block"><h2 style="color:${accent};font-size:18px;margin:28px 0 8px 0;border-bottom:2px solid ${accent};padding-bottom:6px;">${esc(text)}</h2></div>`;

const subTitle = (text: string) =>
  `<div class="export-block"><h3 style="color:#374151;font-size:14px;margin:18px 0 6px 0;">${esc(text)}</h3></div>`;

const metricBox = (label: string, value: string, accent: string) => `
  <div style="display:inline-block;background:#F3F4FB;border:1px solid #E5E7EB;border-radius:8px;padding:10px 16px;margin:4px 8px 4px 0;min-width:120px;">
    <div style="font-size:10px;color:#6B7280;">${esc(label)}</div>
    <div style="font-size:16px;font-weight:700;color:${accent};">${esc(value)}</div>
  </div>
`;

// ========== SECTIONS ==========

function buildIncomeStatementHtml(
  is: IncomeStatement,
  yearLabels: string[],
  accent: string,
  locale: string,
): string {
  const rows: { label: string; values: number[]; highlight?: boolean }[] = [
    { label: locale === "it" ? "Ricavi" : "Revenue", values: [...is.revenue] },
    { label: locale === "it" ? "Costi Totali" : "Total Costs", values: [...is.totalCosts] },
    { label: "EBITDA", values: [...is.ebitda], highlight: true },
    { label: locale === "it" ? "Ammortamenti" : "Depreciation", values: [...is.depreciation] },
    { label: "EBIT", values: [...is.ebit], highlight: true },
    { label: locale === "it" ? "Imposte" : "Taxes", values: [...is.taxes] },
    { label: locale === "it" ? "Utile Netto" : "Net Income", values: [...is.netIncome], highlight: true },
  ];

  const header = `<tr><th style="${thLeftStyle(accent)}"></th>${yearLabels.map((y) => `<th style="${thStyle(accent)}">${y}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => {
      const style = r.highlight ? tdHighlightStyle(accent) : tdStyle;
      const labelStyle = r.highlight ? tdHighlightStyle(accent).replace("text-align: right", "text-align: left") : tdLeftStyle;
      return `<tr><td style="${labelStyle}">${esc(r.label)}</td>${r.values.map((v) => `<td style="${style}">${fmt(v)}</td>`).join("")}</tr>`;
    })
    .join("");

  return `<div class="export-block"><table style="${tableStyle(accent)}">${header}${body}</table></div>`;
}

function buildVCMethodHtml(
  results: FullValuationResults,
  accent: string,
  locale: string,
): string {
  const { vc } = results;
  const parts: string[] = [];

  // Metrics
  parts.push(`<div class="export-block" style="margin:8px 0 16px 0;">
    ${metricBox("EV at Exit", fmt(vc.evAtExit), accent)}
    ${metricBox("Discounted Multiple", `${fmtDec(vc.discountedMultiple)}x`, accent)}
  </div>`);

  // Annual results table
  const header = `<tr>
    <th style="${thLeftStyle(accent)}">Year</th>
    <th style="${thStyle(accent)}">IRR</th>
    <th style="${thStyle(accent)}">Post-Money</th>
    <th style="${thStyle(accent)}">Investment</th>
    <th style="${thStyle(accent)}">Pre-Money</th>
  </tr>`;
  const body = vc.annualResults
    .map(
      (r) =>
        `<tr>
          <td style="${tdLeftStyle}">Year ${r.year}</td>
          <td style="${tdStyle}">${fmtPct(r.irr)}</td>
          <td style="${tdStyle}">${fmt(r.postMoney)}</td>
          <td style="${tdStyle}">${fmt(r.investment)}</td>
          <td style="${tdHighlightStyle(accent)}">${fmt(r.preMoney)}</td>
        </tr>`,
    )
    .join("");

  parts.push(`<div class="export-block"><table style="${tableStyle(accent)}">${header}${body}</table></div>`);

  // Sensitivity matrix
  if (vc.sensitivityMatrix) {
    const sm = vc.sensitivityMatrix;
    parts.push(subTitle(locale === "it" ? "Analisi di Sensitivita" : "Sensitivity Analysis"));

    const smHeader = `<tr><th style="${thLeftStyle(accent)}">IRR \\ Multiple</th>${sm.multipleValues.map((m) => `<th style="${thStyle(accent)}">${m}x</th>`).join("")}</tr>`;
    const smBody = sm.grid
      .map(
        (row, rIdx) =>
          `<tr><td style="${tdLeftStyle}">${fmtPct(sm.irrValues[rIdx]!)}</td>${row.map((val) => `<td style="${tdStyle};${val < 0 ? "color:#DC2626" : ""}">${fmt(val)}</td>`).join("")}</tr>`,
      )
      .join("");

    parts.push(`<div class="export-block"><table style="${tableStyle(accent)}">${smHeader}${smBody}</table></div>`);
  }

  return parts.join("\n");
}

function buildDCFMethodHtml(
  results: FullValuationResults,
  accent: string,
  locale: string,
): string {
  const { dcf } = results;
  const parts: string[] = [];

  parts.push(`<div class="export-block" style="margin:8px 0 16px 0;">
    ${metricBox("DCF Value", fmt(dcf.dcfValue), accent)}
    ${metricBox("Terminal Value", fmt(dcf.terminalValue), "#374151")}
    ${metricBox("WACC", fmtPct(dcf.discountRate), "#374151")}
    ${metricBox("Terminal Growth", fmtPct(dcf.terminalGrowthRate), "#374151")}
  </div>`);

  const rows = [
    { label: "EBIT", data: [...dcf.ebit] },
    { label: locale === "it" ? "Imposte" : "Taxes", data: [...dcf.taxes] },
    { label: locale === "it" ? "Ammortamenti" : "Depreciation", data: [...dcf.depreciation] },
    { label: "CAPEX", data: [...dcf.capex] },
    { label: "FCF", data: [...dcf.fcf] },
  ];

  const header = `<tr><th style="${thLeftStyle(accent)}"></th>${dcf.fcf.map((_, i) => `<th style="${thStyle(accent)}">Year ${i + 1}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => {
      const isHighlight = r.label === "FCF";
      const style = isHighlight ? tdHighlightStyle(accent) : tdStyle;
      const lStyle = isHighlight ? tdHighlightStyle(accent).replace("text-align: right", "text-align: left") : tdLeftStyle;
      return `<tr><td style="${lStyle}">${esc(r.label)}</td>${r.data.map((v) => `<td style="${style};${v < 0 ? "color:#DC2626" : ""}">${fmt(v)}</td>`).join("")}</tr>`;
    })
    .join("");

  parts.push(`<div class="export-block"><table style="${tableStyle(accent)}">${header}${body}</table></div>`);

  return parts.join("\n");
}

function buildFirstChicagoHtml(
  results: FullValuationResults,
  accent: string,
): string {
  const { firstChicago } = results;

  const header = `<tr>
    <th style="${thLeftStyle(accent)}">Scenario</th>
    <th style="${thStyle(accent)}">Market Capture</th>
    <th style="${thStyle(accent)}">Probability</th>
    <th style="${thStyle(accent)}">Terminal Value</th>
    <th style="${thStyle(accent)}">Present Value</th>
    <th style="${thStyle(accent)}">Weighted</th>
  </tr>`;

  const body = firstChicago.scenarios
    .map(
      (s) =>
        `<tr>
          <td style="${tdLeftStyle}">${esc(s.name)}</td>
          <td style="${tdStyle}">${fmtPct(s.marketCapture)}</td>
          <td style="${tdStyle}">${fmtPct(s.probability)}</td>
          <td style="${tdStyle}">${fmt(s.terminalValue)}</td>
          <td style="${tdStyle}">${fmt(s.presentValue)}</td>
          <td style="${tdHighlightStyle(accent)}">${fmt(s.weightedValue)}</td>
        </tr>`,
    )
    .join("");

  const totalRow = `<tr>
    <td colspan="5" style="${tdHighlightStyle(accent).replace("text-align: right", "text-align: left")}">Weighted Total</td>
    <td style="${tdHighlightStyle(accent)}">${fmt(firstChicago.finalWeightedValue)}</td>
  </tr>`;

  return `<div class="export-block"><table style="${tableStyle(accent)}">${header}${body}${totalRow}</table></div>`;
}

function buildEVAMethodHtml(
  results: FullValuationResults,
  accent: string,
): string {
  const { eva } = results;
  return `<div class="export-block" style="margin:8px 0 16px 0;">
    ${metricBox("NOPAT", fmt(eva.nopat), "#374151")}
    ${metricBox("Invested Capital", fmt(eva.investedCapital), "#374151")}
    ${metricBox("WACC", fmtPct(eva.wacc), "#374151")}
    ${metricBox("ROE", fmtPct(eva.roe), "#374151")}
    ${metricBox("ROI", fmtPct(eva.roi), "#374151")}
    ${metricBox("EVA", fmt(eva.eva), accent)}
  </div>`;
}

function buildSummaryHtml(
  results: FullValuationResults,
  accent: string,
  locale: string,
): string {
  const { summary } = results;
  const parts: string[] = [];

  // Method comparison table
  const methods = [
    { label: "Venture Capital Method", value: summary.vcValue },
    { label: "DCF Method", value: summary.dcfValue },
    { label: "First Chicago Model", value: summary.firstChicagoValue },
    { label: "EVA Method", value: summary.evaValue },
  ];

  const header = `<tr><th style="${thLeftStyle(accent)}">${locale === "it" ? "Metodo" : "Method"}</th><th style="${thStyle(accent)}">Pre-Money</th></tr>`;
  const body = methods
    .map((m) => `<tr><td style="${tdLeftStyle}">${esc(m.label)}</td><td style="${tdHighlightStyle(accent)}">${fmt(m.value)}</td></tr>`)
    .join("");

  parts.push(`<div class="export-block"><table style="${tableStyle(accent)}">${header}${body}</table></div>`);

  // Min / Max / Average
  parts.push(`<div class="export-block" style="margin:8px 0 16px 0;">
    ${metricBox(locale === "it" ? "Minimo" : "Minimum", fmt(summary.min), accent)}
    ${metricBox(locale === "it" ? "Massimo" : "Maximum", fmt(summary.max), accent)}
    ${metricBox(locale === "it" ? "Media" : "Average", fmt(summary.average), accent)}
  </div>`);

  return parts.join("\n");
}

// ========== MAIN EXPORT ==========

export function buildValuationHtml(
  financialData: FinancialProjectionData,
  industryClassification: IndustryClassification,
  results: FullValuationResults,
  options: ValuationHtmlExportOptions = {},
): string {
  const fontFamily = options.fontFamily ?? DEFAULT_EXPORT_FONT_FAMILY;
  const fontSize = options.fontSize ?? EXPORT_TYPOGRAPHY.body;
  const accent = options.headingColor ?? "#4C6AD2";
  const paperSize = options.paperSize ?? "A4";
  const marginCm = options.marginCm ?? A4_MARGIN_CM;
  const locale = options.locale ?? "en";
  const workspaceName = options.workspaceName?.trim();
  const logoDataUrl = options.logoDataUrl?.trim();

  const is = computeIncomeStatement(
    financialData.revenueLines,
    financialData.costLines,
    financialData.valuationInputs.depreciation,
    financialData.valuationInputs.taxRate,
  );

  const yearLabels = financialData.yearLabels;

  // Titles
  const reportTitle = locale === "it" ? "Valutazione Pre-Money" : "Pre-Money Valuation";
  const chFinancial = locale === "it" ? "Analisi Economico Finanziaria" : "Financial Analysis";
  const chValuation = locale === "it" ? "Valutazione Pre-Money" : "Pre-Money Valuation";

  const coverHtml = `
    <div class="cover-page">
      ${logoDataUrl ? `<img class="cover-logo" src="${esc(logoDataUrl)}" alt="Logo" />` : ""}
      <h1 class="cover-title" style="color:${accent}">${esc(reportTitle)}</h1>
      ${workspaceName ? `<p class="cover-workspace">${esc(workspaceName)}</p>` : ""}
      <p class="cover-date">${new Date().toLocaleDateString(locale === "it" ? "it-IT" : "en-US", { year: "numeric", month: "long" })}</p>
    </div>
  `;

  const industryHtml = `<div class="export-block" style="margin:8px 0 16px 0;">
    ${metricBox(locale === "it" ? "Settore" : "Sector", industryClassification.onboardingSector, "#374151")}
    ${metricBox("Damodaran", industryClassification.damodaranIndustry, "#374151")}
    ${metricBox(locale === "it" ? "Multiplo Base" : "Base Multiple", `${fmtDec(industryClassification.baseMultiple)}x`, "#374151")}
    ${metricBox(locale === "it" ? "Multiplo Aggiustato" : "Adjusted Multiple", `${fmtDec(industryClassification.adjustedMultiple)}x`, accent)}
    ${metricBox("Stage", industryClassification.companyStage, "#374151")}
  </div>`;

  const sections = [
    coverHtml,
    `<div class="page-break"></div>`,

    // CHAPTER 1: Financial Analysis
    sectionTitle(chFinancial, accent),
    subTitle(locale === "it" ? "Classificazione Settoriale" : "Industry Classification"),
    industryHtml,

    subTitle(locale === "it" ? "Conto Economico Previsionale" : "Projected Income Statement"),
    buildIncomeStatementHtml(is, [...yearLabels], accent, locale),

    // CHAPTER 2: Valuation
    `<div class="page-break"></div>`,
    sectionTitle(chValuation, accent),

    subTitle("Venture Capital Method"),
    buildVCMethodHtml(results, accent, locale),

    subTitle("DCF Method"),
    buildDCFMethodHtml(results, accent, locale),

    subTitle("First Chicago Model"),
    buildFirstChicagoHtml(results, accent),

    subTitle("EVA Method"),
    buildEVAMethodHtml(results, accent),

    `<div class="page-break"></div>`,
    sectionTitle(locale === "it" ? "Riepilogo Pre-Money" : "Pre-Money Summary", accent),
    buildSummaryHtml(results, accent, locale),
  ];

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${esc(reportTitle)}</title>
    <style>
      @page { size: ${paperSize}; margin: ${marginCm}cm; }
      body {
        margin: 0;
        font-family: ${fontFamily}, Arial, sans-serif;
        font-size: ${fontSize}px;
        color: #1F2933;
        line-height: 1.6;
      }
      .export-block { break-inside: avoid; }
      .page-break { page-break-after: always; break-after: page; }
      .cover-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        padding: 40px;
      }
      .cover-logo { max-width: 160px; max-height: 80px; margin-bottom: 30px; }
      .cover-title { font-size: 32px; margin-bottom: 12px; }
      .cover-workspace { font-size: 16px; color: #6B7280; margin: 4px 0; }
      .cover-date { font-size: 13px; color: #9CA3AF; }
      table { border-radius: 6px; }
      h2 { page-break-after: avoid; break-after: avoid; }
      h3 { page-break-after: avoid; break-after: avoid; }
    </style>
  </head>
  <body>
    ${sections.join("\n")}
  </body>
</html>`;
}
