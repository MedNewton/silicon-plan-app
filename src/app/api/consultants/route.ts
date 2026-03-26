// src/app/api/consultants/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { listConsultants } from "@/server/consultants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const industry = searchParams.get("industry") || undefined;
    const country = searchParams.get("country") || undefined;
    const availability = searchParams.get("availability") || undefined;
    const minRate = searchParams.get("minRate")
      ? Number(searchParams.get("minRate"))
      : undefined;
    const maxRate = searchParams.get("maxRate")
      ? Number(searchParams.get("maxRate"))
      : undefined;

    const consultants = await listConsultants({
      search,
      industry,
      country,
      availability,
      minRate,
      maxRate,
    });

    return NextResponse.json({ consultants }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/consultants:", error);
    return NextResponse.json(
      { error: "Failed to load consultants" },
      { status: 500 },
    );
  }
}
