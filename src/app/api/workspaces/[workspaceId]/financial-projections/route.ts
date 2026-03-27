// src/app/api/workspaces/[workspaceId]/financial-projections/route.ts
// GET: fetch financial projections + valuation results
// PUT: upsert financial data, run valuation, store results

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getFinancialProjection,
  upsertFinancialProjection,
  updateValuationResults,
} from "@/server/financialProjections";
import { runFullValuation } from "@/lib/valuation";
import type { FinancialProjectionData, IndustryClassification } from "@/types/financialProjections";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

/**
 * GET /api/workspaces/[workspaceId]/financial-projections
 * Returns the stored financial projection data, industry classification,
 * and cached valuation results.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { userId } = await auth();
    const { workspaceId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projection = await getFinancialProjection({ workspaceId, userId });

    return NextResponse.json({
      financialData: projection?.financial_data ?? null,
      industryClassification: projection?.industry_classification ?? null,
      valuationResults: projection?.valuation_results ?? null,
    });
  } catch (error) {
    console.error("Error in GET /financial-projections:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}

/**
 * PUT /api/workspaces/[workspaceId]/financial-projections
 * Upserts financial data and industry classification.
 * Optionally runs the full valuation pipeline and caches results.
 *
 * Body: {
 *   financialData: FinancialProjectionData,
 *   industryClassification?: IndustryClassification,
 *   runValuation?: boolean  // default true
 * }
 */
export async function PUT(req: Request, ctx: RouteContext) {
  try {
    const { userId } = await auth();
    const { workspaceId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      financialData: FinancialProjectionData;
      industryClassification?: IndustryClassification;
      runValuation?: boolean;
    };

    if (!body.financialData) {
      return new NextResponse("financialData is required", { status: 400 });
    }

    // Upsert the financial data
    const projection = await upsertFinancialProjection({
      workspaceId,
      userId,
      financialData: body.financialData,
      industryClassification: body.industryClassification ?? null,
    });

    // Run valuation if requested (default: true) and we have industry classification
    const shouldRunValuation = body.runValuation !== false;
    const classification = (body.industryClassification ??
      projection.industry_classification) as IndustryClassification | null;

    if (shouldRunValuation && classification) {
      const { results } = runFullValuation(body.financialData, classification);

      await updateValuationResults({
        workspaceId,
        userId,
        valuationResults: results,
      });

      return NextResponse.json({
        financialData: body.financialData,
        industryClassification: classification,
        valuationResults: results,
      });
    }

    return NextResponse.json({
      financialData: body.financialData,
      industryClassification: classification,
      valuationResults: projection.valuation_results ?? null,
    });
  } catch (error) {
    console.error("Error in PUT /financial-projections:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
