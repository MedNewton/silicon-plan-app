// src/app/api/workspaces/[workspaceId]/financial-projections/resolve-industry/route.ts
// POST: resolve onboarding sector + stage -> industry classification with adjusted multiple

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveSectorToDamodaran } from "@/lib/sectorMapping";
import { getWeightedMultiple, getMultipleForIndustry } from "@/lib/valuation";
import type { OnboardingSector } from "@/types/sectors";
import type { IndustryClassification } from "@/types/financialProjections";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

/**
 * POST /api/workspaces/[workspaceId]/financial-projections/resolve-industry
 *
 * Body: {
 *   onboardingSector: string,
 *   companyStage: string,
 *   atecoCode?: string
 * }
 *
 * Returns: IndustryClassification with base and adjusted multiples
 */
export async function POST(req: Request, _ctx: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      onboardingSector: string;
      companyStage: string;
      atecoCode?: string;
    };

    const { onboardingSector, companyStage, atecoCode } = body;

    if (!onboardingSector || !companyStage) {
      return new NextResponse(
        "onboardingSector and companyStage are required",
        { status: 400 },
      );
    }

    // Resolve sector to Damodaran industries
    const resolution = resolveSectorToDamodaran(
      onboardingSector as OnboardingSector,
      atecoCode,
    );

    if (!resolution) {
      return new NextResponse("Could not resolve sector", { status: 400 });
    }

    // Compute weighted multiple (across primary/secondary/tertiary industries)
    const adjustedMultiple = getWeightedMultiple(resolution, companyStage);
    const baseMultiple = getMultipleForIndustry(
      resolution.damodaranIndustries.primary,
    );

    const classification: IndustryClassification = {
      onboardingSector,
      atecoCode: atecoCode ?? "",
      damodaranIndustry: resolution.damodaranIndustries.primary,
      baseMultiple,
      adjustedMultiple,
      companyStage,
      isManualOverride: false,
    };

    return NextResponse.json(classification);
  } catch (error) {
    console.error("Error in POST /resolve-industry:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
