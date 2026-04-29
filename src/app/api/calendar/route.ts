import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSoloUserId } from "@/lib/solo-user";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const userId = await getSoloUserId();

  const yearMonth = req.nextUrl.searchParams.get("month"); // "2026-04"
  const base = yearMonth ? new Date(`${yearMonth}-01`) : new Date();
  const from = startOfMonth(base);
  const to = endOfMonth(base);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      summaryDate: { gte: from, lte: to },
    },
    select: {
      summaryDate: true,
      totalCalories: true,
      calorieGoal: true,
      isGoalAchieved: true,
    },
    orderBy: { summaryDate: "asc" },
  });

  return NextResponse.json({ summaries });
}
