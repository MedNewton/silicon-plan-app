// src/app/api/workspaces/[workspaceId]/business-profile/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { upsertWorkspaceBusinessProfile } from "@/server/workspaces";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

type Body = {
  workspaceId?: string;
  tagline?: string;
  isOperating?: boolean;
  industry?: string;
  companyStage?: string;
  problemShort?: string;
  problemLong?: string;
  solutionAndUniqueness?: string;
  teamAndRoles?: string;
  financialProjections?: string;
  risksAndMitigation?: string;
  successMetrics?: string;
  growthPartnerships?: string;
  rawFormData?: Record<string, unknown>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({ businessProfile: null }, { status: 200 });
  } catch (error) {
    console.error(
      "Error in GET /api/workspaces/[workspaceId]/business-profile:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to load workspace business profile" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as Body | null;

    const profile = await upsertWorkspaceBusinessProfile({
      userId: user.id,
      workspaceId,
      tagline: body?.tagline,
      isOperating: body?.isOperating,
      industry: body?.industry,
      companyStage: body?.companyStage,
      problemShort: body?.problemShort,
      problemLong: body?.problemLong,
      solutionAndUniqueness: body?.solutionAndUniqueness,
      teamAndRoles: body?.teamAndRoles,
      financialProjections: body?.financialProjections,
      risksAndMitigation: body?.risksAndMitigation,
      successMetrics: body?.successMetrics,
      growthPartnerships: body?.growthPartnerships,
      rawFormData: body?.rawFormData,
    });

    return NextResponse.json(
      {
        businessProfile: profile,
        redirectTo: "/?tab=my-workspaces",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error in POST /api/workspaces/[workspaceId]/business-profile:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to save workspace business profile" },
      { status: 500 },
    );
  }
}
