import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getYokaiPlayerState } from "@/lib/yokai-dash/state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getYokaiPlayerState(userId);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Error in GET /api/yokai-dash/state:", error);
    return NextResponse.json({ error: "Failed to fetch state" }, { status: 500 });
  }
}

