// src/app/api/workspaces/[workspaceId]/business-plan/generate-valuation/route.ts
// POST: generates valuation chapters/sections in the business plan from
// stored financial projections and valuation results.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getOrCreateBusinessPlan,
  createChapter,
  createSection,
} from "@/server/businessPlan";
import { getFinancialProjection } from "@/server/financialProjections";
import { runFullValuation } from "@/lib/valuation";
import type {
  FinancialProjectionData,
  IndustryClassification,
  IncomeStatement,
} from "@/types/financialProjections";
import type { FullValuationResults } from "@/types/valuation";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

// ========== HELPERS: build section content from data ==========

function tableSection(headers: string[], rows: string[][]) {
  return {
    sectionType: "table" as const,
    content: { type: "table" as const, headers, rows },
  };
}

function textSection(text: string) {
  return {
    sectionType: "text" as const,
    content: { type: "text" as const, text },
  };
}

function fmtNum(n: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "\u20AC";
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(0) + "%";
}

// ========== BUILD SECTIONS FOR EACH SUB-CHAPTER ==========

function buildRevenueSections(
  data: FinancialProjectionData,
  income: IncomeStatement,
) {
  const years = data.yearLabels;
  const headers = ["\u20AC/1.000", ...years];
  const rows: string[][] = [];

  for (const line of data.revenueLines) {
    rows.push([line.label, ...line.values.map(fmtNum)]);
  }
  rows.push(["Totale Ricavi", ...income.revenue.map(fmtNum)]);

  return [tableSection(headers, rows)];
}

function buildCostSections(
  data: FinancialProjectionData,
  income: IncomeStatement,
) {
  const years = data.yearLabels;
  const headers = ["\u20AC/1.000", ...years];
  const rows: string[][] = [];

  for (const line of data.costLines) {
    rows.push([`${line.label} (${line.type})`, ...line.values.map(fmtNum)]);
  }
  rows.push(["Totale Costi", ...income.totalCosts.map(fmtNum)]);

  return [tableSection(headers, rows)];
}

function buildIncomeStatementSections(
  data: FinancialProjectionData,
  income: IncomeStatement,
) {
  const years = data.yearLabels;
  const headers = ["\u20AC/1.000", ...years];
  const rows: string[][] = [
    ["Ricavi", ...income.revenue.map(fmtNum)],
    ["Costi Totali", ...income.totalCosts.map(fmtNum)],
    ["EBITDA (MOL)", ...income.ebitda.map(fmtNum)],
    ["Ammortamenti", ...income.depreciation.map(fmtNum)],
    ["EBIT", ...income.ebit.map(fmtNum)],
    ["Imposte", ...income.taxes.map(fmtNum)],
    ["Utile Netto", ...income.netIncome.map(fmtNum)],
  ];
  return [tableSection(headers, rows)];
}

function buildBalanceSheetSections(data: FinancialProjectionData) {
  const years = data.yearLabels;
  const bs = data.balanceSheet;
  const headers = ["\u20AC/1.000", ...years];
  const rows: string[][] = [
    ["Totale Attivo", ...bs.totalAssets.map(fmtNum)],
    ["Patrimonio Netto", ...bs.equity.map(fmtNum)],
    ["Debiti", ...bs.debt.map(fmtNum)],
    ["Capitale Investito", ...bs.investedCapital.map(fmtNum)],
  ];
  return [tableSection(headers, rows)];
}

function buildVCSections(
  data: FinancialProjectionData,
  results: FullValuationResults,
  classification: IndustryClassification,
) {
  const vc = results.vc;
  const years = data.yearLabels;
  const sections = [];

  // Revenue & EBITDA table
  sections.push(
    tableSection(
      ["\u20AC/1.000", ...years],
      [
        ["Ricavi", ...vc.revenueProjections.map(fmtNum)],
        ["Ebitda", ...vc.ebitdaProjections.map(fmtNum)],
      ],
    ),
  );

  // Multiple info
  sections.push(
    tableSection(
      ["MULTIPLO SOCIETA' QUOTATE", ""],
      [
        ["EV/EBITDA", String(classification.baseMultiple)],
        ["MULTIPLO SCONTATO DEL 40%", String(vc.discountedMultiple.toFixed(1))],
      ],
    ),
  );

  // Exit
  sections.push(
    tableSection(
      ["EXIT", ""],
      [
        ["EBITDA EXIT", fmtNum(vc.ebitdaProjections[4])],
        ["MULTIPLO EV/EBITDA", String(vc.discountedMultiple.toFixed(1))],
        ["EV (ENTERPRISE VALUE)", fmtNum(vc.evAtExit)],
      ],
    ),
  );

  // Annual progression
  sections.push(
    tableSection(
      ["\u20AC/1.000", ...years],
      [
        ["IRR ATTESO", ...vc.annualResults.map((r) => fmtPct(r.irr))],
        ["POST-MONEY", ...vc.annualResults.map((r) => fmtNum(r.postMoney))],
        ["INVESTIMENTO", ...vc.annualResults.map((r) => fmtNum(r.investment))],
        ["PRE-MONEY", ...vc.annualResults.map((r) => fmtNum(r.preMoney))],
      ],
    ),
  );

  // Sensitivity matrix
  const sm = vc.sensitivityMatrix;
  const smHeaders = ["\u20AC/1.000", ...sm.multipleValues.map(String)];
  const smRows: string[][] = [
    ["EBIT EXIT", ...sm.multipleValues.map(() => fmtNum(sm.ebitExit))],
    ["EV EXIT", ...sm.evExitByMultiple.map(fmtNum)],
  ];
  for (let r = 0; r < sm.irrValues.length; r++) {
    smRows.push([
      fmtPct(sm.irrValues[r]!),
      ...sm.grid[r]!.map(fmtNum),
    ]);
  }
  sections.push(tableSection(smHeaders, smRows));

  return sections;
}

function buildDCFSections(
  data: FinancialProjectionData,
  results: FullValuationResults,
) {
  const dcf = results.dcf;
  const years = data.yearLabels;
  const sections = [];

  // Input table
  sections.push(
    tableSection(
      ["INPUT", ""],
      [
        ["DISCOUNTED RATE / IRR ATTESO", fmtPct(dcf.discountRate)],
        ["TASSO DI CRESCITA", fmtPct(dcf.terminalGrowthRate)],
      ],
    ),
  );

  // FCF calculation table
  sections.push(
    tableSection(
      ["\u20AC/1.000", ...years],
      [
        ["EBIT", ...dcf.ebit.map(fmtNum)],
        ["IMPOSTE", ...dcf.taxes.map(fmtNum)],
        ["AMMORTAMENTI E ACCONTANEMENTI", ...dcf.depreciation.map(fmtNum)],
        ["CAPEX", ...dcf.capex.map(fmtNum)],
        ["FREE CASH FLOWS", ...dcf.fcf.map(fmtNum)],
      ],
    ),
  );

  // Terminal Value + DCF result
  sections.push(
    tableSection(
      ["TERMINAL VALUE", fmtNum(dcf.terminalValue), "DCF", fmtNum(dcf.dcfValue)],
      [],
    ),
  );

  return sections;
}

function buildFirstChicagoSections(
  results: FullValuationResults,
  classification: IndustryClassification,
) {
  const fc = results.firstChicago;
  const sections = [];

  // Scenario table
  const scenarioHeaders = ["SCENARI", "SCENARIO OTTIMISTICO", "SCENARIO REALISTICO", "SCENARIO PESSIMISTICO"];
  sections.push(
    tableSection(scenarioHeaders, [
      [
        "STIMA DELLA DIMENSIONE DEL MERCATO ACQUISIBILE",
        ...fc.scenarios.map((s) => fmtPct(s.marketCapture)),
      ],
      [
        "PROBABILITA' CHE SI VERIFICHI UNO DEI 3 SCENARI",
        ...fc.scenarios.map((s) => fmtPct(s.probability)),
      ],
    ]),
  );

  // Input table
  sections.push(
    tableSection(
      ["INPUT", ""],
      [
        ["INTERNAL RATE RETURN DESIDERATO", fmtPct(fc.irr)],
        ["NUMERO ANNI DI DURATA DELL'INVESTIMENTO", "5 Anni"],
      ],
    ),
  );
  sections.push(
    tableSection(
      ["MULTIPLO SOCIETA' QUOTATE", ""],
      [
        ["EV/EBITDA", String(classification.baseMultiple)],
        ["MULTIPLO SCONTATO DEL 40%", String(fc.discountedMultiple.toFixed(1))],
      ],
    ),
  );

  // Values table
  sections.push(
    tableSection(
      ["SCENARI", "OTTIMISTICO", "REALISTICO", "PESSIMISTICO"],
      [
        ["TERMINAL VALUE", ...fc.scenarios.map((s) => fmtNum(s.terminalValue))],
        ["PRESENT VALUE", ...fc.scenarios.map((s) => fmtNum(s.presentValue))],
        ["VALORE MEDIO ATTUALIZZATO", ...fc.scenarios.map((s) => fmtNum(s.weightedValue))],
      ],
    ),
  );

  // Final value
  sections.push(
    tableSection(
      ["VALORE FINALE ATTUALIZZATO", fmtNum(fc.finalWeightedValue)],
      [],
    ),
  );

  return sections;
}

function buildEVASections(results: FullValuationResults) {
  const eva = results.eva;
  const sections = [];

  sections.push(
    tableSection(
      ["DATI CALCOLATI DA STIME PREVISIONALI", ""],
      [
        ["ROE atteso", fmtPct(eva.roe)],
        ["ROI atteso", fmtPct(eva.roi)],
        ["ALIQUOTA FISCALE", fmtPct(eva.taxRate)],
        ["DEBITI", fmtNum(eva.debt)],
        ["EQUITY VALUE", fmtNum(eva.equity)],
      ],
    ),
  );

  sections.push(
    tableSection(
      ["", ""],
      [
        ["WACC", fmtPct(eva.wacc)],
        ["NOPAT", fmtNum(eva.nopat)],
        ["CAPITALE INVESTITO", fmtNum(eva.investedCapital)],
      ],
    ),
  );

  sections.push(
    tableSection(
      ["ECONOMIC VALUE ADDED (EVA)", fmtNum(eva.eva)],
      [],
    ),
  );

  return sections;
}

function buildSummarySections(results: FullValuationResults) {
  const s = results.summary;
  const sections = [];

  sections.push(
    tableSection(
      ["Min. Value", "Max Value", "Media"],
      [[fmtNum(s.min), fmtNum(s.max), fmtNum(s.average)]],
    ),
  );

  sections.push(
    textSection("*EVA Method non partecipa al calcolo della media"),
  );

  // Comparison text (chart will be added in Phase 3)
  sections.push(
    tableSection(
      ["Metodo", "Valutazione"],
      [
        ["Venture Capital Method", fmtNum(s.vcValue)],
        ["DCF Method", fmtNum(s.dcfValue)],
        ["First Chicago Model", fmtNum(s.firstChicagoValue)],
        ["EVA Method", fmtNum(s.evaValue)],
      ],
    ),
  );

  return sections;
}

// ========== ROUTE HANDLER ==========

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const { userId } = await auth();
    const { workspaceId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as { locale?: string };
    const locale = body.locale ?? "it";

    // Fetch stored financial projections
    const projection = await getFinancialProjection({ workspaceId, userId });

    if (!projection?.financial_data || !projection?.industry_classification) {
      return NextResponse.json(
        { error: "Financial projections and industry classification must be saved first" },
        { status: 400 },
      );
    }

    const financialData = projection.financial_data as unknown as FinancialProjectionData;
    const classification = projection.industry_classification as unknown as IndustryClassification;

    // Run full valuation
    const { incomeStatement, results } = runFullValuation(financialData, classification);

    // Get or create business plan
    const businessPlan = await getOrCreateBusinessPlan({ workspaceId, userId });

    // Determine order index: place valuation chapters after existing ones
    // We'll use high order indices to ensure they appear at the end
    const baseOrder = 100;

    // ── CHAPTER 1: Analisi Economico Finanziaria ──
    const titles1 = locale === "it"
      ? {
          main: "Analisi Economico Finanziaria",
          company: "La Societ\u00E0",
          revenue: "Stima dei Ricavi",
          costs: "Stima dei Costi",
          income: "Conto Economico Previsionale",
          balance: "Stato Patrimoniale Previsionale",
        }
      : {
          main: "Economic & Financial Analysis",
          company: "The Company",
          revenue: "Revenue Estimate",
          costs: "Cost Estimate",
          income: "Projected Income Statement",
          balance: "Projected Balance Sheet",
        };

    const ch1 = await createChapter({
      businessPlanId: businessPlan.id,
      userId,
      title: titles1.main,
      orderIndex: baseOrder,
    });

    // Sub-chapters for financial analysis
    const subChapters1 = [
      { title: titles1.company, buildSections: () => [textSection("")] },
      { title: titles1.revenue, buildSections: () => buildRevenueSections(financialData, incomeStatement) },
      { title: titles1.costs, buildSections: () => buildCostSections(financialData, incomeStatement) },
      { title: titles1.income, buildSections: () => buildIncomeStatementSections(financialData, incomeStatement) },
      { title: titles1.balance, buildSections: () => buildBalanceSheetSections(financialData) },
    ];

    for (const [idx, sub] of subChapters1.entries()) {
      const subCh = await createChapter({
        businessPlanId: businessPlan.id,
        userId,
        parentChapterId: ch1.id,
        title: sub.title,
        orderIndex: idx,
      });

      const sections = sub.buildSections();
      for (const [sIdx, s] of sections.entries()) {
        await createSection({
          chapterId: subCh.id,
          userId,
          sectionType: s.sectionType,
          content: s.content,
          orderIndex: sIdx,
        });
      }
    }

    // ── CHAPTER 2: Valutazione Pre-Money ──
    const titles2 = locale === "it"
      ? {
          main: "Valutazione Pre-Money",
          vc: "Venture Capital Method",
          dcf: "DCF Method",
          chicago: "First Chicago Model",
          eva: "Eva Method",
          summary: "Riepilogo Pre-Money",
        }
      : {
          main: "Pre-Money Valuation",
          vc: "Venture Capital Method",
          dcf: "DCF Method",
          chicago: "First Chicago Model",
          eva: "EVA Method",
          summary: "Pre-Money Summary",
        };

    const ch2 = await createChapter({
      businessPlanId: businessPlan.id,
      userId,
      title: titles2.main,
      orderIndex: baseOrder + 1,
    });

    const subChapters2 = [
      { title: titles2.vc, buildSections: () => buildVCSections(financialData, results, classification) },
      { title: titles2.dcf, buildSections: () => buildDCFSections(financialData, results) },
      { title: titles2.chicago, buildSections: () => buildFirstChicagoSections(results, classification) },
      { title: titles2.eva, buildSections: () => buildEVASections(results) },
      { title: titles2.summary, buildSections: () => buildSummarySections(results) },
    ];

    for (const [idx, sub] of subChapters2.entries()) {
      const subCh = await createChapter({
        businessPlanId: businessPlan.id,
        userId,
        parentChapterId: ch2.id,
        title: sub.title,
        orderIndex: idx,
      });

      const sections = sub.buildSections();
      for (const [sIdx, s] of sections.entries()) {
        await createSection({
          chapterId: subCh.id,
          userId,
          sectionType: s.sectionType,
          content: s.content,
          orderIndex: sIdx,
        });
      }
    }

    return NextResponse.json({
      success: true,
      chapters: {
        financialAnalysis: ch1.id,
        premoneyValuation: ch2.id,
      },
    });
  } catch (error) {
    console.error("Error in POST /generate-valuation:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
