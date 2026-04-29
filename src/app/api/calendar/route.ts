import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yearMonth = req.nextUrl.searchParams.get("month"); // "2026-04"
  const base = yearMonth ? new Date(`${yearMonth}-01`) : new Date();
  const from = startOfMonth(base);
  const to = endOfMonth(base);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId: session.user.id,
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
