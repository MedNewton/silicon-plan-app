// src/app/api/consultants/favorites/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { listUserFavorites, toggleFavorite } from "@/server/favorites";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const favoriteIds = await listUserFavorites(user.id);
    return NextResponse.json({ favoriteIds }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/consultants/favorites:", error);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { consultantId?: string } | null;
    if (!body?.consultantId) {
      return NextResponse.json({ error: "consultantId is required" }, { status: 400 });
    }

    const result = await toggleFavorite(user.id, body.consultantId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/consultants/favorites:", error);
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}
