import { withSession } from "@/lib/auth";
import { currentYearMonth } from "@/lib/dates";
import { getInsights } from "@/lib/entries";
import { jsonError } from "@/lib/http";
import { validateMonth } from "@/lib/validate";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withSession(async () => {
    const month = validateMonth(request.nextUrl.searchParams.get("month") ?? currentYearMonth());
    if (!month) return jsonError(400, "invalid", "달을 다시 확인해 주세요.");
    const insights = getInsights(month);
    return Response.json({
      month: insights.month,
      entryCount: insights.entryCount,
      savedCount: insights.savedCount,
      sufficient: insights.sufficient,
      userMoods: insights.userMoods,
      days: insights.days,
      aiEmotions: insights.aiEmotions,
      analyzedCount: insights.analyzedCount,
      week: insights.week,
      monthly: insights.monthly,
    });
  });
}
