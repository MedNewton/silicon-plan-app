// src/app/api/consultants/filters/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getConsultantFilterOptions, RATE_BUCKETS } from "@/server/consultants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const options = await getConsultantFilterOptions();
    return NextResponse.json({ ...options, rateBuckets: RATE_BUCKETS }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/consultants/filters:", error);
    return NextResponse.json(
      { error: "Failed to load filter options" },
      { status: 500 },
    );
  }
}
