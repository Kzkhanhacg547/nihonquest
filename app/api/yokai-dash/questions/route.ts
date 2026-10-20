import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { fetchYokaiQuestions } from "@/lib/yokai-dash/questions";
import { YokaiLevel } from "@/lib/yokai-dash/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const levelParam = (searchParams.get("level") || "N5").toUpperCase() as YokaiLevel;
    const countParam = parseInt(searchParams.get("count") || "8", 10);
    const modeParam = (searchParams.get("mode") || "ALL").toUpperCase() as any;

    const validLevels: YokaiLevel[] = ["KANA", "N5", "N4", "N3", "LISTENING"];
    const level: YokaiLevel = validLevels.includes(levelParam) ? levelParam : "N5";

    const validModes = [
      "ALL",
      "WORD_TO_MEANING",
      "MEANING_TO_WORD",
      "WORD_BOTH",
      "SENTENCE_TO_MEANING",
      "MEANING_TO_SENTENCE",
      "SENTENCE_BOTH",
      "LESSON_GRAMMAR",
    ];
    const mode = validModes.includes(modeParam) ? modeParam : "ALL";

    const questions = await fetchYokaiQuestions(level, countParam, mode);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error in /api/yokai-dash/questions:", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}

