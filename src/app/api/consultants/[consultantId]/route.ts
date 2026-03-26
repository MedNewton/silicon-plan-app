// src/app/api/consultants/[consultantId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getConsultantDetail, getSimilarConsultants } from "@/server/consultants";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ consultantId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { consultantId } = await context.params;

    const [detail, similarConsultants] = await Promise.all([
      getConsultantDetail(consultantId),
      getSimilarConsultants(consultantId),
    ]);

    return NextResponse.json({ ...detail, similarConsultants }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/consultants/[consultantId]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Consultant not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to load consultant" },
      { status: 500 },
    );
  }
}
